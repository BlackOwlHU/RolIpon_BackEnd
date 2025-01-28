const express = require('express');
const authenticateToken = require('../middleware/jwtAuth');
const { editProfile, editPassword } = require('../controllers/profileControllers');

const router = express.Router();

router.post('/editProfile', authenticateToken, editProfile);
router.post('/editPassword', authenticateToken, editPassword);

module.exports = router;