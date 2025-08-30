# Gmail SMTP Setup Guide

## Fixing "535-5.7.8 Username and Password not accepted" Error

### Step 1: Generate App Password (Recommended for 2FA enabled accounts)

1. Go to your Google Account settings: https://myaccount.google.com/
2. Navigate to "Security" section
3. If you have 2-Step Verification enabled:
   - Under "Signing in to Google", click "2-Step Verification"
   - Scroll down to "App passwords"
   - Generate a new app password for "Mail" and select "Other (Custom name)"
   - Name it "Node.js App" or similar
   - Copy the generated 16-character password

4. If you don't have 2-Step Verification enabled:
   - Enable "Less secure app access" (note: Google is phasing this out)
   - Or better: Enable 2-Step Verification and use App Password

### Step 2: Update Environment Variables

Update your `.env` file with the correct credentials:

```env
EMAIL_USER=your.email@gmail.com
EMAIL_PASS=your_generated_app_password_here
EMAIL_FROM_NAME="Your App Name"
```

### Step 3: Alternative Configuration Options

#### Option A: Using OAuth2 (Most Secure)
```javascript
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL_USER,
    clientId: process.env.OAUTH_CLIENT_ID,
    clientSecret: process.env.OAUTH_CLIENT_SECRET,
    refreshToken: process.env.OAUTH_REFRESH_TOKEN,
    accessToken: process.env.OAUTH_ACCESS_TOKEN,
  },
});
```

#### Option B: Using Different Port (465 with SSL)
```javascript
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});
```

### Step 4: Test Your Configuration

Create a test script to verify the setup:

```javascript
// test-email.js
const { sendEmail } = require('./utils/sendEmail');

async function testEmail() {
  try {
    await sendEmail({
      email: 'test@example.com',
      subject: 'Test Email',
      message: 'This is a test email from your Node.js app'
    });
    console.log('✅ Email sent successfully!');
  } catch (error) {
    console.error('❌ Email failed:', error.message);
  }
}

testEmail();
```

### Step 5: Troubleshooting Common Issues

1. **App Password Not Working**: Ensure you're using the exact 16-character app password, not your regular Gmail password.

2. **Account Security Settings**: Check if your Google account has any security alerts or blocks.

3. **Firewall/Network Issues**: Some networks block SMTP ports. Try from a different network.

4. **Rate Limiting**: Gmail has sending limits (500 emails per day for free accounts).

### Step 6: Production Considerations

For production use, consider:
- Using a dedicated email service (SendGrid, Mailgun, etc.)
- Implementing email queue system
- Adding retry logic for failed sends
- Setting up proper error logging

### Security Notes

- Never commit your `.env` file to version control
- Use app passwords instead of your main account password
- Consider using OAuth2 for better security
- Regularly rotate app passwords

### Support Links

- [Google App Passwords Help](https://support.google.com/accounts/answer/185833)
- [Nodemailer Gmail Guide](https://nodemailer.com/usage/using-gmail/)
- [Troubleshooting Gmail SMTP](https://support.google.com/mail/answer/7126229)
