// Get elements
// const nicknameInput = document.getElementById('nickname');
// const nicknameCharCount = document.getElementById('nickname-char-count');
const roleSelect = document.getElementById('role');
const otherRoleGroup = document.getElementById('other-role-group');
const otherRoleInput = document.getElementById('other-role');
const otherRoleCharCount = document.getElementById('other-role-char-count');
const proceedBtnOne = document.getElementById('proceed-btn-one');
const createPromptBtn = document.getElementById('create-prompt-btn');
const featureTwo = document.getElementById('feature-two');
const textAreaWrapper = document.getElementById('text-area-wrapper');
const promptTextArea = document.getElementById('prompt-text-area');
const copyBtn = document.getElementById('copy-btn');
const chatPopup = document.getElementById('chat-popup');
const loadingOverlay = document.getElementById('loading-overlay');
const personaHeading = document.getElementById('persona-heading');
const specificConfigurationsArea = document.getElementById('specific-configurations-area');

let selectedTask  = null;
let finalPrompt = '';


// User data object to store input values
let userData = {
    // nickname: '',
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
    if (value <= 2) return "I have no prior knowledge";
    if (value <= 4) return "I have some basic awareness";
    if (value <= 6) return "I understand key concepts";
    if (value <= 8) return "I am highly knowledgeable";
    return "I have expert-level understanding";
}

