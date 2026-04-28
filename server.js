const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// MongoDB Connection String
const MONGODB_URI = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_CLUSTER}/${process.env.MONGODB_DATABASE}?retryWrites=true&w=majority`;

let db;
let contactsCollection;

// Connect to MongoDB
async function connectToDatabase() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB successfully!');
    
    db = client.db(process.env.MONGODB_DATABASE);
    contactsCollection = db.collection('contacts');
    
    // Create index on email for faster queries
    await contactsCollection.createIndex({ email: 1 });
    
  } catch (error) {
    console.error('⚠️  MongoDB connection error:', error.message);
    console.log('⚠️  Running in demo mode without database. Contact form submissions will not be saved.');
    console.log('💡 To fix: Update MONGODB_CLUSTER in .env with your correct MongoDB Atlas cluster URL');
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
    
    // Check if MongoDB is connected
    if (contactsCollection) {
      const result = await contactsCollection.insertOne(contactData);
      
      res.status(201).json({
        success: true,
        message: 'Thank you for contacting us! We will get back to you soon.',
        contactId: result.insertedId
      });
    } else {
      // Demo mode - log to console instead
      console.log('📧 Contact Form Submission (Demo Mode):', contactData);
      
      res.status(201).json({
        success: true,
        message: 'Thank you for contacting us! (Demo mode - submission logged to console)',
        demo: true
      });
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
    database: db ? 'connected' : 'disconnected'
  });
});

// Start server
connectToDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
});
