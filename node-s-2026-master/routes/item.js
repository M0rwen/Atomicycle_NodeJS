const express = require('express');
const router = express.Router();
const { getAllItems,
    getSingleItem,
    getArchivedItems,
    createItem,
    updateItem,
    deleteItem,
    restoreItem,
} = require('../controllers/item')
const upload = require('../utils/multer')
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth')

router.get('/items', getAllItems)
router.get('/items/archived', isAuthenticatedUser, authorizeRoles('admin'), getArchivedItems)
router.get('/items/:id', getSingleItem)
router.post('/items', isAuthenticatedUser, authorizeRoles('admin'), upload.array('images', 10), createItem)
router.put('/items/:id', isAuthenticatedUser, authorizeRoles('admin'), upload.array('images', 10), updateItem)
router.patch('/items/:id/restore', isAuthenticatedUser, authorizeRoles('admin'), restoreItem)
router.delete('/items/:id', isAuthenticatedUser, authorizeRoles('admin'), deleteItem)
module.exports = router;