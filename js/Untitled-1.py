# path: diff_poetry_lock/__init__.py


# [EOD]
# path: diff_poetry_lock/github.py

import requests
from pydantic import BaseModel, Field, parse_obj_as
from requests import Response

from diff_poetry_lock.settings import Settings

MAGIC_COMMENT_IDENTIFIER = "<!-- posted by Github Action nborrmann/diff-poetry-lock -->\n\n"
MAGIC_BOT_USER_ID = 41898282


class GithubComment(BaseModel):
    class GithubUser(BaseModel):
        id_: int = Field(alias="id")

    body: str
    id_: int = Field(alias="id")
    user: GithubUser

    def is_bot_comment(self) -> bool:
        return self.body.startswith(MAGIC_COMMENT_IDENTIFIER) and self.user.id_ == MAGIC_BOT_USER_ID


class GithubApi:
    def __init__(self, settings: Settings) -> None:
        self.s = settings
        self.session = requests.session()

    def post_comment(self, comment: str) -> None:
        if not comment:
            print("No changes to lockfile detected")
            return


        r = self.session.post(
            f"https://api.github.com/repos/{self.s.repository}/issues/{self.s.pr_num()}/comments",
            headers={"Authorization": f"Bearer {self.s.token}", "Accept": "application/vnd.github+json"},
            json={"body": f"{MAGIC_COMMENT_IDENTIFIER}{comment}"},
            timeout=10,
        )
        r.raise_for_status()

    def update_comment(self, comment_id: int, comment: str) -> None:
        r = self.session.patch(
            f"https://api.github.com/repos/{self.s.repository}/issues/comments/{comment_id}",
            headers={"Authorization": f"Bearer {self.s.token}", "Accept": "application/vnd.github+json"},
            json={"body": f"{MAGIC_COMMENT_IDENTIFIER}{comment}"},
            timeout=10,
        )
        r.raise_for_status()

    def list_comments(self) -> list[GithubComment]:
        all_comments, comments, page = [], None, 1
        while comments is None or len(comments) == 100:  # noqa: PLR2004
            r = self.session.get(
                f"https://api.github.com/repos/{self.s.repository}/issues/{self.s.pr_num()}/comments",
                params={"per_page": 100, "page": page},
                headers={"Authorization": f"Bearer {self.s.token}", "Accept": "application/vnd.github+json"},
                timeout=10,
            )
            r.raise_for_status()
            comments = parse_obj_as(list[GithubComment], r.json())
            all_comments.extend(comments)
            page += 1
        return [c for c in all_comments if c.is_bot_comment()]

    def get_file(self, ref: str) -> Response:
        r = self.session.get(
            f"https://api.github.com/repos/{self.s.repository}/contents/{self.s.lockfile_path}",
            params={"ref": ref},
            headers={"Authorization": f"Bearer {self.s.token}", "Accept": "application/vnd.github.raw"},
            timeout=10,
            stream=True,
        )
        if r.status_code == 404:  # noqa: PLR2004
            raise FileNotFoundError(f"Lockfile {self.s.lockfile_path} not found on branch {ref}")
        r.raise_for_status()
        return r

    def delete_comment(self, comment_id: int) -> None:
        r = self.session.delete(
            f"https://api.github.com/repos/{self.s.repository}/issues/comments/{comment_id}",
            headers={"Authorization": f"Bearer {self.s.token}", "Accept": "application/vnd.github+json"},
        )
        r.raise_for_status()

    def upsert_comment(self, existing_comment: GithubComment | None, comment: str | None) -> None:
        if existing_comment is None and comment is None:
            return

        if existing_comment is None and comment is not None:
            print("Posting diff to new comment.")
            self.post_comment(comment)

        elif existing_comment is not None and comment is None:
            print("Deleting existing comment.")
            self.delete_comment(existing_comment.id_)

        elif existing_comment is not None and comment is not None:
            if existing_comment.body == f"{MAGIC_COMMENT_IDENTIFIER}{comment}":
                print("Content did not change, not updating existing comment.")
            else:
                print("Updating existing comment.")
                self.update_comment(existing_comment.id_, comment)

# [EOD]
# path: action.yaml

