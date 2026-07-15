#!/usr/bin/env node

/**
 * GenVedha Email Sender
 * Reusable script to send professional service emails from support@genvedha.com
 * 
 * Usage:
 *   node send-genvedha-email.js recipient@example.com "Recipient Name"
 *   node send-genvedha-email.js recipient@example.com "Recipient Name" "Custom Subject"
 */

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Email configuration
const EMAIL_CONFIG = {
    host: 'smtpout.secureserver.net',
    port: 465,
    secure: true,
    auth: {
        user: 'support@genvedha.com',
        pass: 'Leopard@1982'
    }
};

// Default email settings
const DEFAULT_SUBJECT = 'Transform Your Business with GenVedha AI & Software Solutions';
const FROM_EMAIL = 'support@genvedha.com';
const FROM_NAME = 'GenVedha Global AI & Software Solutions';

/**
 * Load and customize email template
 */
function loadEmailTemplate(recipientName) {
    const templatePath = path.join(__dirname, 'email-templates', 'genvedha-services-email.html');
    
    if (!fs.existsSync(templatePath)) {
        throw new Error(`Email template not found at: ${templatePath}`);
    }
    
    let template = fs.readFileSync(templatePath, 'utf8');
    
    // Replace placeholders
    template = template.replace(/{{RECIPIENT_NAME}}/g, recipientName || 'Valued Partner');
    
    return template;
}

/**
 * Send email
 */
async function sendEmail(recipientEmail, recipientName, customSubject = null) {
    try {
        console.log('📧 Preparing to send email...');
        console.log(`   To: ${recipientEmail}`);
        console.log(`   Name: ${recipientName}`);
        
        // Create transporter
        const transporter = nodemailer.createTransport(EMAIL_CONFIG);
        
        // Verify connection
        console.log('🔌 Verifying SMTP connection...');
        await transporter.verify();
        console.log('✅ SMTP connection verified');
        
        // Load email template
        console.log('📄 Loading email template...');
        const htmlContent = loadEmailTemplate(recipientName);
        
        // Prepare email options
        const mailOptions = {
            from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
            to: recipientEmail,
            subject: customSubject || DEFAULT_SUBJECT,
            html: htmlContent,
            text: generatePlainTextVersion(recipientName)
        };
        
        // Send email
        console.log('📤 Sending email...');
        const info = await transporter.sendMail(mailOptions);
        
        console.log('✅ Email sent successfully!');
        console.log(`   Message ID: ${info.messageId}`);
        console.log(`   Response: ${info.response}`);
        
        return {
            success: true,
            messageId: info.messageId,
            response: info.response
        };
        
    } catch (error) {
        console.error('❌ Error sending email:', error.message);
        throw error;
    }
}

/**
 * Generate plain text version of email
 */
function generatePlainTextVersion(recipientName) {
    return `
Dear ${recipientName || 'Valued Partner'},

We're excited to introduce you to GenVedha Global AI & Software Solutions – your partner in digital transformation and innovation.

🚀 AI-BUILT E-COMMERCE - LIVE IN MINUTES!

Launch your fully-functional online store in minutes, not months. Our proprietary AI crews generate complete e-commerce applications with:

✓ Product catalog with images
✓ Shopping cart & checkout
✓ Admin panel & inventory management
✓ Payment gateway integration
✓ AWS cloud hosting included
✓ Custom domain mapping from GoDaddy

Powered by AI. Backed by human expertise.

OUR COMPREHENSIVE SERVICES:

🤖 AI & Machine Learning
Advanced AI solutions including predictive analytics, NLP, and computer vision.

💻 Custom Software Development
Tailored applications built with modern technologies to scale with your growth.

☁️ Cloud Solutions & Hosting
Cloud migration, architecture design, and production-ready AWS hosting.

📊 Data Analytics & Business Intelligence
Transform raw data into actionable insights for better decision-making.

Ready to transform your business with cutting-edge AI and software solutions? Let's discuss how we can help you achieve your goals.

Visit us: https://genvedha.com
Learn more: https://genvedha.com/ai-ecommerce-solution
Contact: support@genvedha.com

Best regards,
The GenVedha Team

---
GenVedha Global AI & Software Solutions
Intelligence. Innovation. Impact.
© 2026 GenVedha. All rights reserved.
    `.trim();
}

