const nodemailer = require('nodemailer');
const config = require('../config/app');

// Validate email configuration
if (!config.email.user || !config.email.password) {
  console.warn('⚠️  EMAIL_USER and/or EMAIL_PASS not set in environment variables.');
  console.warn('   Email functionality will not work until configured.');
  console.warn('   See backend/.env.dev.example or backend/.env.prod.example for setup instructions.');
}

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure,
  auth: {
    user: config.email.user,
    pass: config.email.password
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email transporter verification failed:', error.message);
    
    // Check for various authentication error patterns
    const authErrors = [
      'BadCredentials',
      'Username and Password not accepted',
      'Authentication Failed',
      '535 Authentication Failed',
      '535',
      'EAUTH',
      'Invalid login'
    ];
    
    const isAuthError = authErrors.some(pattern => 
      error.message.includes(pattern) || error.code === 'EAUTH'
    );
    
    if (isAuthError) {
      console.error('\n📧 Gmail Authentication Error:');
      console.error('   1. Make sure you have 2-Factor Authentication enabled on your Gmail account');
      console.error('   2. Generate an App Password: https://myaccount.google.com/apppasswords');
      console.error('   3. Use the App Password (not your regular password) in EMAIL_PASS');
      console.error('   4. Make sure EMAIL_USER is your full Gmail address (e.g., yourname@gmail.com)');
      console.error('   5. Check for extra spaces or quotes in your .env file');
      console.error('   6. App Password should be exactly 16 characters (no spaces)');
      console.error('\n🔍 Current Configuration:');
      console.error(`   EMAIL_USER: ${config.email.user ? `"${config.email.user}" (${config.email.user.length} chars)` : '❌ NOT SET'}`);
      console.error(`   EMAIL_PASS: ${config.email.password ? `"${'*'.repeat(config.email.password.length)}" (${config.email.password.length} chars)` : '❌ NOT SET'}`);
      console.error(`   EMAIL_HOST: ${config.email.host}`);
      console.error(`   EMAIL_PORT: ${config.email.port}`);
      
      // Additional checks
      if (config.email.password && config.email.password.length !== 16) {
        console.error('\n⚠️  WARNING: App Password should be 16 characters. Current length:', config.email.password.length);
      }
      if (config.email.user && !config.email.user.includes('@gmail.com')) {
        console.error('\n⚠️  WARNING: EMAIL_USER should be a Gmail address');
      }
    }
  } else {
    console.log('✅ Email transporter configured successfully');
  }
});

exports.sendOTPEmail = async (email, otp) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('Email configuration missing. Please set EMAIL_USER and EMAIL_PASS in .env file');
    }

    const mailOptions = {
      from: `"iDream Portal" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'iDream Portal - Email Verification OTP',
      html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1f2937;">Email Verification</h2>
          <p>Your OTP for email verification is:</p>
          <h1 style="color: #4F46E5; font-size: 32px; text-align: center; padding: 20px; background: #f3f4f6; border-radius: 8px;">${otp}</h1>
          <p>This OTP will expire in 10 minutes.</p>
          <p style="color: #6b7280; font-size: 0.875rem;">If you didn't request this, please ignore this email.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Email sending error:', error.message);
    
    // Provide helpful error messages
    const authErrors = [
      'BadCredentials',
      'Username and Password not accepted',
      'Authentication Failed',
      '535 Authentication Failed',
      '535',
      'Invalid login'
    ];
    
    if (authErrors.some(pattern => error.message.includes(pattern)) || error.code === 'EAUTH') {
      throw new Error('Gmail authentication failed. Please check your EMAIL_USER and EMAIL_PASS in .env file. You may need to use an App Password instead of your regular password. Make sure 2-Factor Authentication is enabled and you\'ve generated an App Password from https://myaccount.google.com/apppasswords');
    }
    
    throw error;
  }
};

