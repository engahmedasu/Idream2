const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permissionController');
const { auth, authorize } = require('../middleware/auth');

router.use(auth); // All permission routes require authentication

router.get('/', authorize('superAdmin'), permissionController.getAllPermissions);
router.get('/:id', authorize('superAdmin'), permissionController.getPermissionById);
router.post('/', authorize('superAdmin'), permissionController.createPermission);
router.put('/:id', authorize('superAdmin'), permissionController.updatePermission);
router.delete('/:id', authorize('superAdmin'), permissionController.deletePermission);
router.patch('/:id/toggle', authorize('superAdmin'), permissionController.togglePermission);

module.exports = router;

