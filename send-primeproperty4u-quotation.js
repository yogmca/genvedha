/**
 * Send PrimeProperty4U Quotation Email
 * Uses GenVedha's existing email service configuration
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config(); // Use default .env file

// Import nodemailer dynamically for ES module compatibility
async function sendQuotation() {
    try {
        // Dynamic import for nodemailer (ES module)
        const nodemailer = await import('nodemailer');
        
        console.log('📧 Preparing to send PrimeProperty4U quotation email...');
        
        // Email configuration from GenVedha's .env
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT),
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        // Read the HTML email template
        const htmlContent = fs.readFileSync(
            path.join(__dirname, 'primeproperty4u-quotation-email.html'),
            'utf8'
        );

        // Read the markdown quotation for attachment
        const markdownContent = fs.readFileSync(
            path.join(__dirname, 'PRIMEPROPERTY4U-QUOTATION.md'),
            'utf8'
        );

        // Recipient can be overridden via CLI arg: node send-...js recipient@example.com
        const fromAddress = process.env.EMAIL_USER || 'support@genvedha.com';
        const recipient = process.argv[2] || 'yogmca@gmail.com';

        // Email options
        const mailOptions = {
            from: {
                name: 'GenVedha Global AI and Software Solutions',
                address: fromAddress
            },
            // Explicit SMTP envelope so Return-Path/MAIL FROM align with the
            // authenticated sender (critical for SPF/DMARC pass -> inbox).
            envelope: {
                from: fromAddress,
                to: recipient
            },
            to: recipient,
            cc: 'support@genvedha.com',
            replyTo: fromAddress,
            subject: 'PrimeProperty4U.com - Project Quotation (₹75,500)',
            html: htmlContent,
            attachments: [
                {
                    filename: 'PrimeProperty4U-Quotation.md',
                    content: markdownContent,
                    contentType: 'text/markdown'
                }
            ]
        };

        console.log(`From: ${mailOptions.from.address}`);
        console.log(`To: ${mailOptions.to}`);
        console.log(`CC: ${mailOptions.cc}`);
        console.log(`Subject: ${mailOptions.subject}`);
        
        // Verify transporter configuration
        await transporter.verify();
        console.log('✅ Email server connection verified');
        
        // Send email
        const info = await transporter.sendMail(mailOptions);
        
        console.log('\n✅ Quotation email sent successfully!');
        console.log(`Message ID: ${info.messageId}`);
        console.log(`Response: ${info.response}`);
        console.log('\n📋 Email Details:');
        console.log(`- Recipient: ${recipient}`);
        console.log(`- CC: support@genvedha.com`);
        console.log(`- Subject: PrimeProperty4U.com - Project Quotation (₹75,500)`);
        console.log(`- Attachment: PrimeProperty4U-Quotation.md`);
        console.log('\n💰 Quotation Summary:');
        console.log(`- Development: ₹40,000`);
        console.log(`- Infrastructure (Year 1): ₹35,500`);
        console.log(`- Total Year 1: ₹75,500`);
        console.log(`- Timeline: 2-4 Weeks`);
        
    } catch (error) {
        console.error('❌ Error sending email:', error.message);
        
        if (error.code === 'EAUTH') {
            console.error('\n⚠️  Authentication failed. Please check:');
            console.error('1. EMAIL_USER in .env');
            console.error('2. EMAIL_PASSWORD in .env');
            console.error('3. Email account credentials');
        } else if (error.code === 'ECONNECTION' || error.code === 'ESOCKET') {
            console.error('\n⚠️  Connection failed. Please check:');
            console.error('1. EMAIL_HOST in .env');
            console.error('2. EMAIL_PORT in .env');
            console.error('3. Internet connection');
        } else {
            console.error('\n⚠️  Error details:', error);
        }
        
        process.exit(1);
    }
}

// Run the script
console.log('🚀 GenVedha Email Service - PrimeProperty4U Quotation');
console.log('='.repeat(60));
sendQuotation();
