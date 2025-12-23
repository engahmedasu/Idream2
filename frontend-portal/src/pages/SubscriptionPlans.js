import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCheck, FiX } from 'react-icons/fi';
import api from '../utils/api';
import { toast } from 'react-toastify';
import './SubscriptionPlans.css';

const SubscriptionPlans = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [billingCycles, setBillingCycles] = useState([]);
  const [selectedCycle, setSelectedCycle] = useState('monthly'); // default to monthly
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await api.get('/subscriptions/plans');
      setPlans(response.data.plans || []);
      setBillingCycles(response.data.billingCycles || []);
      
      // Set default cycle to monthly if available
      if (response.data.billingCycles && response.data.billingCycles.length > 0) {
        const monthlyCycle = response.data.billingCycles.find(bc => bc.name === 'monthly');
        if (monthlyCycle) {
          setSelectedCycle('monthly');
        } else {
          setSelectedCycle(response.data.billingCycles[0].name);
        }
      }
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      toast.error('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderNow = (planId) => {
    // Navigate to Enterprise Portal registration with selected plan
    navigate('/enterprise-portal', { 
      state: { 
        subscriptionPlanId: planId, 
        billingCycle: selectedCycle,
        tab: 'register'
      } 
    });
  };

  const getPlanColor = (index) => {
    const colors = [
      { 
        primary: '#00D9FF', 
        gradient: ['#00D9FF', '#0099CC'],
        glow: 'rgba(0, 217, 255, 0.4)',
        cardBorder: 'rgba(0, 217, 255, 0.3)'
      }, // Cyan/Blue Tech
      { 
        primary: '#9333EA', 
        gradient: ['#9333EA', '#7C3AED'],
        glow: 'rgba(147, 51, 234, 0.4)',
        cardBorder: 'rgba(147, 51, 234, 0.3)'
      }, // Electric Purple
      { 
        primary: '#F59E0B', 
        gradient: ['#F59E0B', '#D97706'],
        glow: 'rgba(245, 158, 11, 0.4)',
        cardBorder: 'rgba(245, 158, 11, 0.3)'
      }  // Neon Amber
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="subscription-plans-page">
        <div className="loading-state">Loading subscription plans...</div>
      </div>
    );
  }

  return (
    <div className="subscription-plans-page">
      <div className="plans-header">
        <h1>Choose Your Plan</h1>
        <p>Select the perfect subscription plan for your business</p>
        
        {billingCycles.length > 1 && (
          <div className="billing-cycle-toggle">
            {billingCycles.map(cycle => (
              <button
                key={cycle._id}
                className={`cycle-btn ${selectedCycle === cycle.name ? 'active' : ''}`}
                onClick={() => setSelectedCycle(cycle.name)}
              >
                {cycle.displayName}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="plans-container">
        {plans.length === 0 ? (
          <div className="no-plans">No subscription plans available at the moment.</div>
        ) : (
          plans.map((plan, index) => {
            const colorScheme = getPlanColor(index);
            const pricing = plan.pricing?.[selectedCycle];
            const price = pricing?.price || 0;
            const currency = 'EGP';
            const discount = pricing?.discount || 0;

            return (
              <div 
                key={plan._id} 
                className="plan-card"
                style={{
                  '--plan-primary': colorScheme.primary,
                  '--plan-primary-light': colorScheme.gradient[0],
                  '--card-gradient-start': colorScheme.gradient[0],
                  '--card-gradient-end': colorScheme.gradient[1],
                  '--card-glow': colorScheme.glow,
                  '--card-border': colorScheme.cardBorder,
                  '--ribbon-start': colorScheme.gradient[0],
                  '--ribbon-end': colorScheme.gradient[1],
                  '--button-start': colorScheme.gradient[0],
                  '--button-end': colorScheme.gradient[1],
                  '--button-glow': colorScheme.glow
                }}
              >
                <div className="plan-card-header">
                  <h2 className="plan-title">
                    {plan.displayName.toUpperCase()}
                  </h2>
                  <p className="plan-period">PER {selectedCycle === 'monthly' ? 'MONTH' : 'YEAR'}</p>
                </div>
                
                <div className="price-ribbon">
                  <div className="price-ribbon-tail"></div>
                  <span className="currency">{currency === 'EGP' ? 'EGP' : currency}</span>
                  <span className="price">{discount > 0 ? Math.round(price * (1 - discount / 100)) : price}</span>
                  {discount > 0 && (
                    <span className="original-price">{price}</span>
                  )}
                </div>

                <div className="features-list">
                  {plan.features && plan.features.length > 0 ? (
                    plan.features.map((feature, idx) => (
                      <div key={idx} className="feature-item included">
                        <FiCheck className="feature-icon check" />
                        <span>{feature.title || feature}</span>
                      </div>
                    ))
                  ) : (
                    <div className="no-features">No features available</div>
                  )}
                </div>

                {plan.limits && (
                  <div className="plan-limits">
                    {plan.limits.max_products !== undefined && plan.limits.max_products !== -1 && (
                      <div className="limit-item">
                        <strong>Max Products:</strong> {plan.limits.max_products}
                      </div>
                    )}
                    {plan.limits.max_hot_offers !== undefined && plan.limits.max_hot_offers !== -1 && (
                      <div className="limit-item">
                        <strong>Max Hot Offers:</strong> {plan.limits.max_hot_offers}
                      </div>
                    )}
                  </div>
                )}

                <button
                  className="order-button"
                  onClick={() => handleOrderNow(plan._id)}
                >
                  ORDER NOW &gt;
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SubscriptionPlans;

