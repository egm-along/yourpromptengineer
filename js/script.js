// Get elements
// const nicknameInput = document.getElementById('nickname');
// const nicknameCharCount = document.getElementById('nickname-char-count');
const roleSelect = document.getElementById('role');
const initialPromptTextArea = document.getElementById('initial-prompt');
const otherRoleGroup = document.getElementById('other-role-group');
const otherRoleInput = document.getElementById('other-role');
const otherRoleCharCount = document.getElementById('other-role-char-count');
const proceedBtnOne = document.getElementById('proceed-btn-one');
const createPromptButton = document.getElementById('create-prompt-btn');
const featureTwo = document.getElementById('feature-two');
const textAreaWrapper = document.getElementById('text-area-wrapper');
const promptTextArea = document.getElementById('prompt-text-area');
const copyButton = document.getElementById('copy-btn');
const chatPopup = document.getElementById('chat-popup');
const loadingOverlay = document.getElementById('loading-overlay');
const personaHeading = document.getElementById('persona-heading');
const personaSubheading = document.getElementById('persona-subheading');
const specificConfigurationsArea = document.getElementById('specific-configurations-area');


let selectedTask  = null;
let finalPrompt = '';
let initialPrompt = '';

// User data object to store input values
let userData = {
    role: ''
};

// Track form submission state
let formOneSubmitted = false;
let formTwoSubmitted = false;

// Function to get text representation
function getReaderProficiencyText(value) {
    if (value <= 2) return "Beginner";
    if (value <= 4) return "Low";
    if (value <= 6) return "Average";
    if (value <= 8) return "Above Average";
    return "Advanced";
}

function getReaderProficiencySpecificInstructions(proficiencyText) {
    switch (proficiencyText) {
        case "Beginner":
            return "Restructure, rephrase, and redefine concepts to ensure clarity. Use simple language and examples.";
        case "Low":
            return "Freely adjust tone, word choice, and explanation depth.";
        case "Average":
            return "Moderately reword explanations and simplify structure but retain key concepts.";
        case "Above Average":
            return "Simplify only when essential. Make minimal adjustments for clarity, but retain key terminology and structure.";
        case "Advanced":
            return "Preserve the technical level as much as possible. Do not adjust complexity. Keep the technical terms and depth.";
        default:
            return "";
    }
}

function getUserProficiencyText(value) {
    if (value <= 2) return "I have no prior knowledge.";
    if (value <= 4) return "I have some basic awareness.";
    if (value <= 6) return "I understand key concepts.";
    if (value <= 8) return "I am highly knowledgeable.";
    return "I have expert-level understanding.";
}

function getUserProficiencySpecificInstructions(value) {
    if (value <= 2) return "I am unfamiliar with the subject. I need basic definitions and context.";
    if (value <= 4) return "I have heard of the topic. I understand simple terms but lacks foundational knowledge.";
    if (value <= 6) return "I grasp core ideas and can follow explanations with light technical content.";
    if (value <= 8) return "I am highly knowledgeable of technical discussion, jargon, and key concepts.";
    return "I am capable of deep analysis and technical reasoning on the subject.";
}

function getCodingProficiencySpecificInstructions(proficiencyText) {
    debugClause = " If there are errors, debug and explain the solution in-depth, in line with my prior knowledge.";

    switch (proficiencyText) {
        case "I have no prior knowledge":
            return "I have no prior knowledge with this code. I am unfamiliar with its syntax and functions." + debugClause;
        case "I only have basic understanding of this code":
            return "I only have a basic understanding of this code. I need a concise explaanation and examples." + debugClause;
        case "I have firm understanding of this code":
            return "I can understand this code well, but I need more explanations from you." + debugClause;
        case "I am confidently knowledgeable about this code":
            return "I can follow the structure and logic of the code, but I need help with edge cases and optimization." + debugClause;
        case "I just need a second opinion (I have expert-level understanding)":
            return "I fully understand the code, but I need your review, second-opinion, and tips on best practices." + debugClause;
        default:
            return "";
    }
}

function getCodingProficiencyText(value) {
    if (value <= 2) return "I have no prior knowledge";
    if (value <= 4) return "I only have basic understanding of this code";
    if (value <= 6) return "I have firm understanding of this code";
    if (value <= 8) return "I am confidently knowledgeable about this code";
    return "I just need a second opinion (I have expert-level understanding)";
}


