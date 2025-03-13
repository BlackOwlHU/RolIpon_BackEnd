const express = require('express');
const authenticateToken = require('../middleware/jwtAuth');
const upload = require('../middleware/multer');
const { products, thisProduct, newProduct, deleteProduct } = require('../controllers/productsControllers');

const router = express.Router();

router.get('/getProducts/:brand/:category', authenticateToken, products);
router.get('/thisProduct/:product_id', authenticateToken, thisProduct);
router.post('/newProduct', authenticateToken, upload.single('image'), newProduct);
router.delete('/deleteProduct', authenticateToken, deleteProduct);

module.exports = router;