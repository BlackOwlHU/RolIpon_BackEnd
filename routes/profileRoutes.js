const express = require('express');
const authenticateToken = require('../middleware/jwtAuth');
const { editProfile, editPassword } = require('../controllers/profileControllers');

const router = express.Router();

router.put('/editProfile', authenticateToken, editProfile);
router.put('/editPassword', authenticateToken, editPassword);

module.exports = router;