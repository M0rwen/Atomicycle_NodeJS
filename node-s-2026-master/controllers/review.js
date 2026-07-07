const { Review, User, Item, OrderInfo, OrderLine, Customer } = require('../models');

const normalizeReview = (review) => {
    const plainReview = review.get({ plain: true });

    return {
        ...plainReview,
        reviewer_name: plainReview.User?.name || 'Anonymous',
    };
};

const getDeliveredOrderInfoForItem = async (userId, itemId) => {
    const customer = await Customer.findOne({
        where: { user_id: userId },
    });

    if (!customer) {
        return null;
    }

    const deliveredOrders = await OrderInfo.findAll({
        where: {
            customer_id: customer.id,
            delivery_status: 'delivered',
        },
        include: [{
            model: OrderLine,
            as: 'lines',
            where: { item_id: itemId },
        }],
    });

    return deliveredOrders[0] || null;
};

exports.getReviewsByItem = async (req, res) => {
    try {
        const { item_id } = req.params;

        const reviews = await Review.findAll({
            where: { item_id: item_id },
            include: [{ model: User, attributes: ['id', 'name'] }],
            order: [['created_at', 'DESC']],
        });

        return res.status(200).json({
            success: true,
            rows: reviews.map(normalizeReview),
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error loading reviews', details: error.message });
    }
};

exports.createReview = async (req, res) => {
    try {
        const userId = req.body?.user?.id;
        const { item_id, rating, comment } = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!item_id || !rating || !comment || !String(comment).trim()) {
            return res.status(400).json({ error: 'Item, rating, and comment are required' });
        }

        const safeRating = Number(rating);
        if (!Number.isInteger(safeRating) || safeRating < 1 || safeRating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }

        const existingReview = await Review.findOne({
            where: { user_id: userId, item_id },
        });

        if (existingReview) {
            return res.status(409).json({ error: 'You already reviewed this item' });
        }

        const item = await Item.findByPk(item_id);
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        const deliveredOrder = await getDeliveredOrderInfoForItem(userId, item_id);
        if (!deliveredOrder) {
            return res.status(403).json({ error: 'You can only review items you received in a delivered order' });
        }

        const review = await Review.create({
            user_id: userId,
            item_id,
            orderinfo_id: deliveredOrder.orderinfo_id,
            rating: safeRating,
            comment: String(comment).trim(),
            created_at: new Date(),
            updated_at: new Date(),
        });

        const populatedReview = await Review.findByPk(review.review_id, {
            include: [{ model: User, attributes: ['id', 'name'] }],
        });

        return res.status(201).json({
            success: true,
            review: normalizeReview(populatedReview),
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error creating review', details: error.message });
    }
};

exports.updateReview = async (req, res) => {
    try {
        const userId = req.body?.user?.id;
        const { review_id } = req.params;
        const { rating, comment } = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const review = await Review.findByPk(review_id);
        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }

        if (Number(review.user_id) !== Number(userId)) {
            return res.status(403).json({ error: 'You can only update your own review' });
        }

        const safeRating = rating === undefined ? review.rating : Number(rating);
        if (!Number.isInteger(safeRating) || safeRating < 1 || safeRating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }

        const nextComment = comment === undefined ? review.comment : String(comment).trim();
        if (!nextComment) {
            return res.status(400).json({ error: 'Comment is required' });
        }

        await review.update({
            rating: safeRating,
            comment: nextComment,
            updated_at: new Date(),
        });

        const updatedReview = await Review.findByPk(review.review_id, {
            include: [{ model: User, attributes: ['id', 'name'] }],
        });

        return res.status(200).json({
            success: true,
            review: normalizeReview(updatedReview),
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error updating review', details: error.message });
    }
};
