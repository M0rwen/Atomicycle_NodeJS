const jwt = require("jsonwebtoken")
const { User } = require('../models')

const getTokenFromRequest = (req) => {
    const authHeader = req.header('Authorization');

    if (!authHeader) {
        return null;
    }

    const parts = authHeader.split(' ');
    return parts.length === 2 ? parts[1] : null;
};

const verifyToken = (req, res) => {
    const token = getTokenFromRequest(req);

    if (!token) {
        res.status(401).json({ message: 'Login first to access this resource' });
        return null;
    }

    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        res.status(401).json({ message: 'Invalid or expired token' });
        return null;
    }
};

const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        const decoded = verifyToken(req, res);

        if (!decoded) {
            return;
        }

        req.user = { id: decoded.id, role: decoded.role };
        req.body = req.body || {};
        req.body.user = req.user;

        User.findOne({
            where: {
                id: decoded.id,
                deleted_at: null,
            },
        }).then((user) => {
            const role = user ? user.role : null;

            if (!allowedRoles.includes(role)) {
                return res.status(403).json({ message: 'Admin access required' });
            }

            req.user = { id: decoded.id, role };
            req.body.user = req.user;
            next();
        }).catch((err) => {
            console.log(err);
            return res.status(500).json({ message: 'Unable to verify access' });
        });
    };
};

exports.isAuthenticatedUser = (req, res, next) => {
    const decoded = verifyToken(req, res);

    if (!decoded) {
        return;
    }

    req.user = { id: decoded.id, role: decoded.role };
    req.body = req.body || {};
    req.body.user = req.user;
    next();
};

exports.isAdminUser = authorizeRoles('admin');
exports.authorizeRoles = authorizeRoles;

