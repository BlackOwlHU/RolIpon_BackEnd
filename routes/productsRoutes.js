const express = require('express');
const authenticateToken = require('../middleware/jwtAuth');
const upload = require('../middleware/multer');
const { products, newProduct, deleteProduct} = require('../controllers/productsControllers');

const router = express.Router();

router.get('/getProducts', authenticateToken, products);
router.post('/newProduct', authenticateToken, upload.single('image'), newProduct);
router.delete('/deleteProduct', authenticateToken, deleteProduct);

module.exports = router;