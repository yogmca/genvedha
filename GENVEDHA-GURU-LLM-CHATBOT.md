# Genvedha Guru - LLM-Powered Conversational Chatbot

## Overview

Genvedha Guru has been upgraded to use **AI-powered natural language processing** for gathering e-commerce app requirements. Instead of a rigid question-and-answer flow, users can now have a natural conversation with the AI assistant.

## Key Features

### 🤖 Natural Conversation
- Users can chat naturally about their business idea
- AI extracts requirements from free-form conversation
- No need to follow a strict question sequence
- Intelligent follow-up questions based on context

### 🎯 Focused on E-commerce Only
- AI is **strictly limited** to e-commerce app creation topics
- If users ask about unrelated topics (weather, sports, politics, etc.), the AI politely redirects them back to creating their e-commerce app
- Maintains professional focus throughout the conversation

### 📋 Smart Requirement Extraction
The AI automatically extracts:
1. **Business Name** - What they want to call their e-commerce business
2. **Product Type** - What products they will be selling
3. **Business Description** - A brief description of their business
4. **Product Categories** - The categories of products they need

### ✅ Automatic Completion Detection
- AI knows when all required information has been gathered
- Automatically shows requirements preview when ready
- Users can review and approve before app generation

## How It Works

### User Flow

1. **Start Conversation**
   - User clicks "🚀 Start Creating" button
   - AI greets them and asks about their business idea

2. **Natural Chat**
   - User describes their business in their own words
   - AI asks clarifying questions as needed
   - Requirements are extracted automatically

3. **Review & Approve**
   - Once all info is gathered, AI shows a summary
   - User can edit or approve the requirements

4. **App Generation**
   - AI generates the complete e-commerce app
   - Progress is shown with visual feedback
   - App is ready in under a minute

### Example Conversation

```
User: "Hi, I want to create an online store"

AI: "Excellent! Let's get started. 🎉

Tell me about your e-commerce business idea. You can share:
• What you want to name your business
• What products you'll be selling
• Any other details about your vision

Just chat naturally with me, and I'll gather all the information I need!"

User: "I want to sell aquatic plants for aquariums. The business name is AquaGarden"

AI: "Great! AquaGarden is a wonderful name for an aquatic plants business! 🌿

Could you give me a brief description of what makes AquaGarden special? And what categories of aquatic plants will you be offering?"

User: "We sell premium quality plants. Categories are: Floating Plants, Stem Plants, Carpet Plants, and Moss"

AI: "Perfect! I have all the information I need. Let me show you a summary of your app requirements..."
```

## Technical Implementation

### Frontend (`public/genvedha-guru.js`)

**Key Changes:**
- Removed rigid conversation flow
- Added `conversationHistory` to track the entire conversation
- Implemented `processWithAI()` method to call the LLM API
- Fallback to rule-based processing if LLM is unavailable
- Smart requirement extraction from natural language

**Main Methods:**
```javascript
async processWithAI(userMessage) {
  // Calls /api/genvedha/analyze-requirements
  // Sends conversation history and current requirements
  // Receives AI response and extracted information
  // Updates UI based on AI's analysis
}

processWithRules(userMessage) {
  // Fallback method using regex patterns
  // Extracts requirements using pattern matching
  // Used when LLM API is not available
}
```

### Backend (`server.js`)

**New API Endpoint:**
```javascript
POST /api/genvedha/analyze-requirements
```

**Request Body:**
```json
{
  "conversationHistory": [
    { "role": "user", "content": "I want to sell plants" },
    { "role": "assistant", "content": "Great! What's your business name?" }
  ],
  "currentRequirements": {
    "businessName": null,
    "productType": "plants",
    "description": null,
    "categories": null
  },
  "userMessage": "The business name is AquaGarden"
}
```

**Response:**
```json
{
  "success": true,
  "response": "Great! AquaGarden is a wonderful name...",
  "extractedInfo": {
    "businessName": "AquaGarden"
  },
  "allRequirementsGathered": false
}
```