function getUserProficiencySpecificInstructions(proficiencyText) {
    switch (proficiencyText) {
        case "I have prior knowledge":
            return "I am unfamiliar with the subject. I need basic definitions and context.";
        case "I have some basic awareness":
            return "I have heard of the topic. I understand simple terms but lacks foundational knowledge.";
        case "I understand key concepts":
            return "I grasp core ideas and can follow explanations with light technical content.";
        case "I am confidently knowledgeable about this code":
            return "I am highly knowledgeable of technical discussion, jargon, and key concepts.";
        case "I have expert-level understanding":
            return "I am capable of deep analysis and technical reasoning on the subject.";
        default:
            return "";
    }
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
 function updatePersonaText(finalPrompt) {
    promptTextArea.innerHTML = `
        ${finalPrompt}
    `;
}

function enableFormOneUpdates() {
    // Listen to dropdown changes
    roleSelect.addEventListener('change', checkAndEnableUpdate);

    // Listen to typing inside the Other role field
    otherRoleInput.addEventListener('input', checkAndEnableUpdate);

    // Listen to changes in the radio buttons
    const options = document.getElementsByName('option');
    for (const option of options) {
        option.addEventListener('change', checkAndEnableUpdate);
    }
}

function checkAndEnableUpdate() {
    if (formOneSubmitted) {
        proceedBtnOne.textContent = "Update";
        proceedBtnOne.disabled = false;
        proceedBtnOne.style.background = "linear-gradient(135deg, #6366F1, #8B5CF6)";
    }
}

function checkAndEnableFormTwoUpdate() {
    if (formOneSubmitted && createPromptBtn.disabled) {
        createPromptBtn.textContent = "Update Prompt";
        createPromptBtn.disabled = false;
        createPromptBtn.style.background = "linear-gradient(135deg, #6366F1, #8B5CF6)";
    }
}





proceedBtnOne.addEventListener('click', function() {
  
    if (roleSelect.value === 'Others' && !otherRoleInput.value.trim()) {
        alert('Please specify your role');
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
        
            if (selectedTask == 'Answer') {
                const fellowDataAnalyticsProfessional = 'partner data analytics professional'
                const seniorManager = 'senior manager/leader'
                const productiveExpertAI = 'productive expert AI'     

                input_features = `
                <form id="configuration-form">  
                    <div class="form-group">
                        <label for="audience"><b>How do you want your LLM to answer?</b></label>
                        <select id="persona" name="persona">
                            <option value="${productiveExpertAI}">As a ${productiveExpertAI}</option>
                            <option value="${fellowDataAnalyticsProfessional}">As a ${fellowDataAnalyticsProfessional}</option>
                            <option value="${seniorManager}">As a ${seniorManager}</option>
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
                    
                     
                </form>
                `
                

                specificConfigurationsArea.innerHTML = input_features
                    
                let userProficiency = 5; 
                const userProficiencySlider = document.getElementById("userProficiencySlider");
                const userProficiencySliderText = document.getElementById("userProficiencySliderText");
                let userProficiencyText = null;

                userProficiencySlider.oninput = function () {
                    userProficiency = parseInt(this.value);
                    userProficiencyText = getUserProficiencyText(userProficiency);
                    userProficiencySliderText.textContent = userProficiencyText;
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
                    explanationDepthSliderText.textContent = explanationDepthText;
                };


                explanationDepthSlider.oninput();
                explanationDepthSlider.addEventListener('input', checkAndEnableFormTwoUpdate);
            }

            else if (selectedTask == 'Explain') {
                const fellowDataAnalyticsProfessional = 'partner data analytics professional'
                const seniorManager = 'senior manager/leader'
                const productiveExpertAI = 'productive expert AI'     

                input_features = `
                <form id="configuration-form">  
                    <div class="form-group">
                        <label for="audience"><b>How do you want your LLM to explain or debug your code?</b></label>
                        <select id="persona" name="persona">
                            <option value="${productiveExpertAI}">As a ${productiveExpertAI}</option>
                            <option value="${fellowDataAnalyticsProfessional}">As a ${fellowDataAnalyticsProfessional}</option>
                            <option value="${seniorManager}">As a ${seniorManager}</option>
                        </select>
                    </div>
                    <div class="slider-wrapper">
                        <label class="slider-label" for="codingExplanationDepthSlider"><b>How in-depth do you want the explanation to be?</b></label>
                        <div class="slider-description" id="codingExplanationDepthSliderText">Explain the core idea clearly</div>
                        <div class="slider-container">   
                            <input type="range" min="1" max="10" value="5" class="slider" id="codingExplanationDepthSlider">
                        </div>
                    </div>
                    
                     
                </form>
            `
                specificConfigurationsArea.innerHTML = input_features
                    
                let codingExplanationDepth = 5;
                const codingExplanationDepthSlider = document.getElementById("codingExplanationDepthSlider");
                const codingExplanationDepthSliderText = document.getElementById("codingExplanationDepthSliderText");
                let codingExplanationDepthText = null;

                codingExplanationDepthSlider.oninput = function () {
                    codingExplanationDepth = parseInt(this.value);
                    codingExplanationDepthText = getCodingProficiencyText(codingExplanationDepth);
                    codingExplanationDepthSliderText.textContent = codingExplanationDepthText;
                };


                codingExplanationDepthSlider.oninput();
                codingExplanationDepthSlider.addEventListener('input', checkAndEnableFormTwoUpdate);
        }

        else if (selectedTask == 'Proofread') {
                input_features = `
                    <form id="configuration-form">     
                        <div class="slider-wrapper">
                            <label class="slider-label" for="proofreadingFlexibilitySlider">
                               <b>How flexible do you want the proofreader to be?</b>
                            </label>
                            <div class="slider-description" id="proofreadingFlexibilitySliderDisplay">
                                Revise however you want as needed, but keep the original meaning.
                            </div>
                            <div class="slider-container">
                                <input type="range" min="1" max="10" value="5" class="slider" id="proofreadingFlexibilitySlider">
                            </div>
                        </div>
                    </form>
                `

        
                specificConfigurationsArea.innerHTML = input_features

                let proofreadingFlexibility = 5;
                const proofreadingFlexibilitySlider = document.getElementById("proofreadingFlexibilitySlider");
                const proofreadingFlexibilitySliderDisplay = document.getElementById("proofreadingFlexibilitySliderDisplay");
                let proofreadingFlexibilityText = null;
        
                proofreadingFlexibilitySlider.oninput = function () {
                    proofreadingFlexibility = parseInt(this.value);
                    proofreadingFlexibilityText = getProofreadingFlexibilityText(proofreadingFlexibility);
                    proofreadingFlexibilitySliderDisplay.textContent = proofreadingFlexibilityText;
                };
                
                proofreadingFlexibilitySlider.oninput();  

                proofreadingFlexibilitySlider.addEventListener('input', checkAndEnableFormTwoUpdate);

                
            } else if (selectedTask == 'Adjust') {
                const fellowDataAnalyticsProfessional = 'Fellow data analytics professional'
                const seniorManager = 'Senior manager/leader'
                const widerCompanyAudience = 'Wider company'
                const generalPublic = 'General public'

                input_features = `
                    <form id="configuration-form">
                        <div class="form-group">
                            <label for="document-type">What is the text format?</label>
                            <select id="document-type" name="document-type">
                                <option value="Email">Email</option>
                                <option value="Documentation">Documentation</option>
                                <option value="Article/blog">Article/blog</option>
                            </select>
                        </div>
    
                         <div class="form-group">
                            <label for="audience"><b>Who is your reader or audience?</b></label>
                            <select id="audience" name="audience">
                                <option value="${fellowDataAnalyticsProfessional}">${fellowDataAnalyticsProfessional}</option>
                                <option value="${seniorManager}">${seniorManager}</option>
                                <option value="${widerCompanyAudience}">${widerCompanyAudience}</option>
                                <option value="${generalPublic}">${generalPublic}</option>
                            </select>
                        </div>
                      
                        <div class="slider-wrapper">
                             <label class="slider-label" for="proofreadingFlexibilitySlider"><b>How would you describe your readers' proficiency?</b></label>
                             <div class="slider-description" id="proficiencyDisplay">Average</div>
                             <div class="slider-container">   
                                <input type="range" min="1" max="10" value="5" class="slider" id="proficiencySlider">
                            </div>
                        </div>
                    </form>
                `
                
                specificConfigurationsArea.innerHTML = input_features

                let proficiency = 5; // default
                const proficiencySlider = document.getElementById("proficiencySlider");
                const proficiencyDisplay = document.getElementById("proficiencyDisplay");
            
                proficiencySlider.oninput = function () {
                    proficiency = parseInt(this.value);
                    const proficiencyText = getReaderProficiencyText(proficiency);
                    proficiencyDisplay.textContent = proficiencyText;
                };
        
                
                proficiencySlider.oninput();
            

                proficiencySlider.addEventListener('input', checkAndEnableFormTwoUpdate);

                document.getElementById('document-type').addEventListener('change', checkAndEnableFormTwoUpdate);
                document.getElementById('audience').addEventListener('change', checkAndEnableFormTwoUpdate);
            
            }
    
        
    
        const otherDocumentTypeInput = document.getElementById('other-document-type')
        const otherDocumentTypeCharCount = document.getElementById('other-document-type-char-count');
        
    }
        

    // Check if this is an update or first submission
    if (formOneSubmitted) {
        // If it's an update, update the persona text if already generated
        if (!textAreaWrapper.classList.contains('locked') && personaHeading.style.display === "block") {
            updatePersonaText();
        }

        // Visual indicator that the update was successful
        this.textContent = "Done ✓";
        this.style.background = "linear-gradient(135deg, #10B981, #059669)";
        
        // Disable the button temporarily
        this.disabled = true;
        
        // // Re-enable updates after a delay
        // setTimeout(checkAndEnableUpdate, 2000);
    } else {
        // First submission
        formOneSubmitted = true;
        
        // Remove the locked class from feature two to unblur it
        featureTwo.classList.remove('locked');
        
        // Visual indicator that the action was successful
        this.textContent = "✔️";
        this.style.background = "linear-gradient(135deg, #10B981, #059669)";
        
        // Disable the button
        this.disabled = true;
        
        // Enable form updates
        enableFormOneUpdates();
    }

    console.log('User data saved:', userData);
});

createPromptBtn.addEventListener('click', function() {
    
    const promptFormatClause = `First, provide the revised text version. Follow this with the list of all change instances with the paragraph number. Provide feedback only when necessary.`
    const productivityClause = `Prioritize helping me maximize my productivity. Your response should be concise, precise, and organized.`
    
    
    loadingOverlay.style.display = "flex";

    if (selectedTask == 'Answer') {
        const userProficiency = document.getElementById('userProficiencySlider').value;
        const userProficiencyDescription = getUserProficiencyText(userProficiency)
        const explanationDepth = document.getElementById('explanationDepthSlider').value;
        const persona = document.getElementById('persona').value;


        finalPrompt = `
            You are my ${persona.toUpperCase()}. I am a ${userData.role.toUpperCase()}. 
            Regarding this topic I will ask you about: ${getUserProficiencySpecificInstructions(userProficiencyDescription)} 
            In answering my question: ${getExplanationDepthSpecificInstructions(explanationDepth)}
            ${productivityClause}
            Only when necessary, provide accurate and existing sources about my question.
        `
    }
    else if (selectedTask == 'Explain') {
        const codingProficiency = document.getElementById('codingExplanationDepthSlider').value;
        const codingExplanationDepthText = getCodingProficiencyText(codingProficiency);
        const codingProficiencyDescription = getCodingProficiencySpecificInstructions(codingExplanationDepthText)
        const persona = document.getElementById('persona').value;


        finalPrompt = `
            You are my ${persona.toUpperCase()}. I am a ${userData.role.toUpperCase()}. 
            I will give you code snippets. ${codingProficiencyDescription} 
            ${productivityClause}
            Only when necessary, provide accurate and existing sources about my question.
        `

    }
    else if (selectedTask == 'Proofread') {
        const proofreadingFlexibility = document.getElementById('proofreadingFlexibilitySlider').value;
        const proofreadingFlexibilityText = getProofreadingFlexibilityText(proofreadingFlexibility);

        finalPrompt = ` You are a PROOFREADER for a ${userData.role.toUpperCase()}. 
                        Check the grammar, style, and syntax of the text I'll provide. 
                        ${getProofreadingFlexibilityText(proofreadingFlexibility)} 
                        ${getProofreadingFlexibilitySpecificInstructions(proofreadingFlexibilityText)} 
                        ${promptFormatClause}
                        ${productivityClause}
                    `

    }
    else if (selectedTask == 'Adjust') {
        const format = document.getElementById('document-type').value;
        const audience = document.getElementById('audience').value;
        const proficiency = document.getElementById('proficiencySlider').value;
    
        let proficiencyText = getReaderProficiencyText(proficiency);
    
        finalPrompt = `I made this ${format.toUpperCase()} for a ${audience.toUpperCase()} with ${proficiencyText.toUpperCase()} technical proficiency on the subject. \
                        I want my writing to match their comprehension. 
                        ${getReaderProficiencySpecificInstructions(proficiencyText)} 
                        ${promptFormatClause} 
                        ${productivityClause}
                        `
    
    }

   
    userData.role = (roleSelect.value === 'Others') ? otherRoleInput.value.trim() : roleSelect.value;
    
    if (formOneSubmitted) { // Check if this is an update or first submission

        if (!textAreaWrapper.classList.contains('locked') && personaHeading.style.display === "block") {
            updatePersonaText();
        }
        
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
        
        // Show the persona heading
        personaHeading.style.display = "block";
        
        // Update the persona text with user data
        updatePersonaText(finalPrompt);
    }, 1000);




});


