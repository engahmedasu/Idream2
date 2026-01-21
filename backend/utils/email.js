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

    const isAccessRestricted = /554|5\.7\.8|Access Restricted/i.test(error.message);
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

    if (isAccessRestricted) {
      console.error('\n📧 Zoho "554 5.7.8 Access Restricted" – SMTP/IMAP access is blocked:');
      console.error('   https://help.zoho.com/portal/en/community/topic/zoho-mail-server-details');
      console.error('');
      console.error('   Fix checklist:');
      console.error('   1. App Password: If 2FA is on, use an Application-Specific Password in EMAIL_PASS');
      console.error('      (Zoho: My Account → Security → Application-Specific Passwords)');
      console.error('   2. SMTP host: Use smtppro.zoho.com for domain/paid (e.g. no.reply@idreamegypt.com)');
      console.error('      Use smtp.zoho.com for @zoho.com / @zohomail.com');
      console.error('   3. Zoho Mail: Settings → Mail Accounts → POP/IMAP Access → enable IMAP & SMTP');
      console.error('   4. Org/Admin: If this is an org account, ask admin to allow SMTP in Email Policy');
      console.error('   5. Plan: Free plans may no longer get SMTP; check your Zoho plan.');
    } else if (isAuthError) {
      console.error('\n📧 Zoho Email Authentication Error:');
      console.error('   1. Make sure EMAIL_USER is your full Zoho email address (e.g., yourname@zoho.com)');
      console.error('   2. Use your Zoho account password or App Password in EMAIL_PASS');
      console.error('   3. If 2FA is enabled, generate an App Password from Zoho Account settings');
      console.error('   4. Check for extra spaces or quotes in your .env file');
      console.error('   5. Verify EMAIL_HOST: smtp.zoho.com (free) or smtppro.zoho.com (domain/paid)');
      console.error('      Regions: smtp.zoho.eu, smtp.zoho.in, smtp.zoho.com.au');
    }

    if (isAccessRestricted || isAuthError) {
      console.error('\n🔍 Current Configuration:');
      console.error(`   EMAIL_USER: ${config.email.user ? `"${config.email.user}" (${config.email.user.length} chars)` : '❌ NOT SET'}`);
      console.error(`   EMAIL_PASS: ${config.email.password ? `"${'*'.repeat(config.email.password.length)}" (${config.email.password.length} chars)` : '❌ NOT SET'}`);
      console.error(`   EMAIL_HOST: ${config.email.host}`);
      console.error(`   EMAIL_PORT: ${config.email.port}`);
      if (config.email.user && !/@zoho|@zohomail\.com/i.test(config.email.user)) {
        console.error('\n   → Domain accounts (e.g. no.reply@idreamegypt.com) must use EMAIL_HOST=smtppro.zoho.com');
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
      'EAUTH',
      'Invalid login',
      '554',
      'Access Restricted'
    ];

    if (authErrors.some(pattern => error.message.includes(pattern)) || error.code === 'EAUTH') {
      const hint = /554|Access Restricted/i.test(error.message)
        ? 'Zoho may be blocking SMTP: use an Application-Specific Password if 2FA is on, enable POP/IMAP in Zoho Mail, use smtppro.zoho.com for domain accounts, and check org Email Policy. See: https://help.zoho.com/portal/en/community/topic/zoho-mail-server-details'
        : 'Check EMAIL_USER (full address), EMAIL_PASS (or App Password if 2FA), and EMAIL_HOST (smtp.zoho.com or smtppro.zoho.com for domain).';
      throw new Error(`Zoho email authentication failed. ${hint}`);
    }

    throw error;
  }
};

