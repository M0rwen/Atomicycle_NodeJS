const jwt = require("jsonwebtoken")
const connection = require('../config/database')

exports.isAuthenticatedUser = (req, res, next) => {

    console.log(req.headers)

    if (!req.header('Authorization')) {
        return res.status(401).json({ message: 'Login first to access this resource' })
    }

    const token = req.header('Authorization').split(' ')[1];
    console.log(token)


    if (!token) {
        return res.status(401).json({ message: 'Login first to access this resource' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.body = req.body || {}
    console.log(decoded.id)
    req.body.user = { id: decoded.id, role: decoded.role }
    console.log(req.body)

    next()
};

exports.isAdminUser = (req, res, next) => {
    if (!req.header('Authorization')) {
        return res.status(401).json({ message: 'Login first to access this resource' })
    }

    const token = req.header('Authorization').split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Login first to access this resource' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    connection.execute('SELECT role FROM users WHERE id = ? AND deleted_at IS NULL', [decoded.id], (err, rows) => {
        if (err) {
            console.log(err)
            return res.status(500).json({ message: 'Unable to verify admin access' })
        }

        const role = rows.length > 0 ? rows[0].role : null

        if (role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' })
        }

        req.body = req.body || {}
        req.body.user = { id: decoded.id, role }
        next()
    })
};

