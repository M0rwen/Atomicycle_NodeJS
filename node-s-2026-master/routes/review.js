const express = require('express');
const router = express.Router();
const {
    getReviewsByItem,
    createReview,
    updateReview,
} = require('../controllers/review');
const { isAuthenticatedUser } = require('../middlewares/auth');

router.get('/reviews/:item_id', getReviewsByItem);
router.post('/reviews', isAuthenticatedUser, createReview);
router.put('/reviews/:review_id', isAuthenticatedUser, updateReview);

module.exports = router;
