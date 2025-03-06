const db = require('../models/database');

// termékek lekérdezése brand és category szűrés alapján
const products = (req, res) => {
    const {brand, category} = req.params;
    //console.log(req.params, brand, category);
    
    const sqlProducts = 'SELECT products.product_id, products.product_name, category.category, brands.brand, products.price, products.is_in_stock, products.description, products.image FROM `products` INNER JOIN brands ON products.brand_id = brands.brand_id INNER JOIN category ON products.category_id = category.category_id';
    const sql = 'SELECT products.product_id, products.product_name, category.category, brands.brand, products.price, products.is_in_stock, products.description, products.image FROM products INNER JOIN brands ON products.brand_id = brands.brand_id INNER JOIN category ON products.category_id = category.category_id WHERE products.brand_id = ? AND products.category_id = ?';
    const sqlBrand = 'SELECT products.product_id, products.product_name, category.category, brands.brand, products.price, products.is_in_stock, products.description, products.image FROM products INNER JOIN brands ON products.brand_id = brands.brand_id INNER JOIN category ON products.category_id = category.category_id WHERE products.brand_id = ?';
    const sqlCategory = 'SELECT products.product_id, products.product_name, category.category, brands.brand, products.price, products.is_in_stock, products.description, products.image FROM products INNER JOIN brands ON products.brand_id = brands.brand_id INNER JOIN category ON products.category_id = category.category_id WHERE products.category_id = ?';
    
    if (brand === "0" && category === "0") {
        db.query(sqlProducts, (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Hiba az SQL-ben' });
            }
    
            if (result.length === 0) {
                return res.status(200).json([]);
            }
            //console.log("mind");
            
            return res.status(200).json(result);
        });
    }else{
        if (brand !== "0" && category === "0") {
            db.query(sqlBrand, [brand], (err, result) => {
                if (err) {
                    return res.status(500).json({ error: 'Hiba az SQL-ben' });
                }
                if (result.length === 0) {
                    return res.status(200).json([]);
                }
                //console.log("brand");
                return res.status(200).json(result);
            });
        }else{
            if (category !== "0" && brand === "0") {
                db.query(sqlCategory, [category], (err, result) => {
                    if (err) {
                        return res.status(500).json({ error: 'Hiba az SQL-ben' });
                    }
            
                    if (result.length === 0) {
                        return res.status(200).json([]);
                    }
                    //console.log("kategória");
                    return res.status(200).json(result);
                });
            }else{
                if( brand !== "0" && category !== "0"){
                db.query(sql, [brand, category] , (err, result) => {
                    if (err) {
                        return res.status(500).json({ error: 'Hiba az SQL-ben' });
                    }
            
                    if (result.length === 0) {
                        return res.status(200).json([]);
                    }
                    //console.log("konkrét");
                    return res.status(200).json(result);
                });
            }}
        }
    } 
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

    // Ellenőrzés: Kötelező mezők
    if (!product_name || !category_id || !brand_id || !price) {
        return res.status(400).json({ error: 'Hiányzó kötelező mezők!' });
    }

    // Ellenőrizzük, hogy létezik-e a megadott category_id és brand_id
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

        // Beszúrás a termékek táblába
        const insertSql = `
            INSERT INTO products (product_id, product_name, category_id, brand_id, price, is_in_stock, description, image)
            VALUES (NULL, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [product_name, category_id, brand_id, price, is_in_stock, description, image];

        db.query(insertSql, [product_name, category_id, brand_id, price, is_in_stock, description, image], (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Hiba a termék beszúrása során!' });
            }

            // Visszaadjuk az új termék ID-ját
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