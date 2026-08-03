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
const crypto = require('crypto');

// Load Titan email credentials from .env.titan (falls back silently if absent).
// This ensures the script uses the SAME mailbox/host as Titan Webmail.
try {
    require('dotenv').config({ path: path.join(__dirname, '.env.titan') });
} catch (e) {
    // dotenv optional; env vars may already be set in the shell.
}

// Email configuration
// support@genvedha.com is a GoDaddy-hosted mailbox. The VERIFIED working
// outgoing server (same one used by Webmail) is:
//   Host: smtpout.secureserver.net   Security: SSL   Port: 465
// Sending manually from Webmail works because it uses this authenticated path.
//
// The script previously ALSO used this host, so the wrong host was NOT the
// delivery problem. The real cause of non-delivery was the hidden 1x1 tracking
// pixel (a strong spam signal) plus a missing SMTP envelope / Return-Path
// alignment. Those are fixed below; the host stays on the verified GoDaddy relay.
//
// Values are read from environment variables when present (see .env.titan) and
// fall back to the known-good GoDaddy settings otherwise.
const EMAIL_CONFIG = {
    host: process.env.EMAIL_HOST || 'smtpout.secureserver.net',
    port: parseInt(process.env.EMAIL_PORT || '465', 10),
    // secure:true for 465 (implicit SSL/TLS). For 587 use secure:false + STARTTLS.
    secure: process.env.EMAIL_SECURE
        ? process.env.EMAIL_SECURE === 'true'
        : (parseInt(process.env.EMAIL_PORT || '465', 10) === 465),
    auth: {
        user: process.env.EMAIL_USER || 'support@genvedha.com',
        // Use the SAME password you use to log in to Webmail.
        pass: process.env.EMAIL_PASSWORD || 'Leopard@1982'
    }
};

// Default email settings
const DEFAULT_SUBJECT = 'Transform Your Business with GenVedha AI & Software Solutions';
// FROM_EMAIL MUST match the authenticated Titan mailbox (EMAIL_USER) so the
// domain aligns for SPF/DKIM/DMARC and the message reaches the inbox.
const FROM_EMAIL = process.env.EMAIL_USER || 'support@genvedha.com';
const FROM_NAME = 'GenVedha Global AI & Software Solutions';

// Read receipt settings
// NOTE: Read-receipt headers are a strong spam signal for corporate mail
// gateways (e.g. Wipro, Infosys, TCS). Keep this DISABLED for cold/outreach
// emails to maximise inbox delivery. Enable only for known/whitelisted contacts.
const ENABLE_READ_RECEIPT = false; // Set to true to request read receipts
const READ_RECEIPT_EMAIL = 'support@genvedha.com'; // Email to receive read receipts

// ============================================================
// EMAIL OPEN TRACKING (works entirely from this file)
// ============================================================
// Read receipts are unreliable. Instead we embed an invisible tracking pixel.
// When the recipient opens the email, their client loads the pixel image, and
// that request is recorded in your genvedha.com web-server ACCESS LOGS with the
// unique tracking id + recipient email in the URL query string.
//
// The pixel points at your existing genvedha.com static file (logo.png) with a
// unique query string per recipient. No server.js change is needed — you read
// the opens directly from the nginx/web access log by grepping the tracking id.
//
// If you later add a /track/open.gif endpoint you can just change PIXEL_BASE_URL.
// NOTE: A hidden 1x1 tracking pixel pointing to logo.png is a well-known spam
// signal and can cause the very non-delivery you are seeing. Titan Webmail sends
// have no such pixel, which is one reason they arrive. Keep this DISABLED so the
// script matches the clean Webmail send. Set to true only for trusted contacts.
const ENABLE_OPEN_TRACKING = false;
// Base URL for the tracking pixel. Uses your live site so requests appear in
// your server access logs. Query params (t, e) are appended per recipient.
const PIXEL_BASE_URL = 'https://genvedha.com/logo.png';
// Local record of every email you send (recipient, time, tracking id, messageId)
const SEND_LOG_PATH = path.join(__dirname, 'email-send-log.json');
// Path to the nginx access log ON THE EC2 SERVER where pixel opens are recorded.
// IMPORTANT: The live site logs to genvedha_access.log (with underscore), NOT
// the generic access.log. This is the file you grep to see who opened an email.
const NGINX_ACCESS_LOG = '/var/log/nginx/genvedha_access.log';