# name: 'Diff poetry.lock'
# description: 'A Github Action that posts a summary of all changes within the poetry.lock file to a pull request'
# branding:
#   icon: 'message-circle'
#   color: 'blue'
# inputs:
#   GITHUB_TOKEN:
#     description: 'Github token of the repository (automatically created by Github)'
#     default: ${{ github.token }}
#     required: false
#   lockfile_path:
#     description: "Path to the lockfile inside the repo (defaults to 'poetry.lock')"
#     default: "poetry.lock"
#     required: false

# runs:
#   using: 'docker'
#   image: 'Dockerfile'

# [EOD]
# path: diff_poetry_lock/settings.py

import sys
from typing import Any

from pydantic import BaseSettings, Field, ValidationError, validator


class Settings(BaseSettings):
    event_name: str = Field(env="github_event_name")  # must be 'pull_request'
    ref: str = Field(env="github_ref")
    repository: str = Field(env="github_repository")
    token: str = Field(env="input_github_token")
    base_ref: str = Field(env="github_base_ref")
    lockfile_path: str = Field(env="input_lockfile_path", default="poetry.lock")

    def __init__(self, **values: Any) -> None:  # noqa: ANN401
        try:
            super().__init__(**values)
        except ValidationError as ex:
            if e1 := next(e.exc for e in ex.raw_errors if e.loc_tuple() == ("event_name",)):  # type: ignore[union-attr]
                # event_name is not 'pull_request' - we fail early
                print(str(e1), file=sys.stderr)
                sys.exit(0)
            raise

    @validator("event_name")
    def event_must_be_pull_request(cls, v: str) -> str:  # noqa: N805
        if v != "pull_request":
            raise ValueError("This Github Action can only be run in the context of a pull request")
        return v

    def pr_num(self) -> str:
        # TODO: Validate early
        return self.ref.split("/")[2]

[EOD]
path: diff_poetry_lock/test/test_poetry_diff.py

from operator import attrgetter
from textwrap import dedent
from typing import Any

import pytest
import requests_mock
from _pytest.monkeypatch import MonkeyPatch
from requests_mock import Mocker

from diff_poetry_lock.github import MAGIC_COMMENT_IDENTIFIER
from diff_poetry_lock.run_poetry import PackageSummary, diff, do_diff, format_comment, load_packages, main
from diff_poetry_lock.settings import Settings

TESTFILE_1 = "diff_poetry_lock/test/res/poetry1.lock"
TESTFILE_2 = "diff_poetry_lock/test/res/poetry2.lock"


@pytest.fixture()
def cfg() -> Settings:
    return create_settings()


@pytest.fixture()
def data1() -> bytes:
    return load_file(TESTFILE_1)


@pytest.fixture()
def data2() -> bytes:
    return load_file(TESTFILE_2)


def test_settings(monkeypatch: MonkeyPatch) -> None:
    monkeypatch.setenv("GITHUB_EVENT_NAME", "pull_request")
    monkeypatch.setenv("GITHUB_REF", "refs/pull/1/merge")
    monkeypatch.setenv("GITHUB_REPOSITORY", "account/repo")
    monkeypatch.setenv("INPUT_GITHUB_TOKEN", "foobar")
    monkeypatch.setenv("GITHUB_BASE_REF", "main")

    s = Settings()

    assert s.pr_num() == "1"


def test_settings_not_pr(monkeypatch: MonkeyPatch) -> None:
    monkeypatch.setenv("GITHUB_EVENT_NAME", "push")
    monkeypatch.setenv("GITHUB_REF", "refs/pull/1/merge")
    monkeypatch.setenv("GITHUB_REPOSITORY", "account/repo")
    monkeypatch.setenv("INPUT_GITHUB_TOKEN", "foobar")

    with pytest.raises(SystemExit) as pytest_wrapped_e:
        main()

    assert pytest_wrapped_e.type == SystemExit
    assert pytest_wrapped_e.value.code == 0


def test_diff() -> None:
    old = load_packages(TESTFILE_1)
    new = load_packages(TESTFILE_2)

    summary: list[PackageSummary] = sorted(diff(old, new), key=attrgetter("name"))

    expected = [
        PackageSummary(name="certifi", old_version="2022.12.7", new_version="2022.12.7"),
        PackageSummary(name="charset-normalizer", old_version="3.1.0", new_version="3.1.0"),
        PackageSummary(name="idna", old_version="3.4", new_version="3.4"),
        PackageSummary(name="pydantic", old_version="1.10.6", new_version=None),
        PackageSummary(name="requests", old_version="2.28.2", new_version="2.28.2"),
        PackageSummary(name="typing-extensions", old_version="4.5.0", new_version=None),
        PackageSummary(name="urllib3", old_version="1.26.15", new_version="1.26.14"),
    ]
    assert summary == expected

    expected_comment = """\
    ### Detected 3 changes to dependencies in Poetry lockfile

    Removed **pydantic** (1.10.6)
    Removed **typing-extensions** (4.5.0)
    Updated **urllib3** (1.26.15 -> 1.26.14)

    *(0 added, 2 removed, 1 updated, 4 not changed)*"""
    assert format_comment(summary) == dedent(expected_comment)


