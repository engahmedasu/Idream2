const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('\n📧 Email Configuration Test\n');
console.log('='.repeat(50));

// Check if environment variables are loaded
console.log('\n1. Environment Variables Check:');
console.log('   EMAIL_HOST:', process.env.EMAIL_HOST || '❌ NOT SET (defaults to smtp.zoho.com)');
console.log('   EMAIL_PORT:', process.env.EMAIL_PORT || '❌ NOT SET (defaults to 587)');
console.log('   EMAIL_USER:', process.env.EMAIL_USER ? `✅ ${process.env.EMAIL_USER}` : '❌ NOT SET');
console.log('   EMAIL_PASS:', process.env.EMAIL_PASS ? `✅ ${'*'.repeat(process.env.EMAIL_PASS.length)} (${process.env.EMAIL_PASS.length} chars)` : '❌ NOT SET');

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.log('\n❌ Email configuration is incomplete!');
  console.log('\n📝 Setup Instructions:');
  console.log('   1. Create a file named .env in the backend/ directory');
  console.log('   2. Add the following lines:');
  console.log('      EMAIL_USER=your-email@zoho.com');
  console.log('      EMAIL_PASS=your-password-here');
  console.log('      EMAIL_HOST=smtp.zoho.com');
  console.log('      EMAIL_PORT=587');
  console.log('\n🔐 Zoho Email Setup:');
  console.log('   • EMAIL_USER: Your full Zoho email address');
  console.log('   • EMAIL_PASS: Your Zoho account password');
  console.log('   • If 2FA is enabled, use an App Password from Zoho Account settings');
  console.log('\n📧 Zoho SMTP Host by Region:');
  console.log('   • US/Global: smtp.zoho.com');
  console.log('   • Europe: smtp.zoho.eu');
  console.log('   • India: smtp.zoho.in');
  console.log('   • Australia: smtp.zoho.com.au');
  console.log('\n🔧 Port Options:');
  console.log('   • 587 (TLS/STARTTLS) - Recommended, set secure=false');
  console.log('   • 465 (SSL) - Alternative, set secure=true');
  process.exit(1);
}

// Test email connection
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.zoho.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_PORT === '465', // true for 465, false for 587
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
      console.log('      • Make sure EMAIL_USER is your full Zoho email address (e.g., yourname@zoho.com)');
      console.log('      • Verify EMAIL_PASS is your correct Zoho account password');
      console.log('      • If 2FA is enabled, use an App Password from Zoho Account settings');
      console.log('      • Check that EMAIL_HOST matches your Zoho region (smtp.zoho.com, smtp.zoho.eu, etc.)');
      console.log('      • Verify EMAIL_PORT is correct (587 for TLS, 465 for SSL)');
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

