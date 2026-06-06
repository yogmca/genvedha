# Genvedha Guru - AI E-commerce App Creator

## Overview

**Genvedha Guru** is an interactive AI chatbot that guides users through creating a complete e-commerce application in less than a minute. It features an animated robotic crew member that collects requirements, shows a preview for approval, and generates a fully-functional app using the Genvedha LLM service.

## Features

### 🤖 Interactive AI Assistant
- Animated robot character with speech bubbles
- Conversational interface for requirement gathering
- Real-time status updates and visual feedback

### 📋 Smart Requirement Collection
The chatbot collects the following information:
1. **Business Name** - Name of the e-commerce business
2. **Product Type** - Type of products to sell
3. **Description** - Brief business description
4. **Category Count** - Number of product categories needed
5. **Categories** - List of category names
6. **Port** - Server port (default: 5000)

### ✅ Approval Workflow
- Shows complete requirements preview before generation
- Allows users to review and edit requirements
- Requires explicit approval before app creation

### 🎨 App Generation
- Generates complete full-stack e-commerce application
- Creates React frontend with modern UI
- Sets up Node.js/Express backend
- Configures MongoDB database
- Includes product management system
- Adds image upload capability
- Implements responsive design

## File Structure

```
public/
├── genvedha-guru.html      # Main chatbot page
├── genvedha-guru.css       # Styles and animations
└── genvedha-guru.js        # Chatbot logic and API integration

server.js                   # Backend API endpoint
genvedha-llm-service/       # App generation service
```

## Components

### 1. HTML Structure (`genvedha-guru.html`)

**Key Sections:**
- **Navigation** - Header with logo and back button
- **Robot Section** - Animated robot character with speech bubble
- **Chat Section** - Message interface with input
- **Modals:**
  - Requirements Preview Modal
  - Progress Modal
  - Success Modal

### 2. CSS Styling (`genvedha-guru.css`)

**Features:**
- Animated robot with floating effect
- Waving arms and blinking antenna
- Smooth message animations
- Responsive design for mobile
- Modal overlays with backdrop blur
- Progress indicators

**Robot Animations:**
- `float` - Gentle up/down movement
- `antennaWave` - Antenna swaying
- `pulse` - Antenna ball pulsing
- `lookAround` - Eye pupil movement
- `smile` - Mouth animation
- `waveLeft/waveRight` - Arm waving

### 3. JavaScript Logic (`genvedha-guru.js`)

**Main Class: `GenvedhaGuru`**

**Properties:**
- `currentStep` - Current question index
- `requirements` - Collected user data
- `conversationFlow` - Question configuration

**Key Methods:**

#### `init()`
Initializes the chatbot and sets up event listeners

#### `startConversation()`
Begins the requirement collection process

#### `askNextQuestion()`
Displays the next question in the flow

#### `processAnswer(answer)`
Validates and stores user responses

#### `showRequirementsPreview()`
Displays modal with all collected requirements

#### `createApp()`
Calls the backend API to generate the app

**Conversation Flow:**
```javascript
[
  { question: "Business name?", field: "businessName", type: "text" },
  { question: "Product type?", field: "productType", type: "text" },
  { question: "Description?", field: "description", type: "text" },
  { question: "Category count?", field: "categoryCount", type: "number" },
  { question: "Categories?", field: "categories", type: "list" },
  { question: "Port?", field: "port", type: "number", default: "5000" }
]
```

## Backend Integration

### API Endpoint: `/api/genvedha/generate`

**Method:** POST

**Request Body:**
```json
{
  "businessName": "AquaGarden",
  "productType": "Aquatic Plants",
  "description": "Premium aquatic plants for aquariums",
  "categories": [
    {
      "id": "cat-1",
      "name": "Floating Plants",
      "slug": "floating-plants",
      "description": "Floating Plants products",
      "order": 1
    }
  ],
  "port": 5001,
  "mongoUri": "mongodb://localhost:27017",
  "databaseName": "aquagarden_db"
}
```

**Response:**
```json
{
  "success": true,
  "message": "E-commerce app generated successfully!",
  "appName": "AquaGarden",
  "outputDir": "./generated-apps/aquagarden_db",
  "port": 5001,
  "categories": 4,
  "filesGenerated": 45,
  "nextSteps": [
    "cd ./generated-apps/aquagarden_db",
    "npm install",
    "npm start"
  ]
}
```

## Usage Flow

### 1. User Journey

```
1. User visits genvedha-guru.html
   ↓
2. Robot greets and explains the service
   ↓
3. User clicks "Start Creating"
   ↓
4. Chatbot asks questions one by one
   ↓
5. User provides answers
   ↓
6. System validates each answer
   ↓
7. Shows requirements preview modal
   ↓
8. User reviews and approves
   ↓
9. Progress modal shows generation steps
   ↓
10. Success modal displays app details
    ↓
11. User can launch or create another app
```

### 2. Generation Steps

