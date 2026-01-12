const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');
const Shop = require('../models/Shop');
const { sendOTPEmail } = require('../utils/email');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Register guest user
exports.register = async (req, res) => {
  console.log('=== REGISTRATION ATTEMPT ===');
  console.log(`Time: ${new Date().toISOString()}`);
  
  try {
    const { email, phone, password } = req.body;
    console.log(`Email: ${email || 'NOT PROVIDED'}`);
    console.log(`Phone: ${phone || 'NOT PROVIDED'}`);
    console.log(`Password provided: ${password ? 'YES' : 'NO'}`);

    // Validate required fields
    if (!email || !phone || !password) {
      console.log('❌ Registration failed: Missing required fields');
      return res.status(400).json({ message: 'Email, phone, and password are required' });
    }

    // Check if user exists
    console.log('🔍 Checking if user already exists...');
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`❌ Registration failed: User already exists with email: ${email}`);
      return res.status(400).json({ message: 'User already exists' });
    }
    console.log('✅ Email is available');

    // Get or create guest role
    let guestRole = await Role.findOne({ name: 'guest' });
    if (!guestRole) {
      // If guest role doesn't exist, create it with basic permissions
      const Permission = require('../models/Permission');
      const readPermissions = await Permission.find({
        $or: [
          { name: 'product.read' },
          { name: 'shop.read' },
          { name: 'category.read' }
        ]
      });
      
      guestRole = await Role.create({
        name: 'guest',
        description: 'Guest user - can browse and purchase',
        permissions: readPermissions.map(p => p._id),
        isActive: true
      });
      console.log('Guest role created automatically');
    }

    // Ensure guest role is active
    if (!guestRole.isActive) {
      return res.status(500).json({ message: 'Guest role is not active' });
    }

    // Create user with guest role
    const user = await User.create({
      email,
      phone,
      password,
      role: guestRole._id,
      isEmailVerified: false,
      isActive: true
    });

    // Generate and send OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.emailVerificationOTP = otp;
    user.emailVerificationOTPExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    await sendOTPEmail(email, otp);

    res.status(201).json({
      message: 'Registration successful. Please verify your email.',
      userId: user._id
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Register partner (creates user with shopAdmin role and shop)
// Helper function to validate Egyptian phone number format (+20XXXXXXXXXX)
const validateEgyptianPhone = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, message: 'Phone number is required' };
  }
  const trimmedPhone = phone.trim();
  if (!trimmedPhone.startsWith('+20')) {
    return { valid: false, message: 'Phone number must start with +20 (Egypt international format)' };
  }
  // Check if it's a valid Egyptian phone number: +20 followed by 10 digits
  const phoneDigits = trimmedPhone.replace(/\D/g, ''); // Remove all non-digits
  if (phoneDigits.length !== 12 || !phoneDigits.startsWith('20')) {
    return { valid: false, message: 'Phone number must be in format: +20XXXXXXXXXX (12 digits including country code)' };
  }
  return { valid: true, message: '' };
};

