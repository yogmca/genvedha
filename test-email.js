#!/usr/bin/env node

/**
 * Email Configuration Test Script
 * Tests if your GoDaddy email settings are working correctly
 */

const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('================================================');
console.log('GenVedha Email Configuration Test');
console.log('================================================\n');

// Display current configuration (hide password)
console.log('📋 Current Configuration:');
console.log('  EMAIL_HOST:', process.env.EMAIL_HOST || '❌ Not set');
console.log('  EMAIL_PORT:', process.env.EMAIL_PORT || '❌ Not set');
console.log('  EMAIL_SECURE:', process.env.EMAIL_SECURE || '❌ Not set');
console.log('  EMAIL_USER:', process.env.EMAIL_USER || '❌ Not set');
console.log('  EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✅ Set (hidden)' : '❌ Not set');
console.log('  EMAIL_FROM:', process.env.EMAIL_FROM || '❌ Not set');
console.log('  EMAIL_TO:', process.env.EMAIL_TO || '❌ Not set');
console.log('');

// Check if all required variables are set
const requiredVars = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASSWORD', 'EMAIL_FROM', 'EMAIL_TO'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('\n💡 Please update your .env file with the missing values.\n');
  process.exit(1);
}

// Create email transporter
console.log('🔧 Creating email transporter...');
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Test 1: Verify connection
console.log('🔍 Testing SMTP connection...\n');
transporter.verify(function(error, success) {
  if (error) {
    console.error('❌ SMTP Connection Failed!');
    console.error('Error:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Check if EMAIL_PASSWORD is correct');
    console.error('   2. Verify EMAIL_USER is: support@genvedha.com');
    console.error('   3. Try resetting password in GoDaddy');
    console.error('   4. Test login at: https://email.secureserver.net\n');
    process.exit(1);
  } else {
    console.log('✅ SMTP Connection Successful!\n');
    
    // Test 2: Send test email
    console.log('📧 Sending test email...\n');
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_TO,
      subject: '✅ Test Email - GenVedha Contact Form Setup',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0066ff;">✅ Email Configuration Test Successful!</h2>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <p>This is a test email from your GenVedha website contact form system.</p>
            <p><strong>Configuration Details:</strong></p>
            <ul>
              <li><strong>SMTP Host:</strong> ${process.env.EMAIL_HOST}</li>
              <li><strong>Port:</strong> ${process.env.EMAIL_PORT}</li>
              <li><strong>Secure:</strong> ${process.env.EMAIL_SECURE}</li>
              <li><strong>From:</strong> ${process.env.EMAIL_FROM}</li>
              <li><strong>To:</strong> ${process.env.EMAIL_TO}</li>
            </ul>
            <p style="margin-top: 20px; color: #28a745; font-weight: bold;">
              ✅ Your email system is working correctly!
            </p>
            <p>When visitors submit the contact form on your website, you will receive notifications like this at ${process.env.EMAIL_TO}.</p>
          </div>
          <div style="background-color: #e7f3ff; padding: 15px; border-left: 4px solid #0066ff; margin: 20px 0;">
            <p><strong>Next Steps:</strong></p>
            <ol>
              <li>Deploy your .env file to the production server</li>
              <li>Restart the application (pm2 restart genvedha-app)</li>
              <li>Test the contact form on your live website</li>
            </ol>
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            Test performed at: ${new Date().toLocaleString()}<br>
            This is an automated test email from GenVedha email configuration test script.
          </p>
        </div>
      `
    };
    
    transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
        console.error('❌ Failed to send test email!');
        console.error('Error:', error.message);
        console.error('\n💡 The connection works, but sending failed. Check:');
        console.error('   1. EMAIL_FROM format is correct');
        console.error('   2. EMAIL_TO is a valid email address');
        console.error('   3. Your email account has sending permissions\n');
        process.exit(1);
      } else {
        console.log('✅ Test Email Sent Successfully!\n');
        console.log('📬 Email Details:');
        console.log('   Message ID:', info.messageId);
        console.log('   From:', process.env.EMAIL_FROM);
        console.log('   To:', process.env.EMAIL_TO);
        console.log('   Response:', info.response);
        console.log('\n================================================');
        console.log('🎉 SUCCESS! Your email configuration is working!');
        console.log('================================================\n');
        console.log('✅ Check your inbox at:', process.env.EMAIL_TO);
        console.log('✅ Look for: "Test Email - GenVedha Contact Form Setup"\n');
        console.log('Next Steps:');
        console.log('1. Deploy .env to server');
        console.log('2. Restart application: pm2 restart genvedha-app');
        console.log('3. Test contact form on live website\n');
      }
    });
  }
});