copyBtn.addEventListener('click', function() {
  
    const textToCopy = promptTextArea.innerText;
    
    navigator.clipboard.writeText(textToCopy).then(function() {
        // Show success message
        copyBtn.innerHTML = '<span class="copy-icon">✓</span> Copied!';
        copyBtn.style.background = "linear-gradient(135deg, #10B981, #059669)";
        
   
        // copyBtn.innerHTML = '<span class="copy-icon">📋</span> Copy this prompt';
        // copyBtn.style.background = "linear-gradient(135deg, #6366F1, #8B5CF6)";
        
        // Show chat popup
        chatPopup.style.display = "block";
        
    }, function() {
        // Show error message if copy fails
        copyBtn.innerHTML = '<span class="copy-icon">❌</span> Failed to copy';
        copyBtn.style.background = "linear-gradient(135deg, #EF4444, #DC2626)";
        
        // Revert button after 2 seconds
        setTimeout(function() {
            copyBtn.innerHTML = '<span class="copy-icon">📋</span> Copy Text';
            copyBtn.style.background = "linear-gradient(135deg, #6366F1, #8B5CF6)";
        }, 2000);
    });
});

// Hide chat popup when clicking outside of it
document.addEventListener('click', function(event) {
    if (!copyBtn.contains(event.target) && !chatPopup.contains(event.target) && chatPopup.style.display === "block") {
        chatPopup.style.display = "none";
    }
});