function getProofreadingFlexibilityText(value) {
    if (value <= 2) return "Correct typos and punctuations only";
    if (value <= 4) return "Minimally correct grammar issues";
    if (value <= 6) return "Improve grammar, style, and clarity in general.";
    if (value <= 8) return "Freely adjust tone, word choice, and explanation depth.";
    return "Revise however you want as needed, but keep the original meaning.";
}

function getProofreadingFlexibilitySpecificInstructions(value) {
    if (value <= 2) return "Focus purely on fixing obvious spelling and punctuation mistakes; no rewording based on grammar. ";
    if (value <= 4) return "Correct clear grammar issues but avoid changing structure or tone.";
    if (value <= 6) return "Edit for clarity and understanding but keep the original form intact.";
    if (value <= 8) return "Improve smoothness and readability, but keep the meaning.";
    return "No restrictions on editing for clarity, flow, or style—as long as the meaning is preserved.";
}

function getExplanationDepthText(value) {
    if (value <= 2) return "Briefest answer possible";
    if (value <= 4) return "Answer briefly with minimal context";
    if (value <= 6) return "Explain the core idea clearly.";
    if (value <= 8) return "Explain thoroughly and logically.";
    return "Provide a full, detailed explanation.";
}

function getExplanationDepthSpecificInstructions(value) {
    if (value <= 2) return "Provide a direct answer without context, definitions, or elaboration. ";
    if (value <= 4) return "Include the main answer with limited clarification or examples. Avoid deeper explanations.";
    if (value <= 6) return "Offer a clear, structured explanation with basic reasoning and occasional examples.";
    if (value <= 8) return "Develop the answer with well-organized reasoning and relevant examples.";
    return "Cover the topic comprehensively, with definitions, analogies, exceptions, and implications.";
}


// Show/hide other role input based on dropdown selection
roleSelect.addEventListener('change', function() {
    if (this.value === 'Others') {
        otherRoleGroup.style.display = 'block';
    } else {
        otherRoleGroup.style.display = 'none';
        otherRoleInput.value = '';
    }
});

// Update character count for other role
otherRoleInput.addEventListener('input', function() {
    const remainingChars = 25 - this.value.length;
    otherRoleCharCount.textContent = remainingChars + ' characters remaining';
    
    // Add warning classes based on remaining characters
    if (remainingChars <= 10 && remainingChars > 5) {
        otherRoleCharCount.className = 'char-count warning';
    } else if (remainingChars <= 5) {
        otherRoleCharCount.className = 'char-count danger';
    } else {
        otherRoleCharCount.className = 'char-count';
    }
});

 // Function to update the persona text
 function updatePromptTextArea(finalPrompt) {
    promptTextArea.innerHTML = `${finalPrompt}`;
}

function enableFormOneUpdates() {
    roleSelect.addEventListener('change', checkAndEnableUpdate);
    otherRoleInput.addEventListener('input', checkAndEnableUpdate);

    // Listen to changes in the radio buttons
    const options = document.getElementsByName('option');
    for (const option of options) {
        option.addEventListener('change', checkAndEnableUpdate);
    }

    initialPromptTextArea.addEventListener('input', checkAndEnableUpdate);
}

function checkAndEnableUpdate() {
    if (formOneSubmitted) {
        proceedBtnOne.textContent = "Update";
        proceedBtnOne.disabled = false;
        proceedBtnOne.style.background = "linear-gradient(135deg, #6366F1, #8B5CF6)";
    }
}

function checkAndEnableFormTwoUpdate() {
    if (formOneSubmitted && createPromptButton.disabled) {
        createPromptButton.textContent = "Update Prompt";
        createPromptButton.disabled = false;
        createPromptButton.style.background = "linear-gradient(135deg, #6366F1, #8B5CF6)";
    }
}

