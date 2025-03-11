const express = require('express');
const authenticateToken = require('../middleware/jwtAuth');
const adminAuth = require('../middleware/adminAuth');
const { ordersGet, orderedItems, createOrder, deleteOrder, getAllOrders, getAllOrdersItems } = require('../controllers/orderControllers');

const router = express.Router();

router.get('/orders', authenticateToken, ordersGet);
router.get('/orderedItems/:order_id', authenticateToken, orderedItems);
router.post('/createOrder/:cart_id', authenticateToken, createOrder);
router.delete('/deleteOrder/:id', authenticateToken, deleteOrder);
router.get('getAllOrders', authenticateToken, getAllOrders);
router.get('getAllOrdersItems', authenticateToken, getAllOrdersItems)

module.exports = router;