/**
 * Send bulk emails
 */
async function sendBulkEmails(recipients) {
    console.log(`📬 Sending emails to ${recipients.length} recipients...\n`);
    
    const results = [];
    
    for (let i = 0; i < recipients.length; i++) {
        const recipient = recipients[i];
        console.log(`\n[${i + 1}/${recipients.length}] Processing: ${recipient.email}`);
        
        try {
            const result = await sendEmail(
                recipient.email,
                recipient.name,
                recipient.subject
            );
            results.push({ ...recipient, success: true, ...result });
            
            // Wait 2 seconds between emails to avoid rate limiting
            if (i < recipients.length - 1) {
                console.log('⏳ Waiting 2 seconds before next email...');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        } catch (error) {
            results.push({ ...recipient, success: false, error: error.message });
        }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 BULK EMAIL SUMMARY');
    console.log('='.repeat(60));
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📧 Total: ${results.length}`);
    
    return results;
}

// Main execution
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log(`
╔════════════════════════════════════════════════════════════════╗
║           GenVedha Email Sender - Usage Guide                  ║
╚════════════════════════════════════════════════════════════════╝

📧 SINGLE EMAIL:
   node send-genvedha-email.js <email> <name> [subject]

   Examples:
   node send-genvedha-email.js client@example.com "John Doe"
   node send-genvedha-email.js client@example.com "John Doe" "Custom Subject"

📬 BULK EMAILS:
   node send-genvedha-email.js --bulk recipients.json

   recipients.json format:
   [
     { "email": "client1@example.com", "name": "John Doe" },
     { "email": "client2@example.com", "name": "Jane Smith", "subject": "Custom" }
   ]

🧪 TEST EMAIL:
   node send-genvedha-email.js --test your-email@example.com

📋 TEMPLATE INFO:
   Template: email-templates/genvedha-services-email.html
   From: support@genvedha.com
   SMTP: smtpout.secureserver.net

        `);
        process.exit(0);
    }
    
    // Handle bulk emails
    if (args[0] === '--bulk') {
        const recipientsFile = args[1];
        if (!recipientsFile) {
            console.error('❌ Please provide recipients JSON file');
            process.exit(1);
        }
        
        try {
            const recipients = JSON.parse(fs.readFileSync(recipientsFile, 'utf8'));
            sendBulkEmails(recipients)
                .then(() => process.exit(0))
                .catch(error => {
                    console.error('❌ Bulk email error:', error);
                    process.exit(1);
                });
        } catch (error) {
            console.error('❌ Error reading recipients file:', error.message);
            process.exit(1);
        }
        return;
    }
    
    // Handle test email
    if (args[0] === '--test') {
        const testEmail = args[1];
        if (!testEmail) {
            console.error('❌ Please provide test email address');
            process.exit(1);
        }
        
        console.log('🧪 Sending test email...\n');
        sendEmail(testEmail, 'Test Recipient', 'GenVedha Test Email')
            .then(() => {
                console.log('\n✅ Test email sent successfully!');
                process.exit(0);
            })
            .catch(error => {
                console.error('\n❌ Test email failed:', error.message);
                process.exit(1);
            });
        return;
    }
    
    // Handle single email
    const recipientEmail = args[0];
    const recipientName = args[1] || 'Valued Partner';
    const customSubject = args[2] || null;
    
    if (!recipientEmail || !recipientEmail.includes('@')) {
        console.error('❌ Please provide a valid email address');
        process.exit(1);
    }
    
    sendEmail(recipientEmail, recipientName, customSubject)
        .then(() => {
            console.log('\n✅ Email sent successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Failed to send email');
            process.exit(1);
        });
}

// Export for use as module
module.exports = {
    sendEmail,
    sendBulkEmails,
    loadEmailTemplate
};
