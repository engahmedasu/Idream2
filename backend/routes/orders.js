const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { auth } = require('../middleware/auth');

/**
 * @swagger
 * /orders/log:
 *   post:
 *     summary: Log an order (Order via WhatsApp)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shopId
 *               - items
 *             properties:
 *               shopId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     productName:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     price:
 *                       type: number
 *                     shippingFees:
 *                       type: number
 *               totalAmount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Order logged successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.post('/log', auth, orderController.logOrder);

/**
 * @swagger
 * /orders/summary/{orderNumber}:
 *   get:
 *     summary: Get order summary by order number (public endpoint for sharing)
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: orderNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Order number
 *     responses:
 *       200:
 *         description: Order summary retrieved successfully
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.get('/summary/:orderNumber', orderController.getOrderSummary);

module.exports = router;