### AI System Prompt

The AI is given strict instructions:

```
You are Genvedha Guru, an AI assistant specialized in creating e-commerce applications. 
Your ONLY purpose is to help users create e-commerce apps by gathering the following information:

1. Business Name
2. Product Type
3. Business Description
4. Product Categories

STRICT RULES:
- ONLY discuss e-commerce app creation topics
- If user asks about anything unrelated, politely redirect them back
- Be friendly but stay focused on gathering the 4 required pieces of information
- Once you have all 4 pieces, let the user know you're ready to create their app
```

## Configuration

### Environment Variables

Add to your `.env` file:

```bash
# Claude API Key for AI-powered chatbot
CLAUDE_API_KEY=your_claude_api_key_here
CLAUDE_MODEL=claude-3-5-sonnet-20241022
```

### Getting a Claude API Key

1. Go to [https://console.anthropic.com/](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key to your `.env` file

### Fallback Mode

If `CLAUDE_API_KEY` is not configured:
- The chatbot automatically falls back to **rule-based processing**
- Uses regex patterns to extract requirements
- Still functional but less intelligent than LLM mode

## Benefits Over Previous Version

### Before (Rigid Flow)
❌ Users had to answer questions in a specific order
❌ No flexibility in how information was provided
❌ Felt like filling out a form
❌ Users couldn't ask questions or clarify
❌ Got stuck if they didn't understand a question

### After (LLM-Powered)
✅ Natural conversation flow
✅ Users can provide information in any order
✅ Feels like talking to a human assistant
✅ AI can answer questions and provide clarification
✅ Intelligent handling of unclear responses
✅ Stays focused on e-commerce topics only

## Security & Privacy

- Conversation history is **not stored** on the server
- Each conversation is independent
- No user data is retained after app generation
- API calls to Claude are made server-side (API key is secure)

## Testing

### Test the Chatbot

1. Open `http://localhost:3000/genvedha-guru.html`
2. Click "🚀 Start Creating"
3. Try different conversation styles:
   - Provide all info at once
   - Answer questions one by one
   - Ask the AI questions
   - Try off-topic questions (AI should redirect)

### Test Cases

**Test 1: All Info at Once**
```
User: "I want to create AquaGarden, an online store for aquatic plants. 
We'll sell Floating Plants, Stem Plants, Carpet Plants, and Moss."
```
Expected: AI extracts all information and shows preview

**Test 2: Step by Step**
```
User: "I want to sell plants"
AI: "Great! What's your business name?"
User: "AquaGarden"
AI: "What type of plants?"
User: "Aquatic plants for aquariums"
```
Expected: Natural back-and-forth conversation

**Test 3: Off-Topic**
```
User: "What's the weather today?"
```
Expected: AI politely redirects to e-commerce app creation

## Troubleshooting

### Issue: AI Not Responding
**Solution:** Check if `CLAUDE_API_KEY` is set in `.env` file

### Issue: Chatbot Gets Stuck
**Solution:** 
1. Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)
2. Check browser console for errors
3. Verify server is running on port 3000

### Issue: Requirements Not Extracted
**Solution:** 
- Be more specific in your responses
- Include key information (business name, product type, categories)
- The AI will ask follow-up questions if needed

### Issue: API Key Error
**Solution:**
1. Verify API key is valid
2. Check API key has sufficient credits
3. Ensure no extra spaces in `.env` file

## Future Enhancements

- [ ] Multi-language support
- [ ] Voice input capability
- [ ] Image upload for product examples
- [ ] Integration with business databases
- [ ] Advanced customization options through conversation
- [ ] Export conversation history

## Support

For issues or questions:
- Check the browser console for errors
- Review server logs for API errors
- Ensure all dependencies are installed (`npm install`)
- Verify environment variables are set correctly

## Credits

- **AI Model:** Claude 3.5 Sonnet by Anthropic
- **Framework:** Express.js + Vanilla JavaScript
- **UI Design:** Custom CSS with modern animations
