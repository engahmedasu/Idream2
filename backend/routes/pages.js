const express = require('express');
const router = express.Router();
const pageController = require('../controllers/pageController');
const { auth, authorize } = require('../middleware/auth');

/**
 * @swagger
 * /pages:
 *   get:
 *     summary: Get all pages (Public)
 *     tags: [Pages]
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of pages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get('/', pageController.getAllPages);

/**
 * @swagger
 * /pages/slug/{slug}:
 *   get:
 *     summary: Get page by slug (Public)
 *     tags: [Pages]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Page details
 *       404:
 *         description: Page not found
 */
router.get('/slug/:slug', pageController.getPageBySlug);

/**
 * @swagger
 * /pages/{id}:
 *   get:
 *     summary: Get page by ID (Admin)
 *     tags: [Pages]
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
 *         description: Page details
 *       404:
 *         description: Page not found
 */
router.get('/:id', auth, authorize('superAdmin'), pageController.getPageById);

/**
 * @swagger
 * /pages:
 *   post:
 *     summary: Create a new page (SuperAdmin only)
 *     tags: [Pages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - slug
 *               - title
 *               - content
 *             properties:
 *               slug:
 *                 type: string
 *               title:
 *                 type: object
 *                 properties:
 *                   en:
 *                     type: string
 *                   ar:
 *                     type: string
 *               content:
 *                 type: object
 *                 properties:
 *                   en:
 *                     type: string
 *                   ar:
 *                     type: string
 *               order:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Page created successfully
 *       403:
 *         description: Forbidden - SuperAdmin access required
 */
router.post('/', auth, authorize('superAdmin'), pageController.createPage);

/**
 * @swagger
 * /pages/{id}:
 *   put:
 *     summary: Update page (SuperAdmin only)
 *     tags: [Pages]
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
 *               slug:
 *                 type: string
 *               title:
 *                 type: object
 *               content:
 *                 type: object
 *               order:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Page updated successfully
 */
router.put('/:id', auth, authorize('superAdmin'), pageController.updatePage);

/**
 * @swagger
 * /pages/{id}:
 *   delete:
 *     summary: Delete page (SuperAdmin only)
 *     tags: [Pages]
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
 *         description: Page deleted successfully
 */
router.delete('/:id', auth, authorize('superAdmin'), pageController.deletePage);

/**
 * @swagger
 * /pages/{id}/toggle:
 *   patch:
 *     summary: Toggle page active status (SuperAdmin only)
 *     tags: [Pages]
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
 *         description: Page status toggled successfully
 */
router.patch('/:id/toggle', auth, authorize('superAdmin'), pageController.togglePage);

/**
 * @swagger
 * /pages/order/update:
 *   patch:
 *     summary: Update page display order (SuperAdmin only)
 *     tags: [Pages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pages:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     order:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Page order updated successfully
 */
router.patch('/order/update', auth, authorize('superAdmin'), pageController.updateOrder);

module.exports = router;