function configureSlidersForAnswerAQuestionOrRequest() {
    let userProficiency = 5; 
    const userProficiencySlider = document.getElementById("userProficiencySlider");
    const userProficiencySliderText = document.getElementById("userProficiencySliderText");
    let userProficiencyText = null;

    userProficiencySlider.oninput = function () {
        userProficiency = parseInt(this.value);
        userProficiencyText = getUserProficiencyText(userProficiency);
        userProficiencySliderText.textContent = userProficiencyText + " (" + userProficiency + "/10)";
    };

    userProficiencySlider.oninput();
    userProficiencySlider.addEventListener('input', checkAndEnableFormTwoUpdate);
    

    let explanationDepth = 5;
    const explanationDepthSlider = document.getElementById("explanationDepthSlider");
    const explanationDepthSliderText = document.getElementById("explanationDepthSliderText");
    let explanationDepthText = null;

    explanationDepthSlider.oninput = function () {
        explanationDepth = parseInt(this.value);
        explanationDepthText = getExplanationDepthText(explanationDepth);
        explanationDepthSliderText.textContent = explanationDepthText + " (" + explanationDepth + "/10)";
    };


    explanationDepthSlider.oninput();
    explanationDepthSlider.addEventListener('input', checkAndEnableFormTwoUpdate);

    document.getElementById('userProficiencySlider').addEventListener('input', checkAndEnableFormTwoUpdate);
    document.getElementById('explanationDepthSlider').addEventListener('input', checkAndEnableFormTwoUpdate);

}

function buildAnswerAQuestionOrRequestUI() {
    const colleague = 'colleague in this field'
    const managerMentor = 'manager/mentor'
    const expertAI = 'expert AI'
    
    input_features = `
    <form id="configuration-form">  
        <div class="form-group">
            <label for="audience"><b>Persona: How do you want your LLM to answer?</b></label>
            <select id="persona" name="persona">
                <option value="${expertAI}">🤖 As an ${expertAI}</option>
                <option value="${colleague}">🤝 As a ${colleague}</option>
                <option value="${managerMentor}">🧑‍🏫 As a ${managerMentor}</option>
            </select>
        </div>


        <div class="slider-wrapper">
            <label class="slider-label" for="userProficiencySlider">
                <b>What's your knowledge level in the topic?</b>
            </label>
            <div class="slider-description" id="userProficiencySliderText">
                <i>Understands key concepts</i>
            </div>
            <div class="slider-container">
                <input type="range" min="1" max="10" value="5" class="slider" id="userProficiencySlider">
            </div>
        </div>
        <div class="slider-wrapper">
            <label class="slider-label" for="explanationDepthSlider"><b>How in-depth do you want the explanation to be?</b></label>
            <div class="slider-description" id="explanationDepthSliderText"><i>Explain the core idea clearly</i></div>
            <div class="slider-container">   
                <input type="range" min="1" max="10" value="5" class="slider" id="explanationDepthSlider">
            </div>
        </div>
        <div class="form-group checkbox-group">
            <label for="explain-like-five"><input type="checkbox" id="explain-like-five" name="explain-like-five">Teach me like I’m five.</label>
        </div>
        <div class="form-group checkbox-group">
            <label for="provide-sources"><input type="checkbox" id="provide-sources" name="provide-sources">Provide sources and references.</label>
        </div>

    </form>
    `
    
    specificConfigurationsArea.innerHTML = input_features;
    
    configureSlidersForAnswerAQuestionOrRequest();

    document.getElementById('persona').addEventListener('change', checkAndEnableFormTwoUpdate);
    document.getElementById('explain-like-five').addEventListener('change', checkAndEnableFormTwoUpdate);
    document.getElementById('provide-sources').addEventListener('change', checkAndEnableFormTwoUpdate);
}