/**
 * Generate a unique tracking id for a recipient
 */
function generateTrackingId(recipientEmail) {
    return crypto
        .createHash('sha1')
        .update(recipientEmail + Date.now() + Math.random())
        .digest('hex')
        .substring(0, 16);
}

/**
 * Build the invisible tracking pixel HTML for a recipient
 */
function buildTrackingPixel(trackingId, recipientEmail) {
    const url = `${PIXEL_BASE_URL}?t=${trackingId}&e=${encodeURIComponent(recipientEmail)}`;
    return `<img src="${url}" width="1" height="1" alt="" style="display:none;width:1px;height:1px;border:0;" />`;
}

/**
 * Append a record to the local send log
 */
function recordSend(entry) {
    try {
        let log = [];
        if (fs.existsSync(SEND_LOG_PATH)) {
            log = JSON.parse(fs.readFileSync(SEND_LOG_PATH, 'utf8'));
        }
        log.push(entry);
        fs.writeFileSync(SEND_LOG_PATH, JSON.stringify(log, null, 2));
    } catch (e) {
        console.error('⚠️  Could not write send log:', e.message);
    }
}

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
        let htmlContent = loadEmailTemplate(recipientName);

        // Inject invisible open-tracking pixel
        let trackingId = null;
        if (ENABLE_OPEN_TRACKING) {
            trackingId = generateTrackingId(recipientEmail);
            const pixel = buildTrackingPixel(trackingId, recipientEmail);
            // Place pixel just before </body> (fallback: append to end)
            if (htmlContent.includes('</body>')) {
                htmlContent = htmlContent.replace('</body>', `${pixel}</body>`);
            } else {
                htmlContent += pixel;
            }
            console.log(`🔎 Open-tracking enabled. Tracking ID: ${trackingId}`);
        }

        // Prepare email options with read receipt support
        const mailOptions = {
            from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
            // Explicit SMTP envelope so Return-Path/MAIL FROM align with the
            // authenticated Titan sender (critical for SPF/DMARC pass -> inbox).
            envelope: {
                from: FROM_EMAIL,
                to: recipientEmail
            },
            to: recipientEmail,
            replyTo: FROM_EMAIL,
            subject: customSubject || DEFAULT_SUBJECT,
            html: htmlContent,
            text: generatePlainTextVersion(recipientName),
            // Priority and importance flags
            priority: 'normal',
            // Read receipt headers (MDN - Message Disposition Notification)
            headers: {}
        };
        
        // Add read receipt headers if enabled
        if (ENABLE_READ_RECEIPT) {
            mailOptions.headers = {
                'Disposition-Notification-To': READ_RECEIPT_EMAIL,
                'Return-Receipt-To': READ_RECEIPT_EMAIL,
                'X-Confirm-Reading-To': READ_RECEIPT_EMAIL,
                'Read-Receipt-To': READ_RECEIPT_EMAIL
            };
        }
        
        // Send email
        console.log('📤 Sending email...');
        const info = await transporter.sendMail(mailOptions);
        
        console.log('✅ Email sent successfully!');
        console.log(`   Message ID: ${info.messageId}`);
        console.log(`   Response: ${info.response}`);
        if (ENABLE_READ_RECEIPT) {
            console.log(`   📬 Read receipt requested to: ${READ_RECEIPT_EMAIL}`);
        }

        // Record this send locally so you always have proof of what was sent
        if (ENABLE_OPEN_TRACKING) {
            recordSend({
                email: recipientEmail,
                name: recipientName,
                subject: customSubject || DEFAULT_SUBJECT,
                trackingId: trackingId,
                messageId: info.messageId,
                sentAt: new Date().toISOString()
            });
            console.log('\n📊 HOW TO VERIFY IF THIS EMAIL WAS OPENED:');
            console.log(`   • Tracking ID: ${trackingId}`);
            console.log(`   • When ${recipientEmail} opens the email, their mail client`);
            console.log(`     loads the pixel and this URL appears in your web server logs:`);
            console.log(`     ${PIXEL_BASE_URL}?t=${trackingId}&e=${encodeURIComponent(recipientEmail)}`);
            console.log(`   • On your EC2 server, check opens with:`);
            console.log(`     sudo grep "${trackingId}" ${NGINX_ACCESS_LOG}`);
            console.log(`   • A local record was saved to: email-send-log.json`);
        }

        return {
            success: true,
            messageId: info.messageId,
            response: info.response,
            trackingId: trackingId
        };
        
    } catch (error) {
        console.error('❌ Error sending email:', error.message);
        // Detailed diagnostics
        if (error.code) console.error('   Error code:', error.code);
        if (error.command) console.error('   Failed command:', error.command);
        if (error.response) console.error('   SMTP response:', error.response);
        if (error.responseCode) console.error('   SMTP response code:', error.responseCode);
        if (error.errno) console.error('   Errno:', error.errno);
        if (error.syscall) console.error('   Syscall:', error.syscall);
        if (error.address) console.error('   Address:', error.address);
        if (error.port) console.error('   Port:', error.port);
        throw error;
    }
}