The progress modal shows these steps:
1. 🚀 Initializing
2. 🗄️ Setting up database
3. ⚙️ Creating backend
4. 🎨 Building frontend
5. 📂 Configuring categories
6. 📄 Generating files
7. ✨ Finalizing

## Quick Actions

The chatbot provides three quick action buttons:

1. **🚀 Start Creating** - Begin the app creation process
2. **💡 Show Example** - Display an example configuration
3. **❓ How It Works** - Explain the process

## Example Configuration

```javascript
Business Name: AquaGarden
Product Type: Aquatic Plants
Description: Premium aquatic plants for aquariums
Categories: Floating Plants, Stem Plants, Carpet Plants, Moss
Port: 5001
```

**Generated App Includes:**
- ✅ Product catalog with images
- ✅ Category filtering
- ✅ Shopping cart
- ✅ Admin panel
- ✅ Image upload
- ✅ Database integration
- ✅ Responsive design

## Integration with Main Website

The Genvedha Guru is integrated into the main GenVedha website:

1. **Hero Section** - Primary CTA button
2. **Services Section** - Featured service card
3. **Navigation** - Direct link

## Customization

### Modify Questions

Edit the `conversationFlow` array in `genvedha-guru.js`:

```javascript
this.conversationFlow = [
  {
    question: "Your question here?",
    field: "fieldName",
    type: "text|number|list",
    validation: (value) => /* validation logic */,
    errorMessage: "Error message",
    default: "optional default value"
  }
];
```

### Change Robot Appearance

Modify the robot structure in `genvedha-guru.html` and styles in `genvedha-guru.css`.

### Update Progress Steps

Edit the `steps` array in the `createApp()` method:

```javascript
const steps = [
  { name: 'Step name', icon: '🎨', duration: 2000 }
];
```

## Testing

### Local Testing

1. Start the server:
```bash
npm start
```

2. Visit:
```
http://localhost:3000/genvedha-guru.html
```

3. Test the flow:
   - Click "Start Creating"
   - Answer all questions
   - Review requirements
   - Approve and generate
   - Check generated app

### Test Cases

1. **Valid Input** - Complete flow with valid data
2. **Invalid Input** - Test validation errors
3. **Empty Input** - Test required field validation
4. **Default Values** - Test default port value
5. **Category Parsing** - Test comma-separated categories
6. **Modal Interactions** - Test all modal buttons
7. **Reset Flow** - Test "Create Another" button

## Troubleshooting

### Common Issues

**1. API Connection Failed**
- Check if server is running on port 3000
- Verify `/api/genvedha/generate` endpoint exists
- Check browser console for errors

**2. App Generation Fails**
- Ensure genvedha-llm-service is properly installed
- Check MongoDB connection
- Verify file write permissions

**3. Robot Not Animating**
- Check CSS file is loaded
- Verify browser supports CSS animations
- Clear browser cache

**4. Messages Not Appearing**
- Check JavaScript console for errors
- Verify DOM elements exist
- Check event listeners are attached

## Performance

- **Initial Load:** < 1 second
- **Question Response:** Instant
- **App Generation:** 30-60 seconds
- **File Size:**
  - HTML: ~8 KB
  - CSS: ~15 KB
  - JS: ~12 KB

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers

## Security Considerations

1. **Input Validation** - All inputs are validated
2. **XSS Prevention** - HTML is escaped
3. **Rate Limiting** - Consider adding to API
4. **Authentication** - Add for production use
5. **CORS** - Configure appropriately

## Future Enhancements

### Planned Features
- [ ] Save requirements for later
- [ ] Template selection
- [ ] Advanced customization options
- [ ] Real-time preview
- [ ] Multi-language support
- [ ] Voice input
- [ ] Integration with payment gateways
- [ ] Deployment automation

### Potential Improvements
- Add more product types
- Enhanced validation
- Better error handling
- Progress persistence
- User accounts
- App management dashboard

## API Reference

### POST `/api/genvedha/generate`

Generates a new e-commerce application.

**Headers:**
```
Content-Type: application/json
```

**Body Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| businessName | string | Yes | Name of the business |
| productType | string | Yes | Type of products |
| description | string | No | Business description |
| categories | array | Yes | Product categories |
| port | number | No | Server port (default: 5000) |
| mongoUri | string | No | MongoDB URI |
| databaseName | string | No | Database name |

**Success Response (200):**
```json
{
  "success": true,
  "message": "E-commerce app generated successfully!",
  "appName": "string",
  "outputDir": "string",
  "port": number,
  "categories": number,
  "filesGenerated": number,
  "nextSteps": ["string"]
}
```

**Error Response (400/500):**
```json
{
  "success": false,
  "error": "string",
  "message": "string"
}
```

## Support

For issues or questions:
- Email: support@genvedha.com
- Documentation: This file
- GitHub Issues: [Create an issue]

## License

Copyright © 2026 GenVedha Global AI & Software Solutions

---

**Created by:** GenVedha Team  
**Version:** 1.0.0  
**Last Updated:** 2026-05-31
