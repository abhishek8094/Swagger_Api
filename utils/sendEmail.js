const nodemailer = require('nodemailer');

const sendEmail = async (options) => {

  console.log("hello",options);
  try {
    // Try multiple Gmail SMTP configurations
    const transporterConfigs = [
      // Configuration 1: Standard with TLS
      {
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        tls: {
          rejectUnauthorized: false
        }
      },
      // Configuration 2: SSL
      {
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        }
      }
    ];

    let lastError = null;

    // Try each configuration until one works
    for (const config of transporterConfigs) {
      try {
        const transporter = nodemailer.createTransport(config);
        
        // Verify connection configuration
        await transporter.verify();
        console.log('✅ SMTP connection verified successfully');

        const message = {
          from: `${process.env.EMAIL_FROM_NAME || 'Authentication Service'} <${process.env.EMAIL_USER}>`,
          to: options.email,
          subject: options.subject,
          text: options.message,
          html: options.html || options.message,
        };

        const result = await transporter.sendMail(message);
        console.log('✅ Email sent successfully:', result.messageId);
        return result;
      } catch (error) {
        console.warn(`⚠️ Configuration failed:`, error.message);
        lastError = error;
        continue; // Try next configuration
      }
    }

    // If all configurations failed, throw the last error
    throw lastError;

  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    console.error('Error details:', error);
    throw error; // Re-throw to be caught by the caller
  }
};

// Email templates
const emailTemplates = {
  passwordResetRequest: (resetUrl, userName = 'User') => {
    return {
      subject: 'Password Reset Request',
      message: `You are receiving this email because you (or someone else) has requested the reset of a password. Please click the following link to reset your password: ${resetUrl}\n\nThis link will expire in 10 minutes.`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Password Reset Request</h2>
            <p>Hello ${userName},</p>
            <p>You are receiving this email because you (or someone else) has requested to reset your password.</p>
            <p>Please click the button below to reset your password:</p>
            <p><a href="${resetUrl}" class="button">Reset Password</a></p>
            <p>This link will expire in 10 minutes for security reasons.</p>
            <p>If you did not request this password reset, please ignore this email and your password will remain unchanged.</p>
            <div class="footer">
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
  },

  passwordResetSuccess: (userName = 'User') => {
    return {
      subject: 'Password Reset Successful',
      message: `Your password has been successfully reset. If you did not perform this action, please contact support immediately.`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .success { color: #28a745; font-weight: bold; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Password Reset Successful</h2>
            <p>Hello ${userName},</p>
            <p class="success">Your password has been successfully reset!</p>
            <p>If you did not perform this action, please contact our support team immediately to secure your account.</p>
            <p>You can now log in to your account using your new password.</p>
            <div class="footer">
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
  },

};

module.exports = { sendEmail, emailTemplates };
