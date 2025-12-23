const nodemailer = require('nodemailer');

// Validate email configuration
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.warn('⚠️  EMAIL_USER and/or EMAIL_PASS not set in environment variables.');
  console.warn('   Email functionality will not work until configured.');
  console.warn('   See backend/.env.example or check README for setup instructions.');
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email transporter verification failed:', error.message);
    if (error.message.includes('BadCredentials') || error.message.includes('Username and Password not accepted')) {
      console.error('\n📧 Gmail Authentication Error:');
      console.error('   1. Make sure you have 2-Factor Authentication enabled on your Gmail account');
      console.error('   2. Generate an App Password: https://myaccount.google.com/apppasswords');
      console.error('   3. Use the App Password (not your regular password) in EMAIL_PASS');
      console.error('   4. Make sure EMAIL_USER is your full Gmail address (e.g., yourname@gmail.com)');
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
    if (error.message.includes('BadCredentials') || error.message.includes('Username and Password not accepted')) {
      throw new Error('Gmail authentication failed. Please check your EMAIL_USER and EMAIL_PASS in .env file. You may need to use an App Password instead of your regular password.');
    } else if (error.message.includes('Invalid login')) {
      throw new Error('Invalid email credentials. Please verify EMAIL_USER and EMAIL_PASS in .env file.');
    } else if (error.code === 'EAUTH') {
      throw new Error('Email authentication failed. Please check your email credentials.');
    }
    
    throw error;
  }
};

