const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

const sendEmail = require('../utils/sendEmail');
const { User, Customer } = require('../models');

const normalizeUserRole = (role) => role || 'user';

const splitAddressValue = (value) => {
    const cleanValue = (value || '').toString().trim();

    if (!cleanValue) {
        return { addressline: '', town: '' };
    }

    const parts = cleanValue.split(',').map((part) => part.trim()).filter(Boolean);

    if (parts.length <= 1) {
        return { addressline: cleanValue, town: '' };
    }

    return {
        addressline: parts[0],
        town: parts.slice(1).join(', '),
    };
};

const saveTokenForUser = async (userId, token) => {
    await User.update({ token }, { where: { id: userId } });
};

const getUserProfile = async (req, res) => {
    const userId = req.user?.id || req.body?.user?.id;

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    try {
        const [customer, created] = await Customer.findOrCreate({
            where: { user_id: userId },
            defaults: {
                fname: '',
                lname: '',
                addressline: '',
                zipcode: '',
                phone: '',
                user_id: userId,
            },
        });

        const user = await User.findByPk(userId, {
            attributes: ['id', 'name', 'email', 'role'],
        });

        const addressParts = splitAddressValue(customer.addressline);

        return res.status(200).json({
            success: true,
            result: {
                ...customer.get({ plain: true }),
                ...addressParts,
                name: user?.name || '',
                email: user?.email || '',
                role: normalizeUserRole(user?.role),
            },
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error loading profile', details: error.message });
    }
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
    const { fname, lname, addressline, zipcode, phone, userId, town } = req.body;
    const imagePath = req.file
        ? `/images/${req.file.filename}`
        : undefined;
    const resolvedUserId = userId || req.user?.id || req.body?.user?.id;
    const fullAddress = [addressline, town].filter((value) => typeof value === 'string' && value.trim()).join(', ');

    if (!resolvedUserId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    try {
        const [customer, created] = await Customer.findOrCreate({
            where: { user_id: resolvedUserId },
            defaults: {
                fname: fname || '',
                lname: lname || '',
                addressline: fullAddress,
                zipcode: zipcode || '',
                phone: phone || '',
                image_path: imagePath || null,
                user_id: resolvedUserId,
            },
        });

        if (!created) {
            await customer.update({
                fname: fname || '',
                lname: lname || '',
                addressline: fullAddress,
                zipcode: zipcode || '',
                phone: phone || '',
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

const getArchivedUsers = async (req, res) => {
    try {
        const rows = await User.findAll({
            attributes: ['id', 'name', 'email', 'role', 'token', 'deleted_at'],
            where: { deleted_at: { [Op.ne]: null } },
            order: [['id', 'DESC']],
        });

        return res.status(200).json({ rows });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error loading archived users', details: error.message });
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

const restoreUserById = async (req, res) => {
    const { id } = req.params;

    try {
        const [affectedRows] = await User.update(
            { deleted_at: null },
            { where: { id } }
        );

        if (affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json({
            success: true,
            message: 'User restored successfully',
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error restoring user', details: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
    updateUser,
    deactivateUser,
    getAllUsers,
    getArchivedUsers,
    updateUserRole,
    deactivateUserById,
    restoreUserById,
};