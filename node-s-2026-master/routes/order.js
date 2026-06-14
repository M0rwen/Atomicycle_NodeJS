const express = require('express');

const router = express.Router();

const {
	createOrder,
	getAllTransactions,
	getSingleTransaction,
	updateTransaction,
	deleteTransaction,
} = require('../controllers/order')
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth')

router.post('/create-order', isAuthenticatedUser, createOrder)
router.get('/transactions', authorizeRoles('admin'), getAllTransactions)
router.get('/transactions/:id', authorizeRoles('admin'), getSingleTransaction)
router.patch('/transactions/:id', authorizeRoles('admin'), updateTransaction)
router.delete('/transactions/:id', authorizeRoles('admin'), deleteTransaction)

module.exports = router;