function buildExplainOrDebugCodeUI() {

    const bulletPoints = 'Bullet points'
    const numberedSteps = 'Numbered steps'
    const paragraph = 'Paragraph format'
    const explanationSideBySide = 'Short explanation side-by-side with code'

    const defaultExplanation = 'Default explanation'
    const highLevelSummary = 'High-level summary only'
    const lineByLevelExplanation = 'Line-by-line explanation'


    input_features = `
        <form id="configuration-form">  
            <div class="form-group">
                <label for="explanation-layout"><b>What is your preferred explanation format?</b></label>
                <select id="explanation-layout" name="explanation-layout">
                    <option value="${explanationSideBySide}">💻 ${explanationSideBySide}</option>
                    <option value="${bulletPoints}"> ➤ ${bulletPoints}</option>
                    <option value="${numberedSteps}">🔢 ${numberedSteps}</option>
                    <option value="${paragraph}">📝 ${paragraph}</option>
                </select>
            </div>
            <div class="form-group">
                <label for="technical-detail"><b>What is your preferred level of technical detail?</b></label>
                <select id="technical-detail" name="technical-detail">
                    <option value="${defaultExplanation}"> ⚙️ ${defaultExplanation}</option>
                    <option value="${highLevelSummary}">🌐 ${highLevelSummary}</option>
                    <option value="${lineByLevelExplanation}">🪝 ${lineByLevelExplanation}</option>
                </select>
            </div>
            <div class="form-group checkbox-group">
                <label for="provide-corrected-code"><input type="checkbox" id="provide-corrected-code" name="provide-corrected-code">Provide corrected code if errors are found.</label>
            </div>
            <div class="form-group checkbox-group">
                <label for="deep-dive-algorithm"><input type="checkbox" id="deep-dive-algorithm" name="deep-dive-algorithm">Deep dive into algorithms or performance implications.</label>
            </div>
            <div class="form-group checkbox-group">
                <label for="include-documentation"><input type="checkbox" id="include-documentation" name="include-documentation">Include links to documentation and references.</label>
            </div>
            <div class="form-group checkbox-group">
                <label for="rewrite-or-refactor"><input type="checkbox" id="rewrite-or-refactor" name="rewrite-or-refactor">Rewrite or refactor the code.</label>
            </div>
                <div class="form-group checkbox-group">
                <label for="highlight-potential-pitfalls"><input type="checkbox" id="highlight-potential-pitfalls" name="highlight-potential-pitfalls">Highlight potential pitfalls.</label>
            </div>
            <div class="form-group checkbox-group">
                <label for="put-comments"><input type="checkbox" id="put-comments" name="put-comments">Put comments on the code.</label>
            </div>

        </form>
        `
    specificConfigurationsArea.innerHTML = input_features

    document.getElementById('explanation-layout').addEventListener('change', checkAndEnableFormTwoUpdate);
    document.getElementById('technical-detail').addEventListener('change', checkAndEnableFormTwoUpdate);
    document.getElementById('provide-corrected-code').addEventListener('change', checkAndEnableFormTwoUpdate);
    document.getElementById('deep-dive-algorithm').addEventListener('change', checkAndEnableFormTwoUpdate);
    document.getElementById('include-documentation').addEventListener('change', checkAndEnableFormTwoUpdate);
    document.getElementById('rewrite-or-refactor').addEventListener('change', checkAndEnableFormTwoUpdate);
    document.getElementById('highlight-potential-pitfalls').addEventListener('change', checkAndEnableFormTwoUpdate);
    document.getElementById('put-comments').addEventListener('change', checkAndEnableFormTwoUpdate);

}

