const { sequelize, User, Customer, Item, OrderInfo, OrderLine, Stock } = require('../models');
const sendEmail = require('../utils/sendEmail');
const { generateReceiptPdfBuffer } = require('../utils/receiptPdf');

const loadTransactionById = async (id, transaction = null) => {
    return OrderInfo.findByPk(id, {
        include: [
            {
                model: Customer,
                include: [{ model: User, attributes: ['id', 'name', 'email'] }],
            },
            {
                model: OrderLine,
                as: 'lines',
                include: [{ model: Item }],
            },
        ],
        ...(transaction ? { transaction } : {}),
    });
};

const normalizeTransaction = (transaction) => {
    const plainTransaction = transaction.get({ plain: true });
    const lines = plainTransaction.lines || [];
    const subtotal = lines.reduce((sum, line) => {
        const price = Number(line.Item?.sell_price || 0);
        return sum + price * Number(line.quantity || 0);
    }, 0);
    const shipping = Number(plainTransaction.shipping || 0);
    const total = subtotal + shipping;
    const totalItems = lines.reduce((sum, line) => sum + Number(line.quantity || 0), 0);

    return {
        ...plainTransaction,
        customer_name: plainTransaction.Customer
            ? `${plainTransaction.Customer.fname || ''} ${plainTransaction.Customer.lname || ''}`.trim()
            : '',
        customer_email: plainTransaction.Customer?.User?.email || '',
        subtotal,
        total,
        totalItems,
        lines,
    };
};

const sendReceiptEmail = async (transactionRecord, title) => {
    const email = transactionRecord.Customer?.User?.email;

    console.log('[receiptEmail] preparing receipt email', {
        orderId: transactionRecord.orderinfo_id,
        email,
    });

    const pdfBuffer = await generateReceiptPdfBuffer(transactionRecord);
    const safePdfBuffer = Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer || '');

    console.log('[receiptEmail] pdfBuffer', {
        isBuffer: Buffer.isBuffer(pdfBuffer),
        safeBufferLength: safePdfBuffer.length,
        preview: safePdfBuffer.subarray(0, 40).toString('utf8'),
    });

    if (!email) {
        console.log('[receiptEmail] no email address found for transaction receipt');
        return;
    }

    const attachments = safePdfBuffer.length > 0
        ? [
            {
                filename: `receipt-order-${transactionRecord.orderinfo_id}.pdf`,
                content: safePdfBuffer,
                contentType: 'application/pdf',
            },
        ]
        : [];

    console.log('[receiptEmail] sending email with attachments', {
        attachmentCount: attachments.length,
        orderId: transactionRecord.orderinfo_id,
    });

    await sendEmail({
        email,
        subject: title,
        text: `Transaction ${transactionRecord.orderinfo_id} has been updated. The receipt is attached.`,
        html: `<p>Transaction <strong>${transactionRecord.orderinfo_id}</strong> has been processed. Your receipt is attached as a PDF.</p>`,
        attachments,
    });
};

const createOrder = async (req, res) => {
    const {
        cart,
        user,
        deliveryName,
        deliveryPhone,
        deliveryAddress,
        paymentMethod,
        shipping,
        orderNotes,
    } = req.body;

    if (!Array.isArray(cart) || cart.length === 0) {
        return res.status(400).json({ error: 'Cart is empty' });
    }

    if (!deliveryName || !deliveryPhone || !deliveryAddress || !paymentMethod) {
        return res.status(400).json({ error: 'Delivery and payment details are required' });
    }

    const transaction = await sequelize.transaction();

    try {
        let customer = await Customer.findOne({
            where: { user_id: user.id },
            include: [{ model: User, attributes: ['id', 'name', 'email'] }],
            transaction,
        });

        if (!customer) {
            const userRecord = await User.findByPk(user.id, { transaction });
            const [fname, ...lnameParts] = (userRecord?.name || '').split(' ');

            customer = await Customer.create(
                {
                    user_id: user.id,
                    fname: fname || '',
                    lname: lnameParts.join(' ') || '',
                    addressline: '',
                    zipcode: '',
                    phone: '',
                },
                { transaction }
            );
        }

        const customerPrimaryKey = Customer.primaryKeyAttribute || 'id';
        const customerId = customer?.[customerPrimaryKey] ?? customer?.id;

        const orderInfo = await OrderInfo.create(
            {
                customer_id: customerId,
                date_placed: new Date(),
                date_shipped: null,
                shipping: Number(shipping || 0),
                payment_method: paymentMethod,
                delivery_status: 'pending',
                delivery_name: deliveryName,
                delivery_address: deliveryAddress,
                delivery_phone: deliveryPhone,
                notes: orderNotes || null,
            },
            { transaction }
        );

        for (const item of cart) {
            await OrderLine.create(
                {
                    orderinfo_id: orderInfo.orderinfo_id,
                    item_id: item.item_id,
                    quantity: item.quantity,
                },
                { transaction }
            );

            const stockRecord = await Stock.findOne({
                where: { item_id: item.item_id },
                transaction,
            });

            if (stockRecord) {
                const orderedQuantity = Number(item.quantity || 0);
                const currentQuantity = Number(stockRecord.quantity || 0);

                await stockRecord.update(
                    {
                        quantity: Math.max(0, currentQuantity - orderedQuantity),
                    },
                    { transaction }
                );
            }
        }

        await transaction.commit();

        const createdTransaction = await loadTransactionById(orderInfo.orderinfo_id);
        try {
            await sendReceiptEmail(createdTransaction, 'Order Success');
        } catch (emailError) {
            console.log('Receipt email failed:', emailError);
        }

        return res.status(201).json({
            success: true,
            order_id: orderInfo.orderinfo_id,
            dateOrdered: orderInfo.date_placed,
            message: 'Order placed successfully',
            cart,
        });
    } catch (error) {
        await transaction.rollback();
        console.log(error);
        return res.status(500).json({ error: 'Transaction error', details: error.message });
    }
};

