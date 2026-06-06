const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Port management for generated apps
const fs = require('fs');
const portRegistryPath = path.join(__dirname, 'generated-apps', 'port-registry.json');

// Initialize port registry
function initPortRegistry() {
  const registryDir = path.join(__dirname, 'generated-apps');
  if (!fs.existsSync(registryDir)) {
    fs.mkdirSync(registryDir, { recursive: true });
  }
  if (!fs.existsSync(portRegistryPath)) {
    fs.writeFileSync(portRegistryPath, JSON.stringify({ apps: {}, nextPort: 5000 }, null, 2));
  }
}

// Get next available port
function getNextAvailablePort() {
  try {
    const registry = JSON.parse(fs.readFileSync(portRegistryPath, 'utf-8'));
    const usedPorts = Object.values(registry.apps).map(app => app.port);
    let nextPort = registry.nextPort || 5000;
    
    // Find next available port
    while (usedPorts.includes(nextPort)) {
      nextPort++;
    }
    
    return nextPort;
  } catch (error) {
    console.error('Error reading port registry:', error);
    return 5000;
  }
}

// Register app with port
function registerAppPort(appName, port, databaseName) {
  try {
    const registry = JSON.parse(fs.readFileSync(portRegistryPath, 'utf-8'));
    registry.apps[appName] = {
      port,
      databaseName,
      createdAt: new Date().toISOString()
    };
    registry.nextPort = port + 1;
    fs.writeFileSync(portRegistryPath, JSON.stringify(registry, null, 2));
    console.log(`✅ Registered ${appName} on port ${port}`);
  } catch (error) {
    console.error('Error registering app port:', error);
  }
}

// Initialize port registry on startup
initPortRegistry();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'dist')));
// Serve public directory for static assets (logo, verification files, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// SEO Files - Serve sitemap.xml and robots.txt from public directory
app.get('/sitemap.xml', (req, res) => {
  res.setHeader('Content-Type', 'application/xml');
  res.sendFile(path.join(__dirname, 'public/sitemap.xml'));
});

app.get('/robots.txt', (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.sendFile(path.join(__dirname, 'public/robots.txt'));
});

// Google Search Console verification file
app.get('/googled2aa9717f21f7609.html', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.sendFile(path.join(__dirname, 'public/googled2aa9717f21f7609.html'));
});

// MongoDB Connection String
const MONGODB_URI = process.env.MONGODB_URI || `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_CLUSTER}/${process.env.MONGODB_DATABASE}?retryWrites=true&w=majority`;

let db;
let contactsCollection;

// Email transporter configuration
let emailTransporter;

function createEmailTransporter() {
  try {
    emailTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    console.log('✅ Email transporter configured successfully!');
  } catch (error) {
    console.error('⚠️  Email configuration error:', error.message);
    console.log('⚠️  Email notifications will be disabled. Update EMAIL_* variables in .env to enable.');
  }
}

// Send email notification
async function sendEmailNotification(contactData) {
  if (!emailTransporter) {
    console.log('⚠️  Email transporter not configured. Skipping email notification.');
    return false;
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_TO,
      subject: `New Contact Form Submission - ${contactData.service}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0066ff;">New Contact Form Submission</h2>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <p><strong>Name:</strong> ${contactData.name}</p>
            <p><strong>Email:</strong> <a href="mailto:${contactData.email}">${contactData.email}</a></p>
            <p><strong>Phone:</strong> ${contactData.phone || 'Not provided'}</p>
            <p><strong>Company:</strong> ${contactData.company || 'Not provided'}</p>
            <p><strong>Service Interest:</strong> ${contactData.service}</p>
            <p><strong>Message:</strong></p>
            <div style="background-color: white; padding: 15px; border-left: 4px solid #0066ff; margin-top: 10px;">
              ${contactData.message}
            </div>
            <p style="margin-top: 20px; color: #666;"><strong>Submitted at:</strong> ${new Date(contactData.submittedAt).toLocaleString()}</p>
          </div>
          <p style="color: #666; font-size: 12px;">This is an automated notification from GenVedha website contact form.</p>
        </div>
      `
    };

    await emailTransporter.sendMail(mailOptions);
    console.log('✅ Email notification sent successfully to', process.env.EMAIL_TO);
    return true;
  } catch (error) {
    console.error('⚠️  Error sending email:', error.message);
    return false;
  }
}