def test_diff_2() -> None:
    old = load_packages(TESTFILE_2)
    new = load_packages(TESTFILE_1)

    summary: list[PackageSummary] = sorted(diff(old, new), key=attrgetter("name"))

    expected = [
        PackageSummary(name="certifi", old_version="2022.12.7", new_version="2022.12.7"),
        PackageSummary(name="charset-normalizer", old_version="3.1.0", new_version="3.1.0"),
        PackageSummary(name="idna", old_version="3.4", new_version="3.4"),
        PackageSummary(name="pydantic", old_version=None, new_version="1.10.6"),
        PackageSummary(name="requests", old_version="2.28.2", new_version="2.28.2"),
        PackageSummary(name="typing-extensions", old_version=None, new_version="4.5.0"),
        PackageSummary(name="urllib3", old_version="1.26.14", new_version="1.26.15"),
    ]
    assert summary == expected

    expected_comment = """\
    ### Detected 3 changes to dependencies in Poetry lockfile

    Added **pydantic** (1.10.6)
    Added **typing-extensions** (4.5.0)
    Updated **urllib3** (1.26.14 -> 1.26.15)

    *(2 added, 0 removed, 1 updated, 4 not changed)*"""
    assert format_comment(summary) == dedent(expected_comment)


def test_diff_no_changes() -> None:
    old = load_packages(TESTFILE_2)
    new = load_packages(TESTFILE_2)

    summary: list[PackageSummary] = sorted(diff(old, new), key=attrgetter("name"))

    expected = [
        PackageSummary(name="certifi", old_version="2022.12.7", new_version="2022.12.7"),
        PackageSummary(name="charset-normalizer", old_version="3.1.0", new_version="3.1.0"),
        PackageSummary(name="idna", old_version="3.4", new_version="3.4"),
        PackageSummary(name="requests", old_version="2.28.2", new_version="2.28.2"),
        PackageSummary(name="urllib3", old_version="1.26.14", new_version="1.26.14"),
    ]
    assert summary == expected
    assert format_comment(summary) is None


def test_file_loading_missing_file_base_ref(cfg: Settings) -> None:
    with requests_mock.Mocker() as m:
        m.get(
            f"https://api.github.com/repos/{cfg.repository}/contents/{cfg.lockfile_path}?ref={cfg.base_ref}",
            headers={"Authorization": f"Bearer {cfg.token}", "Accept": "application/vnd.github.raw"},
            status_code=404,
        )

        with pytest.raises(FileNotFoundError):
            do_diff(cfg)


def test_file_loading_missing_file_head_ref(cfg: Settings, data1: bytes) -> None:
    with requests_mock.Mocker() as m:
        m.get(
            f"https://api.github.com/repos/{cfg.repository}/contents/{cfg.lockfile_path}?ref={cfg.base_ref}",
            headers={"Authorization": f"Bearer {cfg.token}", "Accept": "application/vnd.github.raw"},
            content=data1,
        )
        m.get(
            f"https://api.github.com/repos/{cfg.repository}/contents/{cfg.lockfile_path}?ref={cfg.ref}",
            headers={"Authorization": f"Bearer {cfg.token}", "Accept": "application/vnd.github.raw"},
            status_code=404,
        )

        with pytest.raises(FileNotFoundError):
            do_diff(cfg)


