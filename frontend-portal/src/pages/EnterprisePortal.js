import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { FiArrowLeft, FiShield, FiShoppingBag, FiPhone, FiLock, FiUser, FiMapPin, FiAlertCircle, FiMessageCircle, FiGrid, FiMail, FiDollarSign, FiCalendar } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../utils/api';
import './EnterprisePortal.css';

// Allowed roles for Enterprise Portal (constant, defined outside component for stable reference)
const ALLOWED_ROLES = ['superAdmin', 'mallAdmin', 'shopAdmin'];

const EnterprisePortal = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'register'
  const [loginData, setLoginData] = useState({ identifier: '', password: '' });
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    address: '',
    whatsapp: '',
    categoryId: '',
    subscriptionPlanId: '',
    billingCycleId: ''
  });
  const [categories, setCategories] = useState([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [billingCycles, setBillingCycles] = useState([]);
  const [selectedPlanPricing, setSelectedPlanPricing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const { user, loading: authLoading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch categories for registration form
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories?isActive=true');
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch subscription plans and billing cycles
  const fetchSubscriptionPlans = useCallback(async () => {
    try {
      const response = await api.get('/subscriptions/plans');
      setSubscriptionPlans(response.data.plans || []);
      setBillingCycles(response.data.billingCycles || []);
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      toast.error('Failed to load subscription plans. Please refresh the page.');
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'register') {
      fetchSubscriptionPlans();
    }
  }, [activeTab, fetchSubscriptionPlans]);

  // Handle navigation state from subscription plans page
  useEffect(() => {
    if (location.state) {
      if (location.state.tab === 'register') {
        setActiveTab('register');
      }
      if (location.state.subscriptionPlanId) {
        setRegisterData(prev => ({
          ...prev,
          subscriptionPlanId: location.state.subscriptionPlanId
        }));
      }
    }
  }, [location.state]);

  // Set billing cycle ID once cycles are loaded
  useEffect(() => {
    if (location.state?.billingCycle && billingCycles.length > 0) {
      const cycle = billingCycles.find(bc => bc.name === location.state.billingCycle);
      if (cycle) {
        setRegisterData(prev => ({
          ...prev,
          billingCycleId: cycle._id
        }));
      }
    }
  }, [location.state, billingCycles]);

  // Check if user has access (only for login tab, registration is public)
  useEffect(() => {
    if (authLoading || activeTab === 'register') return;

    if (user) {
      const userRole = user.role?.name || user.role;
      if (!ALLOWED_ROLES.includes(userRole)) {
        setAccessDenied(true);
        toast.error(t('enterprise.accessDenied') || 'Access denied. Admin privileges required.', { autoClose: 5000 });
        // Redirect after 5 seconds
        setTimeout(() => {
          navigate('/');
        }, 5000);
      }
    }
  }, [user, authLoading, navigate, t, activeTab]);

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterData({ ...registerData, [name]: value });
    
    // Update pricing display when plan or billing cycle changes
    if (name === 'subscriptionPlanId' || name === 'billingCycleId') {
      updatePricingDisplay(name === 'subscriptionPlanId' ? value : registerData.subscriptionPlanId, 
                          name === 'billingCycleId' ? value : registerData.billingCycleId);
    }
  };

  const updatePricingDisplay = (planId, cycleId) => {
    if (!planId || !cycleId) {
      setSelectedPlanPricing(null);
      return;
    }

    const plan = subscriptionPlans.find(p => p._id === planId);
    if (!plan || !plan.pricing) {
      setSelectedPlanPricing(null);
      return;
    }

    const cycle = billingCycles.find(bc => bc._id === cycleId);
    if (!cycle) {
      setSelectedPlanPricing(null);
      return;
    }

    const pricing = plan.pricing[cycle.name];
    if (pricing) {
      setSelectedPlanPricing({
        price: pricing.price,
        currency: pricing.currency || 'EGP',
        discount: pricing.discount || 0,
        planName: plan.displayName,
        cycleName: cycle.displayName
      });
    } else {
      setSelectedPlanPricing(null);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Determine if identifier is email or phone
      const isEmail = loginData.identifier.includes('@');
      
      if (isEmail) {
        await login(loginData.identifier, null, loginData.password);
      } else {
        await login(null, loginData.identifier, loginData.password);
      }

      // Check user role and redirect to admin portal
      const token = localStorage.getItem('token');
      if (token) {
        const userResponse = await api.get('/auth/me');
        const user = userResponse.data;
        
        // Check if user has admin role (superAdmin, mallAdmin, or shopAdmin)
        const userRole = user.role?.name || user.role;
        
        if (ALLOWED_ROLES.includes(userRole)) {
          // Redirect to admin portal with token in URL hash
          const adminPortalUrl = process.env.REACT_APP_ADMIN_PORTAL_URL || 'http://localhost:3001';
          window.location.href = `${adminPortalUrl}#token=${token}`;
        } else {
          toast.error(t('enterprise.accessDenied') || 'Access denied. Admin privileges required.', { autoClose: 5000 });
          // Logout the user since they don't have access
          localStorage.removeItem('token');
          window.location.reload();
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || t('common.error'), { autoClose: 5000 });
    } finally {
      setLoading(false);
    }
  };

  const validateEgyptianPhone = (phone) => {
    if (!phone || !phone.trim()) {
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

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate subscription plan selection
    if (!registerData.subscriptionPlanId || !registerData.billingCycleId) {
      toast.error('Please select a subscription plan and billing cycle');
      setLoading(false);
      return;
    }

    // Validate phone number format
    const phoneValidation = validateEgyptianPhone(registerData.phone);
    if (!phoneValidation.valid) {
      toast.error(`Phone: ${phoneValidation.message}`);
      setLoading(false);
      return;
    }

    // Validate WhatsApp number format if provided
    if (registerData.whatsapp && registerData.whatsapp.trim()) {
      const whatsappValidation = validateEgyptianPhone(registerData.whatsapp);
      if (!whatsappValidation.valid) {
        toast.error(`WhatsApp: ${whatsappValidation.message}`);
        setLoading(false);
        return;
      }
    }

    try {
      // Register partner (creates user with shopAdmin role and shop)
      const response = await api.post('/auth/register-partner', {
        name: registerData.name,
        email: registerData.email,
        phone: registerData.phone,
        password: registerData.password,
        address: registerData.address,
        whatsapp: registerData.whatsapp || registerData.phone,
        categoryId: registerData.categoryId,
        subscriptionPlanId: registerData.subscriptionPlanId,
        billingCycleId: registerData.billingCycleId
      });

      toast.success(response.data.message || 'Registration successful');
      
      // Auto login after registration
      await login(null, registerData.phone, registerData.password);
      
      // Verify role after login
      const userResponse = await api.get('/auth/me');
      const user = userResponse.data;
      const userRole = user.role?.name || user.role;
      
      if (ALLOWED_ROLES.includes(userRole)) {
        // Redirect to admin portal with token in URL hash
        const token = localStorage.getItem('token');
        const adminPortalUrl = process.env.REACT_APP_ADMIN_PORTAL_URL || 'http://localhost:3001';
        window.location.href = `${adminPortalUrl}#token=${token}`;
      } else {
        toast.error(t('enterprise.accessDenied') || 'Access denied. Admin privileges required.');
        localStorage.removeItem('token');
        window.location.reload();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (authLoading) {
    return (
      <div className="enterprise-portal-page">
        <div className="enterprise-container">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>{t('common.loading') || 'Loading...'}</p>
          </div>
        </div>
      </div>
    );
  }

  // Show access denied message
  if (accessDenied || (user && !ALLOWED_ROLES.includes(user.role?.name || user.role))) {
    return (
      <div className="enterprise-portal-page">
        <div className="enterprise-back-link">
          <Link to="/">
            <FiArrowLeft /> {t('enterprise.returnToMall') || '← Return to Mall'}
          </Link>
        </div>
        <div className="enterprise-container">
          <div className="access-denied-message">
            <FiAlertCircle className="access-denied-icon" />
            <h2>{t('enterprise.accessDenied') || 'Access Denied'}</h2>
            <p>{t('enterprise.accessDeniedMessage') || 'You do not have permission to access Your Shop. Only administrators can access this page.'}</p>
            <Link to="/" className="btn-return-home">
              {t('enterprise.returnToMall') || '← Return to Mall'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="enterprise-portal-page">
      <div className="enterprise-container">
        <div className="enterprise-tabs">
          <button
            type="button"
            className={`enterprise-tab ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => setActiveTab('login')}
          >
            {t('enterprise.signIn') || 'Sign In'}
          </button>
          <button
            type="button"
            className={`enterprise-tab ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => setActiveTab('register')}
          >
            {t('enterprise.partnerRegistration') || 'Partner Registration'}
          </button>
        </div>

        <div className="enterprise-icon">
          <div className="icon-circle">
            {activeTab === 'login' ? <FiShield /> : <FiShoppingBag />}
          </div>
        </div>

        {activeTab === 'login' ? (
          <>
            <h1 className="enterprise-title">{t('enterprise.enterprisePortal') || 'Your Shop'}</h1>
            <p className="enterprise-subtitle">{t('enterprise.authorizedAccess') || 'Authorized Access Only'}</p>

            <form onSubmit={handleLogin} className="enterprise-form">
              <div className="form-group">
                <label>{t('enterprise.idUsername') || 'ID / Username (Phone)'}</label>
                <div className="input-with-icon">
                  <FiPhone />
                  <input
                    type="text"
                    name="identifier"
                    value={loginData.identifier}
                    onChange={handleLoginChange}
                    placeholder="admin"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>{t('enterprise.password') || 'Password'}</label>
                <div className="input-with-icon">
                  <FiLock />
                  <input
                    type="password"
                    name="password"
                    value={loginData.password}
                    onChange={handleLoginChange}
                    placeholder="......"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn-secure-login" disabled={loading}>
                {loading ? t('common.loading') || 'Loading...' : t('enterprise.secureLogin') || 'Secure Login'}
              </button>
              
              <div className="form-footer-link">
                <Link to="/">
                  {t('enterprise.returnToMall') || '← Return to Mall'}
                </Link>
              </div>
            </form>
          </>
        ) : (
          <>
            <h1 className="enterprise-title">{t('enterprise.joinPartners') || 'Join iDream Partners'}</h1>
            <p className="enterprise-subtitle">{t('enterprise.registerBusiness') || 'Register your business today'}</p>

            <form onSubmit={handleRegister} className="enterprise-form">
              <div className="form-group">
                <label>{t('enterprise.businessOwnerName') || 'Business/Owner Name'}</label>
                <div className="input-with-icon">
                  <FiUser />
                  <input
                    type="text"
                    name="name"
                    value={registerData.name}
                    onChange={handleRegisterChange}
                    placeholder={t('enterprise.businessOwnerPlaceholder') || 'e.g. John Doe / My Shop'}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>{t('enterprise.email') || 'Email *'}</label>
                <div className="input-with-icon">
                  <FiMail />
                  <input
                    type="email"
                    name="email"
                    value={registerData.email}
                    onChange={handleRegisterChange}
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>{t('enterprise.phoneLoginId') || 'Phone (Login ID)'}</label>
                <div className="input-with-icon">
                  <FiPhone />
                  <input
                    type="tel"
                    name="phone"
                    value={registerData.phone}
                    onChange={handleRegisterChange}
                    placeholder="+20XXXXXXXXXX"
                    pattern="\+20[0-9]{10}"
                    title="Must start with +20 followed by 10 digits"
                    required
                  />
                </div>
                <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                  Format: +20XXXXXXXXXX (Egypt international format)
                </small>
              </div>

              <div className="form-group">
                <label>{t('enterprise.password') || 'Password'}</label>
                <div className="input-with-icon">
                  <FiLock />
                  <input
                    type="password"
                    name="password"
                    value={registerData.password}
                    onChange={handleRegisterChange}
                    placeholder="......"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>{t('enterprise.address') || 'Address'}</label>
                <div className="input-with-icon">
                  <FiMapPin />
                  <input
                    type="text"
                    name="address"
                    value={registerData.address}
                    onChange={handleRegisterChange}
                    placeholder={t('enterprise.addressPlaceholder') || 'City, Area'}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>{t('enterprise.whatsapp') || 'WhatsApp Number'}</label>
                <div className="input-with-icon">
                  <FiMessageCircle />
                  <input
                    type="tel"
                    name="whatsapp"
                    value={registerData.whatsapp}
                    onChange={handleRegisterChange}
                    placeholder="+20XXXXXXXXXX (optional)"
                    pattern="\+20[0-9]{10}"
                    title="Must start with +20 followed by 10 digits"
                  />
                </div>
                <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                  {t('enterprise.whatsappHint') || 'If not provided, phone number will be used. Format: +20XXXXXXXXXX'}
                </small>
              </div>

              <div className="form-group">
                <label>{t('enterprise.category') || 'Business Category'}</label>
                <div className="input-with-icon">
                  <FiGrid />
                  <select
                    name="categoryId"
                    value={registerData.categoryId}
                    onChange={handleRegisterChange}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem 0.75rem 2.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      background: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">{t('enterprise.selectCategory') || 'Select a category'}</option>
                    {categories.map(category => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>{t('enterprise.subscriptionPlan') || 'Subscription Plan *'}</label>
                <div className="input-with-icon">
                  <FiDollarSign />
                  <select
                    name="subscriptionPlanId"
                    value={registerData.subscriptionPlanId}
                    onChange={handleRegisterChange}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem 0.75rem 2.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      background: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">{t('enterprise.selectPlan') || 'Select a subscription plan'}</option>
                    {subscriptionPlans.map(plan => (
                      <option key={plan._id} value={plan._id}>
                        {plan.displayName}
                      </option>
                    ))}
                  </select>
                </div>
                {registerData.subscriptionPlanId && (
                  <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                    {subscriptionPlans.find(p => p._id === registerData.subscriptionPlanId)?.description || ''}
                  </small>
                )}
              </div>

              <div className="form-group">
                <label>{t('enterprise.billingCycle') || 'Billing Cycle *'}</label>
                <div className="input-with-icon">
                  <FiCalendar />
                  <select
                    name="billingCycleId"
                    value={registerData.billingCycleId}
                    onChange={handleRegisterChange}
                    required
                    disabled={!registerData.subscriptionPlanId}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem 0.75rem 2.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      background: registerData.subscriptionPlanId ? 'white' : '#f3f4f6',
                      cursor: registerData.subscriptionPlanId ? 'pointer' : 'not-allowed'
                    }}
                  >
                    <option value="">{t('enterprise.selectBillingCycle') || 'Select billing cycle'}</option>
                    {billingCycles.map(cycle => (
                      <option key={cycle._id} value={cycle._id}>
                        {cycle.displayName}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedPlanPricing && (
                  <div style={{ 
                    marginTop: '0.5rem', 
                    padding: '0.75rem', 
                    background: '#f0f9ff', 
                    borderRadius: '8px',
                    border: '1px solid #bae6fd'
                  }}>
                    <div style={{ fontSize: '0.875rem', color: '#1e40af', fontWeight: '500' }}>
                      {selectedPlanPricing.planName} - {selectedPlanPricing.cycleName}
                    </div>
                    <div style={{ fontSize: '1.125rem', color: '#1e40af', fontWeight: '600', marginTop: '0.25rem' }}>
                      {selectedPlanPricing.price} {selectedPlanPricing.currency}
                      {selectedPlanPricing.discount > 0 && (
                        <span style={{ fontSize: '0.875rem', color: '#059669', marginLeft: '0.5rem' }}>
                          ({selectedPlanPricing.discount}% discount)
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button type="submit" className="btn-register-partner" disabled={loading}>
                {loading ? t('common.loading') || 'Loading...' : t('enterprise.registerPartnerAccount') || 'Register Partner Account'}
              </button>
              
              <div className="form-footer-link">
                <Link to="/">
                  {t('enterprise.returnToMall') || '← Return to Mall'}
                </Link>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default EnterprisePortal;