// Connect to MongoDB
async function connectToDatabase() {
  try {
    const client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    await client.connect();
    console.log('✅ Connected to MongoDB successfully!');
    
    db = client.db(process.env.MONGODB_DATABASE);
    contactsCollection = db.collection('contacts');
    
    // Test the connection with a simple operation
    try {
      await db.admin().ping();
      console.log('✅ MongoDB ping successful!');
    } catch (pingError) {
      console.log('⚠️  MongoDB ping failed:', pingError.message);
    }
    
    // Try to create index on email for faster queries (optional)
    try {
      await contactsCollection.createIndex({ email: 1 });
      console.log('✅ Database index created successfully!');
    } catch (indexError) {
      console.log('⚠️  Could not create index (this is okay):', indexError.message);
    }
    
  } catch (error) {
    console.error('⚠️  MongoDB connection error:', error.message);
    console.log('⚠️  Running in demo mode without database. Contact form submissions will not be saved.');
    console.log('💡 To fix: Check your MongoDB connection string in .env');
    // Set collections to null to trigger demo mode
    db = null;
    contactsCollection = null;
  }
}

// API Routes

// Submit contact form
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, company, message, service } = req.body;
    
    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required fields'
      });
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }
    
    const contactData = {
      name,
      email,
      phone: phone || '',
      company: company || '',
      message,
      service: service || 'General Inquiry',
      submittedAt: new Date(),
      status: 'new'
    };
    
    // Send email notification
    const emailSent = await sendEmailNotification(contactData);
    
    // Check if MongoDB is connected
    if (contactsCollection) {
      try {
        const result = await contactsCollection.insertOne(contactData);
        
        res.status(201).json({
          success: true,
          message: 'Thank you for contacting us! We will get back to you soon.',
          contactId: result.insertedId,
          emailSent: emailSent
        });
      } catch (dbError) {
        console.error('⚠️  MongoDB insert error:', dbError.message);
        console.error('⚠️  Error code:', dbError.code);
        console.error('⚠️  Error name:', dbError.codeName);
        
        // If database fails but email was sent, still return success
        if (emailSent) {
          console.log('✅ Email was sent successfully, continuing without database save');
          res.status(201).json({
            success: true,
            message: 'Thank you for contacting us! We will get back to you soon.',
            emailSent: true,
            dbSaved: false,
            note: 'Your message was received via email'
          });
        } else {
          // Both failed
          throw dbError;
        }
      }
    } else {
      // Demo mode - log to console instead
      console.log('📧 Contact Form Submission (Demo Mode):', contactData);
      
      // If email was sent, that's good enough
      if (emailSent) {
        res.status(201).json({
          success: true,
          message: 'Thank you for contacting us! We will get back to you soon.',
          emailSent: true,
          dbSaved: false
        });
      } else {
        res.status(201).json({
          success: true,
          message: 'Thank you for contacting us! (Demo mode - submission logged to console)',
          demo: true,
          emailSent: false
        });
      }
    }
    
  } catch (error) {
    console.error('Error saving contact:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while submitting your request. Please try again.'
    });
  }
});

// Get all contacts (admin endpoint - you may want to add authentication)
app.get('/api/contacts', async (req, res) => {
  try {
    if (contactsCollection) {
      const contacts = await contactsCollection
        .find({})
        .sort({ submittedAt: -1 })
        .toArray();
      
      res.json({ success: true, contacts });
    } else {
      res.json({
        success: true,
        contacts: [],
        demo: true,
        message: 'Running in demo mode - no database connected'
      });
    }
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching contacts'
    });
  }
});

