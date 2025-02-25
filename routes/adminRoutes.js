const express = require('express');
const router = express.Router();
const adminAuth = require('../middlewares/adminAuth');

router.get('/dashboard', adminAuth, (req, res) => {
    res.status(200).json({ message: 'Admin felület elérhető' });
});

module.exports = router;