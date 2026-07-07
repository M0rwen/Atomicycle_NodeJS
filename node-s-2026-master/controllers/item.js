const { Op } = require('sequelize');
const { sequelize, Item, Stock } = require('../models');

const normalizeImageValue = (value) => {
    if (!value) {
        return '';
    }

    if (Array.isArray(value)) {
        return value.map(normalizeImageValue).filter(Boolean);
    }

    const rawValue = String(value).trim();
    if (!rawValue) {
        return '';
    }

    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(rawValue);
            if (Array.isArray(parsed)) {
                return parsed.map(normalizeImageValue).filter(Boolean);
            }
        } catch (error) {
            // keep going with the raw string value
        }
    }

    const normalizedValue = rawValue.replace(/\\/g, '/');

    if (/^https?:\/\//i.test(normalizedValue)) {
        try {
            const parsedUrl = new URL(normalizedValue);
            return parsedUrl.pathname.startsWith('/images/') ? parsedUrl.pathname : `/images/${parsedUrl.pathname.split('/').filter(Boolean).pop()}`;
        } catch (error) {
            return normalizedValue;
        }
    }

    if (normalizedValue.includes('/images/')) {
        const matched = normalizedValue.match(/\/images\/[^?#]+/i);
        return matched ? matched[0] : normalizedValue;
    }

    const fileName = normalizedValue.split('/').filter(Boolean).pop();
    return fileName ? `/images/${fileName}` : normalizedValue;
};

const toImageList = (files) => {
    if (!files || files.length === 0) {
        return [];
    }

    return files
        .map((file) => {
            if (typeof file === 'string') {
                return normalizeImageValue(file);
            }

            return normalizeImageValue(file.path || file.filename || file.originalname);
        })
        .filter(Boolean);
};

const getStoredImageValue = (row) => {
    const rawValue = row?.img_path;

    if (!rawValue) {
        return [];
    }

    if (Array.isArray(rawValue)) {
        return rawValue.map(normalizeImageValue).filter(Boolean);
    }

    if (typeof rawValue === 'string') {
        try {
            const parsed = JSON.parse(rawValue);
            if (Array.isArray(parsed)) {
                return parsed.map(normalizeImageValue).filter(Boolean);
            }
        } catch (error) {
            return [normalizeImageValue(rawValue)].filter(Boolean);
        }

        return [normalizeImageValue(rawValue)].filter(Boolean);
    }

    return [];
};

const normalizeItem = (item) => {
    const plainItem = item.get({ plain: true });
    plainItem.quantity = plainItem.Stock?.quantity ?? plainItem.quantity ?? 0;
    plainItem.img_path = getStoredImageValue(plainItem);
    delete plainItem.Stock;
    return plainItem;
};

exports.getAllItems = async (req, res) => {
    try {
        const search = (req.query.search || '').trim();
        const where = { deleted_at: null };

        if (search) {
            where[Op.or] = [
                { description: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search.toLowerCase()}%` } },
            ];
        }

        const rows = await Item.findAll({
            where,
            include: [{ model: Stock }],
            order: [['item_id', 'DESC']],
        });

        return res.status(200).json({
            rows: rows.map(normalizeItem),
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error loading items', details: error.message });
    }
};

exports.getSingleItem = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await Item.findAll({
            where: { item_id: id, deleted_at: null },
            include: [{ model: Stock }],
        });

        return res.status(200).json({
            success: true,
            result: result.map(normalizeItem),
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error loading item', details: error.message });
    }
};

exports.createItem = async (req, res) => {
    const { description, cost_price, sell_price, quantity } = req.body;
    const imagePath = JSON.stringify(toImageList(req.files));

    if (!description || !cost_price || !sell_price) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const transaction = await sequelize.transaction();

    try {
        const item = await Item.create(
            {
                description,
                cost_price,
                sell_price,
                img_path: imagePath,
            },
            { transaction }
        );

        await Stock.create(
            {
                item_id: item.item_id,
                quantity: quantity ?? 0,
            },
            { transaction }
        );

        await transaction.commit();

        return res.status(201).json({
            success: true,
            itemId: item.item_id,
            image: imagePath,
            quantity: quantity ?? 0,
            result: item,
        });
    } catch (error) {
        await transaction.rollback();
        console.log(error);
        return res.status(500).json({ error: 'Error inserting item', details: error.message });
    }
};

exports.updateItem = async (req, res) => {
    const id = req.params.id;
    const { description, cost_price, sell_price, quantity } = req.body;
    const images = toImageList(req.files);

    if (!description || !cost_price || !sell_price) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const transaction = await sequelize.transaction();

    try {
        const currentItem = await Item.findByPk(id, { transaction });

        if (!currentItem) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Item not found' });
        }

        const currentImages = getStoredImageValue(currentItem);
        const imagePath = images.length > 0 ? JSON.stringify(images) : JSON.stringify(currentImages);

        await currentItem.update(
            {
                description,
                cost_price,
                sell_price,
                img_path: imagePath,
            },
            { transaction }
        );

        const [stock] = await Stock.findOrCreate({
            where: { item_id: id },
            defaults: { item_id: id, quantity: quantity ?? 0 },
            transaction,
        });

        if (stock) {
            await stock.update({ quantity: quantity ?? 0 }, { transaction });
        }

        await transaction.commit();

        return res.status(200).json({
            success: true,
        });
    } catch (error) {
        await transaction.rollback();
        console.log(error);
        return res.status(500).json({ error: 'Error updating item', details: error.message });
    }
};

exports.getArchivedItems = async (req, res) => {
    try {
        const rows = await Item.findAll({
            where: { deleted_at: { [Op.ne]: null } },
            include: [{ model: Stock }],
            order: [['item_id', 'DESC']],
        });

        return res.status(200).json({
            rows: rows.map(normalizeItem),
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error loading archived items', details: error.message });
    }
};

exports.restoreItem = async (req, res) => {
    const { id } = req.params;

    try {
        const [affectedRows] = await Item.update(
            { deleted_at: null },
            { where: { item_id: id } }
        );

        if (affectedRows === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }

        return res.status(200).json({
            success: true,
            message: 'Item restored successfully',
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error restoring item', details: error.message });
    }
};

exports.deleteItem = async (req, res) => {
    const id = req.params.id;
    const transaction = await sequelize.transaction();

    try {
        const currentItem = await Item.findByPk(id, { transaction });

        if (!currentItem) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Item not found' });
        }

        const timestamp = new Date();
        await currentItem.update({ deleted_at: timestamp }, { transaction });

        await transaction.commit();

        return res.status(200).json({
            success: true,
            message: 'item archived',
        });
    } catch (error) {
        await transaction.rollback();
        console.log(error);
        return res.status(500).json({ error: 'Error archiving item', details: error.message });
    }
};