// Genvedha Guru - Requirements Analysis API (LLM-based conversation)
app.post('/api/genvedha/analyze-requirements', async (req, res) => {
  try {
    const { conversationHistory, currentRequirements, userMessage } = req.body;
    
    // Use the ClaudeClient from genvedha-llm-service (it handles model configuration)
    const ClaudeClient = require('./genvedha-llm-service/services/claude-client');
    
    let claudeClient;
    try {
      claudeClient = new ClaudeClient();
    } catch (error) {
      // Claude not configured, use fallback
      return res.status(200).json({
        success: false,
        error: 'LLM not configured',
        message: 'Using rule-based processing'
      });
    }

    // STEP 1: Extract requirements from user message using regex (reliable)
    const extractedInfo = {};
    const trimmedMessage = userMessage.trim();
    
    // Extract business name
    if (!currentRequirements.businessName) {
      const namePatterns = [
        /create\s+([A-Z][a-zA-Z0-9]+)/i,
        /(?:name|call|called)\s+(?:is|it)?\s*['""]?([A-Z][a-zA-Z0-9\s]+?)['""]?(?:\s+selling|\s+for|\.|,|$)/i,
        /(?:store|shop|business)\s+(?:called|named)\s+['""]?([A-Z][a-zA-Z0-9\s]+?)['""]?/i
      ];
      for (const p of namePatterns) {
        const m = userMessage.match(p);
        if (m && m[1] && m[1].trim().length >= 2) {
          extractedInfo.businessName = m[1].trim();
          break;
        }
      }
      // If user just types a name as answer (1-3 words, no common words)
      if (!extractedInfo.businessName) {
        const wordCount = trimmedMessage.split(/\s+/).length;
        const isCommonWord = /^(yes|no|ok|sure|hi|hello|hey|thanks|thank|please|help|how|what|why|when|where|i\s|my\s)/i.test(trimmedMessage);
        if (wordCount <= 3 && !isCommonWord && trimmedMessage.length >= 2 && trimmedMessage.length <= 30) {
          extractedInfo.businessName = trimmedMessage;
          console.log('📌 Detected business name from short answer:', extractedInfo.businessName);
        }
      }
    }
    
    // Extract product type
    if (!currentRequirements.productType) {
      const productPatterns = [
        /selling\s+([a-zA-Z\s]+?)(?:\.|,|Categories|Description|$)/i,
        /sell\s+([a-zA-Z\s]+?)(?:\.|,|Categories|Description|$)/i,
        /(?:i\s+)?(?:want to |will )?sell\s+([a-zA-Z\s]+)/i
      ];
      for (const p of productPatterns) {
        const m = userMessage.match(p);
        if (m && m[1] && m[1].trim().length >= 3) {
          extractedInfo.productType = m[1].trim();
          break;
        }
      }
      // If user just types the product type as answer (when we already have businessName)
      if (!extractedInfo.productType && currentRequirements.businessName && !currentRequirements.productType) {
        const isCommonWord = /^(yes|no|ok|sure|hi|hello|hey|thanks)/i.test(trimmedMessage);
        if (!isCommonWord && trimmedMessage.length >= 3 && trimmedMessage.length <= 50 && !trimmedMessage.includes(',')) {
          extractedInfo.productType = trimmedMessage;
          console.log('📌 Detected product type from answer:', extractedInfo.productType);
        }
      }
    }
    
    // Extract categories - flexible patterns
    if (!currentRequirements.categories) {
      const catPatterns = [
        /Categories?:\s*([a-zA-Z\s,]+?)(?:\.|Description|$)/i,
        /categories?\s+(?:are|like|include|would be)\s*:?\s*([a-zA-Z\s,]+?)(?:\.|$)/i
      ];
      for (const p of catPatterns) {
        const m = userMessage.match(p);
        if (m && m[1]) {
          const cats = m[1].split(',').map(c => c.trim()).filter(c => c.length > 0);
          if (cats.length >= 1) {
            extractedInfo.categories = cats;
            break;
          }
        }
      }
      // If user types comma-separated items (when we already have businessName and productType)
      if (!extractedInfo.categories && currentRequirements.businessName && currentRequirements.productType) {
        if (trimmedMessage.includes(',')) {
          const commaItems = trimmedMessage.split(',').map(c => c.trim()).filter(c => c.length > 0);
          if (commaItems.length >= 2) {
            extractedInfo.categories = commaItems;
            console.log('📌 Detected categories from comma-separated answer:', extractedInfo.categories);
          }
        }
      }
    }
    
    // Extract description
    if (!currentRequirements.description) {
      const descMatch = userMessage.match(/Description:\s*(.+?)(?:\.|Categories|$)/i);
      if (descMatch && descMatch[1]) {
        extractedInfo.description = descMatch[1].trim();
      }
    }
    
    console.log('📋 Regex extracted info:', extractedInfo);
    
    // Merge with current requirements
    const updatedRequirements = { ...currentRequirements };
    for (const [key, value] of Object.entries(extractedInfo)) {
      if (value !== null && value !== undefined && value !== '') {
        updatedRequirements[key] = value;
      }
    }
    
    // Check if all requirements are gathered (description is optional)
    const allGathered = !!(
      updatedRequirements.businessName &&
      updatedRequirements.productType &&
      updatedRequirements.categories &&
      updatedRequirements.categories.length >= 1
    );
    
    // Auto-generate description if we have everything else
    if (allGathered && !updatedRequirements.description) {
      updatedRequirements.description = `${updatedRequirements.businessName} - ${updatedRequirements.productType} e-commerce platform`;
      extractedInfo.description = updatedRequirements.description;
    }
    
    console.log('📋 Updated requirements:', updatedRequirements);
    console.log('✅ All gathered:', allGathered);

    // STEP 2: Use LLM for conversational response
    const missingFields = [];
    if (!updatedRequirements.businessName) missingFields.push('business name');
    if (!updatedRequirements.productType) missingFields.push('product type');
    if (!updatedRequirements.categories) missingFields.push('product categories');
    
    let conversationPrompt;
    
    if (allGathered) {
      conversationPrompt = `You are Genvedha Guru, an e-commerce app creator. The user has provided ALL requirements:

Business Name: ${updatedRequirements.businessName}
Product Type: ${updatedRequirements.productType}
Description: ${updatedRequirements.description}
Categories: ${updatedRequirements.categories.join(', ')}

Show a neat summary of the collected requirements. Tell the user you're now ready to generate their "${updatedRequirements.businessName}" e-commerce app. Be enthusiastic but brief. ONLY discuss e-commerce.`;
    } else if (missingFields.length === 3) {
      // First interaction - ask for business name
      conversationPrompt = `You are Genvedha Guru, an e-commerce app creator. The user said: "${userMessage}"

This is the start of the conversation. Welcome the user warmly and ask them: "What would you like to name your e-commerce business?"

Be friendly and brief. ONLY discuss e-commerce. If user asks off-topic, redirect them politely.`;
    } else {
      // Some info collected, ask for the next missing field
      const nextQuestion = !updatedRequirements.businessName
        ? 'What would you like to name your e-commerce business?'
        : !updatedRequirements.productType
        ? `What type of products will ${updatedRequirements.businessName} be selling?`
        : !updatedRequirements.categories
        ? `What product categories would you like for ${updatedRequirements.businessName}? (Please list them separated by commas, e.g., "Category1, Category2, Category3")`
        : 'Tell me more about your business.';
      
      conversationPrompt = `You are Genvedha Guru, an e-commerce app creator. The user said: "${userMessage}"

Already collected: ${JSON.stringify(updatedRequirements)}

Acknowledge what the user just provided, then ask this EXACT next question: "${nextQuestion}"

Be friendly and brief. Ask only ONE question. ONLY discuss e-commerce. If user asks off-topic, redirect them.`;
    }

    const messages = [{
      role: 'user',
      content: conversationPrompt
    }];

    const response = await claudeClient.client.messages.create({
      model: claudeClient.model,
      max_tokens: 500,
      messages: messages
    });

    const aiResponse = response.content[0].text;
    console.log('🤖 LLM response:', aiResponse.substring(0, 200));

    res.status(200).json({
      success: true,
      response: aiResponse,
      extractedInfo: extractedInfo,
      allRequirementsGathered: allGathered
    });

  } catch (error) {
    console.error('❌ Requirements analysis failed:', error);
    res.status(200).json({
      success: false,
      error: 'Analysis failed',
      message: error.message
    });
  }
});

