const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path')

const items = require('./routes/item');
const users = require('./routes/user');
const orders = require('./routes/order');
const reviews = require('./routes/review');
const dashboard = require('./routes/dashboard');

const frontendDir = path.join(__dirname, '..', 'itcp237-js-s-2026-master');

app.use(cors())
app.use(express.json())
app.use(express.static(frontendDir));
app.use('/images', express.static(path.join(__dirname, 'images')))

app.get('/', (req, res) => res.sendFile(path.join(frontendDir, 'home.html')));

app.use('/api/v1', items);
app.use('/api/v1', users);
app.use('/api/v1', orders);
app.use('/api/v1', reviews);
app.use('/api/v1', dashboard);

module.exports = app