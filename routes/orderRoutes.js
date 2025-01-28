const express = require('express');
const authenticateToken = require('../middleware/jwtAuth');
const { ordersGet, orderedItems, createOrder, deleteOrder} = require('../controllers/orderControllers');

const router = express.Router();

router.get('/orders', authenticateToken, ordersGet);
router.get('/orderedItems', authenticateToken, orderedItems);
router.post('/createOrder/:cart_id', authenticateToken, createOrder);
router.delete('/deleteOrder/:id', authenticateToken, deleteOrder);

module.exports = router;