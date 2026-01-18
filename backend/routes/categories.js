const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { auth, optionalAuth, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all categories (Public)
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
// Public endpoint - allow unauthenticated users, superAdmin, mallAdmin, Sales, and shopAdmin
router.get('/', optionalAuth, (req, res, next) => {
  // If user is authenticated, allow superAdmin, mallAdmin, Sales, and shopAdmin
  if (req.user) {
    const userRole = req.user.role?.name;
    const allowedRoles = ['superAdmin', 'mallAdmin', 'Sales', 'shopAdmin'];
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: 'Access denied. Categories are only available to unauthenticated users, superAdmin, mallAdmin, Sales, or shopAdmin.' });
    }
  }
  next();
}, categoryController.getAllCategories);

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Get category by ID with shops and hot offers (Public)
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category details with shops and hot offers
 *       404:
 *         description: Category not found
 */
// Public endpoint - allow unauthenticated users, superAdmin, mallAdmin, Sales, and shopAdmin
router.get('/:id', optionalAuth, (req, res, next) => {
  // If user is authenticated, allow superAdmin, mallAdmin, Sales, and shopAdmin
  if (req.user) {
    const userRole = req.user.role?.name;
    const allowedRoles = ['superAdmin', 'mallAdmin', 'Sales', 'shopAdmin'];
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: 'Access denied. Categories are only available to unauthenticated users, superAdmin, mallAdmin, Sales, or shopAdmin.' });
    }
  }
  next();
}, categoryController.getCategoryById);

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create a new category (SuperAdmin only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *               order:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Category created successfully
 *       403:
 *         description: Forbidden - SuperAdmin access required
 */
router.post('/', auth, authorize('superAdmin'), upload.single('image'), categoryController.createCategory);

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Update category (SuperAdmin only)
 *     tags: [Categories]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *               order:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Category updated successfully
 */
router.put('/:id', auth, authorize('superAdmin'), upload.single('image'), categoryController.updateCategory);

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Delete category (SuperAdmin only)
 *     tags: [Categories]
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
 *         description: Category deleted successfully
 */
router.delete('/:id', auth, authorize('superAdmin'), categoryController.deleteCategory);

/**
 * @swagger
 * /categories/{id}/toggle:
 *   patch:
 *     summary: Toggle category active status (SuperAdmin only)
 *     tags: [Categories]
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
 *         description: Category status toggled successfully
 */
router.patch('/:id/toggle', auth, authorize('superAdmin'), categoryController.toggleCategory);

/**
 * @swagger
 * /categories/order/update:
 *   patch:
 *     summary: Update category display order (SuperAdmin only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categories:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     order:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Category order updated successfully
 */
router.patch('/order/update', auth, authorize('superAdmin'), categoryController.updateOrder);

module.exports = router;