function buildProofreadYourWritingUI() {    
    const academicPaper = 'Academic paper';
    const blogPost = 'Blog post';
    const email = 'Email';
    const technicalDocumentation = 'Technical documentation';   
    const socialMediaPost = 'Social media post';
    const others = 'Others';

    const formal = 'Formal and professional'
    const friendly = 'Friendly and conversational'
    const persuasive = 'Persuasive'
    const neutral = 'Neutral'

    const nonTechnical = 'Non-technical stakeholders'
    const technical = 'Technical stakeholders/colleagues'
    const generalAudience = 'General audience (anybody)'
    const seniors = 'Seniors (managers, mentors, leaders)'


    const lightTouch = 'Light—Only check grammar and spelling';
    const moderateTouch = 'Moderate—Improve style and flow aside from errors';
    const heavyTouch = 'Heavy—Rewrite the text to improve clarity and engagement';

    const sameLength = 'Keep the text length the same';
    const shortenLength = 'Allow shortening for brevity';
    const expandLength = 'Expand details for clarity';

    input_features = `
     <form id="configuration-form">  
        <div class="form-group">
            <label for="text-type"><b>What text will be proofread?</b></label>
            <select id="text-type" name="text-type">
                <option value="${email}">📧 ${email}</option>
                <option value="${academicPaper}"> 📄 ${academicPaper}</option>
                <option value="${blogPost}">✍️ ${blogPost}</option>
                <option value="${technicalDocumentation}">🛠️ ${technicalDocumentation}</option>
                <option value="${socialMediaPost}">📣 ${socialMediaPost}</option>
                <option value="${others}">❓ ${others}</option>
            </select>
        </div> 
         <div class="form-group">
            <label for="target-audience"><b>Who is your target audience?</b></label>
            <select id="target-audience" name="target-audience">
                <option value="${generalAudience}">🌎 ${generalAudience}</option>
                <option value="${seniors}"> 🎓 ${seniors}</option>
                <option value="${technical}">🧑‍💻 ${technical}</option>
                <option value="${nonTechnical}">👥 ${nonTechnical}</option>
            </select>
        </div>
        <div class="form-group">
            <label for="writing-tone"><b>What is your writing tone?</b></label>
            <select id="writing-tone" name="writing-tone">
                <option value="${neutral}">⚪ ${neutral}</option>
                <option value="${formal}"> 🏛️ ${formal}</option>
                <option value="${friendly}">😊 ${friendly}</option>
                <option value="${persuasive}">🗣️ ${persuasive}</option>
            </select>
        </div>
        <div class="form-group">
            <label for="rewrite-option"><b>How much do you want to rewrite?</b></label>
            <select id="rewrite-option" name="rewrite-option">
                <option value="${lightTouch}"> 🟢 ${lightTouch}</option>
                <option value="${moderateTouch}">🟡 ${moderateTouch}</option>
                <option value="${heavyTouch}">🔴 ${heavyTouch}</option>
            </select>
        </div>
        <div class="form-group">
            <label for="flexibility"><b>How much flexibility do you want?</b></label>
            <select id="flexibility" name="flexibility">
                <option value="${sameLength}"> 🔒 ${sameLength}</option>
                <option value="${shortenLength}">✂️ ${shortenLength}</option>
                <option value="${expandLength}">➕ ${expandLength}</option>
            </select>
        </div>
        <div class="form-group checkbox-group">
            <label for="adjust-writing"><input type="checkbox" id="adjust-writing" name="adjust-writing">Adjust the writing to the target audience.</label>
        </div>
        <div class="form-group checkbox-group">
                <label for="suggest-alternative"><input type="checkbox" id="suggest-alternative" name="suggest-alternative">Suggest alternative wordings.</label>
        </div>
        <div class="form-group checkbox-group">
                <label for="summarize-and-explain"><input type="checkbox" id="summarize-and-explain" name="summarize-and-explain">Summarize and explain the changes made.</label>
        </div>
        <div class="form-group checkbox-group">
                <label for="define-technical-terms"><input type="checkbox" id="define-technical-terms" name="define-technical-terms">Define technical terms.</label>
        </div>
        <div class="form-group checkbox-group">
                <label for="avoid-jargon"><input type="checkbox" id="avoid-jargon" name="avoid-jargon">Avoid jargon.</label>
        </div>
        
    </form>
    `

    
    specificConfigurationsArea.innerHTML = input_features


    document.getElementById('text-type').addEventListener('change', checkAndEnableFormTwoUpdate);
    document.getElementById('rewrite-option').addEventListener('change', checkAndEnableFormTwoUpdate);
    document.getElementById('flexibility').addEventListener('change', checkAndEnableFormTwoUpdate);
    document.getElementById('suggest-alternative').addEventListener('change', checkAndEnableFormTwoUpdate);
    document.getElementById('summarize-and-explain').addEventListener('change', checkAndEnableFormTwoUpdate);
    document.getElementById('define-technical-terms').addEventListener('change', checkAndEnableFormTwoUpdate);
    document.getElementById('avoid-jargon').addEventListener('change', checkAndEnableFormTwoUpdate);
    document.getElementById('target-audience').addEventListener('change', checkAndEnableFormTwoUpdate);
    document.getElementById('writing-tone').addEventListener('change', checkAndEnableFormTwoUpdate);

}

