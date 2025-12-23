const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('\n📧 Email Configuration Test\n');
console.log('='.repeat(50));

// Check if environment variables are loaded
console.log('\n1. Environment Variables Check:');
console.log('   EMAIL_HOST:', process.env.EMAIL_HOST || '❌ NOT SET (defaults to smtp.gmail.com)');
console.log('   EMAIL_PORT:', process.env.EMAIL_PORT || '❌ NOT SET (defaults to 587)');
console.log('   EMAIL_USER:', process.env.EMAIL_USER ? `✅ ${process.env.EMAIL_USER}` : '❌ NOT SET');
console.log('   EMAIL_PASS:', process.env.EMAIL_PASS ? `✅ ${'*'.repeat(process.env.EMAIL_PASS.length)} (${process.env.EMAIL_PASS.length} chars)` : '❌ NOT SET');

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.log('\n❌ Email configuration is incomplete!');
  console.log('\n📝 Setup Instructions:');
  console.log('   1. Create a file named .env in the backend/ directory');
  console.log('   2. Add the following lines:');
  console.log('      EMAIL_USER=your-email@gmail.com');
  console.log('      EMAIL_PASS=your-app-password-here');
  console.log('      EMAIL_HOST=smtp.gmail.com');
  console.log('      EMAIL_PORT=587');
  console.log('\n🔐 How to get Gmail App Password:');
  console.log('   1. Go to: https://myaccount.google.com/security');
  console.log('   2. Enable 2-Step Verification (if not already enabled)');
  console.log('   3. Go to: https://myaccount.google.com/apppasswords');
  console.log('   4. Select "Mail" and "Other (Custom name)"');
  console.log('   5. Enter name: "iDream Portal"');
  console.log('   6. Click "Generate"');
  console.log('   7. Copy the 16-character password (no spaces)');
  console.log('   8. Paste it in EMAIL_PASS in your .env file');
  process.exit(1);
}

// Test email connection
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

console.log('\n2. Testing Email Connection...');
transporter.verify((error, success) => {
  if (error) {
    console.log('   ❌ Connection failed!');
    console.log('\n   Error:', error.message);
    
    if (error.message.includes('BadCredentials') || error.message.includes('Username and Password not accepted')) {
      console.log('\n   🔧 Troubleshooting:');
      console.log('      • Make sure you\'re using an App Password, not your regular Gmail password');
      console.log('      • App Passwords are 16 characters long (no spaces)');
      console.log('      • Make sure EMAIL_USER is your full Gmail address');
      console.log('      • Verify 2-Step Verification is enabled');
      console.log('      • Try generating a new App Password');
    } else if (error.code === 'EAUTH') {
      console.log('\n   🔧 Troubleshooting:');
      console.log('      • Check that EMAIL_USER and EMAIL_PASS are correct');
      console.log('      • Make sure there are no extra spaces in your .env file');
      console.log('      • Try using an App Password instead of regular password');
    } else {
      console.log('\n   🔧 Troubleshooting:');
      console.log('      • Check your internet connection');
      console.log('      • Verify EMAIL_HOST and EMAIL_PORT are correct');
      console.log('      • Check if your firewall is blocking the connection');
    }
    process.exit(1);
  } else {
    console.log('   ✅ Email connection successful!');
    console.log('\n   Your email configuration is working correctly.');
    console.log('   You can now send OTP emails from the application.');
    process.exit(0);
  }
});

