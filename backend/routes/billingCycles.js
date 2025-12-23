const express = require('express');
const router = express.Router();
const billingCycleController = require('../controllers/billingCycleController');
const { auth, authorize } = require('../middleware/auth');

router.use(auth); // All billing cycle routes require authentication

/**
 * @swagger
 * /billingcycles:
 *   get:
 *     summary: Get all billing cycles (SuperAdmin only)
 *     tags: [BillingCycles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of billing cycles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get('/', authorize('superAdmin'), billingCycleController.getAllBillingCycles);

/**
 * @swagger
 * /billingcycles/{id}:
 *   get:
 *     summary: Get billing cycle by ID (SuperAdmin only)
 *     tags: [BillingCycles]
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
 *         description: Billing cycle details
 *       404:
 *         description: Billing cycle not found
 */
router.get('/:id', authorize('superAdmin'), billingCycleController.getBillingCycleById);

/**
 * @swagger
 * /billingcycles:
 *   post:
 *     summary: Create a new billing cycle (SuperAdmin only)
 *     tags: [BillingCycles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - displayName
 *               - durationInDays
 *             properties:
 *               name:
 *                 type: string
 *                 enum: [monthly, yearly]
 *               displayName:
 *                 type: string
 *               durationInDays:
 *                 type: number
 *                 minimum: 1
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Billing cycle created successfully
 *       403:
 *         description: Forbidden - SuperAdmin access required
 */
router.post('/', authorize('superAdmin'), billingCycleController.createBillingCycle);

/**
 * @swagger
 * /billingcycles/{id}:
 *   put:
 *     summary: Update billing cycle (SuperAdmin only)
 *     tags: [BillingCycles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 enum: [monthly, yearly]
 *               displayName:
 *                 type: string
 *               durationInDays:
 *                 type: number
 *                 minimum: 1
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Billing cycle updated successfully
 *       404:
 *         description: Billing cycle not found
 */
router.put('/:id', authorize('superAdmin'), billingCycleController.updateBillingCycle);

/**
 * @swagger
 * /billingcycles/{id}:
 *   delete:
 *     summary: Delete billing cycle (SuperAdmin only)
 *     tags: [BillingCycles]
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
 *         description: Billing cycle deleted successfully
 *       404:
 *         description: Billing cycle not found
 */
router.delete('/:id', authorize('superAdmin'), billingCycleController.deleteBillingCycle);

/**
 * @swagger
 * /billingcycles/{id}/toggle:
 *   patch:
 *     summary: Toggle billing cycle active status (SuperAdmin only)
 *     tags: [BillingCycles]
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
 *         description: Billing cycle status toggled successfully
 *       404:
 *         description: Billing cycle not found
 */
router.patch('/:id/toggle', authorize('superAdmin'), billingCycleController.toggleBillingCycle);

module.exports = router;