/**
 * Generate plain text version of email
 */
function generatePlainTextVersion(recipientName) {
    return `
Dear ${recipientName || 'Valued Partner'},

We're excited to introduce you to GenVedha Global AI & Software Solutions - https://genvedha.com

Most companies I speak with are trying to scale their digital infrastructure or launch new products, but are held back by slow development cycles and rising cloud costs. GenVedha acts as an agile technology partner. We help firms rapidly develop & deploy AI integrations, custom software, and automated e-commerce stores on Cloud servers without the overhead of full-time hiring. We recently helped a client cut their product time-to-market by 80% using our specialized engineering sprints. Are you open to a brief look at a 1-page case study showing how we handle the development?

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

Yogesh Kumar
Founder
https://genvedha.com
– your partner in digital transformation and innovation.

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

📜 VIEW SENT-EMAIL LOG (who you emailed + tracking ids):
   node send-genvedha-email.js --log

🔎 CHECK IF OPENED (run on your EC2 server, or via SSH):
   sudo grep "<tracking-id>" ${NGINX_ACCESS_LOG}
   (tracking id is printed after each send and saved in email-send-log.json)

📋 TEMPLATE INFO:
   Template: email-templates/genvedha-services-email.html
   From: support@genvedha.com
   SMTP: smtpout.secureserver.net
   Read Receipt: ${ENABLE_READ_RECEIPT ? 'Enabled ✅' : 'Disabled ❌'}
   Open Tracking: ${ENABLE_OPEN_TRACKING ? 'Enabled ✅' : 'Disabled ❌'}

        `);
        process.exit(0);
    }

    // Handle send-log view
    if (args[0] === '--log') {
        try {
            if (!fs.existsSync(SEND_LOG_PATH)) {
                console.log('📭 No emails sent yet (email-send-log.json not found).');
                process.exit(0);
            }
            const log = JSON.parse(fs.readFileSync(SEND_LOG_PATH, 'utf8'));
            console.log(`\n📜 SENT EMAIL LOG (${log.length} total)\n` + '='.repeat(70));
            log.forEach((e, i) => {
                console.log(`\n[${i + 1}] ${e.email}  (${e.name || 'no name'})`);
                console.log(`    Sent:        ${e.sentAt}`);
                console.log(`    Subject:     ${e.subject}`);
                console.log(`    Tracking ID: ${e.trackingId}`);
                console.log(`    Check open:  sudo grep "${e.trackingId}" ${NGINX_ACCESS_LOG}`);
            });
            console.log('\n' + '='.repeat(70));
        } catch (err) {
            console.error('❌ Error reading send log:', err.message);
            process.exit(1);
        }
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
