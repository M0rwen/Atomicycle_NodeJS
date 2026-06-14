const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const sendEmail = require('../utils/sendEmail');
const { User, Customer } = require('../models');

const normalizeUserRole = (role) => role || 'user';

const saveTokenForUser = async (userId, token) => {
    await User.update({ token }, { where: { id: userId } });
};

const registerUser = async (req, res) => {
    const { name, password, email } = req.body;

    if (!name || !password || !email) {
        return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    try {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ error: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await User.create({
            name,
            password: hashedPassword,
            email,
            role: 'user',
        });

        return res.status(201).json({
            success: true,
            result,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error registering user', details: error.message });
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({
            where: { email, deleted_at: null },
        });

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { id: user.id, role: normalizeUserRole(user.role) },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        await saveTokenForUser(user.id, token);

        try {
            await sendEmail({
                email: user.email,
                subject: 'Atomicycle Login Token',
                message: `Your authentication token is: ${token}`,
            });
        } catch (emailError) {
            console.log('Token email failed:', emailError);
        }

        const safeUser = user.get({ plain: true });
        delete safeUser.password;
        safeUser.role = normalizeUserRole(safeUser.role);

        return res.status(200).json({
            success: 'welcome back',
            user: safeUser,
            token,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error logging in', details: error.message });
    }
};

const updateUser = async (req, res) => {
    const { fname, lname, addressline, zipcode, phone, userId } = req.body;
    const imagePath = req.file ? req.file.path.replace(/\\/g, '/') : undefined;

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    try {
        const [customer, created] = await Customer.findOrCreate({
            where: { user_id: userId },
            defaults: {
                fname: fname || '',
                lname: lname || '',
                addressline: addressline || '',
                zipcode: zipcode || '',
                phone: phone || '',
                image_path: imagePath || null,
                user_id: userId,
            },
        });

        if (!created) {
            await customer.update({
                fname,
                lname,
                addressline,
                zipcode,
                phone,
                ...(imagePath ? { image_path: imagePath } : {}),
            });
        }

        return res.status(200).json({
            success: true,
            message: 'profile updated',
            result: customer,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error updating profile', details: error.message });
    }
};

const deactivateUser = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        const timestamp = new Date();
        const [affectedRows] = await User.update(
            { deleted_at: timestamp },
            { where: { email } }
        );

        if (affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json({
            success: true,
            message: 'User deactivated successfully',
            email,
            deleted_at: timestamp,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error deactivating user', details: error.message });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const rows = await User.findAll({
            attributes: ['id', 'name', 'email', 'role', 'token', 'deleted_at'],
            where: { deleted_at: null },
            order: [['id', 'DESC']],
        });

        return res.status(200).json({ rows });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error loading users', details: error.message });
    }
};

const updateUserRole = async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!role) {
        return res.status(400).json({ error: 'Role is required' });
    }

    try {
        const [affectedRows] = await User.update({ role }, { where: { id } });

        if (affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json({
            success: true,
            message: 'User role updated successfully',
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error updating role', details: error.message });
    }
};

const deactivateUserById = async (req, res) => {
    const { id } = req.params;
    const timestamp = new Date();

    try {
        const [affectedRows] = await User.update(
            { deleted_at: timestamp, token: null },
            { where: { id } }
        );

        if (affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json({
            success: true,
            message: 'User deactivated successfully',
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error deactivating user', details: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    updateUser,
    deactivateUser,
    getAllUsers,
    updateUserRole,
    deactivateUserById,
};