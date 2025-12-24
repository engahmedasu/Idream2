const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { auth, optionalAuth, authorize, checkPermission } = require('../middleware/auth');
const upload = require('../middleware/upload');

/**
 * @swagger
 * /products/hot-offers:
 *   get:
 *     summary: Get hot offers (Public)
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of offers to return
 *     responses:
 *       200:
 *         description: List of hot offers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get('/hot-offers', productController.getHotOffers);

/**
 * @swagger
 * /products/limits/status:
 *   get:
 *     summary: Get product limits status for shop (Authenticated)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: shopId
 *         schema:
 *           type: string
 *         description: Shop ID (optional for shopAdmin, uses their shop)
 *     responses:
 *       200:
 *         description: Limits status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 canCreateProduct:
 *                   type: boolean
 *                 canSetHotOffer:
 *                   type: boolean
 *                 maxProducts:
 *                   type: number
 *                   nullable: true
 *                 maxHotOffers:
 *                   type: number
 *                   nullable: true
 *                 currentProducts:
 *                   type: number
 *                 currentHotOffers:
 *                   type: number
 */
router.get('/limits/status', auth, productController.getProductLimitsStatus);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get product by ID (Public)
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         description: Product not found
 */
router.get('/:id', productController.getProductById);

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products (Protected)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: shop
 *         schema:
 *           type: string
 *         description: Filter by shop ID
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: isHotOffer
 *         schema:
 *           type: boolean
 *         description: Filter hot offers
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search products by name or description
 *     responses:
 *       200:
 *         description: List of products
 */
router.get('/', optionalAuth, productController.getAllProducts);

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product (Authenticated)
 *     tags: [Products]
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
 *               - description
 *               - price
 *               - shop
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               shop:
 *                 type: string
 *               category:
 *                 type: string
 *               productImage:
 *                 type: string
 *                 format: binary
 *               isHotOffer:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Bad request
 */
router.post('/', auth, checkPermission('product', 'create'), upload.single('productImage'), productController.createProduct);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update product (Authenticated)
 *     tags: [Products]
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
 *               price:
 *                 type: number
 *               productImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       404:
 *         description: Product not found
 */
router.put('/:id', auth, upload.single('productImage'), productController.updateProduct);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete product (Admin only)
 *     tags: [Products]
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
 *         description: Product deleted successfully
 *       403:
 *         description: Forbidden - Admin access required
 */
router.delete('/:id', auth, authorize('superAdmin', 'mallAdmin', 'shopAdmin'), productController.deleteProduct);

/**
 * @swagger
 * /products/{id}/activate:
 *   patch:
 *     summary: Activate product (Admin only)
 *     tags: [Products]
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
 *         description: Product activated successfully
 */
router.patch('/:id/activate', auth, checkPermission('product', 'activate'), productController.activateProduct);

/**
 * @swagger
 * /products/{id}/deactivate:
 *   patch:
 *     summary: Deactivate product (Admin only)
 *     tags: [Products]
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
 *         description: Product deactivated successfully
 */
// Deactivate uses activate permission (same permission for both actions)
router.patch('/:id/deactivate', auth, checkPermission('product', 'activate'), productController.deactivateProduct);

module.exports = router;
