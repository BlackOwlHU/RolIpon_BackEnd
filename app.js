// sql crashel száma: 20
const express = require('express');//i can't remember
const path = require('path');
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
    origin: 'https://rolipon.netlify.app/',
    credentials: true
}));
app.use(cookieParser())

// az uploads mappa fájlok elérése
app.use('/uploads', authenticateToken, express.static(path.join(__dirname, 'uploads')));

// az általunk készített packagek használata
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/filter', filterRoutes);

module.exports = app;