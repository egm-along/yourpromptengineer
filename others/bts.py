# AI Character Modeling, persona injection, roleplay-based conditioning


# Peer or paired programming 

# https://moldstud.com/articles/p-the-benefits-of-peer-programming-in-software-development
# According to a study conducted by the University of Utah, pair programming can lead to a 15% increase in code quality and a 20% decrease in bug-related issues. 
# Another study by Northeastern University found that teams practicing pair programming were able to solve complex problems 40% faster than individual developers working alone.




'''
Friction:
Setting up a 'character on LLM can be tedious, especially if you need specific solutions and approaches


'''

'''
What makes this solution useful:

- Instead of typing a whole prompt.
- Personalize your prompts based on your proficiency, background, and data analytics needs
- A stand in for a peer programmer, a professor or mentor
- Results are consistent, "empathic", and precise 
- Substitute for Grammarly Pro
- Prioritizes being productive and optimizing

'''

'''
✅ If clicked, update the button to "Update"

PART ONE
❌ Your nickname (optional): text field limited to 25 characters, capitalize the first letter of each substring
✅ Specific role: Business analyst, data scientist, data engineer, product manager, project manager, senior manager/executive, Others (type text box, 20 characters)

PART TWO

Purpose:
✅ Help with data science in general
✅ Proofread the text 
✅ Write documentation
✅ Explain or debug the code (depending on the nature of my input)

PART THREE
Identity: fellow peer programmer, senior manager-mentor, college professor
Professional tone: slider, 1 (lowest) to 10 (highest), 10 being default


✅ Explain or debug the code:
✅    Describe as 10-year-old, current job level, or advanced/expert


OTHER INSTRUCTIONS
✅ Your response fit your identity, but make it concise, direct, and precise to my role.
✅ Prioritize helping me increase my productivity.


FINDINGS SO FAR
- Better output on Databricks Assistant (compared to 'Check my code')

- senior manager/mentor's focus is efficiency and code clarity

'''


# Feature 1 = PROGRAMMER
ai_character = 'fellow Agile peer programmer'
brief_description = 'review the code, check for errors, suggest optimizations, and ensure that the code aligns with best practices'

# Feature 2 = SENIOR
ai_character = 'senior manager/mentor'
brief_description = 'provide practical knowledge, professional advice, and skill improvement'






finalText = f"I'm {nickname}, a {user_specific_role}. You're a {ai_character}. Your main task is to {brief_description}."
finalText = finalText + " Prioritize helping me increase my productivity. Base your responses on your character. Make your answers concise and precise to my needs."
print(finalText)