def test_e2e_no_diff_existing_comment(cfg: Settings, data1: bytes) -> None:
    with requests_mock.Mocker() as m:
        mock_get_file(m, cfg, data1, cfg.base_ref)
        mock_get_file(m, cfg, data1, cfg.ref)
        comments = [
            {"body": "foobar", "id": 1334, "user": {"id": 123}},
            {"body": "foobar", "id": 1335, "user": {"id": 41898282}},
            {"body": f"{MAGIC_COMMENT_IDENTIFIER}", "id": 1336, "user": {"id": 123}},
            {"body": f"{MAGIC_COMMENT_IDENTIFIER}foobar", "id": 1337, "user": {"id": 41898282}},
        ]
        mock_list_comments(m, cfg, comments)
        m.delete(
            f"https://api.github.com/repos/{cfg.repository}/issues/comments/1337",
            headers={"Authorization": f"Bearer {cfg.token}", "Accept": "application/vnd.github.raw"},
        )

        do_diff(cfg)


def test_e2e_no_diff_inexisting_comment(cfg: Settings, data1: bytes) -> None:
    with requests_mock.Mocker() as m:
        mock_get_file(m, cfg, data1, cfg.base_ref)
        mock_get_file(m, cfg, data1, cfg.ref)
        mock_list_comments(m, cfg, [])

        do_diff(cfg)


def test_e2e_diff_inexisting_comment(cfg: Settings, data1: bytes, data2: bytes) -> None:
    summary = format_comment(diff(load_packages(TESTFILE_2), load_packages(TESTFILE_1)))

    with requests_mock.Mocker() as m:
        mock_get_file(m, cfg, data1, cfg.base_ref)
        mock_get_file(m, cfg, data2, cfg.ref)
        mock_list_comments(m, cfg, [])
        m.post(
            f"https://api.github.com/repos/{cfg.repository}/issues/{cfg.pr_num()}/comments",
            headers={"Authorization": f"Bearer {cfg.token}", "Accept": "application/vnd.github.raw"},
            json={"body": f"{MAGIC_COMMENT_IDENTIFIER}{summary}"},
        )

        do_diff(cfg)


def test_e2e_diff_existing_comment_same_data(cfg: Settings, data1: bytes, data2: bytes) -> None:
    summary = format_comment(diff(load_packages(TESTFILE_1), load_packages(TESTFILE_2)))

    with requests_mock.Mocker() as m:
        mock_get_file(m, cfg, data1, cfg.base_ref)
        mock_get_file(m, cfg, data2, cfg.ref)
        comments = [
            {"body": "foobar", "id": 1334, "user": {"id": 123}},
            {"body": "foobar", "id": 1335, "user": {"id": 41898282}},
            {"body": f"{MAGIC_COMMENT_IDENTIFIER}", "id": 1336, "user": {"id": 123}},
            {"body": f"{MAGIC_COMMENT_IDENTIFIER}{summary}", "id": 1337, "user": {"id": 41898282}},
        ]
        mock_list_comments(m, cfg, comments)

        do_diff(cfg)


def test_e2e_diff_existing_comment_different_data(cfg: Settings, data1: bytes, data2: bytes) -> None:
    summary = format_comment(diff(load_packages(TESTFILE_1), []))

    with requests_mock.Mocker() as m:
        mock_get_file(m, cfg, data1, cfg.base_ref)
        mock_get_file(m, cfg, data2, cfg.ref)
        comments = [
            {"body": "foobar", "id": 1334, "user": {"id": 123}},
            {"body": "foobar", "id": 1335, "user": {"id": 41898282}},
            {"body": f"{MAGIC_COMMENT_IDENTIFIER}", "id": 1336, "user": {"id": 123}},
            {"body": f"{MAGIC_COMMENT_IDENTIFIER}{summary}", "id": 1337, "user": {"id": 41898282}},
        ]
        mock_list_comments(m, cfg, comments)
        m.patch(
            f"https://api.github.com/repos/{cfg.repository}/issues/comments/1337",
            headers={"Authorization": f"Bearer {cfg.token}", "Accept": "application/vnd.github.raw"},
            json={"body": f"{MAGIC_COMMENT_IDENTIFIER}{summary}"},
        )

        do_diff(cfg)


def load_file(filename: str) -> bytes:
    with open(filename, "rb") as f:
        return f.read()


def mock_list_comments(m: Mocker, s: Settings, response_json: list[dict[Any, Any]]) -> None:
    m.get(
        f"https://api.github.com/repos/{s.repository}/issues/{s.pr_num()}/comments?per_page=100&page=1",
        headers={"Authorization": f"Bearer {s.token}", "Accept": "application/vnd.github.raw"},
        json=response_json,
    )


