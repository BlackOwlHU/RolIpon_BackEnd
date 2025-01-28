const express = require('express');
const authenticateToken = require('../middleware/jwtAuth');
const upload = require('../middleware/multer');
const { brands, category, newBrand, deleteBrand, newCategory, deleteCategory } = require('../controllers/filterControllers');

const router = express.Router();

router.get('/brands', authenticateToken, brands);
router.get('/category', authenticateToken, category);
router.post('/newbrand', authenticateToken, newBrand);
router.delete('/brand/delete', authenticateToken, deleteBrand);
router.post('/newcategory', authenticateToken, upload.single('image'), newCategory);
router.delete('/category/delete', authenticateToken, deleteCategory);

module.exports = router;