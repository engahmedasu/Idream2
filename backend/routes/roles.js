const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const { auth, authorize } = require('../middleware/auth');

router.use(auth); // All role routes require authentication

router.get('/', authorize('superAdmin'), roleController.getAllRoles);
router.get('/:id', authorize('superAdmin'), roleController.getRoleById);
router.post('/', authorize('superAdmin'), roleController.createRole);
router.put('/:id', authorize('superAdmin'), roleController.updateRole);
router.delete('/:id', authorize('superAdmin'), roleController.deleteRole);
router.patch('/:id/toggle', authorize('superAdmin'), roleController.toggleRole);

module.exports = router;