proceedBtnOne.addEventListener('click', function() {


    initialPrompt = document.getElementById('initial-prompt').value.trim();
    console.log('Initial prompt:', initialPrompt);
  
    if ((roleSelect.value === 'Others' && !otherRoleInput.value.trim()) || (roleSelect.value === 'Select a role...')) {
        alert('Please specify your role.');
        return;
    }

    if (!initialPrompt) {
        alert('Please enter your prompt.');
        return;
    }
    
    userData.role = (roleSelect.value === 'Others') ? otherRoleInput.value.trim() : roleSelect.value;

    const options = document.getElementsByName('option');

        // Find the selected radio button
    for (const option of options) {
        if (option.checked) {
            selectedTask = option.value;
            break;
        }

        option.checked ? selectedTask = option.value : null
    }

    if (selectedTask) {
        featureTwo.classList.remove('locked'); // Unlock feature three
        formOneSubmitted = true; // Mark form two as submitted

        // Visual indicator
        this.textContent = "✔️";
        this.style.background = "linear-gradient(135deg, #10B981, #059669)";
        this.disabled = true;

        enableFormOneUpdates();
    
       
        if (selectedTask == 'Answer') {buildAnswerAQuestionOrRequestUI()}  // FEATURE 1: ANSWER A QUESTION/REQUEST
        else if (selectedTask == 'Explain') {buildExplainOrDebugCodeUI()} // FEATURE 2: EXPLAIN OR DEBUG CODE
        else if (selectedTask == 'Proofread') {buildProofreadYourWritingUI();} //FEATURE 3: PROOFREAD YOUR WRITING

    }    
    
    // Check if this is an update or first submission
    if (formOneSubmitted) {
        // If it's an update, update the persona text if already generated
        if (!textAreaWrapper.classList.contains('locked') && personaHeading.style.display === "block") {
            updatePromptTextArea("");
            resetCopyButton();
        }

        // Visual indicator that the update was successful
        this.textContent = "Done ✓";
        this.style.background = "linear-gradient(135deg, #10B981, #059669)";
        
        this.disabled = true; // Disable the button temporarily
        
    } else {
        
        formOneSubmitted = true; // First submission
        featureTwo.classList.remove('locked'); // Remove the locked class from feature two to unblur it
        
        // Visual indicator that the action was successful
        this.textContent = "✔️";
        this.style.background = "linear-gradient(135deg, #10B981, #059669)";
        this.disabled = true; // Disable the button
        
        enableFormOneUpdates();
    }

    // console.log('User data saved:', userData);
});

function getTheAnswerAQuestionOrRequestPrompt() {
    const persona = document.getElementById('persona').value;
    const userProficiency = document.getElementById('userProficiencySlider').value;
    const explanationDepth = document.getElementById('explanationDepthSlider').value;
    // const domainInput = document.getElementById('domainTopic').value.trim();

    const explainLikeFiveCheckbox = document.getElementById('explain-like-five');
    const provideSourcesCheckbox = document.getElementById('provide-sources');
    
    const userProficiencyDescription = getUserProficiencyText(userProficiency)
    const explainLikeFive = explainLikeFiveCheckbox ? explainLikeFiveCheckbox.checked : false;
    const provideSources = provideSourcesCheckbox ? provideSourcesCheckbox.checked : false;

    const productivityClause = `Prioritize helping me maximize my productivity. Keep your responses concise, precise, and organized.`
    
    const userIdentityClause = `I am a ${userData.role.toUpperCase()}. 
                                ${userProficiencyDescription}
                                ${getUserProficiencySpecificInstructions(userProficiency)}
                                `;
    const aiPersonaClause = `You are my ${persona.toUpperCase()}.`;
    
    const specificInstructions = `Here’s how I’d like you to assist me: <br/>
                                    - ${getExplanationDepthSpecificInstructions(explanationDepth)} <br/>
                                    - ${productivityClause} <br/>
                                    - ${explainLikeFive ? `Explain it like I’m five.` : `Do not explain it like I’m five.`} <br/>
                                    - ${provideSources ? "Provide accurate and existing sources about my question." : "Do not provide sources."}
                            `; 

    finalPrompt = `
        ${userIdentityClause} <br/>
        ${aiPersonaClause}<br/><br/>
        ${specificInstructions}
        <br/><br/>This is my prompt:<br/>${initialPrompt}
    `

    return finalPrompt;
}

