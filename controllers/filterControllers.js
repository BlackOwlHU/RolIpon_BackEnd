const db = require('../models/database');

// márka lekérdezése
const brands = (req, res) => {
    const sql = 'SELECT* FROM brands';
    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Hiba az SQL-ben' });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: 'Nincs még márka' });
        }

        return res.status(200).json(result);
    });
};

// kategória lekérdezése
const category = (req, res) => {
    const sql = 'SELECT * FROM category';
    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Hiba az SQL-ben' });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: 'Nincs még kategória' });
        }

        return res.status(200).json(result);
    });
};

// új márka
const newBrand = (req, res) => {
    const brand = req.body.brand;

    //ellenőrzés
    if (brand === "" || brand === null || !brand) {
        return res.status(400).json({ error: 'Töltsd ki a mezőt!' })
    }

    db.query('INSERT INTO brands (brand_id, brand) VALUES (NULL, ?)', [brand], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Adatbázis hiba!' })
        }
        //ha nincs hiba
        return res.status(201).json({
            message: 'Sikeres feltöltés!',
            id: result.insertId
        })
    })
};

// márka törlése
const deleteBrand = (req, res) => {
    const brand_id = req.body.brand_id;

    if (!brand_id) {
        return res.status(400).json({ error: 'Add meg a márka ID-t!' });
    }

    const sql = 'DELETE FROM brands WHERE brand_id = ?';
    db.query(sql, [brand_id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Hiba az SQL-ben' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Nincs ilyen márka' });
        }

        return res.status(200).json({ message: 'Márka törölve' });
    });
};

// új kategória
const newCategory = (req, res) => {
    const category = req.body.category;
    const image = req.file ? req.file.filename : null;

    if (category === "" || image === null) {
        return res.status(400).json({ error: "Legyen a kategória neve és képe kitöltve" });
    }

    const sql = 'INSERT INTO category (category_id, category, image) VALUES(NULL, ?, ?)';
    db.query(sql, [category, image], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Hiba az SQL-ben' });
        }

        return res.status(201).json({ message: 'Kategória feltöltve', category_id: result.insertId });
    })
};

// kategória törlése
const deleteCategory = (req, res) => {
    const category_id = req.body.category_id;

    if (!category_id) {
        return res.status(400).json({ error: 'Add meg a kategória ID-t!' });
    }

    const sql = 'DELETE FROM category WHERE category_id = ?';
    db.query(sql, [category_id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Hiba az SQL-ben' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Nincs ilyen kategória' });
        }

        return res.status(200).json({ message: 'Kategória törölve' });
    });
};

module.exports = { brands, category, newBrand, deleteBrand, newCategory, deleteCategory };