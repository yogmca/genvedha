# Genvedha Guru - Offline Mode Configuration

## Overview

Genvedha Guru now supports **offline mode**, allowing the chatbot to work without a Claude API key. The chatbot uses intelligent pattern matching to gather requirements and create e-commerce apps.

## Features

### ✅ Offline Mode (Default)
- Works without Claude API key
- Uses rule-based pattern matching
- Extracts business information from user messages
- Provides structured conversation flow
- Fully functional for app generation

### 🌐 Online Mode (Claude API)
- Natural language understanding
- Conversational AI responses
- More flexible input handling
- Requires Claude API key on server

## Configuration

### Quick Toggle

Edit [`genvedha-guru-config.js`](public/genvedha-guru-config.js:11):

```javascript
const GENVEDHA_CONFIG = {
    // Set to true to enable Claude API integration
    // Set to false to use offline rule-based mode
    USE_CLAUDE_API: false,  // Change this to true for AI mode
    
    // ... other settings
};
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `USE_CLAUDE_API` | boolean | `false` | Enable/disable Claude API integration |
| `DEFAULT_PORT` | number | `5000` | Default port for generated apps |
| `MIN_CATEGORIES` | number | `2` | Minimum categories required |

## How Offline Mode Works

### 1. **Pattern Matching**
The chatbot uses regex patterns to extract information:

```javascript
// Business Name Patterns
"My business name is AquaGarden"
"Create AquaGarden"
"AquaGarden"

// Product Type Patterns
"Selling aquatic plants"
"Products: aquatic plants"
"Type of products: aquatic plants"

// Categories Patterns
"Categories: Floating Plants, Stem Plants, Moss"
"Floating Plants, Stem Plants, Moss"
```

### 2. **Conversation Flow**
The chatbot asks for missing information in order:
1. Business Name
2. Product Type
3. Product Categories

### 3. **Smart Extraction**
- Capitalizes business names properly
- Cleans up product descriptions
- Parses comma-separated categories
- Validates minimum requirements

## Usage Examples

### Example 1: All Information at Once
**User:** "Create AquaGarden selling aquatic plants. Categories: Floating Plants, Stem Plants, Carpet Plants, Moss"

**Bot:** ✅ Extracts all information and shows preview

### Example 2: Step by Step
**User:** "AquaGarden"
**Bot:** "Great! 'AquaGarden' is a nice name! What type of products will you be selling?"

**User:** "aquatic plants"
**Bot:** "Perfect! So you'll be selling aquatic plants. What product categories would you like?"

**User:** "Floating Plants, Stem Plants, Moss"
**Bot:** ✅ Shows requirements preview

### Example 3: Natural Language (Offline Mode)
**User:** "I want to create an online store called FreshMart selling organic vegetables"
**Bot:** Extracts "FreshMart" and "organic vegetables", then asks for categories

## Switching to Online Mode

### Prerequisites
1. Claude API key configured on server
2. Backend endpoint `/api/genvedha/analyze-requirements` working

### Steps
1. Open [`genvedha-guru-config.js`](public/genvedha-guru-config.js:11)
2. Change `USE_CLAUDE_API: false` to `USE_CLAUDE_API: true`
3. Save the file
4. Refresh the browser

### Visual Indicators
- **Offline Mode:** 🔌 Orange badge "Offline Mode"
- **Online Mode:** 🌐 Green badge "AI Mode"

## Testing

### Test Offline Mode
1. Ensure `USE_CLAUDE_API: false` in config
2. Open [`genvedha-guru.html`](public/genvedha-guru.html:1)
3. Click "🚀 Start Creating"
4. Try these inputs:
   ```
   AquaGarden
   aquatic plants
   Floating Plants, Stem Plants, Moss
   ```

### Test Pattern Matching
Try different formats:
```
"My business is called TechStore"
"Selling electronics"
"Categories: Laptops, Phones, Tablets"
```

## Troubleshooting

### Issue: Bot doesn't extract information
**Solution:** Use clearer patterns:
- Start business name with capital letter
- Use "selling" or "products:" for product type
- Use "Categories:" or comma-separated list for categories

### Issue: Bot asks for already provided info
**Solution:** Provide information in separate messages or use exact patterns

### Issue: Mode indicator not showing
**Solution:** Clear browser cache and refresh

## Benefits of Offline Mode

✅ **No API Costs** - Works without external API calls
✅ **Privacy** - All processing happens client-side
✅ **Fast Response** - Instant pattern matching
✅ **Reliable** - No dependency on external services
✅ **Predictable** - Consistent behavior
✅ **Easy Setup** - No API key configuration needed

## Default Behavior

When the chatbot starts, it will:
1. Show mode indicator (Offline/AI Mode)
2. Display welcome message with mode note
3. Use appropriate conversation style based on mode
4. Process user input accordingly

## File Structure

```
public/
├── genvedha-guru.html          # Main HTML file
├── genvedha-guru.js            # Main chatbot logic
├── genvedha-guru-config.js     # Configuration file (NEW)
└── genvedha-guru.css           # Styles
```

## API Endpoints (Online Mode Only)

When `USE_CLAUDE_API: true`:
- `POST /api/genvedha/analyze-requirements` - Analyze user input with AI
- `POST /api/genvedha/generate` - Generate app files

## Future Enhancements

- [ ] Add more pattern variations
- [ ] Support for additional languages
- [ ] Enhanced validation rules
- [ ] Export/import configurations
- [ ] A/B testing between modes

## Support

For issues or questions:
1. Check console logs for debugging info
2. Verify configuration settings
3. Test with example inputs
4. Review pattern matching logic in [`genvedha-guru.js`](public/genvedha-guru.js:315)

---

**Last Updated:** July 16, 2026
**Version:** 2.0 (Offline Mode Support)