function getTheExplainOrDebugCodePrompt() {
    const explanationLayout = document.getElementById('explanation-layout').value;
    const technicalDetail = document.getElementById('technical-detail').value;

    const provideCorrectedCodeCheckbox = document.getElementById('provide-corrected-code');
    const deepDiveAlgorithmCheckbox = document.getElementById('deep-dive-algorithm');
    const includeDocumentationCheckbox = document.getElementById('include-documentation');
    const rewriteOrRefactorCheckbox = document.getElementById('rewrite-or-refactor');
    const highlightPotentialPitfallsCheckbox = document.getElementById('highlight-potential-pitfalls');
    const putCommentsCheckbox = document.getElementById('put-comments');

    const provideCorrectedCode = provideCorrectedCodeCheckbox ? provideCorrectedCodeCheckbox.checked : false;
    const deepDiveAlgorithm = deepDiveAlgorithmCheckbox ? deepDiveAlgorithmCheckbox.checked : false;
    const includeDocumentation = includeDocumentationCheckbox ? includeDocumentationCheckbox.checked : false;
    const rewriteOrRefactor = rewriteOrRefactorCheckbox ? rewriteOrRefactorCheckbox.checked : false;
    const highlightPotentialPitfalls = highlightPotentialPitfallsCheckbox ? highlightPotentialPitfallsCheckbox.checked : false;
    const putComments = putCommentsCheckbox ? putCommentsCheckbox.checked : false;

    const productivityClause = `Prioritize helping me maximize my productivity. Keep your responses concise, precise, and organized.`
       
    finalPrompt = `
        I am a ${userData.role.toUpperCase()}. I want you to explain or debug this code. These are your instructions: <br/>
        - ${productivityClause} <br/>
        - My preferred explanation format is ${explanationLayout.toLowerCase()}. <br/>
        - My preferred level of technical detail is ${technicalDetail.toLowerCase()}. <br/>
        - ${provideCorrectedCode ? "Provide the corrected code if errors are found." : "Do not provide the corrected code."} <br/>
        - ${deepDiveAlgorithm ? "Deep dive into algorithms or performance implications." : "Do not deep dive into algorithms or performance implications."} <br/>
        - ${includeDocumentation ? "Include links to documentation and references." : "Do not include links to documentation and references."} <br/>
        - ${rewriteOrRefactor ? "Rewrite or refactor the code." : "Do not rewrite or refactor the code."} <br/>
        - ${highlightPotentialPitfalls ? "Highlight potential pitfalls." : "Do not highlight potential pitfalls."} <br/>
        - ${putComments ? "Put comments on the code." : "Do not put comments on the code."} <br/><br/>
        Here’s the code I need help with:<br/>${initialPrompt}
    `

    return finalPrompt;

}

function getTheProofreadYourWritingPrompt() {
    const textType = document.getElementById('text-type').value;
    const rewriteOption = document.getElementById('rewrite-option').value;
    const flexibility = document.getElementById('flexibility').value;
    const targetAudience = document.getElementById('target-audience').value;
    const writingTone = document.getElementById('writing-tone').value;


 //writing-tone, target-audience






    const suggestAlternativeCheckbox = document.getElementById('suggest-alternative');
    const summarizeAndExplainCheckbox = document.getElementById('summarize-and-explain');
    const defineTechnicalTermsCheckbox = document.getElementById('define-technical-terms');
    const avoidJargonCheckbox = document.getElementById('avoid-jargon');
    const adjustWritingCheckbox = document.getElementById('adjust-writing');

    const suggestAlternative = suggestAlternativeCheckbox ? suggestAlternativeCheckbox.checked : false;
    const summarizeAndExplain = summarizeAndExplainCheckbox ? summarizeAndExplainCheckbox.checked : false;  
    const defineTechnicalTerms = defineTechnicalTermsCheckbox ? defineTechnicalTermsCheckbox.checked : false;
    const avoidJargon = avoidJargonCheckbox ? avoidJargonCheckbox.checked : false;
    const adjustWriting = adjustWritingCheckbox ? adjustWritingCheckbox.checked : false;

    const textTypeValue = textType == 'Others' ? "" : textType.toLowerCase(); // if the user selects "Others"

    finalPrompt = ` You are an expert proofreader for me, a ${userData.role.toUpperCase()}. <br/>
                    Check the grammar, style, and syntax of this text (${textTypeValue}). The target audience is ${targetAudience.toLowerCase()}.<br/> 
                    These are my instructions: <br/>
                    - The writing tone should be ${writingTone.toLowerCase()}. <br/>
                    - ${adjustWriting ? "Adjust the writing to the target audience." : "Do not adjust the writing to the target audience."} <br/>         
                    - Keep the rewriting ${rewriteOption.toLowerCase()}. <br/>
                    - ${flexibility}. <br/>
                    - ${suggestAlternative ? "Suggest alternative wordings." : "Do not suggest alternative wordings."} <br/>
                    - ${summarizeAndExplain ? "Summarize and explain the changes made." : "Do not summarize and explain the changes made."} <br/>
                    - ${defineTechnicalTerms ? "Define technical terms." : "Do not define technical terms."} <br/>
                    - ${avoidJargon ? "Avoid jargon." : "Do not avoid jargon."} <br/><br/>

                    Here's the text: <br/> 
                    ${initialPrompt}
                `

    return finalPrompt
}



