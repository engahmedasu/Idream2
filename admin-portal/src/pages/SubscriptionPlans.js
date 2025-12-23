import React, { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiX, FiCheckCircle, FiXCircle, FiList, FiSettings, FiShoppingBag, FiCalendar, FiEye } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../utils/api';
import './SubscriptionPlans.css';

const SubscriptionPlans = () => {
  const [activeTab, setActiveTab] = useState('plans');
  const [plans, setPlans] = useState([]);
  const [billingCycles, setBillingCycles] = useState([]);
  const [shopSubscriptions, setShopSubscriptions] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showBillingCycleModal, setShowBillingCycleModal] = useState(false);
  const [showBillingCycleDetailsModal, setShowBillingCycleDetailsModal] = useState(false);
  const [selectedBillingCycle, setSelectedBillingCycle] = useState(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictData, setConflictData] = useState(null);
  
  const [editingPlan, setEditingPlan] = useState(null);
  const [editingFeature, setEditingFeature] = useState(null);
  const [editingPricing, setEditingPricing] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planFeatures, setPlanFeatures] = useState([]);
  const [planLimits, setPlanLimits] = useState([]);
  const [planPricing, setPlanPricing] = useState([]);
  
  const [planFormData, setPlanFormData] = useState({
    displayName: '',
    features: [],
    sortOrder: 0,
    isActive: true,
    maxProducts: '',
    maxHotOffers: '',
    monthlyPrice: '',
    yearlyPrice: ''
  });
  
  const [newFeature, setNewFeature] = useState('');
  
  const [featureFormData, setFeatureFormData] = useState({
    title: '',
    isHighlighted: false,
    sortOrder: 0
  });
  
  const [limitFormData, setLimitFormData] = useState({
    limitKey: '',
    limitValue: ''
  });
  
  const [pricingFormData, setPricingFormData] = useState({
    billingCycleId: '',
    price: 0,
    currency: 'USD',
    discount: 0
  });
  
  const [billingCycleFormData, setBillingCycleFormData] = useState({
    name: 'monthly',
    displayName: '',
    durationInDays: 30,
    isActive: true
  });
  
  const [subscriptionFormData, setSubscriptionFormData] = useState({
    shopId: '',
    subscriptionPlanId: '',
    billingCycleId: '',
    startDate: ''
  });

  const fetchPlans = useCallback(async () => {
    try {
      const response = await api.get('/subscriptions/admin/plans');
      setPlans(response.data);
    } catch (error) {
      toast.error('Failed to fetch plans');
      console.error(error);
    }
  }, []);

  const fetchBillingCycles = useCallback(async () => {
    try {
      const response = await api.get('/billingcycles');
      setBillingCycles(response.data);
    } catch (error) {
      toast.error('Failed to fetch billing cycles');
      console.error(error);
    }
  }, []);

  const fetchShopSubscriptions = useCallback(async () => {
    try {
      const response = await api.get('/subscriptions/admin/shop-subscriptions');
      setShopSubscriptions(response.data);
    } catch (error) {
      toast.error('Failed to fetch shop subscriptions');
      console.error(error);
    }
  }, []);

  const fetchShops = useCallback(async () => {
    try {
      const response = await api.get('/shops');
      setShops(response.data);
    } catch (error) {
      toast.error('Failed to fetch shops');
      console.error(error);
    }
  }, []);

  const fetchPlanFeatures = useCallback(async (planId) => {
    try {
      const response = await api.get(`/subscriptions/admin/plans/${planId}/features`);
      setPlanFeatures(response.data);
    } catch (error) {
      toast.error('Failed to fetch plan features');
      console.error(error);
    }
  }, []);

  const fetchPlanLimits = useCallback(async (planId) => {
    try {
      const response = await api.get(`/subscriptions/admin/plans/${planId}/limits`);
      setPlanLimits(response.data);
    } catch (error) {
      toast.error('Failed to fetch plan limits');
      console.error(error);
    }
  }, []);

  const fetchPlanPricing = useCallback(async (planId) => {
    try {
      const response = await api.get(`/subscriptions/admin/plans/${planId}/pricing`);
      setPlanPricing(response.data);
    } catch (error) {
      toast.error('Failed to fetch plan pricing');
      console.error(error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchPlans(),
        fetchBillingCycles(),
        fetchShopSubscriptions(),
        fetchShops()
      ]);
      setLoading(false);
    };
    loadData();
  }, [fetchPlans, fetchBillingCycles, fetchShopSubscriptions, fetchShops]);

  useEffect(() => {
    if (selectedPlan) {
      fetchPlanFeatures(selectedPlan._id);
      fetchPlanLimits(selectedPlan._id);
      fetchPlanPricing(selectedPlan._id);
    }
  }, [selectedPlan, fetchPlanFeatures, fetchPlanLimits, fetchPlanPricing]);

  // Plan CRUD
  const handlePlanSubmit = async (e) => {
    e.preventDefault();
    try {
      const { maxProducts, maxHotOffers, monthlyPrice, yearlyPrice, features, ...planData } = planFormData;
      let planId;
      
      if (editingPlan) {
        await api.put(`/subscriptions/admin/plans/${editingPlan._id}`, planData);
        planId = editingPlan._id;
        toast.success('Plan updated successfully');
      } else {
        const response = await api.post('/subscriptions/admin/plans', planData);
        planId = response.data._id;
        toast.success('Plan created successfully');
      }
      
      // Save max_products limit (always save, empty means -1 for unlimited)
      const maxProductsValue = maxProducts === '' || maxProducts === null || maxProducts === undefined 
        ? -1 
        : parseInt(maxProducts);
      await api.post(`/subscriptions/admin/plans/${planId}/limits`, {
        limitKey: 'max_products',
        limitValue: maxProductsValue
      });
      
      // Save max_hot_offers limit (always save, empty means -1 for unlimited)
      const maxHotOffersValue = maxHotOffers === '' || maxHotOffers === null || maxHotOffers === undefined 
        ? -1 
        : parseInt(maxHotOffers);
      await api.post(`/subscriptions/admin/plans/${planId}/limits`, {
        limitKey: 'max_hot_offers',
        limitValue: maxHotOffersValue
      });
      
      // Find monthly and yearly billing cycles
      const monthlyCycle = billingCycles.find(bc => bc.name === 'monthly');
      const yearlyCycle = billingCycles.find(bc => bc.name === 'yearly');
      
      // Save monthly pricing if price is provided
      if (monthlyPrice !== '' && monthlyPrice !== null && monthlyPrice !== undefined && monthlyCycle) {
        const monthlyPriceValue = parseFloat(monthlyPrice);
        if (!isNaN(monthlyPriceValue) && monthlyPriceValue >= 0) {
          await api.post(`/subscriptions/admin/plans/${planId}/pricing`, {
            billingCycleId: monthlyCycle._id,
            price: monthlyPriceValue,
            discount: 0
          });
        }
      }
      
      // Save yearly pricing if price is provided
      if (yearlyPrice !== '' && yearlyPrice !== null && yearlyPrice !== undefined && yearlyCycle) {
        const yearlyPriceValue = parseFloat(yearlyPrice);
        if (!isNaN(yearlyPriceValue) && yearlyPriceValue >= 0) {
          await api.post(`/subscriptions/admin/plans/${planId}/pricing`, {
            billingCycleId: yearlyCycle._id,
            price: yearlyPriceValue,
            discount: 0
          });
        }
      }
      
      // Save features - delete existing and create new ones
      if (editingPlan) {
        // Delete existing features
        const existingFeatures = await api.get(`/subscriptions/admin/plans/${planId}/features`);
        for (const feature of existingFeatures.data || []) {
          await api.delete(`/subscriptions/admin/plans/${planId}/features/${feature._id}`);
        }
      }
      
      // Create new features
      const featuresToCreate = planFormData.features || [];
      for (let i = 0; i < featuresToCreate.length; i++) {
        await api.post(`/subscriptions/admin/plans/${planId}/features`, {
          title: featuresToCreate[i],
          isHighlighted: false,
          sortOrder: i
        });
      }
      
      setShowPlanModal(false);
      resetPlanForm();
      fetchPlans();
      
      // Refresh limits and pricing if plan is selected
      if (selectedPlan && selectedPlan._id === planId) {
        fetchPlanLimits(planId);
        fetchPlanPricing(planId);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save plan');
    }
  };

  const handleEditPlan = async (plan) => {
    setEditingPlan(plan);
    
    // Fetch limits, pricing, and features
    let maxProducts = '';
    let maxHotOffers = '';
    let monthlyPrice = '';
    let yearlyPrice = '';
    let features = [];
    
    try {
      const [limitsResponse, pricingResponse, featuresResponse] = await Promise.all([
        api.get(`/subscriptions/admin/plans/${plan._id}/limits`),
        api.get(`/subscriptions/admin/plans/${plan._id}/pricing`),
        api.get(`/subscriptions/admin/plans/${plan._id}/features`).catch(() => ({ data: [] }))
      ]);
      
      const limits = limitsResponse.data;
      const pricing = pricingResponse.data;
      const featuresData = featuresResponse.data || [];
      
      const maxProductsLimit = limits.find(l => l.limitKey === 'max_products');
      const maxHotOffersLimit = limits.find(l => l.limitKey === 'max_hot_offers');
      
      if (maxProductsLimit) {
        maxProducts = maxProductsLimit.limitValue === -1 ? '' : maxProductsLimit.limitValue;
      }
      if (maxHotOffersLimit) {
        maxHotOffers = maxHotOffersLimit.limitValue === -1 ? '' : maxHotOffersLimit.limitValue;
      }
      
      // Get monthly and yearly prices
      const monthlyPricing = pricing.find(p => p.billingCycle?.name === 'monthly');
      const yearlyPricing = pricing.find(p => p.billingCycle?.name === 'yearly');
      
      if (monthlyPricing) {
        monthlyPrice = monthlyPricing.price || '';
      }
      if (yearlyPricing) {
        yearlyPrice = yearlyPricing.price || '';
      }
      
      // Extract feature titles
      features = featuresData.map(f => f.title || '').filter(f => f);
    } catch (error) {
      console.error('Failed to fetch limits/pricing/features:', error);
    }
    
    setPlanFormData({
      displayName: plan.displayName || '',
      features: features,
      sortOrder: plan.sortOrder || 0,
      isActive: plan.isActive !== undefined ? plan.isActive : true,
      maxProducts: maxProducts,
      maxHotOffers: maxHotOffers,
      monthlyPrice: monthlyPrice,
      yearlyPrice: yearlyPrice
    });
    setNewFeature('');
    setShowPlanModal(true);
  };

  const handleDeletePlan = async (id) => {
    if (!window.confirm('Are you sure you want to delete this plan? This will also delete all associated features, limits, and pricing.')) {
      return;
    }
    try {
      await api.delete(`/subscriptions/admin/plans/${id}`);
      toast.success('Plan deleted successfully');
      fetchPlans();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete plan');
    }
  };

  const resetPlanForm = () => {
    setPlanFormData({
      displayName: '',
      features: [],
      sortOrder: 0,
      isActive: true,
      maxProducts: '',
      maxHotOffers: '',
      monthlyPrice: '',
      yearlyPrice: ''
    });
    setNewFeature('');
    setEditingPlan(null);
  };
  
  const handleAddFeature = () => {
    if (newFeature.trim() && !planFormData.features.includes(newFeature.trim())) {
      setPlanFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature('');
    }
  };
  
  const handleRemoveFeature = (index) => {
    setPlanFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  // Feature CRUD
  const handleFeatureSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlan) {
      toast.error('Please select a plan first');
      return;
    }
    try {
      const featureData = {
        ...featureFormData,
        sortOrder: parseInt(featureFormData.sortOrder) || 0
      };
      await api.post(`/subscriptions/admin/plans/${selectedPlan._id}/features`, featureData);
      toast.success('Feature added successfully');
      setShowFeatureModal(false);
      resetFeatureForm();
      fetchPlanFeatures(selectedPlan._id);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save feature');
    }
  };

  const handleEditFeature = (feature) => {
    setEditingFeature(feature);
    setFeatureFormData({
      title: feature.title || '',
      isHighlighted: feature.isHighlighted || false,
      sortOrder: feature.sortOrder || 0
    });
    setShowFeatureModal(true);
  };

  const handleFeatureUpdate = async (e) => {
    e.preventDefault();
    if (!selectedPlan || !editingFeature) {
      toast.error('Please select a plan and feature first');
      return;
    }
    try {
      const featureData = {
        ...featureFormData,
        sortOrder: parseInt(featureFormData.sortOrder) || 0
      };
      await api.put(`/subscriptions/admin/features/${editingFeature._id}`, featureData);
      toast.success('Feature updated successfully');
      setShowFeatureModal(false);
      resetFeatureForm();
      setEditingFeature(null);
      fetchPlanFeatures(selectedPlan._id);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update feature');
    }
  };

  const handleDeleteFeature = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feature?')) {
      return;
    }
    try {
      await api.delete(`/subscriptions/admin/features/${id}`);
      toast.success('Feature deleted successfully');
      fetchPlanFeatures(selectedPlan._id);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete feature');
    }
  };

  const resetFeatureForm = () => {
    setFeatureFormData({
      title: '',
      isHighlighted: false,
      sortOrder: 0
    });
    setEditingFeature(null);
  };

  // Limit CRUD
  const handleLimitSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlan) {
      toast.error('Please select a plan first');
      return;
    }
    try {
      let limitValue = limitFormData.limitValue;
      // Try to parse as number, if fails keep as string
      if (!isNaN(limitValue) && limitValue !== '') {
        limitValue = parseFloat(limitValue);
      }
      await api.post(`/subscriptions/admin/plans/${selectedPlan._id}/limits`, {
        limitKey: limitFormData.limitKey,
        limitValue: limitValue
      });
      toast.success('Limit set successfully');
      setShowLimitModal(false);
      resetLimitForm();
      fetchPlanLimits(selectedPlan._id);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save limit');
    }
  };

  const handleDeleteLimit = async (id) => {
    if (!window.confirm('Are you sure you want to delete this limit?')) {
      return;
    }
    try {
      await api.delete(`/subscriptions/admin/limits/${id}`);
      toast.success('Limit deleted successfully');
      fetchPlanLimits(selectedPlan._id);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete limit');
    }
  };

  const resetLimitForm = () => {
    setLimitFormData({
      limitKey: '',
      limitValue: ''
    });
  };

  // Pricing CRUD
  const handlePricingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlan) {
      toast.error('Please select a plan first');
      return;
    }
    try {
      await api.post(`/subscriptions/admin/plans/${selectedPlan._id}/pricing`, {
        billingCycleId: pricingFormData.billingCycleId,
        price: parseFloat(pricingFormData.price),
        currency: pricingFormData.currency,
        discount: parseFloat(pricingFormData.discount) || 0
      });
      toast.success('Pricing set successfully');
      setShowPricingModal(false);
      resetPricingForm();
      fetchPlanPricing(selectedPlan._id);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save pricing');
    }
  };

  const handleEditPricing = (pricing) => {
    setEditingPricing(pricing);
    setPricingFormData({
      billingCycleId: pricing.billingCycle?._id || pricing.billingCycle || '',
      price: pricing.price || 0,
      currency: pricing.currency || 'USD',
      discount: pricing.discount || 0
    });
    setShowPricingModal(true);
  };

  const handlePricingUpdate = async (e) => {
    e.preventDefault();
    if (!selectedPlan || !editingPricing) {
      toast.error('Please select a plan and pricing first');
      return;
    }
    try {
      await api.put(`/subscriptions/admin/pricing/${editingPricing._id}`, {
        price: parseFloat(pricingFormData.price),
        currency: pricingFormData.currency,
        discount: parseFloat(pricingFormData.discount) || 0
      });
      toast.success('Pricing updated successfully');
      setShowPricingModal(false);
      resetPricingForm();
      setEditingPricing(null);
      fetchPlanPricing(selectedPlan._id);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update pricing');
    }
  };

  const resetPricingForm = () => {
    setPricingFormData({
      billingCycleId: '',
      price: 0,
      currency: 'USD',
      discount: 0
    });
    setEditingPricing(null);
  };

  // Billing Cycle CRUD
  const handleBillingCycleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/billingcycles', billingCycleFormData);
      toast.success('Billing cycle created successfully');
      setShowBillingCycleModal(false);
      resetBillingCycleForm();
      fetchBillingCycles();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save billing cycle');
    }
  };

  const handleViewBillingCycleDetails = async (cycle) => {
    try {
      const response = await api.get(`/billingcycles/${cycle._id}`);
      setSelectedBillingCycle(response.data);
      setShowBillingCycleDetailsModal(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch billing cycle details');
    }
  };

  const handleDeleteBillingCycle = async (id) => {
    if (!window.confirm('Are you sure you want to delete this billing cycle? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/billingcycles/${id}`);
      toast.success('Billing cycle deleted successfully');
      fetchBillingCycles();
      if (selectedBillingCycle && selectedBillingCycle._id === id) {
        setShowBillingCycleDetailsModal(false);
        setSelectedBillingCycle(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete billing cycle');
    }
  };

  const handleToggleBillingCycle = async (cycle) => {
    try {
      await api.patch(`/billingcycles/${cycle._id}/toggle`);
      toast.success('Billing cycle status updated');
      fetchBillingCycles();
      // Update selected billing cycle if it's the one being toggled
      if (selectedBillingCycle && selectedBillingCycle._id === cycle._id) {
        const response = await api.get(`/billingcycles/${cycle._id}`);
        setSelectedBillingCycle(response.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update billing cycle status');
    }
  };

  const resetBillingCycleForm = () => {
    setBillingCycleFormData({
      name: 'monthly',
      displayName: '',
      durationInDays: 30,
      isActive: true
    });
  };

  // Shop Subscription
  const handleSubscriptionSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/subscriptions/admin/shop-subscriptions', subscriptionFormData);
      toast.success('Shop subscription set successfully');
      setShowSubscriptionModal(false);
      resetSubscriptionForm();
      fetchShopSubscriptions();
    } catch (error) {
      // Check if it's a conflict response (409)
      if (error.response?.status === 409 && error.response?.data?.conflict) {
        setConflictData(error.response.data);
        setShowConflictModal(true);
      } else {
        toast.error(error.response?.data?.message || 'Failed to save subscription');
      }
    }
  };

  const handleOverwriteSubscription = async () => {
    try {
      await api.post('/subscriptions/admin/shop-subscriptions', {
        ...subscriptionFormData,
        overwrite: true
      });
      toast.success('Shop subscription overwritten successfully');
      setShowSubscriptionModal(false);
      setShowConflictModal(false);
      setConflictData(null);
      resetSubscriptionForm();
      fetchShopSubscriptions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to overwrite subscription');
    }
  };

  const handleCancelOverwrite = () => {
    setShowConflictModal(false);
    setConflictData(null);
  };

  const resetSubscriptionForm = () => {
    setSubscriptionFormData({
      shopId: '',
      subscriptionPlanId: '',
      billingCycleId: '',
      startDate: ''
    });
  };

  if (loading) {
    return <div className="subscription-plans-page loading">Loading...</div>;
  }

  return (
    <div className="subscription-plans-page">
      <div className="page-header">
        <h1>Subscription Plans</h1>
        <p>Manage subscription plans, features, limits, and pricing</p>
      </div>

      <div className="tabs">
        <button
          className={activeTab === 'plans' ? 'active' : ''}
          onClick={() => setActiveTab('plans')}
        >
          <FiList /> Plans
        </button>
        <button
          className={activeTab === 'billing-cycles' ? 'active' : ''}
          onClick={() => setActiveTab('billing-cycles')}
        >
          <FiCalendar /> Billing Cycles
        </button>
        <button
          className={activeTab === 'subscriptions' ? 'active' : ''}
          onClick={() => setActiveTab('subscriptions')}
        >
          <FiShoppingBag /> Shop Subscriptions
        </button>
      </div>

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <div className="tab-content">
          <div className="content-header">
            <button className="btn-primary" onClick={() => { resetPlanForm(); setShowPlanModal(true); }}>
              <FiPlus /> Create Plan
            </button>
          </div>

          <div className="plans-grid">
            {plans.map(plan => (
              <div key={plan._id} className="plan-card">
                <div className="plan-card-header">
                  <h3>{plan.displayName}</h3>
                  <div className="plan-actions">
                    <button onClick={() => { setSelectedPlan(plan); }} className="btn-icon" title="Manage">
                      <FiSettings />
                    </button>
                    <button onClick={() => handleEditPlan(plan)} className="btn-icon" title="Edit">
                      <FiEdit />
                    </button>
                    <button onClick={() => handleDeletePlan(plan._id)} className="btn-icon btn-danger" title="Delete">
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
                {plan.features && plan.features.length > 0 ? (
                  <ul className="plan-features-list">
                    {plan.features.map((feature, idx) => (
                      <li key={idx}>{feature.title || feature}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="plan-description">No features added</p>
                )}
                <div className="plan-status">
                  {plan.isActive ? (
                    <span className="badge badge-success"><FiCheckCircle /> Active</span>
                  ) : (
                    <span className="badge badge-danger"><FiXCircle /> Inactive</span>
                  )}
                  <span className="plan-sort">Sort: {plan.sortOrder}</span>
                </div>
              </div>
            ))}
          </div>

          {selectedPlan && (
            <div className="plan-details">
              <div className="plan-details-header">
                <h2>Managing: {selectedPlan.displayName}</h2>
                <button onClick={() => setSelectedPlan(null)} className="btn-icon">
                  <FiX />
                </button>
              </div>

              <div className="plan-sections">
                {/* Features Section */}
                <div className="plan-section">
                  <div className="section-header">
                    <h3>Features</h3>
                    <button className="btn-primary btn-sm" onClick={() => { resetFeatureForm(); setShowFeatureModal(true); }}>
                      <FiPlus /> Add Feature
                    </button>
                  </div>
                  <div className="features-list">
                    {planFeatures.length === 0 ? (
                      <p className="empty-state">No features added yet</p>
                    ) : (
                      planFeatures.map(feature => (
                        <div key={feature._id} className="feature-item">
                          <div className="feature-content">
                            <span className={feature.isHighlighted ? 'highlighted' : ''}>{feature.title}</span>
                            <span className="feature-sort">Order: {feature.sortOrder}</span>
                          </div>
                          <div className="feature-actions">
                            <button onClick={() => handleEditFeature(feature)} className="btn-icon btn-sm" title="Edit">
                              <FiEdit />
                            </button>
                            <button onClick={() => handleDeleteFeature(feature._id)} className="btn-icon btn-sm btn-danger" title="Delete">
                              <FiTrash2 />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Limits Section */}
                <div className="plan-section">
                  <div className="section-header">
                    <h3>Limits</h3>
                    <button className="btn-primary btn-sm" onClick={() => { resetLimitForm(); setShowLimitModal(true); }}>
                      <FiPlus /> Add Limit
                    </button>
                  </div>
                  <div className="limits-list">
                    {planLimits.length === 0 ? (
                      <p className="empty-state">No limits set yet</p>
                    ) : (
                      planLimits.map(limit => (
                        <div key={limit._id} className="limit-item">
                          <div className="limit-content">
                            <strong>{limit.limitKey}</strong>
                            <span>{typeof limit.limitValue === 'number' ? limit.limitValue : limit.limitValue}</span>
                          </div>
                          <button onClick={() => handleDeleteLimit(limit._id)} className="btn-icon btn-sm btn-danger">
                            <FiTrash2 />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Pricing Section */}
                <div className="plan-section">
                  <div className="section-header">
                    <h3>Pricing</h3>
                    <button className="btn-primary btn-sm" onClick={() => { resetPricingForm(); setShowPricingModal(true); }}>
                      <FiPlus /> Add Pricing
                    </button>
                  </div>
                  <div className="pricing-list">
                    {planPricing.length === 0 ? (
                      <p className="empty-state">No pricing set yet</p>
                    ) : (
                      planPricing.map(pricing => (
                        <div key={pricing._id} className="pricing-item">
                          <div className="pricing-content">
                            <strong>{pricing.billingCycle?.displayName || pricing.billingCycle?.name}</strong>
                            <span>{pricing.currency} {pricing.price}</span>
                            {pricing.discount > 0 && <span className="discount">-{pricing.discount}%</span>}
                            {!pricing.isActive && <span className="badge badge-danger">Inactive</span>}
                          </div>
                          <div className="pricing-actions">
                            <button onClick={() => handleEditPricing(pricing)} className="btn-icon btn-sm" title="Edit">
                              <FiEdit />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Billing Cycles Tab */}
      {activeTab === 'billing-cycles' && (
        <div className="tab-content">
          <div className="content-header">
            <button className="btn-primary" onClick={() => { resetBillingCycleForm(); setShowBillingCycleModal(true); }}>
              <FiPlus /> Create Billing Cycle
            </button>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Display Name</th>
                  <th>Duration (Days)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {billingCycles.map(cycle => (
                  <tr key={cycle._id}>
                    <td>{cycle.name}</td>
                    <td>{cycle.displayName}</td>
                    <td>{cycle.durationInDays}</td>
                    <td>
                      {cycle.isActive ? (
                        <span className="badge badge-success">Active</span>
                      ) : (
                        <span className="badge badge-danger">Inactive</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button 
                          onClick={() => handleViewBillingCycleDetails(cycle)} 
                          className="btn-icon btn-sm" 
                          title="View Details"
                        >
                          <FiEye />
                        </button>
                        <button 
                          onClick={() => handleToggleBillingCycle(cycle)} 
                          className="btn-icon btn-sm"
                          title={cycle.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {cycle.isActive ? <FiXCircle /> : <FiCheckCircle />}
                        </button>
                        <button 
                          onClick={() => handleDeleteBillingCycle(cycle._id)} 
                          className="btn-icon btn-sm btn-danger"
                          title="Delete"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Shop Subscriptions Tab */}
      {activeTab === 'subscriptions' && (
        <div className="tab-content">
          <div className="content-header">
            <button className="btn-primary" onClick={() => { resetSubscriptionForm(); setShowSubscriptionModal(true); }}>
              <FiPlus /> Assign Subscription
            </button>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Shop</th>
                  <th>Plan</th>
                  <th>Billing Cycle</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {shopSubscriptions.map(sub => (
                  <tr key={sub._id}>
                    <td>{sub.shop?.name || 'N/A'}</td>
                    <td>{sub.subscriptionPlan?.displayName || 'N/A'}</td>
                    <td>{sub.billingCycle?.displayName || sub.billingCycle?.name || 'N/A'}</td>
                    <td>{new Date(sub.startDate).toLocaleDateString()}</td>
                    <td>{new Date(sub.endDate).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge badge-${sub.status === 'active' ? 'success' : 'danger'}`}>
                        {sub.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Plan Modal */}
      {showPlanModal && (
        <div className="modal-overlay" onClick={() => { setShowPlanModal(false); resetPlanForm(); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingPlan ? 'Edit Plan' : 'Create Plan'}</h2>
              <button onClick={() => { setShowPlanModal(false); resetPlanForm(); }} className="btn-icon">
                <FiX />
              </button>
            </div>
            <form onSubmit={handlePlanSubmit}>
              <div className="form-group">
                <label>Display Name *</label>
                <input
                  type="text"
                  value={planFormData.displayName}
                  onChange={(e) => setPlanFormData({ ...planFormData, displayName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Features</label>
                <div className="product-types-input">
                  <input
                    type="text"
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                    placeholder="Enter feature (e.g., Unlimited products, Priority support)"
                  />
                  <button
                    type="button"
                    className="btn-add-type"
                    onClick={handleAddFeature}
                  >
                    <FiPlus /> Add
                  </button>
                </div>
                {planFormData.features && planFormData.features.length > 0 && (
                  <div className="product-types-list">
                    {planFormData.features.map((feature, index) => (
                      <span key={index} className="product-type-tag">
                        {feature}
                        <button
                          type="button"
                          className="btn-remove-type"
                          onClick={() => handleRemoveFeature(index)}
                        >
                          <FiX />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <small className="form-hint">Add features that will be displayed as bullet points in the frontend</small>
              </div>
              <div className="form-group">
                <label>Sort Order</label>
                <input
                  type="number"
                  value={planFormData.sortOrder}
                  onChange={(e) => setPlanFormData({ ...planFormData, sortOrder: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={planFormData.isActive}
                    onChange={(e) => setPlanFormData({ ...planFormData, isActive: e.target.checked })}
                  />
                  Active
                </label>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Monthly Price</label>
                  <input
                    type="number"
                    value={planFormData.monthlyPrice}
                    onChange={(e) => setPlanFormData({ ...planFormData, monthlyPrice: e.target.value })}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                  <small className="form-hint">Price for monthly billing cycle</small>
                </div>
                <div className="form-group">
                  <label>Yearly Price</label>
                  <input
                    type="number"
                    value={planFormData.yearlyPrice}
                    onChange={(e) => setPlanFormData({ ...planFormData, yearlyPrice: e.target.value })}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                  <small className="form-hint">Price for yearly billing cycle</small>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Max Products</label>
                  <input
                    type="number"
                    value={planFormData.maxProducts}
                    onChange={(e) => setPlanFormData({ ...planFormData, maxProducts: e.target.value })}
                    placeholder="Leave empty for unlimited"
                    min="0"
                  />
                  <small className="form-hint">Maximum number of products allowed. Leave empty for unlimited (-1).</small>
                </div>
                <div className="form-group">
                  <label>Max Hot Offers</label>
                  <input
                    type="number"
                    value={planFormData.maxHotOffers}
                    onChange={(e) => setPlanFormData({ ...planFormData, maxHotOffers: e.target.value })}
                    placeholder="Leave empty for unlimited"
                    min="0"
                  />
                  <small className="form-hint">Maximum number of hot offers allowed. Leave empty for unlimited (-1).</small>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => { setShowPlanModal(false); resetPlanForm(); }} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feature Modal */}
      {showFeatureModal && (
        <div className="modal-overlay" onClick={() => { setShowFeatureModal(false); resetFeatureForm(); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingFeature ? 'Edit Feature' : 'Add Feature'}</h2>
              <button onClick={() => { setShowFeatureModal(false); resetFeatureForm(); }} className="btn-icon">
                <FiX />
              </button>
            </div>
            <form onSubmit={editingFeature ? handleFeatureUpdate : handleFeatureSubmit}>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={featureFormData.title}
                  onChange={(e) => setFeatureFormData({ ...featureFormData, title: e.target.value })}
                  placeholder="e.g., Up to 50 products"
                  required
                />
              </div>
              <div className="form-group">
                <label>Sort Order</label>
                <input
                  type="number"
                  value={featureFormData.sortOrder}
                  onChange={(e) => setFeatureFormData({ ...featureFormData, sortOrder: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={featureFormData.isHighlighted}
                    onChange={(e) => setFeatureFormData({ ...featureFormData, isHighlighted: e.target.checked })}
                  />
                  Highlighted
                </label>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => { setShowFeatureModal(false); resetFeatureForm(); }} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Limit Modal */}
      {showLimitModal && (
        <div className="modal-overlay" onClick={() => { setShowLimitModal(false); resetLimitForm(); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Limit</h2>
              <button onClick={() => { setShowLimitModal(false); resetLimitForm(); }} className="btn-icon">
                <FiX />
              </button>
            </div>
            <form onSubmit={handleLimitSubmit}>
              <div className="form-group">
                <label>Limit Key *</label>
                <input
                  type="text"
                  value={limitFormData.limitKey}
                  onChange={(e) => setLimitFormData({ ...limitFormData, limitKey: e.target.value })}
                  placeholder="e.g., MAX_PRODUCTS"
                  required
                />
              </div>
              <div className="form-group">
                <label>Limit Value *</label>
                <input
                  type="text"
                  value={limitFormData.limitValue}
                  onChange={(e) => setLimitFormData({ ...limitFormData, limitValue: e.target.value })}
                  placeholder="e.g., 50 or -1 for unlimited"
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => { setShowLimitModal(false); resetLimitForm(); }} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pricing Modal */}
      {showPricingModal && (
        <div className="modal-overlay" onClick={() => { setShowPricingModal(false); resetPricingForm(); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingPricing ? 'Edit Pricing' : 'Add Pricing'}</h2>
              <button onClick={() => { setShowPricingModal(false); resetPricingForm(); }} className="btn-icon">
                <FiX />
              </button>
            </div>
            <form onSubmit={editingPricing ? handlePricingUpdate : handlePricingSubmit}>
              <div className="form-group">
                <label>Billing Cycle *</label>
                <select
                  value={pricingFormData.billingCycleId}
                  onChange={(e) => setPricingFormData({ ...pricingFormData, billingCycleId: e.target.value })}
                  required
                  disabled={!!editingPricing}
                >
                  <option value="">Select billing cycle</option>
                  {billingCycles.map(cycle => (
                    <option key={cycle._id} value={cycle._id}>{cycle.displayName}</option>
                  ))}
                </select>
                {editingPricing && <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>Billing cycle cannot be changed</small>}
              </div>
              <div className="form-group">
                <label>Price *</label>
                <input
                  type="number"
                  step="0.01"
                  value={pricingFormData.price}
                  onChange={(e) => setPricingFormData({ ...pricingFormData, price: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Currency</label>
                <input
                  type="text"
                  value={pricingFormData.currency}
                  onChange={(e) => setPricingFormData({ ...pricingFormData, currency: e.target.value.toUpperCase() })}
                  maxLength="3"
                />
              </div>
              <div className="form-group">
                <label>Discount (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={pricingFormData.discount}
                  onChange={(e) => setPricingFormData({ ...pricingFormData, discount: e.target.value })}
                />
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => { setShowPricingModal(false); resetPricingForm(); }} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Billing Cycle Modal */}
      {showBillingCycleModal && (
        <div className="modal-overlay" onClick={() => { setShowBillingCycleModal(false); resetBillingCycleForm(); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Billing Cycle</h2>
              <button onClick={() => { setShowBillingCycleModal(false); resetBillingCycleForm(); }} className="btn-icon">
                <FiX />
              </button>
            </div>
            <form onSubmit={handleBillingCycleSubmit}>
              <div className="form-group">
                <label>Name *</label>
                <select
                  value={billingCycleFormData.name}
                  onChange={(e) => setBillingCycleFormData({ ...billingCycleFormData, name: e.target.value })}
                  required
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div className="form-group">
                <label>Display Name *</label>
                <input
                  type="text"
                  value={billingCycleFormData.displayName}
                  onChange={(e) => setBillingCycleFormData({ ...billingCycleFormData, displayName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Duration (Days) *</label>
                <input
                  type="number"
                  value={billingCycleFormData.durationInDays}
                  onChange={(e) => setBillingCycleFormData({ ...billingCycleFormData, durationInDays: parseInt(e.target.value) || 30 })}
                  required
                />
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={billingCycleFormData.isActive}
                    onChange={(e) => setBillingCycleFormData({ ...billingCycleFormData, isActive: e.target.checked })}
                  />
                  Active
                </label>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => { setShowBillingCycleModal(false); resetBillingCycleForm(); }} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Billing Cycle Details Modal */}
      {showBillingCycleDetailsModal && selectedBillingCycle && (
        <div className="modal-overlay" onClick={() => { setShowBillingCycleDetailsModal(false); setSelectedBillingCycle(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Billing Cycle Details</h2>
              <button onClick={() => { setShowBillingCycleDetailsModal(false); setSelectedBillingCycle(null); }} className="btn-icon">
                <FiX />
              </button>
            </div>
            <div className="details-content">
              <div className="detail-row">
                <label>Name:</label>
                <span>{selectedBillingCycle.name}</span>
              </div>
              <div className="detail-row">
                <label>Display Name:</label>
                <span>{selectedBillingCycle.displayName}</span>
              </div>
              <div className="detail-row">
                <label>Duration (Days):</label>
                <span>{selectedBillingCycle.durationInDays}</span>
              </div>
              <div className="detail-row">
                <label>Status:</label>
                <span>
                  {selectedBillingCycle.isActive ? (
                    <span className="badge badge-success">Active</span>
                  ) : (
                    <span className="badge badge-danger">Inactive</span>
                  )}
                </span>
              </div>
              {selectedBillingCycle.createdAt && (
                <div className="detail-row">
                  <label>Created At:</label>
                  <span>{new Date(selectedBillingCycle.createdAt).toLocaleString()}</span>
                </div>
              )}
              {selectedBillingCycle.updatedAt && (
                <div className="detail-row">
                  <label>Updated At:</label>
                  <span>{new Date(selectedBillingCycle.updatedAt).toLocaleString()}</span>
                </div>
              )}
              {selectedBillingCycle.createdBy && (
                <div className="detail-row">
                  <label>Created By:</label>
                  <span>{selectedBillingCycle.createdBy?.email || 'N/A'}</span>
                </div>
              )}
              {selectedBillingCycle.updatedBy && (
                <div className="detail-row">
                  <label>Updated By:</label>
                  <span>{selectedBillingCycle.updatedBy?.email || 'N/A'}</span>
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => handleToggleBillingCycle(selectedBillingCycle)}
                className="btn-secondary"
                title={selectedBillingCycle.isActive ? 'Deactivate' : 'Activate'}
              >
                {selectedBillingCycle.isActive ? (
                  <>
                    <FiXCircle /> Deactivate
                  </>
                ) : (
                  <>
                    <FiCheckCircle /> Activate
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDeleteBillingCycle(selectedBillingCycle._id);
                }}
                className="btn-danger"
              >
                <FiTrash2 /> Delete
              </button>
              <button
                type="button"
                onClick={() => { setShowBillingCycleDetailsModal(false); setSelectedBillingCycle(null); }}
                className="btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Modal */}
      {showSubscriptionModal && (
        <div className="modal-overlay" onClick={() => { setShowSubscriptionModal(false); resetSubscriptionForm(); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Assign Subscription</h2>
              <button onClick={() => { setShowSubscriptionModal(false); resetSubscriptionForm(); }} className="btn-icon">
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSubscriptionSubmit}>
              <div className="form-group">
                <label>Shop *</label>
                <select
                  value={subscriptionFormData.shopId}
                  onChange={(e) => setSubscriptionFormData({ ...subscriptionFormData, shopId: e.target.value })}
                  required
                >
                  <option value="">Select shop</option>
                  {shops.map(shop => (
                    <option key={shop._id} value={shop._id}>{shop.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Subscription Plan *</label>
                <select
                  value={subscriptionFormData.subscriptionPlanId}
                  onChange={(e) => setSubscriptionFormData({ ...subscriptionFormData, subscriptionPlanId: e.target.value })}
                  required
                >
                  <option value="">Select plan</option>
                  {plans.filter(p => p.isActive).map(plan => (
                    <option key={plan._id} value={plan._id}>{plan.displayName}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Billing Cycle *</label>
                <select
                  value={subscriptionFormData.billingCycleId}
                  onChange={(e) => setSubscriptionFormData({ ...subscriptionFormData, billingCycleId: e.target.value })}
                  required
                >
                  <option value="">Select billing cycle</option>
                  {billingCycles.filter(bc => bc.isActive).map(cycle => (
                    <option key={cycle._id} value={cycle._id}>{cycle.displayName}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={subscriptionFormData.startDate}
                  onChange={(e) => setSubscriptionFormData({ ...subscriptionFormData, startDate: e.target.value })}
                />
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => { setShowSubscriptionModal(false); resetSubscriptionForm(); }} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">Assign</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Conflict Confirmation Modal */}
      {showConflictModal && conflictData && (
        <div className="modal-overlay" onClick={handleCancelOverwrite}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Subscription Conflict Detected</h2>
              <button onClick={handleCancelOverwrite} className="btn-icon">
                <FiX />
              </button>
            </div>
            <div className="conflict-message">
              <p>{conflictData.message}</p>
              
              <div className="conflict-details">
                <div className="conflict-section">
                  <h3>Current Active Subscription</h3>
                  <div className="detail-item">
                    <strong>Plan:</strong> {conflictData.existingSubscription.subscriptionPlan.displayName}
                  </div>
                  <div className="detail-item">
                    <strong>Billing Cycle:</strong> {conflictData.existingSubscription.billingCycle.displayName}
                  </div>
                  <div className="detail-item">
                    <strong>Start Date:</strong> {new Date(conflictData.existingSubscription.startDate).toLocaleDateString()}
                  </div>
                  <div className="detail-item">
                    <strong>End Date:</strong> {new Date(conflictData.existingSubscription.endDate).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="conflict-section">
                  <h3>New Subscription</h3>
                  <div className="detail-item">
                    <strong>Plan:</strong> {conflictData.newSubscription.subscriptionPlan.displayName}
                  </div>
                  <div className="detail-item">
                    <strong>Billing Cycle:</strong> {conflictData.newSubscription.billingCycle.displayName}
                  </div>
                  <div className="detail-item">
                    <strong>Start Date:</strong> {new Date(conflictData.newSubscription.startDate).toLocaleDateString()}
                  </div>
                  <div className="detail-item">
                    <strong>End Date:</strong> {new Date(conflictData.newSubscription.endDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="conflict-warning">
                <strong>Warning:</strong> Overwriting will replace the current active subscription with the new one.
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={handleCancelOverwrite}>
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={handleOverwriteSubscription}>
                Overwrite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPlans;