const getAllTransactions = async (req, res) => {
    try {
        const transactions = await OrderInfo.findAll({
            include: [
                {
                    model: Customer,
                    include: [{ model: User, attributes: ['id', 'name', 'email'] }],
                },
                {
                    model: OrderLine,
                    as: 'lines',
                    include: [{ model: Item }],
                },
            ],
            order: [['orderinfo_id', 'DESC']],
        });

        return res.status(200).json({
            rows: transactions.map(normalizeTransaction),
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error loading transactions', details: error.message });
    }
};

const getSingleTransaction = async (req, res) => {
    try {
        const transactionRecord = await loadTransactionById(req.params.id);

        if (!transactionRecord) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        return res.status(200).json({
            success: true,
            result: normalizeTransaction(transactionRecord),
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error loading transaction', details: error.message });
    }
};

const updateTransaction = async (req, res) => {
    const transactionId = req.params.id;
    const { shipping, date_shipped, delivery_status, cart } = req.body;
    const transaction = await sequelize.transaction();

    try {
        const orderRecord = await loadTransactionById(transactionId, transaction);

        if (!orderRecord) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Transaction not found' });
        }

        await orderRecord.update(
            {
                ...(shipping !== undefined ? { shipping } : {}),
                ...(date_shipped ? { date_shipped } : {}),
                ...(delivery_status ? { delivery_status } : {}),
            },
            { transaction }
        );

        if (Array.isArray(cart)) {
            await OrderLine.destroy({ where: { orderinfo_id: transactionId }, transaction });

            for (const item of cart) {
                await OrderLine.create(
                    {
                        orderinfo_id: transactionId,
                        item_id: item.item_id,
                        quantity: item.quantity,
                    },
                    { transaction }
                );
            }
        }

        await transaction.commit();

        const updatedTransaction = await loadTransactionById(transactionId);
        try {
            await sendReceiptEmail(updatedTransaction, 'Transaction Updated');
        } catch (emailError) {
            console.log('Receipt email failed:', emailError);
        }

        return res.status(200).json({
            success: true,
            message: 'Transaction updated successfully',
            result: normalizeTransaction(updatedTransaction),
        });
    } catch (error) {
        await transaction.rollback();
        console.log(error);
        return res.status(500).json({ error: 'Error updating transaction', details: error.message });
    }
};

const deleteTransaction = async (req, res) => {
    const transactionId = req.params.id;
    const transaction = await sequelize.transaction();

    try {
        const orderRecord = await OrderInfo.findByPk(transactionId, { transaction });

        if (!orderRecord) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Transaction not found' });
        }

        await OrderLine.destroy({ where: { orderinfo_id: transactionId }, transaction });
        await orderRecord.destroy({ transaction });

        await transaction.commit();

        return res.status(200).json({
            success: true,
            message: 'Transaction deleted successfully',
        });
    } catch (error) {
        await transaction.rollback();
        console.log(error);
        return res.status(500).json({ error: 'Error deleting transaction', details: error.message });
    }
};

module.exports = {
    createOrder,
    getAllTransactions,
    getSingleTransaction,
    updateTransaction,
    deleteTransaction,
};