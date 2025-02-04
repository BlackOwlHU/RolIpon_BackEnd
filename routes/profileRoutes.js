const express = require('express');
const authenticateToken = require('../middleware/jwtAuth');
const { getProfile, editProfile, editPassword } = require('../controllers/profileControllers');

const router = express.Router();

router.get('/getProfile', authenticateToken, getProfile);
router.put('/editProfile', authenticateToken, editProfile);
router.put('/editPassword', authenticateToken, editPassword);

module.exports = router;