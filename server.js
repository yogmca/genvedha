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

// Redirect the legacy static Genvedha Guru page to the new React route.
// This MUST come before express.static so the old public/genvedha-guru.html
// file does not get served (handles bookmarks, old links, cached search results).
app.get('/genvedha-guru.html', (req, res) => {
  res.redirect(301, '/genvedha-guru');
});

// Serve static files from the React app build directory (no-cache to ensure latest bundle)
app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: 0,
  etag: false,
  lastModified: false
}));
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

// Genvedha Guru - Feature flag helper
// Controls whether the public "Start Creating" flow is enabled.
function isGenvedhaCreationEnabled() {
  return String(process.env.ENABLE_GENVEDHA_CREATION).toLowerCase() === 'true';
}

// Genvedha Guru - Public config endpoint
// Exposes safe, client-facing feature flags to the static frontend.
app.get('/api/genvedha/config', (req, res) => {
  res.json({
    success: true,
    creationEnabled: isGenvedhaCreationEnabled()
  });
});

// Genvedha Guru - Requirements Analysis API (LLM-based conversation)
app.post('/api/genvedha/analyze-requirements', async (req, res) => {
  try {
    // Guard: block the creation flow unless explicitly enabled via env flag
    if (!isGenvedhaCreationEnabled()) {
      return res.status(403).json({
        success: false,
        error: 'Feature disabled',
        message: 'App creation is currently disabled.'
      });
    }

    const { conversationHistory, currentRequirements, userMessage } = req.body;
    const currentReqStr = JSON.stringify(currentRequirements || {});
    const recentHistory = conversationHistory
      ? conversationHistory.slice(-4).map(m => m.role + ': ' + m.content).join(' | ')
      : '';
    
    // Use the NVIDIAClient from genvedha-llm-service for conversational LLM responses
    const NVIDIAClient = require('./genvedha-llm-service/services/nvidia-client');
    
    let nvidiaClient;
    try {
      nvidiaClient = new NVIDIAClient();
    } catch (error) {
      // NVIDIA not configured, use fallback
      return res.status(200).json({
        success: false,
        error: 'LLM not configured',
        message: 'Using rule-based processing'
      });
    }

    // STEP 1: Use NVIDIA to dynamically extract requirements AND generate conversational response
    // Shorter prompt to avoid truncation
    const extractionPrompt = `You are Genvedha Guru. Extract e-commerce requirements from the user's message.

CURRENT REQUIREMENTS: ${currentReqStr}
RECENT CHAT: ${recentHistory || '(none)'}
USER: "${userMessage}"

Extract: businessName, productType, categories (array), description.
Only extract fields clearly mentioned. Respond naturally.

RETURN ONLY valid JSON:
{"extractedInfo":{"businessName":null,"productType":null,"categories":null,"description":null},"allRequirementsGathered":false,"response":"your reply"}`;
    
    // STEP 1: Use NVIDIA to dynamically extract requirements AND generate conversational response
    // No rigid regex — NVIDIA understands free-form input naturally
    // Retry up to 3 times if NVIDIA returns empty/truncated responses (rate limiting)
    let extractionResponse;
    let lastError = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        extractionResponse = await nvidiaClient.chat({
          prompt: extractionPrompt,
          systemMessage: 'You are Genvedha Guru, an expert e-commerce app creator. Extract requirements dynamically from user conversation and respond naturally. Return ONLY valid JSON.',
          maxTokens: 400,
          temperature: 0.5
        });

        if (extractionResponse.response && extractionResponse.response.trim().length > 10) {
          break;
        }
        console.warn('⚠️  NVIDIA attempt ' + attempt + ' returned empty/short response, retrying...');
        lastError = new Error('Empty response from NVIDIA');
        await new Promise(r => setTimeout(r, attempt * 1000));
      } catch (err) {
        lastError = err;
        console.warn('⚠️  NVIDIA attempt ' + attempt + ' failed:', err.message);
        await new Promise(r => setTimeout(r, attempt * 1000));
      }
    }

    if (!extractionResponse || !extractionResponse.response || extractionResponse.response.trim().length <= 10) {
      console.error('❌ All NVIDIA attempts failed. Using fallback.');
      const fallbackResponses = [
        "I'm here to help you create your e-commerce app! Could you tell me your business name, what products you'll sell, and what categories you need?",
        "I'd love to help you build your online store! What's your business name and what type of products will you sell?",
        "Let's get started on your e-commerce app! Tell me your business name, product type, and categories."
      ];
      const fallbackResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];

      res.status(200).json({
        success: true,
        response: fallbackResponse,
        extractedInfo: {},
        allRequirementsGathered: false
      });
      return;
    }

    const rawText = extractionResponse.response || '';

    // STEP 3: Parse JSON with multiple strategies for truncated responses
    let parsed = null;

    // Strategy 1: Try to parse the full response as JSON
    try {
      parsed = JSON.parse(rawText);
    } catch (e1) {
      // Strategy 2: Extract the largest JSON object from the response
      try {
        const jsonMatch = rawText.match(/\{[\s\S]*}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        }
      } catch (e2) {
        // Strategy 3: Extract just the extractedInfo object from truncated JSON
        try {
          const infoMatch = rawText.match(/"extractedInfo"\s*:\s*\{[^}]*}/);
          if (infoMatch) {
            parsed = { extractedInfo: JSON.parse('{' + infoMatch[0] + '}'), allRequirementsGathered: false, response: rawText.substring(0, 200) };
          }
        } catch (e3) {
          // Strategy 4: Extract individual fields with regex
          try {
            const extractedInfo = {};
            const bnMatch = rawText.match(/"businessName"\s*:\s*"([^"]+)"/i);
            if (bnMatch) extractedInfo.businessName = bnMatch[1];
            const ptMatch = rawText.match(/"productType"\s*:\s*"([^"]+)"/i);
            if (ptMatch) extractedInfo.productType = ptMatch[1];
            const catMatch = rawText.match(/"categories"\s*:\s*\[([^\]]*)\]/i);
            if (catMatch) {
              extractedInfo.categories = catMatch[1].split(',').map(s => s.trim().replace(/"/g, ''));
            }
            if (Object.keys(extractedInfo).length > 0) {
              parsed = { extractedInfo: extractedInfo, allRequirementsGathered: false, response: rawText.substring(0, 200) };
            }
          } catch (e4) {
            parsed = null;
          }
        }
      }
    }

    if (!parsed) {
      console.error('❌ Failed to parse NVIDIA response:', rawText.substring(0, 200));
      parsed = {
        extractedInfo: {},
        allRequirementsGathered: false,
        response: extractionResponse.response || 'I\'m having trouble understanding. Could you tell me about your e-commerce business?'
      };
    }

    const extractedInfo = parsed.extractedInfo || {};
    const allGathered = parsed.allRequirementsGathered === true || (!!extractedInfo.businessName && !!extractedInfo.productType && !!extractedInfo.categories && extractedInfo.categories.length >= 1);
    const aiResponse = parsed.response || 'Tell me more about your e-commerce business idea!';

    const updatedRequirements = { ...currentRequirements, ...extractedInfo };

    console.log('📋 NVIDIA extracted info:', extractedInfo);
    console.log('📋 Updated requirements:', updatedRequirements);
    console.log('✅ All gathered:', allGathered);

    // Use the conversational response already generated by NVIDIA in step 1
    console.log('🤖 NVIDIA response:', aiResponse.substring(0, 200));

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
    // Guard: block the creation flow unless explicitly enabled via env flag
    if (!isGenvedhaCreationEnabled()) {
      return res.status(403).json({
        success: false,
        error: 'Feature disabled',
        message: 'App creation is currently disabled.'
      });
    }

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
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
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
