const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { auth, optionalAuth, authorize } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Subscriptions
 *   description: Subscription plan management endpoints
 */

/**
 * @swagger
 * /subscriptions/plans:
 *   get:
 *     summary: Get all active subscription plans (Public)
 *     tags: [Subscriptions]
 *     responses:
 *       200:
 *         description: List of active plans with features, limits, and pricing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 plans:
 *                   type: array
 *                   items:
 *                     type: object
 *                 billingCycles:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/plans', optionalAuth, subscriptionController.getPlans);

/**
 * @swagger
 * /subscriptions/shop:
 *   get:
 *     summary: Get shop's current subscription
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Shop subscription details with limits and usage
 *       404:
 *         description: No active subscription found
 */
router.get('/shop', auth, subscriptionController.getShopSubscription);

// Admin routes - require authentication and superAdmin or mallAdmin role
router.use(auth);
router.use(authorize('superAdmin', 'mallAdmin'));

/**
 * @swagger
 * /subscriptions/admin/plans:
 *   get:
 *     summary: Get all subscription plans (Admin)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all plans
 */
router.get('/admin/plans', subscriptionController.getAllPlans);

/**
 * @swagger
 * /subscriptions/admin/plans:
 *   post:
 *     summary: Create subscription plan
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - displayName
 *             properties:
 *               displayName:
 *                 type: string
 *               description:
 *                 type: string
 *               sortOrder:
 *                 type: number
 *     responses:
 *       201:
 *         description: Plan created successfully
 */
router.post('/admin/plans', subscriptionController.createPlan);

/**
 * @swagger
 * /subscriptions/admin/plans/:id:
 *   put:
 *     summary: Update subscription plan
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               sortOrder:
 *                 type: number
 *     responses:
 *       200:
 *         description: Plan updated successfully
 */
router.put('/admin/plans/:id', subscriptionController.updatePlan);

/**
 * @swagger
 * /subscriptions/admin/plans/:id:
 *   delete:
 *     summary: Delete subscription plan
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Plan deleted successfully
 */
router.delete('/admin/plans/:id', subscriptionController.deletePlan);

/**
 * @swagger
 * /subscriptions/admin/plans/:planId/features:
 *   get:
 *     summary: Get plan features
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *   post:
 *     summary: Add plan feature
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 */
router.get('/admin/plans/:planId/features', subscriptionController.getPlanFeatures);
router.post('/admin/plans/:planId/features', subscriptionController.addPlanFeature);

/**
 * @swagger
 * /subscriptions/admin/features/:featureId:
 *   put:
 *     summary: Update plan feature
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *   delete:
 *     summary: Delete plan feature
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 */
router.put('/admin/features/:featureId', subscriptionController.updatePlanFeature);
router.delete('/admin/features/:featureId', subscriptionController.deletePlanFeature);

/**
 * @swagger
 * /subscriptions/admin/plans/:planId/limits:
 *   get:
 *     summary: Get plan limits
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *   post:
 *     summary: Set plan limit
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 */
router.get('/admin/plans/:planId/limits', subscriptionController.getPlanLimits);
router.post('/admin/plans/:planId/limits', subscriptionController.setPlanLimit);

/**
 * @swagger
 * /subscriptions/admin/limits/:limitId:
 *   delete:
 *     summary: Delete plan limit
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/admin/limits/:limitId', subscriptionController.deletePlanLimit);

/**
 * @swagger
 * /subscriptions/admin/billing-cycles:
 *   get:
 *     summary: Get billing cycles
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *   post:
 *     summary: Create billing cycle
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 */
router.get('/admin/billing-cycles', subscriptionController.getBillingCycles);
router.post('/admin/billing-cycles', subscriptionController.createBillingCycle);

/**
 * @swagger
 * /subscriptions/admin/billing-cycles/:id:
 *   put:
 *     summary: Update billing cycle
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 */
router.put('/admin/billing-cycles/:id', subscriptionController.updateBillingCycle);

/**
 * @swagger
 * /subscriptions/admin/plans/:planId/pricing:
 *   get:
 *     summary: Get plan pricing
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *   post:
 *     summary: Set plan pricing
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 */
router.get('/admin/plans/:planId/pricing', subscriptionController.getPlanPricing);
router.post('/admin/plans/:planId/pricing', subscriptionController.setPlanPricing);

/**
 * @swagger
 * /subscriptions/admin/pricing/:pricingId:
 *   put:
 *     summary: Update plan pricing
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 */
router.put('/admin/pricing/:pricingId', subscriptionController.updatePlanPricing);

/**
 * @swagger
 * /subscriptions/admin/shop-subscriptions:
 *   get:
 *     summary: Get all shop subscriptions
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *   post:
 *     summary: Create/Update shop subscription
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 */
router.get('/admin/shop-subscriptions', subscriptionController.getShopSubscriptions);
router.post('/admin/shop-subscriptions', subscriptionController.setShopSubscription);

/**
 * @swagger
 * /subscriptions/admin/subscription-logs:
 *   get:
 *     summary: Get all subscription logs (Admin)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: shopId
 *         schema:
 *           type: string
 *         description: Filter by shop ID
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [created, updated, activated, cancelled, expired, renewed]
 *         description: Filter by action
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Maximum number of logs to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of logs to skip
 *     responses:
 *       200:
 *         description: List of subscription logs
 */
router.get('/admin/subscription-logs', subscriptionController.getAllSubscriptionLogs);

/**
 * @swagger
 * /subscriptions/admin/subscription-logs/shop/:shopId:
 *   get:
 *     summary: Get subscription logs for a specific shop (Admin)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shopId
 *         required: true
 *         schema:
 *           type: string
 *         description: Shop ID
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [created, updated, activated, cancelled, expired, renewed]
 *         description: Filter by action
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of logs to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of logs to skip
 *     responses:
 *       200:
 *         description: List of subscription logs for the shop
 *       404:
 *         description: Shop not found
 */
router.get('/admin/subscription-logs/shop/:shopId', subscriptionController.getShopSubscriptionLogs);

module.exports = router;

