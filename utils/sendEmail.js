const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Gmail SMTP configuration
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  const message = {
    from: `${process.env.EMAIL_FROM_NAME || 'Authentication Service'} <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || options.message,
  };

  await transporter.sendMail(message);
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
  }
};

module.exports = { sendEmail, emailTemplates };
