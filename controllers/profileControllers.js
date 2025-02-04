const db = require('../models/database');
const validator = require('validator');
const bcrypt = require('bcrypt');

const getProfile = (req, res) => {
    const user_id = req.user.id;
    const sql = 'SELECT * FROM users WHERE user_id = ?';

    db.query(sql, [user_id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Hiba az SQL-ben' });
        }
        if (result.length === 0) {
            return res.status(404).json({ error: 'Felhasználó nem található' });
        }
        return res.status(200).json(result[0]); // Küldjük vissza az első elemet
    });
};
// profil szállítási és csomag elküldés név és telefonszám cím szerkesztése
const editProfile = (req, res) => {
    const { username, firstname, surname, city, postcode, address, tel } = req.body;
    const user_id = req.user.id;

    const sql = 'UPDATE users SET username = COALESCE(NULLIF(?, ""), username), firstname = COALESCE(NULLIF(?, ""), firstname), surname = COALESCE(NULLIF(?, ""), surname), city = COALESCE(NULLIF(?, ""), city), postcode = COALESCE(NULLIF(?, ""), postcode), address = COALESCE(NULLIF(?, ""), address), tel = COALESCE(NULLIF(?, ""), tel) WHERE user_id = ?';
    db.query(sql, [username, firstname, surname, city, postcode, address, tel, user_id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Hiba az SQL-ben' });
        }

        return res.status(200).json({ message: 'Profil szállítási adatai frissítve' });
    });
};

// Profil jelszó szerkesztése
const editPassword = (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const user_id = req.user.id;

    if (!validator.isLength(newPassword, { min: 6 })) {
        return res.status(400).json({ error: 'A jelszónak legalább 6 hosszúnak kell lennie' });
    }
    const sql = 'SELECT password FROM users WHERE user_id = ?';
    db.query(sql, [user_id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Hiba az SQL-ben' });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: 'Nincs ilyen felhasználó' });
        }

        const user_id = result[0];

        bcrypt.compare(oldPassword, user_id.password, (err, isMatch) => {
            if (isMatch) {
                bcrypt.hash(newPassword, 10, (err, hash) => {
                    if (err) {
                        return res.status(500).json({ error: 'Hiba a sózáskor!' });
                    }

                    const sqlUpdate = 'UPDATE users SET password = COALESCE(NULLIF(?, ""), password) WHERE user_id = ?';
                    db.query(sqlUpdate, [hash, user_id], (err, result) => {
                        if (err) {
                            return res.status(500).json({ error: 'Hiba az SQL-ben' });
                        }
                        return res.status(200).json({ message: 'Jelszó frissítve' });
                    });
                });
            } else {
                return res.status(401).json({ error: 'Rossz a jelszó' });
            }
        });
    });
};

module.exports = { getProfile, editProfile, editPassword };