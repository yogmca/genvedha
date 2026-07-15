#!/usr/bin/env node

/**
 * Test Email with Port 587 (TLS/STARTTLS)
 */

const nodemailer = require('nodemailer');

// Try port 587 with STARTTLS
const transporter = nodemailer.createTransport({
    host: 'smtpout.secureserver.net',
    port: 587,
    secure: false, // Use STARTTLS
    auth: {
        user: 'support@genvedha.com',
        pass: 'Leopard@1982'
    },
    debug: true,
    logger: true
});

async function testEmail() {
    try {
        console.log('🔍 Testing SMTP with Port 587 (STARTTLS)...\n');
        
        await transporter.verify();
        console.log('✅ SMTP connection successful!\n');
        
        const info = await transporter.sendMail({
            from: '"GenVedha Support" <support@genvedha.com>',
            to: 'yogemca@gmail.com',
            subject: 'Test Email Port 587 - GenVedha',
            text: 'Testing email delivery via port 587',
            html: `
                <div style="font-family: Arial; padding: 20px;">
                    <h2>Test Email from GenVedha (Port 587)</h2>
                    <p>This email was sent using port 587 with STARTTLS.</p>
                    <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                </div>
            `
        });
        
        console.log('✅ Email sent!');
        console.log('Message ID:', info.messageId);
        console.log('Response:', info.response);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testEmail();
