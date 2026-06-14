const mysql = require('mysql2');


require('dotenv').config();
// console.log(process.env.DB_HOST)
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

connection.on('error', (error) => {
    console.log('MySQL connection error:', error.code || error.message || error);
});

module.exports = connection;