// Genvedha Guru - App Generation API
app.post('/api/genvedha/generate', async (req, res) => {
  try {
    const { businessName, productType, description, categories, mongoUri, databaseName } = req.body;
    
    // Validate required fields
    if (!businessName || !productType || !categories) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'businessName, productType, and categories are required'
      });
    }

    console.log('\n🚀 Genvedha Guru - New App Generation Request');
    console.log('📋 Business Name:', businessName);
    console.log('📦 Product Type:', productType);
    console.log('📂 Categories:', categories.length);

    // Auto-assign next available port
    const assignedPort = getNextAvailablePort();
    const dbName = databaseName || businessName.toLowerCase().replace(/\s+/g, '_') + '_db';

    console.log(`🔌 Auto-assigned port: ${assignedPort}`);

    // Prepare the app generation request
    const appConfig = {
      businessName,
      productType,
      description: description || `${businessName} - ${productType} E-commerce Platform`,
      categories,
      port: assignedPort,
      mongoUri: mongoUri || 'mongodb://localhost:27017',
      databaseName: dbName
    };

    // Generate the app using the LLM service
    const AppGenerator = require('./genvedha-llm-service/services/app-generator');
    const appGenerator = new AppGenerator();
    await appGenerator.initialize();

    const userRequirements = `Create an e-commerce app called "${businessName}" selling ${productType}. Description: ${description || businessName + ' e-commerce platform'}. Categories: ${categories.map(c => c.name || c).join(', ')}. Port: ${assignedPort}. Database: ${dbName}.`;
    
    const result = await appGenerator.generateApp({
      userRequirements: userRequirements,
      credentials: {
        mongoUri: mongoUri || 'mongodb://localhost:27017',
        databaseName: dbName
      },
      userId: 'genvedha-guru-user'
    });

    console.log('✅ App generated successfully!');
    console.log('📁 Output directory:', result.outputDir);

    // Register the app with its assigned port
    registerAppPort(businessName, assignedPort, dbName);

    res.status(200).json({
      success: true,
      message: 'E-commerce app generated successfully!',
      appName: businessName,
      outputDir: result.outputDir,
      port: assignedPort,
      categories: categories.length,
      filesGenerated: result.filesGenerated || 0,
      nextSteps: [
        `cd ${result.outputDir}`,
        'npm install',
        'npm start'
      ],
      portInfo: {
        assigned: assignedPort,
        message: `Your app will run on port ${assignedPort}`
      }
    });

  } catch (error) {
    console.error('❌ App generation failed:', error);
    res.status(500).json({
      success: false,
      error: 'App generation failed',
      message: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    database: db ? 'connected' : 'disconnected',
    email: emailTransporter ? 'configured' : 'not configured',
    genvedhaService: 'available'
  });
});

// Serve React app for all other routes (must be last)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
createEmailTransporter();
connectToDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📦 Serving React app from /dist`);
    console.log(`🔌 API endpoints available at /api/*`);
  });
});
