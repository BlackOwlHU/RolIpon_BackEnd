const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/dotenvConfig').config;

function authenticateToken(req, res , next){
    const token = req.cookies.auth_token;
    if(!token){
        return res.status(403).json({error: 'Nincs token'});
    }
    jwt.verify(token, JWT_SECRET, (err, user)=>{
        if(err){
            return res.status(403).json({error: 'Van token, csak épp nem érvényes'});
        }
        req.user = user;
        next();
    })
};

module.exports = authenticateToken;