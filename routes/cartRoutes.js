const express = require('express');
const authenticateToken = require('../middleware/jwtAuth');
const { getCart, addCart, removeCart} = require('../controllers/cartControllers');

const router = express.Router();

router.get('/cart', authenticateToken, getCart);
router.post('/addCart', authenticateToken, addCart);
router.delete('/removeCart', authenticateToken, removeCart);

module.exports = router;