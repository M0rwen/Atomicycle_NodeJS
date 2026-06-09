const express = require('express');
const router = express.Router();
const { getAllItems,
    getSingleItem,
    createItem,
    updateItem,
    deleteItem,
} = require('../controllers/item')
const upload = require('../utils/multer')
const { isAuthenticatedUser } = require('../middlewares/auth')

router.get('/items', getAllItems)
router.get('/items/:id', getSingleItem)
router.post('/items', isAuthenticatedUser, upload.array('images', 10), createItem)
router.put('/items/:id', isAuthenticatedUser, upload.array('images', 10), updateItem)
router.delete('/items/:id', isAuthenticatedUser, deleteItem)
module.exports = router;