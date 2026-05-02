const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    database: db ? 'connected' : 'disconnected',
    email: emailTransporter ? 'configured' : 'not configured'
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