exports.registerPartner = async (req, res) => {
  try {
    const { name, email, phone, password, address, whatsapp, categoryId, subscriptionPlanId, billingCycleId } = req.body;

    if (!name || !email || !phone || !password || !address) {
      return res.status(400).json({ message: 'Name, email, phone, password, and address are required' });
    }

    // Validate subscription plan and billing cycle are provided
    if (!subscriptionPlanId || !billingCycleId) {
      return res.status(400).json({ message: 'Subscription plan and billing cycle are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    // Validate phone number format
    const phoneValidation = validateEgyptianPhone(phone);
    if (!phoneValidation.valid) {
      return res.status(400).json({ message: `Phone: ${phoneValidation.message}` });
    }

    // Validate WhatsApp number format if provided
    const finalWhatsApp = whatsapp || phone;
    if (finalWhatsApp) {
      const whatsappValidation = validateEgyptianPhone(finalWhatsApp);
      if (!whatsappValidation.valid) {
        return res.status(400).json({ message: `WhatsApp: ${whatsappValidation.message}` });
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ phone }, { email }] 
    });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email or phone number' });
    }

    // Get or create shopAdmin role with correct permissions
    let shopAdminRole = await Role.findOne({ name: 'shopAdmin' }).populate('permissions');
    
    if (!shopAdminRole) {
      // Create shopAdmin role with correct permissions
      const Permission = require('../models/Permission');
      
      // Get required permissions for shopAdmin
      const shopAdminPermissions = await Permission.find({
        $or: [
          { name: 'product.create' },
          { name: 'product.read' },
          { name: 'product.update' },
          { name: 'product.delete' },
          { name: 'report.read' }
        ]
      });

      if (shopAdminPermissions.length === 0) {
        return res.status(500).json({ 
          message: 'Required permissions not found. Please run seed script first.' 
        });
      }

      shopAdminRole = await Role.create({
        name: 'shopAdmin',
        description: 'Shop Administrator - can manage own products',
        permissions: shopAdminPermissions.map(p => p._id),
        isActive: true
      });
    } else {
      // Ensure shopAdmin role has correct permissions
      const Permission = require('../models/Permission');
      const requiredPermissions = await Permission.find({
        $or: [
          { name: 'product.create' },
          { name: 'product.read' },
          { name: 'product.update' },
          { name: 'product.delete' },
          { name: 'report.read' }
        ]
      });

      // Update permissions if they don't match
      const currentPermissionIds = shopAdminRole.permissions.map(p => p._id || p.toString());
      const requiredPermissionIds = requiredPermissions.map(p => p._id.toString());
      const hasAllPermissions = requiredPermissionIds.every(id => 
        currentPermissionIds.includes(id)
      );

      if (!hasAllPermissions) {
        shopAdminRole.permissions = requiredPermissions.map(p => p._id);
        await shopAdminRole.save();
      }
    }

    // Get or assign default category
    const Category = require('../models/Category');
    let category;
    
    if (categoryId) {
      category = await Category.findById(categoryId);
      if (!category) {
        return res.status(400).json({ message: 'Invalid category selected' });
      }
    } else {
      // Get first active category as default
      category = await Category.findOne({ isActive: true }).sort({ order: 1, createdAt: 1 });
      if (!category) {
        return res.status(400).json({ 
          message: 'No active category found. Please contact administrator.' 
        });
      }
    }

    // Create user with shopAdmin role (account on hold until shop is verified)
    const user = await User.create({
      email,
      phone,
      password,
      role: shopAdminRole._id,
      isEmailVerified: true, // Skip email verification for partners
      isActive: false // Account on hold until shop is verified by MallAdmin or SuperAdmin
    });

    // Create shop linked to user
    const shop = await Shop.create({
      name,
      address,
      mobile: phone,
      whatsapp: whatsapp || phone, // Use phone as default if whatsapp not provided
      email,
      category: category._id,
      isActive: false, // Requires admin approval
      isApproved: false,
      createdBy: user._id
    });

    // Link shop to user
    user.shop = shop._id;
    await user.save();

    // Validate and create subscription
    const SubscriptionPlan = require('../models/SubscriptionPlan');
    const BillingCycle = require('../models/BillingCycle');
    const ShopSubscription = require('../models/ShopSubscription');

    const subscriptionPlan = await SubscriptionPlan.findById(subscriptionPlanId);
    if (!subscriptionPlan || !subscriptionPlan.isActive) {
      return res.status(400).json({ message: 'Invalid or inactive subscription plan selected' });
    }

    const billingCycle = await BillingCycle.findById(billingCycleId);
    if (!billingCycle || !billingCycle.isActive) {
      return res.status(400).json({ message: 'Invalid or inactive billing cycle selected' });
    }

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + billingCycle.durationInDays);

    // Create shop subscription with 'pending' status (will be activated when shop is approved)
    await ShopSubscription.create({
      shop: shop._id,
      subscriptionPlan: subscriptionPlan._id,
      billingCycle: billingCycle._id,
      startDate: startDate,
      endDate: endDate,
      status: 'pending', // Will be activated when shop is approved
      createdBy: user._id
    });

    res.status(201).json({
      message: 'Partner registration successful. Your account is pending approval.',
      userId: user._id,
      shopId: shop._id
    });
  } catch (error) {
    console.error('Partner registration error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    if (user.emailVerificationOTP !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (Date.now() > user.emailVerificationOTPExpiry) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    user.isEmailVerified = true;
    user.emailVerificationOTP = null;
    user.emailVerificationOTPExpiry = null;
    await user.save();

    await user.populate('role');

    const token = generateToken(user._id);

    res.json({
      message: 'Email verified successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role.name,
        shop: user.shop
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Resend OTP
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.emailVerificationOTP = otp;
    user.emailVerificationOTPExpiry = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendOTPEmail(email, otp);

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  const startTime = Date.now();
  const { email, phone, password } = req.body;

  console.log('\n=== LOGIN ATTEMPT ===');
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`IP: ${req.ip || req.connection.remoteAddress}`);
  console.log(`Email: ${email || 'NOT PROVIDED'}`);
  console.log(`Phone: ${phone || 'NOT PROVIDED'}`);
  console.log(`Password provided: ${password ? 'YES (length: ' + password.length + ')' : 'NO'}`);

  try {
    // Validate input - must have either email or phone, and password
    if ((!email && !phone) || !password) {
      console.log('❌ Login failed: Missing identifier or password');
      console.log(`   Email provided: ${!!email}`);
      console.log(`   Phone provided: ${!!phone}`);
      console.log(`   Password provided: ${!!password}`);
      return res.status(400).json({ message: 'Email or phone number and password are required' });
    }

    // Determine if login is by email or phone
    let user;
    let loginType;
    
    if (email) {
      // Login by email
      loginType = 'email';
      const normalizedEmail = email.toLowerCase().trim();
      console.log(`📧 Login by email: ${normalizedEmail}`);
      
      console.log('🔍 Looking up user in database by email...');
      user = await User.findOne({ email: normalizedEmail }).populate('role');
      
      if (!user) {
        console.log(`❌ Login failed: User not found for email: ${normalizedEmail}`);
        console.log('   Attempted query: { email: "' + normalizedEmail + '" }');
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    } else if (phone) {
      // Login by phone
      loginType = 'phone';
      const normalizedPhone = phone.trim();
      console.log(`📱 Login by phone: ${normalizedPhone}`);
      
      console.log('🔍 Looking up user in database by phone...');
      user = await User.findOne({ phone: normalizedPhone }).populate('role');
      
      if (!user) {
        console.log(`❌ Login failed: User not found for phone: ${normalizedPhone}`);
        console.log('   Attempted query: { phone: "' + normalizedPhone + '" }');
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    }

    console.log(`✅ User found in database (by ${loginType})`);
    console.log(`   - User ID: ${user._id}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Phone: ${user.phone || 'NOT SET'}`);
    console.log(`   - Role: ${user.role ? (user.role.name || 'NO NAME') : 'NOT POPULATED'}`);
    console.log(`   - Role ID: ${user.role ? user.role._id : 'N/A'}`);
    console.log(`   - Is Active: ${user.isActive}`);
    console.log(`   - Is Email Verified: ${user.isEmailVerified}`);
    console.log(`   - Has Password: ${user.password ? 'YES' : 'NO'}`);
    console.log(`   - Password length: ${user.password ? user.password.length : 0} characters`);

    // Check if account is active
    if (!user.isActive) {
      console.log(`❌ Login failed: Account is deactivated`);
      console.log(`   User ID: ${user._id}`);
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Check if email is verified (optional check - can be removed if not required)
    if (!user.isEmailVerified) {
      console.log(`⚠️  Warning: Email not verified for user: ${user._id}`);
      console.log(`   Allowing login anyway (email verification may be optional)`);
      // Uncomment the lines below if email verification should be required for login
      // return res.status(401).json({ message: 'Please verify your email before logging in' });
    }

    // Compare password
    console.log('🔐 Comparing password...');
    console.log(`   Input password length: ${password.length}`);
    console.log(`   Stored password hash length: ${user.password ? user.password.length : 0}`);
    
    let isMatch = false;
    try {
      isMatch = await user.comparePassword(password);
      console.log(`   Password comparison result: ${isMatch ? 'MATCH ✅' : 'NO MATCH ❌'}`);
    } catch (compareError) {
      console.error(`   ❌ Password comparison error: ${compareError.message}`);
      console.error(`   Stack: ${compareError.stack}`);
      throw compareError;
    }
    
    if (!isMatch) {
      console.log(`❌ Login failed: Invalid password`);
      console.log(`   User ID: ${user._id}`);
      console.log(`   Email: ${user.email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('✅ Password match successful');

    // Generate token
    console.log('🎫 Generating JWT token...');
    let token;
    try {
      token = generateToken(user._id);
      console.log(`✅ Token generated successfully`);
      console.log(`   Token length: ${token.length} characters`);
    } catch (tokenError) {
      console.error(`❌ Token generation error: ${tokenError.message}`);
      throw tokenError;
    }

    const responseTime = Date.now() - startTime;
    console.log(`✅ Login successful!`);
    console.log(`   User ID: ${user._id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role ? user.role.name : 'N/A'}`);
    console.log(`   Response time: ${responseTime}ms`);
    console.log('=== LOGIN COMPLETE ===\n');

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role ? user.role.name : null,
        shop: user.shop
      }
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('\n❌ LOGIN ERROR OCCURRED');
    console.error(`   Time: ${new Date().toISOString()}`);
    console.error(`   Email attempted: ${email || 'N/A'}`);
    console.error(`   Error type: ${error.constructor.name}`);
    console.error(`   Error message: ${error.message}`);
    console.error(`   Error stack:`);
    console.error(error.stack);
    console.error(`   Response time: ${responseTime}ms`);
    console.error('=== LOGIN ERROR END ===\n');
    
    // Don't expose internal error details to client
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'An error occurred during login';
    
    res.status(500).json({ message: errorMessage });
  }
};

// Get current user
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('role')
      .populate('shop')
      .select('-password');

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

