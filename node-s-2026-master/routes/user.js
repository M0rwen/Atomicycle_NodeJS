const express = require('express');
const router = express.Router();
const upload = require('../utils/multer')

const { registerUser,
    loginUser,
    getUserProfile,
    updateUser,
    deactivateUser,
    getAllUsers,
    getArchivedUsers,
    updateUserRole,
    deactivateUserById,
    restoreUserById,
} = require('../controllers/user')
const { isAdminUser, isAuthenticatedUser } = require('../middlewares/auth')
router.post('/register', registerUser)
router.post('/login', loginUser)
router.get('/profile', isAuthenticatedUser, getUserProfile)
router.post('/update-profile', isAuthenticatedUser, upload.single('image'), updateUser)
router.delete('/deactivate', deactivateUser)
router.get('/users', isAdminUser, getAllUsers)
router.get('/users/archived', isAdminUser, getArchivedUsers)
router.patch('/users/:id/role', isAdminUser, updateUserRole)
router.patch('/users/:id/restore', isAdminUser, restoreUserById)
router.delete('/users/:id', isAdminUser, deactivateUserById)

module.exports = router;