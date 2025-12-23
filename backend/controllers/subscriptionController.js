const SubscriptionPlan = require('../models/SubscriptionPlan');
const SubscriptionPlanFeature = require('../models/SubscriptionPlanFeature');
const SubscriptionPlanLimit = require('../models/SubscriptionPlanLimit');
const BillingCycle = require('../models/BillingCycle');
const SubscriptionPricing = require('../models/SubscriptionPricing');
const ShopSubscription = require('../models/ShopSubscription');
const SubscriptionUsage = require('../models/SubscriptionUsage');
const SubscriptionLog = require('../models/SubscriptionLog');
const Shop = require('../models/Shop');

// Public: Get all active plans with features, limits, and pricing
exports.getPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find({ isActive: true })
      .sort({ sortOrder: 1 })
      .lean();

    const billingCycles = await BillingCycle.find({ isActive: true })
      .sort({ durationInDays: 1 })
      .lean();

    const plansWithData = await Promise.all(
      plans.map(async (plan) => {
        const [features, limits, pricing] = await Promise.all([
          SubscriptionPlanFeature.find({ subscriptionPlan: plan._id })
            .sort({ sortOrder: 1 })
            .select('title isHighlighted sortOrder')
            .lean(),
          SubscriptionPlanLimit.find({ subscriptionPlan: plan._id })
            .select('limitKey limitValue')
            .lean(),
          SubscriptionPricing.find({ subscriptionPlan: plan._id, isActive: true })
            .populate('billingCycle', 'name displayName durationInDays')
            .select('billingCycle price currency discount')
            .lean()
        ]);

        const pricingByCycle = {};
        pricing.forEach((p) => {
          const cycleName = p.billingCycle.name;
          pricingByCycle[cycleName] = {
            price: p.price,
            currency: p.currency,
            discount: p.discount,
            billingCycle: p.billingCycle
          };
        });

        const limitsMap = {};
        limits.forEach((limit) => {
          limitsMap[limit.limitKey] = limit.limitValue;
        });

        return {
          _id: plan._id,
          displayName: plan.displayName,
          description: plan.description,
          features: features.map((f) => ({
            title: f.title,
            isHighlighted: f.isHighlighted
          })),
          limits: limitsMap,
          pricing: pricingByCycle,
          billingCycles: billingCycles.map((bc) => ({
            _id: bc._id,
            name: bc.name,
            displayName: bc.displayName,
            durationInDays: bc.durationInDays
          }))
        };
      })
    );

    res.json({
      plans: plansWithData,
      billingCycles: billingCycles
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Get all plans (including inactive)
exports.getAllPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find()
      .sort({ sortOrder: 1 })
      .populate('createdBy', 'email')
      .populate('updatedBy', 'email');

    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Create plan
exports.createPlan = async (req, res) => {
  try {
    const { displayName, description, sortOrder } = req.body;

    if (!displayName) {
      return res.status(400).json({ message: 'Display name is required' });
    }

    const plan = new SubscriptionPlan({
      displayName,
      description: description || '',
      sortOrder: sortOrder || 0,
      createdBy: req.user._id,
      updatedBy: req.user._id
    });

    await plan.save();
    res.status(201).json(plan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Update plan
exports.updatePlan = async (req, res) => {
  try {
    const { displayName, description, isActive, sortOrder } = req.body;

    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    if (displayName) plan.displayName = displayName;
    if (description !== undefined) plan.description = description;
    if (isActive !== undefined) plan.isActive = isActive;
    if (sortOrder !== undefined) plan.sortOrder = sortOrder;
    plan.updatedBy = req.user._id;

    await plan.save();
    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Delete plan
exports.deletePlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    // Check if plan is used by any shop
    const activeSubscriptions = await ShopSubscription.countDocuments({
      subscriptionPlan: plan._id,
      status: 'active'
    });

    if (activeSubscriptions > 0) {
      return res.status(400).json({
        message: 'Cannot delete plan with active subscriptions. Deactivate it instead.'
      });
    }

    // Delete related features, limits, and pricing
    await Promise.all([
      SubscriptionPlanFeature.deleteMany({ subscriptionPlan: plan._id }),
      SubscriptionPlanLimit.deleteMany({ subscriptionPlan: plan._id }),
      SubscriptionPricing.deleteMany({ subscriptionPlan: plan._id })
    ]);

    await SubscriptionPlan.findByIdAndDelete(req.params.id);
    res.json({ message: 'Plan deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Get plan features
exports.getPlanFeatures = async (req, res) => {
  try {
    const features = await SubscriptionPlanFeature.find({
      subscriptionPlan: req.params.planId
    })
      .sort({ sortOrder: 1 })
      .populate('createdBy', 'email')
      .populate('updatedBy', 'email');

    res.json(features);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Add plan feature
exports.addPlanFeature = async (req, res) => {
  try {
    const { title, isHighlighted, sortOrder } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const plan = await SubscriptionPlan.findById(req.params.planId);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    const feature = new SubscriptionPlanFeature({
      subscriptionPlan: req.params.planId,
      title,
      isHighlighted: isHighlighted || false,
      sortOrder: sortOrder || 0,
      createdBy: req.user._id,
      updatedBy: req.user._id
    });

    await feature.save();
    res.status(201).json(feature);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Update plan feature
exports.updatePlanFeature = async (req, res) => {
  try {
    const { title, isHighlighted, sortOrder } = req.body;

    const feature = await SubscriptionPlanFeature.findById(req.params.featureId);
    if (!feature) {
      return res.status(404).json({ message: 'Feature not found' });
    }

    if (title) feature.title = title;
    if (isHighlighted !== undefined) feature.isHighlighted = isHighlighted;
    if (sortOrder !== undefined) feature.sortOrder = sortOrder;
    feature.updatedBy = req.user._id;

    await feature.save();
    res.json(feature);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Delete plan feature
exports.deletePlanFeature = async (req, res) => {
  try {
    const feature = await SubscriptionPlanFeature.findById(req.params.featureId);
    if (!feature) {
      return res.status(404).json({ message: 'Feature not found' });
    }

    await SubscriptionPlanFeature.findByIdAndDelete(req.params.featureId);
    res.json({ message: 'Feature deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Get plan limits
exports.getPlanLimits = async (req, res) => {
  try {
    const limits = await SubscriptionPlanLimit.find({
      subscriptionPlan: req.params.planId
    })
      .populate('createdBy', 'email')
      .populate('updatedBy', 'email');

    res.json(limits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Set plan limit
exports.setPlanLimit = async (req, res) => {
  try {
    const { limitKey, limitValue } = req.body;

    if (!limitKey || limitValue === undefined) {
      return res.status(400).json({ message: 'limitKey and limitValue are required' });
    }

    const plan = await SubscriptionPlan.findById(req.params.planId);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    const limit = await SubscriptionPlanLimit.findOneAndUpdate(
      { subscriptionPlan: req.params.planId, limitKey },
      {
        limitValue,
        updatedBy: req.user._id,
        $setOnInsert: { createdBy: req.user._id }
      },
      { upsert: true, new: true }
    );

    res.json(limit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Delete plan limit
exports.deletePlanLimit = async (req, res) => {
  try {
    const limit = await SubscriptionPlanLimit.findById(req.params.limitId);
    if (!limit) {
      return res.status(404).json({ message: 'Limit not found' });
    }

    await SubscriptionPlanLimit.findByIdAndDelete(req.params.limitId);
    res.json({ message: 'Limit deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Get billing cycles
exports.getBillingCycles = async (req, res) => {
  try {
    const cycles = await BillingCycle.find().sort({ durationInDays: 1 });
    res.json(cycles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Create billing cycle
exports.createBillingCycle = async (req, res) => {
  try {
    const { name, displayName, durationInDays } = req.body;

    if (!name || !displayName || !durationInDays) {
      return res.status(400).json({
        message: 'name, displayName, and durationInDays are required'
      });
    }

    if (!['monthly', 'yearly'].includes(name.toLowerCase())) {
      return res.status(400).json({
        message: 'name must be either "monthly" or "yearly"'
      });
    }

    const cycle = new BillingCycle({
      name: name.toLowerCase(),
      displayName,
      durationInDays,
      createdBy: req.user._id,
      updatedBy: req.user._id
    });

    await cycle.save();
    res.status(201).json(cycle);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Billing cycle with this name already exists' });
    }
    res.status(500).json({ message: error.message });
  }
};

// Admin: Update billing cycle
exports.updateBillingCycle = async (req, res) => {
  try {
    const { displayName, durationInDays, isActive } = req.body;

    const cycle = await BillingCycle.findById(req.params.id);
    if (!cycle) {
      return res.status(404).json({ message: 'Billing cycle not found' });
    }

    if (displayName) cycle.displayName = displayName;
    if (durationInDays !== undefined) cycle.durationInDays = durationInDays;
    if (isActive !== undefined) cycle.isActive = isActive;
    cycle.updatedBy = req.user._id;

    await cycle.save();
    res.json(cycle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Get plan pricing
exports.getPlanPricing = async (req, res) => {
  try {
    const pricing = await SubscriptionPricing.find({
      subscriptionPlan: req.params.planId
    })
      .populate('billingCycle', 'name displayName durationInDays')
      .populate('createdBy', 'email')
      .populate('updatedBy', 'email');

    res.json(pricing);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Set plan pricing
exports.setPlanPricing = async (req, res) => {
  try {
    const { billingCycleId, price, currency, discount } = req.body;

    if (!billingCycleId || price === undefined) {
      return res.status(400).json({
        message: 'billingCycleId and price are required'
      });
    }

    const plan = await SubscriptionPlan.findById(req.params.planId);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    const billingCycle = await BillingCycle.findById(billingCycleId);
    if (!billingCycle) {
      return res.status(404).json({ message: 'Billing cycle not found' });
    }

    const pricing = await SubscriptionPricing.findOneAndUpdate(
      { subscriptionPlan: req.params.planId, billingCycle: billingCycleId },
      {
        price,
        currency: currency || 'USD',
        discount: discount || 0,
        updatedBy: req.user._id,
        $setOnInsert: { createdBy: req.user._id, isActive: true }
      },
      { upsert: true, new: true }
    )
      .populate('billingCycle', 'name displayName durationInDays');

    res.json(pricing);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'Pricing for this plan and billing cycle combination already exists'
      });
    }
    res.status(500).json({ message: error.message });
  }
};

// Admin: Update plan pricing
exports.updatePlanPricing = async (req, res) => {
  try {
    const { price, currency, discount, isActive } = req.body;

    const pricing = await SubscriptionPricing.findById(req.params.pricingId);
    if (!pricing) {
      return res.status(404).json({ message: 'Pricing not found' });
    }

    if (price !== undefined) pricing.price = price;
    if (currency) pricing.currency = currency;
    if (discount !== undefined) pricing.discount = discount;
    if (isActive !== undefined) pricing.isActive = isActive;
    pricing.updatedBy = req.user._id;

    await pricing.save();
    res.json(pricing);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Get shop subscriptions
exports.getShopSubscriptions = async (req, res) => {
  try {
    const subscriptions = await ShopSubscription.find()
      .populate('shop', 'name email')
      .populate('subscriptionPlan', 'displayName')
      .populate('billingCycle', 'name displayName')
      .populate('scheduledDowngrade.subscriptionPlan', 'displayName')
      .populate('scheduledDowngrade.billingCycle', 'name displayName')
      .sort({ createdAt: -1 });

    res.json(subscriptions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Create/Update shop subscription
exports.setShopSubscription = async (req, res) => {
  try {
    const { shopId, subscriptionPlanId, billingCycleId, startDate, overwrite } = req.body;

    if (!shopId || !subscriptionPlanId || !billingCycleId) {
      return res.status(400).json({
        message: 'shopId, subscriptionPlanId, and billingCycleId are required'
      });
    }

    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    const plan = await SubscriptionPlan.findById(subscriptionPlanId);
    if (!plan) {
      return res.status(404).json({ message: 'Subscription plan not found' });
    }

    const billingCycle = await BillingCycle.findById(billingCycleId);
    if (!billingCycle) {
      return res.status(404).json({ message: 'Billing cycle not found' });
    }

    // Get previous/current subscription if it exists
    const previousSubscription = await ShopSubscription.findOne({ shop: shopId })
      .populate('subscriptionPlan', 'displayName')
      .populate('billingCycle', 'name displayName');

    const start = startDate ? new Date(startDate) : new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + billingCycle.durationInDays);

    // Check if new start date overlaps with active subscription
    if (previousSubscription && previousSubscription.status === 'active' && !overwrite) {
      const currentStart = new Date(previousSubscription.startDate);
      const currentEnd = new Date(previousSubscription.endDate);
      
      // Check if new start date falls within current subscription period
      if (start >= currentStart && start <= currentEnd) {
        return res.status(409).json({
          conflict: true,
          message: 'The start date overlaps with an existing active subscription plan',
          existingSubscription: {
            _id: previousSubscription._id,
            subscriptionPlan: {
              _id: previousSubscription.subscriptionPlan._id,
              displayName: previousSubscription.subscriptionPlan.displayName
            },
            billingCycle: {
              _id: previousSubscription.billingCycle._id,
              displayName: previousSubscription.billingCycle.displayName
            },
            startDate: previousSubscription.startDate,
            endDate: previousSubscription.endDate,
            status: previousSubscription.status
          },
          newSubscription: {
            subscriptionPlan: {
              _id: plan._id,
              displayName: plan.displayName
            },
            billingCycle: {
              _id: billingCycle._id,
              displayName: billingCycle.displayName
            },
            startDate: start,
            endDate: end
          }
        });
      }
    }

    const isNew = !previousSubscription;
    const action = isNew ? 'created' : 'updated';

    const subscription = await ShopSubscription.findOneAndUpdate(
      { shop: shopId },
      {
        subscriptionPlan: subscriptionPlanId,
        billingCycle: billingCycleId,
        startDate: start,
        endDate: end,
        status: 'active',
        updatedBy: req.user._id,
        $setOnInsert: { createdBy: req.user._id }
      },
      { upsert: true, new: true }
    )
      .populate('subscriptionPlan', 'displayName')
      .populate('billingCycle', 'name displayName');

    // Create log entry
    const logData = {
      shop: shopId,
      shopName: shop.name || '',
      action: action,
      subscriptionPlan: subscriptionPlanId,
      subscriptionPlanName: plan.displayName || '',
      billingCycle: billingCycleId,
      billingCycleName: billingCycle.displayName || billingCycle.name || '',
      startDate: start,
      endDate: end,
      status: 'active',
      createdBy: req.user._id,
      createdByEmail: req.user.email || ''
    };

    // Add previous subscription data if updating
    if (previousSubscription) {
      logData.previousSubscriptionPlan = previousSubscription.subscriptionPlan._id;
      logData.previousSubscriptionPlanName = previousSubscription.subscriptionPlan.displayName || '';
      logData.previousBillingCycle = previousSubscription.billingCycle._id;
      logData.previousBillingCycleName = previousSubscription.billingCycle.displayName || previousSubscription.billingCycle.name || '';
    }

    await SubscriptionLog.create(logData);

    res.json(subscription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get shop's current subscription
exports.getShopSubscription = async (req, res) => {
  try {
    const shopId = req.user.shop || req.params.shopId;

    if (!shopId) {
      return res.status(400).json({ message: 'Shop ID is required' });
    }

    const subscription = await ShopSubscription.findOne({ shop: shopId, status: 'active' })
      .populate('subscriptionPlan', 'displayName description')
      .populate('billingCycle', 'name displayName durationInDays')
      .populate('scheduledDowngrade.subscriptionPlan', 'displayName')
      .populate('scheduledDowngrade.billingCycle', 'name displayName');

    if (!subscription) {
      return res.status(404).json({ message: 'No active subscription found' });
    }

    // Get limits for the plan
    const limits = await SubscriptionPlanLimit.find({
      subscriptionPlan: subscription.subscriptionPlan._id
    }).lean();

    const limitsMap = {};
    limits.forEach((limit) => {
      limitsMap[limit.limitKey] = limit.limitValue;
    });

    // Get current usage
    const usage = await SubscriptionUsage.find({ shop: shopId }).lean();
    const usageMap = {};
    usage.forEach((u) => {
      usageMap[u.limitKey] = u.currentUsage;
    });

    res.json({
      subscription,
      limits: limitsMap,
      usage: usageMap
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper: Check if shop can perform action based on limit
exports.checkLimit = async (shopId, limitKey, increment = 0) => {
  try {
    const subscription = await ShopSubscription.findOne({
      shop: shopId,
      status: 'active'
    }).populate('subscriptionPlan');

    if (!subscription) {
      return { allowed: false, reason: 'No active subscription' };
    }

    const limit = await SubscriptionPlanLimit.findOne({
      subscriptionPlan: subscription.subscriptionPlan._id,
      limitKey
    });

    if (!limit) {
      return { allowed: true };
    }

    let usage = await SubscriptionUsage.findOne({ shop: shopId, limitKey });
    const currentUsage = usage ? usage.currentUsage : 0;

    if (limit.limitValue === -1) {
      return { allowed: true };
    }

    if (currentUsage + increment > limit.limitValue) {
      return {
        allowed: false,
        reason: `Limit exceeded for ${limitKey}`,
        current: currentUsage,
        limit: limit.limitValue
      };
    }

    return { allowed: true, current: currentUsage, limit: limit.limitValue };
  } catch (error) {
    return { allowed: false, reason: error.message };
  }
};

// Helper: Increment usage
exports.incrementUsage = async (shopId, limitKey, amount = 1) => {
  try {
    await SubscriptionUsage.findOneAndUpdate(
      { shop: shopId, limitKey },
      {
        $inc: { currentUsage: amount },
        $set: { lastUpdated: new Date() }
      },
      { upsert: true }
    );
  } catch (error) {
    console.error('Error incrementing usage:', error);
  }
};

// Helper: Decrement usage
exports.decrementUsage = async (shopId, limitKey, amount = 1) => {
  try {
    await SubscriptionUsage.findOneAndUpdate(
      { shop: shopId, limitKey },
      {
        $inc: { currentUsage: -amount },
        $set: { lastUpdated: new Date() }
      },
      { upsert: true }
    );
  } catch (error) {
    console.error('Error decrementing usage:', error);
  }
};

// Admin: Get subscription logs for a shop
exports.getShopSubscriptionLogs = async (req, res) => {
  try {
    const { shopId } = req.params;
    const { action, fromDate, toDate, limit = 50, offset = 0 } = req.query;

    if (!shopId) {
      return res.status(400).json({ message: 'Shop ID is required' });
    }

    // Verify shop exists
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    const filter = { shop: shopId };
    if (action) {
      filter.action = action;
    }
    
    // Add date filtering
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) {
        const toDateObj = new Date(toDate);
        toDateObj.setHours(23, 59, 59, 999); // Include the entire end date
        filter.createdAt.$lte = toDateObj;
      }
    }

    const logs = await SubscriptionLog.find(filter)
      .populate('subscriptionPlan', 'displayName')
      .populate('billingCycle', 'name displayName')
      .populate('previousSubscriptionPlan', 'displayName')
      .populate('previousBillingCycle', 'name displayName')
      .populate('createdBy', 'email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const total = await SubscriptionLog.countDocuments(filter);

    res.json({
      logs,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Get all subscription logs (across all shops)
exports.getAllSubscriptionLogs = async (req, res) => {
  try {
    const { shopId, action, fromDate, toDate, limit = 100, offset = 0 } = req.query;

    const filter = {};
    if (shopId) filter.shop = shopId;
    if (action) filter.action = action;
    
    // Add date filtering
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) {
        const toDateObj = new Date(toDate);
        toDateObj.setHours(23, 59, 59, 999); // Include the entire end date
        filter.createdAt.$lte = toDateObj;
      }
    }

    const logs = await SubscriptionLog.find(filter)
      .populate('shop', 'name email')
      .populate('subscriptionPlan', 'displayName')
      .populate('billingCycle', 'name displayName')
      .populate('previousSubscriptionPlan', 'displayName')
      .populate('previousBillingCycle', 'name displayName')
      .populate('createdBy', 'email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const total = await SubscriptionLog.countDocuments(filter);

    res.json({
      logs,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

