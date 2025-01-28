// sql crashel száma: 8
const express = require('express');//i can't remember
const mysql = require('mysql2');//sql database
const bcrypt = require('bcrypt');//crypting passwords
const dotenv = require('dotenv');//storing psw
const jwt = require('jsonwebtoken');//cookies
const multer = require('multer');//images
const fs = require('fs');
const path = require('path');
const validator = require('validator');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// általunk készített packagek importálása
const authenticateToken = require('./middleware/jwtAuth');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const productsRoutes = require('./routes/productsRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const filterRoutes = require('./routes/filterRoutes');

const app = express();

// middleware konfigurációk
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: 'http://127.0.0.1:5500',
    credentials: true
}));
app.use(cookieParser())

// az uploads mappa fájlok elérése
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// az általunk készített packagek használata
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/filter', filterRoutes);

module.exports = app;