// CREATION OF PROMPTS
createPromptButton.addEventListener('click', function() {
    
    
    loadingOverlay.style.display = "flex";

    switch (selectedTask) {
        case 'Answer': finalPrompt = getTheAnswerAQuestionOrRequestPrompt(); break;
        case 'Explain': finalPrompt = getTheExplainOrDebugCodePrompt(); break;
        case 'Proofread': finalPrompt = getTheProofreadYourWritingPrompt(); break;
        default: finalPrompt = initialPrompt;
    }


   
    userData.role = (roleSelect.value === 'Others') ? otherRoleInput.value.trim() : roleSelect.value;
    
    if (formOneSubmitted) { // Check if this is an update or first submission

        if (!textAreaWrapper.classList.contains('locked') && personaHeading.style.display === "block") { updatePromptTextArea();}
        
        this.textContent = "Done ✓";
        this.style.background = "linear-gradient(135deg, #10B981, #059669)";
        
        this.disabled = true;

    } else {
   
        formOneSubmitted = true;      // First submission
        
        featureTwo.classList.remove('locked');
        
        this.textContent = "✔️";   // Visual indicator that the action was successful
        this.style.background = "linear-gradient(135deg, #10B981, #059669)";
        
        this.disabled = true;

        enableFormOneUpdates();
    }

    this.textContent = "Prompt Created!";
    this.style.background = "linear-gradient(135deg, #10B981, #059669)";
    
    textAreaWrapper.scrollIntoView({behavior: 'smooth'});

 
    this.disabled = true;
    

    setTimeout(function() {     // After a second, remove loading overlay and unlock text area
        loadingOverlay.style.display = "none";
        textAreaWrapper.classList.remove('locked');
        
        personaHeading.style.display = "block";
        personaSubheading.style.display = "block";

        updatePromptTextArea(finalPrompt);
        resetCopyButton();
    }, 1000);

});


copyButton.addEventListener('click', function() {
  
    const textToCopy = promptTextArea.innerText;
    
    navigator.clipboard.writeText(textToCopy).then(function() {
        // Show success message
        copyButton.innerHTML = '<span class="copy-icon">✓</span> Copied to your clipboard!';
        copyButton.style.background = "linear-gradient(135deg, #10B981, #059669)";
        
   
        // copyButton.innerHTML = '<span class="copy-icon">📋</span> Copy this prompt';
        // copyButton.style.background = "linear-gradient(135deg, #6366F1, #8B5CF6)";
        
        // Show chat popup
        chatPopup.style.display = "block";
        
    }, function() {
        // Revert button after 2 seconds
        setTimeout(function() {
            copyButton.innerHTML = '<span class="copy-icon">📋</span> Copy Text';
            copyButton.style.background = "linear-gradient(135deg, #6366F1, #8B5CF6)";
        }, 2000);
    });
});

function resetCopyButton() {
    copyButton.innerHTML = '<span class="copy-icon">📋</span> Copy this prompt';
    copyButton.style.background = "linear-gradient(135deg, #6366F1, #8B5CF6)";
}

// Hide chat popup when clicking outside of it
document.addEventListener('click', function(event) {
    if (!copyButton.contains(event.target) && !chatPopup.contains(event.target) && chatPopup.style.display === "block") {
        chatPopup.style.display = "none";
    }
});