def mock_get_file(m: Mocker, s: Settings, data: bytes, ref: str) -> None:
    m.get(
        f"https://api.github.com/repos/{s.repository}/contents/{s.lockfile_path}?ref={ref}",
        headers={"Authorization": f"Bearer {s.token}", "Accept": "application/vnd.github.raw"},
        content=data,
    )


def create_settings(
    repository: str = "user/repo",
    lockfile_path: str = "poetry.lock",
    token: str = "foobar",  # noqa: S107
) -> Settings:
    return Settings(
        event_name="pull_request",
        ref="refs/pull/1/merge",
        repository=repository,
        token=token,
        base_ref="main",
        lockfile_path=lockfile_path,
    )

[EOD]
path: diff_poetry_lock/test/__init__.py


[EOD]


path: diff_poetry_lock/run_poetry.py

import sys
import tempfile
from operator import attrgetter
from pathlib import Path

import pydantic
from poetry.core.packages.package import Package
from poetry.packages import Locker

from diff_poetry_lock.github import GithubApi
from diff_poetry_lock.settings import Settings


def load_packages(filename: str = "poetry.lock") -> list[Package]:
    l_merged = Locker(Path(filename), local_config={})
    return l_merged.locked_repository().packages


@pydantic.dataclasses.dataclass(config={"arbitrary_types_allowed": True})
class PackageSummary:
    name: str
    old_version: str | None = None
    new_version: str | None = None

    def not_changed(self) -> bool:
        return self.new_version == self.old_version

    def changed(self) -> bool:
        return not self.not_changed()

    def updated(self) -> bool:
        return self.new_version is not None and self.old_version is not None and self.changed()

    def added(self) -> bool:
        return self.new_version is not None and self.old_version is None

    def removed(self) -> bool:
        return self.new_version is None and self.old_version is not None

    def summary_line(self) -> str:
        if self.updated():
            return f"Updated **{self.name}** ({self.old_version} -> {self.new_version})"
        if self.added() and self.new_version is not None:
            return f"Added **{self.name}** ({self.new_version})"
        if self.removed() and self.old_version is not None:
            return f"Removed **{self.name}** ({self.old_version})"

        if self.new_version is None:
            raise ValueError("Inconsistent State")

        return f"Not changed **{self.name}** ({self.new_version})"


def diff(old_packages: list[Package], new_packages: list[Package]) -> list[PackageSummary]:
    merged: dict[str, PackageSummary] = {}
    for package in old_packages:
        merged[package.pretty_name] = PackageSummary(name=package.pretty_name, old_version=package.full_pretty_version)
    for package in new_packages:
        if package.pretty_name not in merged:
            merged[package.pretty_name] = PackageSummary(
                name=package.pretty_name,
                new_version=package.full_pretty_version,
            )
        else:
            merged[package.pretty_name].new_version = package.full_pretty_version

    return list(merged.values())


def post_comment(api: GithubApi, comment: str | None) -> None:
    existing_comments = api.list_comments()

    if len(existing_comments) > 1:
        print("Found more than one existing comment, only updating first comment", file=sys.stderr)

    existing_comment = existing_comments[0] if existing_comments else None
    api.upsert_comment(existing_comment, comment)


def format_comment(packages: list[PackageSummary]) -> str | None:
    added = sorted([p for p in packages if p.added()], key=attrgetter("name"))
    removed = sorted([p for p in packages if p.removed()], key=attrgetter("name"))
    updated = sorted([p for p in packages if p.updated()], key=attrgetter("name"))
    not_changed = sorted([p for p in packages if p.not_changed()], key=attrgetter("name"))

    if len(added + removed + updated) == 0:
        return None

    comment = f"### Detected {len(added + removed + updated)} changes to dependencies in Poetry lockfile\n\n"
    comment += "\n".join(p.summary_line() for p in added + removed + updated)
    comment += (
        f"\n\n*({len(added)} added, {len(removed)} removed, {len(updated)} updated, {len(not_changed)} not changed)*"
    )

    return comment


def load_lockfile(api: GithubApi, ref: str) -> list[Package]:
    r = api.get_file(ref)
    with tempfile.NamedTemporaryFile(mode="wb", delete=True) as f:
        for chunk in r.iter_content(chunk_size=1024):
            f.write(chunk)
        f.flush()

        return load_packages(f.name)


def main() -> None:
    settings = Settings()
    print(settings)
    do_diff(settings)


def do_diff(settings: Settings) -> None:
# [FILL IN]


    if __name__ == "__main__":
        main()

        