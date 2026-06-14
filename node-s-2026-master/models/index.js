const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'user',
    },
    token: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    tableName: 'users',
});

const Customer = sequelize.define('Customer', {
    customer_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    fname: DataTypes.STRING,
    lname: DataTypes.STRING,
    addressline: DataTypes.STRING,
    zipcode: DataTypes.STRING,
    phone: DataTypes.STRING,
    image_path: DataTypes.TEXT,
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    tableName: 'customer',
});

const Item = sequelize.define('Item', {
    item_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    description: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    cost_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    sell_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    img_path: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
}, {
    tableName: 'item',
});

const Stock = sequelize.define('Stock', {
    item_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
}, {
    tableName: 'stock',
});

const OrderInfo = sequelize.define('OrderInfo', {
    orderinfo_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    customer_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    date_placed: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    date_shipped: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    shipping: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
    },
}, {
    tableName: 'orderinfo',
});

const OrderLine = sequelize.define('OrderLine', {
    orderline_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    orderinfo_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    item_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
}, {
    tableName: 'orderline',
});

User.hasOne(Customer, { foreignKey: 'user_id' });
Customer.belongsTo(User, { foreignKey: 'user_id' });

Customer.hasMany(OrderInfo, { foreignKey: 'customer_id' });
OrderInfo.belongsTo(Customer, { foreignKey: 'customer_id' });

OrderInfo.hasMany(OrderLine, { foreignKey: 'orderinfo_id', as: 'lines' });
OrderLine.belongsTo(OrderInfo, { foreignKey: 'orderinfo_id' });

Item.hasOne(Stock, { foreignKey: 'item_id' });
Stock.belongsTo(Item, { foreignKey: 'item_id' });

OrderLine.belongsTo(Item, { foreignKey: 'item_id' });
Item.hasMany(OrderLine, { foreignKey: 'item_id' });

module.exports = {
    sequelize,
    User,
    Customer,
    Item,
    Stock,
    OrderInfo,
    OrderLine,
};