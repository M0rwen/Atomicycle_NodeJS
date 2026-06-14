const express = require('express');
const router = express.Router();
const { getAllItems,
    getSingleItem,
    createItem,
    updateItem,
    deleteItem,
} = require('../controllers/item')
const upload = require('../utils/multer')
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth')

router.get('/items', getAllItems)
router.get('/items/:id', getSingleItem)
router.post('/items', isAuthenticatedUser, authorizeRoles('admin'), upload.array('images', 10), createItem)
router.put('/items/:id', isAuthenticatedUser, authorizeRoles('admin'), upload.array('images', 10), updateItem)
router.delete('/items/:id', isAuthenticatedUser, authorizeRoles('admin'), deleteItem)
module.exports = router;