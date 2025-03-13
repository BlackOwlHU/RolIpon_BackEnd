const db = require('../models/database');

// termékek lekérdezése brand és category szűrés alapján
const products = (req, res) => {
    const { brand, category } = req.params;
    const { search } = req.query;

    let sql = `
        SELECT products.product_id, products.product_name, category.category, brands.brand, products.price, products.is_in_stock, products.description, products.image 
        FROM products 
        INNER JOIN brands ON products.brand_id = brands.brand_id 
        INNER JOIN category ON products.category_id = category.category_id
    `;

    const params = [];

    if (brand !== "0") {
        sql += ' WHERE products.brand_id = ?';
        params.push(brand);
    }

    if (category !== "0") {
        sql += params.length ? ' AND' : ' WHERE';
        sql += ' products.category_id = ?';
        params.push(category);
    }

    if (search) {
        sql += params.length ? ' AND' : ' WHERE';
        sql += ' (products.product_name LIKE ? OR products.price LIKE ? OR products.description LIKE ?)';
        const searchQuery = `%${search}%`;
        params.push(searchQuery, searchQuery, searchQuery);
    }

    db.query(sql, params, (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        return res.status(200).json(result);
    });
};

// Megadott termék lekérése
const thisProduct = (req, res) => {
    const product_id = req.params.product_id;
    const sql = 'SELECT products.product_id, products.product_name, category.category, brands.brand, products.price, products.is_in_stock, products.description, products.image FROM products INNER JOIN brands ON products.brand_id = brands.brand_id INNER JOIN category ON products.category_id = category.category_id WHERE product_id = ?';
    db.query(sql, [product_id], (err, result) => {
        if(err){
            return res.status(500).json({ error: 'Hiba az SQL-ben'});
        }
        if(result.length === 0){
            return res.status(404).json({ error: 'Nincs ilyen termék' });
        }
        return res.status(200).json(result);
    })
};

// Új termék hozzáadása
const newProduct = (req, res) => {
    const { product_name, category_id, brand_id, price, is_in_stock, description } = req.body;
    const image = req.file ? req.file.filename : null;

    if (!product_name || !category_id || !brand_id || !price) {
        return res.status(400).json({ error: 'Hiányzó kötelező mezők!' });
    }

    const checkSql = `
        SELECT 
            (SELECT COUNT(*) FROM category WHERE category_id = ?) AS category_exists,
            (SELECT COUNT(*) FROM brands WHERE brand_id = ?) AS brand_exists;
    `;
    db.query(checkSql, [category_id, brand_id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Hiba az ellenőrzés során!' });
        }

        const categoryExists = results[0].category_exists > 0;
        const brandExists = results[0].brand_exists > 0;

        if (!categoryExists || !brandExists) {
            return res.status(400).json({ error: 'Érvénytelen category_id vagy brand_id!' });
        }

        const insertSql = `
            INSERT INTO products (product_id, product_name, category_id, brand_id, price, is_in_stock, description, image)
            VALUES (NULL, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [product_name, category_id, brand_id, price, is_in_stock, description, image];

        db.query(insertSql, [product_name, category_id, brand_id, price, is_in_stock, description, image], (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Hiba a termék beszúrása során!' });
            }

            res.status(201).json({
                message: 'Új termék sikeresen hozzáadva!',
                product_id: result.insertId,
            });
        });
    });
};

// Termék törlése
const deleteProduct = (req, res) => {
    const product_id = req.body.product_id;

    if (!product_id) {
        return res.status(400).json({ error: 'Add meg a termék ID-t!' });
    }

    const sql = 'DELETE FROM products WHERE product_id = ?';
    db.query(sql, [product_id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Hiba az SQL-ben' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Nincs ilyen termék' });
        }

        return res.status(200).json({ message: 'Termék törölve' });
    });
};

module.exports = { products, thisProduct, newProduct, deleteProduct };