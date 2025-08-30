// Test script to verify email configuration
const { sendEmail } = require('./utils/sendEmail');

async function testEmail() {
  console.log('🧪 Testing email configuration...');
  
  // Check if environment variables are set
  const requiredVars = ['EMAIL_USER', 'EMAIL_PASS'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing environment variables:', missingVars.join(', '));
    console.log('Please set these variables in your .env file:');
    console.log('EMAIL_USER=your.email@gmail.com');
    console.log('EMAIL_PASS=your_app_password_here');
    return;
  }
  
  console.log('✅ Environment variables found');
  console.log('📧 Sender:', process.env.EMAIL_USER);
  
  try {
    // Test email
    await sendEmail({
      email: process.env.EMAIL_USER, // Send to yourself for testing
      subject: '✅ Email Configuration Test',
      message: 'Congratulations! Your email configuration is working correctly.\n\nThis is a test email from your Node.js application.'
    });
    
    console.log('✅ Email sent successfully!');
    console.log('📨 Check your inbox (and spam folder) for the test email.');
    
  } catch (error) {
    console.error('❌ Email failed to send:');
    console.error('Error:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n🔒 Authentication failed. Please check:');
      console.log('1. Your EMAIL_USER and EMAIL_PASS in .env file');
      console.log('2. If using Gmail with 2FA, use an App Password');
      console.log('3. Enable "Less secure app access" if no 2FA');
    } else if (error.code === 'ECONNECTION') {
      console.log('\n🌐 Connection failed. Check your internet connection and firewall settings.');
    }
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  // Load environment variables
  require('dotenv').config();
  testEmail();
}

module.exports = { testEmail };
