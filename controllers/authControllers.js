const bcrypt = require('bcryptjs');
const validator = require('validator');
const db = require('../models/database');
const jwt = require('jsonwebtoken');
const {JWT_SECRET} = require('../config/dotenvConfig').config;

const register = (req, res) => {
    const { username, email, password } = req.body;
    const errors = [];

    if (validator.isEmpty(username)) {
        errors.push({ error: 'Töltsd ki a neved!' });
    }

    if (!validator.isEmail(email)) {
        errors.push({ error: 'Nem valós email cím!' });
    }

    if (!validator.isLength(password, { min: 6 })) {
        errors.push({ error: 'A jelszónak legalább 6 karakternek kell lennie!' });
    }

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }
    const sqlIsExist = 'SELECT * FROM users WHERE email = ?';
    db.query(sqlIsExist, [email], (err, result) => {
        if(err){
            return res.status(500).json({ error: 'Hiba az email azonosítása során.' })
        }
        if(result.length > 0){
            return res.status(200).json({ message: 'Már regisztráltak ezzel a felhasználóval'});
        }
        if(result.length === 0){
            bcrypt.hash(password, 10, (err, hash) => {
                if (err) {
                    return res.status(500).json({ error: 'Hiba a hashelés során' });
                }
                const sql = 'INSERT INTO users (user_id, username, email, password) VALUES(NULL, ?, ?, ?)';
        
                db.query(sql, [username, email, hash], (err, result) => {
                    //console.log(err)
                    if (err) {
                        return res.status(500).json({ error: 'Hiba a regisztráció során!' });
                    }
        
                    const user_id = result.insertId;
        
                    const cartSql = 'INSERT INTO cart (user_id) VALUES (?)';
                    db.query(cartSql, [user_id], (err, cartResult) => {
                        if (err) {
                            return res.status(500).json({ error: 'Hiba a kosár létrehozása során!' });
                        }
        
                        res.status(201).json({
                            message: 'Sikeres regisztráció és kosár létrehozva!',
                            userId: user_id,
                            cartId: cartResult.insertId,
                        });
                    });
                });
            });
        }
    });
};

const login = (req, res) => {
    const { email, password } = req.body;
    const errors = [];

    if (!validator.isEmail(email)) {
        errors.push({ error: 'Add meg az email címet' });
    }

    if (validator.isEmpty(password)) {
        errors.push({ error: 'Add meg a jelszót' });
    }

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Hiba az SQL-ben' });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: 'A felhasználó nem található' });
        }

        const user = result[0];
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (isMatch) {
                const token = jwt.sign(
                    { id: user.user_id, isAdmin: user.admin },
                    JWT_SECRET,
                    { expiresIn: '1y' }
                );

                res.cookie('auth_token', token, {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'none',
                    maxAge: 1000 * 60 * 60 * 24 * 30 * 12
                });
                return res.status(200).json({ message: 'Sikeres bejelentkezés', isAdmin: user.admin });
            } else {
                res.status(401).json({ error: 'Rossz a jelszó' });
            }
        });
    });
};

const logout = (req, res) => {
    res.clearCookie('auth_token', {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
    });
    return res.status(200).json({ message: 'Sikeres kijelentkezés!' });
};

const test = (req, res) => {
    return res.status(200).json({ message: 'bent vagy' });
};

module.exports = { register, login, logout, test };