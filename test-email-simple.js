#!/usr/bin/env node

/**
 * Simple Email Test - Verify SMTP Configuration
 */

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtpout.secureserver.net',
    port: 465,
    secure: true,
    auth: {
        user: 'support@genvedha.com',
        pass: 'Leopard@1982'
    },
    debug: true, // Enable debug output
    logger: true // Log to console
});

async function testEmail() {
    try {
        console.log('🔍 Testing SMTP Configuration...\n');
        
        // Verify connection
        console.log('1️⃣ Verifying SMTP connection...');
        await transporter.verify();
        console.log('✅ SMTP connection successful!\n');
        
        // Send test email
        console.log('2️⃣ Sending test email...');
        const info = await transporter.sendMail({
            from: '"GenVedha Support" <support@genvedha.com>',
            to: 'yogesh@genvedha.com, yogmca@gmail.com',
            subject: 'Test Email from GenVedha - ' + new Date().toLocaleString(),
            text: 'This is a test email to verify the email system is working correctly.',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
                        <h2 style="color: #1a1a2e;">Test Email from GenVedha</h2>
                        <p>This is a test email to verify the email system is working correctly.</p>
                        <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
                        <hr style="border: 1px solid #eee; margin: 20px 0;">
                        <p style="color: #666; font-size: 14px;">
                            If you received this email, the GenVedha email system is working properly!
                        </p>
                    </div>
                </div>
            `
        });
        
        console.log('✅ Email sent successfully!\n');
        console.log('📧 Details:');
        console.log('   Message ID:', info.messageId);
        console.log('   Response:', info.response);
        console.log('   Accepted:', info.accepted);
        console.log('   Rejected:', info.rejected);
        
        console.log('\n✅ Test completed successfully!');
        console.log('📬 Check your inbox (and spam folder) for the test email.');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('\nFull error:', error);
    }
}

testEmail();
