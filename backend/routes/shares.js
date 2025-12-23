const express = require('express');
const router = express.Router();
const shareController = require('../controllers/shareController');
const { auth } = require('../middleware/auth');

/**
 * @swagger
 * /shares:
 *   post:
 *     summary: Log a share action from the frontend portal
 *     tags: [Shares]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             required:
 *               - type
 *               - itemId
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [product, shop]
 *                 description: Type of item being shared
 *               itemId:
 *                 type: string
 *                 description: ID of the product or shop being shared
 *               itemName:
 *                 type: string
 *                 description: Optional display name of the item
 *               channel:
 *                 type: string
 *                 description: Channel or method of sharing
 *               userId:
 *                 type: string
 *                 description: Optional user ID of the sharer
 *               userEmail:
 *                 type: string
 *                 description: Optional email of the sharer
 *     responses:
 *       '201':
 *         description: Share logged successfully
 *       '400':
 *         description: Invalid payload
 *       '500':
 *         description: Server error
 */
router.post('/', shareController.logShare);

module.exports = router;
