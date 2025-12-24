const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const { auth, authorize } = require('../middleware/auth');
const { videoUpload } = require('../middleware/upload');

/**
 * @swagger
 * /videos:
 *   get:
 *     summary: Get all videos (Public)
 *     tags: [Videos]
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of videos
 */
router.get('/', videoController.getAllVideos);

/**
 * @swagger
 * /videos/{id}:
 *   get:
 *     summary: Get video by ID (Public)
 *     tags: [Videos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Video details
 *       404:
 *         description: Video not found
 */
router.get('/:id', videoController.getVideoById);

/**
 * @swagger
 * /videos:
 *   post:
 *     summary: Create a new video (SuperAdmin only)
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               video:
 *                 type: string
 *                 format: binary
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *               videoUrl:
 *                 type: string
 *               thumbnailUrl:
 *                 type: string
 *               priority:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Video created successfully
 *       403:
 *         description: Forbidden - SuperAdmin access required
 */
router.post('/', auth, authorize('superAdmin'), videoUpload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), videoController.createVideo);

/**
 * @swagger
 * /videos/{id}:
 *   put:
 *     summary: Update video (SuperAdmin only)
 *     tags: [Videos]
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
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               video:
 *                 type: string
 *                 format: binary
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *               videoUrl:
 *                 type: string
 *               thumbnailUrl:
 *                 type: string
 *               priority:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Video updated successfully
 */
router.put('/:id', auth, authorize('superAdmin'), videoUpload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), videoController.updateVideo);

/**
 * @swagger
 * /videos/{id}:
 *   delete:
 *     summary: Delete video (SuperAdmin only)
 *     tags: [Videos]
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
 *         description: Video deleted successfully
 */
router.delete('/:id', auth, authorize('superAdmin'), videoController.deleteVideo);

/**
 * @swagger
 * /videos/{id}/toggle:
 *   patch:
 *     summary: Toggle video active status (SuperAdmin only)
 *     tags: [Videos]
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
 *         description: Video status toggled successfully
 */
router.patch('/:id/toggle', auth, authorize('superAdmin'), videoController.toggleVideo);

/**
 * @swagger
 * /videos/priority/update:
 *   patch:
 *     summary: Update video display priority (SuperAdmin only)
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               videos:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     priority:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Video priority updated successfully
 */
router.patch('/priority/update', auth, authorize('superAdmin'), videoController.updatePriority);

module.exports = router;

