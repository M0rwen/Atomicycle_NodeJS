const express = require('express');
const router = express.Router();
const upload = require('../utils/multer')

const { registerUser,
    loginUser,
    updateUser,
    deactivateUser,
    getAllUsers,
    updateUserRole,
    deactivateUserById,
} = require('../controllers/user')
const { isAdminUser } = require('../middlewares/auth')
router.post('/register', registerUser)
router.post('/login', loginUser)
router.post('/update-profile', upload.single('image'), updateUser)
router.delete('/deactivate', deactivateUser)
router.get('/users', isAdminUser, getAllUsers)
router.patch('/users/:id/role', isAdminUser, updateUserRole)
router.delete('/users/:id', isAdminUser, deactivateUserById)

module.exports = router;