const express = require('express');
const authenticateToken = require('../middleware/jwtAuth');
const { getCart, addCart, removeCart, putQuantity } = require('../controllers/cartControllers');

const router = express.Router();

router.get('/cart', authenticateToken, getCart);
router.post('/addCart', authenticateToken, addCart);
router.delete('/removeCart/:cart_items_id', authenticateToken, removeCart);
router.put('/putQuantity/:cart_items_id', authenticateToken, putQuantity);

module.exports = router;