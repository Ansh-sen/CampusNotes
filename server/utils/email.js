const nodemailer = require('nodemailer');

/**
 * Send an email using SMTP or fallback to console log
 * @param {Object} options - { to, subject, text, html }
 */
async function sendEmail(options) {
    const { to, subject, text, html } = options;

    // SMTP configuration from environment variables
    // In a real app, you'd set these in a .env file
    const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    try {
        // Only attempt to send if credentials are provided
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            const info = await transporter.sendMail({
                from: `"CampusNotes" <${process.env.EMAIL_USER}>`,
                to,
                subject,
                text,
                html
            });
            console.log('✅ Email sent:', info.messageId);
            return { success: true, messageId: info.messageId };
        } else {
            // Fallback for development: just log to console
            console.log('--- DEVELOPMENT EMAIL FALLBACK ---');
            console.log(`To: ${to}`);
            console.log(`Subject: ${subject}`);
            console.log(`Content: ${text}`);
            console.log('---------------------------------');
            return { success: true, mocked: true };
        }
    } catch (error) {
        console.error('❌ Email sending failed:', error);
        // Still return success: false so the route can handle it
        return { success: false, error: error.message };
    }
}

module.exports = { sendEmail };
