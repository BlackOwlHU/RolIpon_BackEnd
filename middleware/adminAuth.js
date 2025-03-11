const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/dotenvConfig').config;

function adminAuth(req, res, next){
    const token = req.cookies.auth_token;

    if (!token) {
        return res.status(401).json({ error: 'Nincs jogosultság (nincs token)' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        if (!decoded.isAdmin) {
            return res.status(403).json({ error: 'Hozzáférés megtagadva (nem admin)' });
        }

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Érvénytelen token' });
    }
};

module.exports = adminAuth;
