const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { auth } = require('../middleware/auth');

/**
 * @swagger
 * /ai/chat:
 *   post:
 *     summary: Chat with AI agent (Public)
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *               language:
 *                 type: string
 *                 enum: [en, ar]
 *                 default: en
 *               conversationHistory:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: AI response
 *       400:
 *         description: Invalid request
 */
router.post('/chat', aiController.chat);

/**
 * @swagger
 * /ai/prompt:
 *   get:
 *     summary: Get AI system prompt (Public)
 *     tags: [AI]
 *     parameters:
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *           enum: [en, ar]
 *         default: en
 *     responses:
 *       200:
 *         description: System prompt
 */
router.get('/prompt', aiController.getSystemPrompt);

/**
 * @swagger
 * /ai/prompt:
 *   put:
 *     summary: Update AI system prompt (Admin only)
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               prompt:
 *                 type: string
 *               language:
 *                 type: string
 *     responses:
 *       200:
 *         description: Prompt updated
 */
router.put('/prompt', auth, aiController.updateSystemPrompt);

module.exports = router;

