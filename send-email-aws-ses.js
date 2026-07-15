#!/usr/bin/env node

/**
 * GenVedha Email Sender using AWS SES
 * Better deliverability for Gmail and other providers
 * 
 * Setup:
 * 1. npm install @aws-sdk/client-ses
 * 2. Configure AWS credentials
 * 3. Verify email address in AWS SES
 */

const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const fs = require('path');
const path = require('path');

// AWS SES Configuration
const sesClient = new SESClient({
    region: 'us-east-1', // Change to your preferred region
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'YOUR_AWS_ACCESS_KEY',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'YOUR_AWS_SECRET_KEY'
    }
});

const FROM_EMAIL = 'support@genvedha.com';
const FROM_NAME = 'GenVedha Global AI & Software Solutions';

/**
 * Load email template
 */
function loadEmailTemplate(recipientName) {
    const templatePath = path.join(__dirname, 'email-templates', 'genvedha-services-email.html');
    
    if (!fs.existsSync(templatePath)) {
        throw new Error(`Email template not found at: ${templatePath}`);
    }
    
    let template = fs.readFileSync(templatePath, 'utf8');
    template = template.replace(/{{RECIPIENT_NAME}}/g, recipientName || 'Valued Partner');
    
    return template;
}

/**
 * Send email using AWS SES
 */
async function sendEmailSES(recipientEmail, recipientName, customSubject = null) {
    try {
        console.log('📧 Preparing to send email via AWS SES...');
        console.log(`   To: ${recipientEmail}`);
        console.log(`   Name: ${recipientName}`);
        
        const htmlContent = loadEmailTemplate(recipientName);
        const subject = customSubject || 'Transform Your Business with GenVedha AI & Software Solutions';
        
        const params = {
            Source: `"${FROM_NAME}" <${FROM_EMAIL}>`,
            Destination: {
                ToAddresses: [recipientEmail]
            },
            Message: {
                Subject: {
                    Data: subject,
                    Charset: 'UTF-8'
                },
                Body: {
                    Html: {
                        Data: htmlContent,
                        Charset: 'UTF-8'
                    },
                    Text: {
                        Data: generatePlainTextVersion(recipientName),
                        Charset: 'UTF-8'
                    }
                }
            }
        };
        
        console.log('📤 Sending email via AWS SES...');
        const command = new SendEmailCommand(params);
        const response = await sesClient.send(command);
        
        console.log('✅ Email sent successfully!');
        console.log(`   Message ID: ${response.MessageId}`);
        
        return {
            success: true,
            messageId: response.MessageId
        };
        
    } catch (error) {
        console.error('❌ Error sending email:', error.message);
        
        if (error.name === 'MessageRejected') {
            console.error('   Email was rejected. Check if sender email is verified in AWS SES.');
        } else if (error.name === 'MailFromDomainNotVerifiedException') {
            console.error('   Domain not verified in AWS SES.');
        }
        
        throw error;
    }
}

/**
 * Generate plain text version
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
💻 Custom Software Development
☁️ Cloud Solutions & Hosting
📊 Data Analytics & Business Intelligence

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
async function sendBulkEmailsSES(recipients) {
    console.log(`📬 Sending emails to ${recipients.length} recipients via AWS SES...\n`);
    
    const results = [];
    
    for (let i = 0; i < recipients.length; i++) {
        const recipient = recipients[i];
        console.log(`\n[${i + 1}/${recipients.length}] Processing: ${recipient.email}`);
        
        try {
            const result = await sendEmailSES(
                recipient.email,
                recipient.name,
                recipient.subject
            );
            results.push({ ...recipient, success: true, ...result });
            
            // Wait 1 second between emails
            if (i < recipients.length - 1) {
                console.log('⏳ Waiting 1 second before next email...');
                await new Promise(resolve => setTimeout(resolve, 1000));
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
║        GenVedha Email Sender (AWS SES) - Usage Guide           ║
╚════════════════════════════════════════════════════════════════╝

📧 SETUP:
   1. npm install @aws-sdk/client-ses
   2. Set AWS credentials:
      export AWS_ACCESS_KEY_ID=your_key
      export AWS_SECRET_ACCESS_KEY=your_secret
   3. Verify email in AWS SES Console

📧 SINGLE EMAIL:
   node send-email-aws-ses.js <email> <name> [subject]

📬 BULK EMAILS:
   node send-email-aws-ses.js --bulk recipients.json

🧪 TEST EMAIL:
   node send-email-aws-ses.js --test your-email@example.com

⚠️  NOTE: AWS SES requires email verification before sending.
   Visit: https://console.aws.amazon.com/ses/

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
            sendBulkEmailsSES(recipients)
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
        
        console.log('🧪 Sending test email via AWS SES...\n');
        sendEmailSES(testEmail, 'Test Recipient', 'GenVedha Test Email (AWS SES)')
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
    
    sendEmailSES(recipientEmail, recipientName, customSubject)
        .then(() => {
            console.log('\n✅ Email sent successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Failed to send email');
            process.exit(1);
        });
}

module.exports = {
    sendEmailSES,
    sendBulkEmailsSES
};
