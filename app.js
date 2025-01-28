// sql crashel száma: 8
const express = require('express');//i can't remember
const mysql = require('mysql2');//sql database
const bcrypt = require('bcrypt');//crypting passwords
const dotenv = require('dotenv');//storing psw
const jwt = require('jsonwebtoken');//cookies
const multer = require('multer');//images
const fs = require('fs');
const path = require('path');
const validator = require('validator');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// általunk készített packagek importálása
const authenticateToken = require('./middleware/jwtAuth');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');

const app = express();

// middleware konfigurációk
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: 'http://127.0.0.1:5500',
    credentials: true
}));
app.use(cookieParser())

// az uploads mappa fájlok elérése
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// az általunk készített packagek használata
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);

// Rendelés felhasználóval, lakcím és postázási információkkal, rendelés árával lekérdezése
app.get('/api/ordersGet', authenticateToken, (req, res) => {
    const user_id = req.user.id;
    const sql = 'SELECT users.firstname, users.surname, users.city, users.postcode, users.address, users.tel, orders.order_id, orders.order_date, orders.total_amount FROM users JOIN orders ON users.user_id = orders.user_id WHERE users.user_id = ?';
    pool.query(sql, [user_id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Hiba az SQL-ben' });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: 'Nincs még rendelés' });
        }

        return res.status(200).json(result);
    });
});

// rendelt termékek lekérdezése
app.get('/api/orderedItems', authenticateToken, (req, res) => {
    const user_id = req.user.id;
    const sqlOrderID = 'SELECT order_id FROM orders WHERE user_id = ?';
    const sql = 'SELECT order_items.product_id, order_items.quantity, order_items.unit_price, products.product_name FROM order_items JOIN products ON order_items.product_id = products.product_id WHERE order_items.order_id = ?';
    pool.query(sqlOrderID, [user_id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Hiba az SQL-ben' });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: 'Nincs még rendelés' });
        }

        const order_id = result[0].order_id;
        pool.query(sql, [order_id], (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Hiba az SQL-ben' });
            }

            if (result.length === 0) {
                return res.status(404).json({ error: 'Nincs még rendelt termék' });
            }

            return res.status(200).json(result);
        });
    });
});

// Rendelés törlése
app.delete('/api/deleteOrder/:id', authenticateToken, (req, res) => {
    const user_id = req.params.id;

    const sql = 'DELETE FROM orders WHERE user_id = ?';
    const sqlDeleteOrder_Items = 'DELETE FROM order_items WHERE order_id = ?';
    const sqlSelectOrderId = 'SELECT order_id FROM orders WHERE user_id = ?';

    pool.query(sqlSelectOrderId, [user_id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Hiba az SQL-ben' });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: 'Nincs ilyen rendelés' });
        }

        const order_id = result[0].order_id;

        pool.query(sqlDeleteOrder_Items, [order_id], (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Hiba az SQL-ben' });
            }
        });

        pool.query(sql, [user_id], (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Hiba az SQL-ben' });
            }

            return res.status(200).json({ message: 'Rendelés törölve' });
        });
    });
});

// termékek
app.get('/api/products', authenticateToken, (req, res) => {
    const sql = 'SELECT * FROM products';
    pool.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Hiba az SQL-ben' });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: 'Nincs még termék' });
        }

        return res.status(200).json(result);
    });
});

// márka lekérdezése
app.get('/api/brands', authenticateToken, (req, res) => {
    const sql = 'SELECT* FROM brands';
    pool.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Hiba az SQL-ben' });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: 'Nincs még márka' });
        }

        return res.status(200).json(result);
    });
});

// kategória lekérdezése
app.get('/api/category', authenticateToken, (req, res) => {
    const sql = 'SELECT * FROM category';
    pool.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Hiba az SQL-ben' });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: 'Nincs még kategória' });
        }

        return res.status(200).json(result);
    });
});

// rendelés táblába rerdelés létrehozása, rendelési adatok táblába adatok beszúrása és kosár ürítése
app.post('/api/order/:cart_id', authenticateToken, (req, res) => {
    const user_id = req.user.id;
    const cart_id = req.params.cart_id;
    var item_result = [];
    var total_amount = 0;

    const sqlSelectCart_Items = `
                SELECT 
                    cart_items.cart_items_id,
                    cart_items.product_id,
                    products.product_name,
                    (products.price*cart_items.quantity) AS total_price,
                    products.price,
                    cart_items.quantity
                FROM cart_items
                JOIN products ON cart_items.product_id = products.product_id
                WHERE cart_items.cart_id = ?`;
    const sqlInsertOrder = 'INSERT INTO orders (order_id, user_id, order_date) VALUES (NULL, ?, NOW())';
    pool.query(sqlInsertOrder, [user_id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Hiba az SQL-ben' });
        }
        const order_id = result.insertId;
        pool.query(sqlSelectCart_Items, [cart_id], (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Hiba az SQL-ben' });
            }

            if (result.length === 0) {
                return res.status(404).json({ error: 'Nincs ilyen kosár' });
            }

            item_result = result;
            const sqlInsertOrder_Items = 'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)';
            
            item_result.forEach((item) => {
                total_amount += Number(item.total_price);
                pool.query(sqlInsertOrder_Items, [order_id, item.product_id, item.quantity, item.price], (err, result) => {
                    if (err) {
                        return res.status(500).json({ error: 'Hiba az SQL-ben' });
                    }
                });
            const sqlDeleteCart_Items = 'DELETE FROM cart_items WHERE cart_id = ?';
            pool.query(sqlDeleteCart_Items, [cart_id], (err, result) => {
                if (err) {
                    return res.status(500).json({ error: 'Hiba az SQL-ben' });
                }
                const sqlUpdateOrder = 'UPDATE orders SET total_amount = ? WHERE order_id = ?';
                pool.query(sqlUpdateOrder, [total_amount, order_id], (err, result) => {
                    if (err) {
                        return res.status(500).json({ error: 'Hiba az SQL-ben' });
                    }
                    });
                });
            });
            return res.status(200).json({ message: 'Rendelés sikeres' });
        });
    });
});

// termék kosárhoz adása
app.post('/api/cart/add', authenticateToken, (req, res) => {
    const user_id = req.user.id; // Assuming the user ID is stored in the token
    const { product_id, quantity } = req.body;

    if (!product_id || !quantity) {
        return res.status(400).json({ error: 'Product ID and quantity are required!' });
    }

    // Check if the product exists
    pool.query('SELECT * FROM products WHERE product_id = ?', [product_id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error!' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Product not found!' });
        }

        // Get the user's cart ID
        pool.query('SELECT cart_id FROM cart WHERE user_id = ?', [user_id], (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Database error!' });
            }

            let cart_id;
            if (results.length === 0) {
                // Create a new cart if the user doesn't have one
                pool.query('INSERT INTO carts (user_id) VALUES (?)', [user_id], (err, result) => {
                    if (err) {
                        return res.status(500).json({ error: 'Database error!' });
                    }
                    return res.status(201).json({ message: 'Cart created!' });
                });
            } else {
                cart_id = results[0].cart_id;
                const sqlInsert = 'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)';
                pool.query(sqlInsert, [cart_id, product_id, quantity], (err, result) => {
                    if (err) {
                        return res.status(500).json({ error: 'Database error!' });
                    }
                    return res.status(201).json({ message: 'Product added to cart!' });
                });
            }
        });
    });
});

// termék lekérése
app.get('/api/cart', authenticateToken, (req, res) => {
    const user_id = req.user.id;

    // Get the user's cart ID
    pool.query('SELECT cart_id FROM cart WHERE user_id = ?', [user_id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error!' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Cart not found!' });
        }

        const cart_id = results[0].cart_id;
        const sql = `
            SELECT 
                cart_items.cart_items_id,
                cart_items.product_id,
                products.product_name,
                (products.price*cart_items.quantity) AS total_price,
                products.price,
                cart_items.quantity
            FROM cart_items
            JOIN products ON cart_items.product_id = products.product_id
            WHERE cart_items.cart_id = ?
        `;

        pool.query(sql, [cart_id], (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Database error!' });
            }
            if (results.length === 0) {
                return res.status(404).json({ error: 'No items in cart!' });
            }

            return res.status(200).json(results);
        });
    });
});

// termék kivétele kosárból
app.delete('/api/cart/remove', authenticateToken, (req, res) => {
    const user_id = req.user.id;
    const { cart_items_id } = req.body;

    if (!cart_items_id) {
        return res.status(400).json({ error: 'Cart item ID is required!' });
    }

    const sql = `
        DELETE cart_items
        FROM cart_items
        JOIN cart ON cart_items.cart_id = cart.cart_id
        WHERE cart.user_id = ? AND cart_items.cart_items_id = ?
    `;

    pool.query(sql, [user_id, cart_items_id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Database error!' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Cart item not found!' });
        }

        return res.status(200).json({ message: 'Cart item removed!' });
    });
});

// Új termék hozzáadása
app.post('/api/newproducts', authenticateToken, upload.single('image'), (req, res) => {
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
    pool.query(checkSql, [category_id, brand_id], (err, results) => {
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

        pool.query(insertSql, [product_name, category_id, brand_id, price, is_in_stock, description, image], (err, result) => {
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
});

// termék törlése
app.delete('/api/products/delete', authenticateToken, (req, res) => {
    const product_id = req.body.product_id;

    if (!product_id) {
        return res.status(400).json({ error: 'Add meg a termék ID-t!' });
    }

    const sql = 'DELETE FROM products WHERE product_id = ?';
    pool.query(sql, [product_id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Hiba az SQL-ben' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Nincs ilyen termék' });
        }

        return res.status(200).json({ message: 'Termék törölve' });
    });
});

// új márka
app.post('/api/newbrand', authenticateToken, (req, res) => {
    const brand = req.body.brand;

    //ellenőrzés
    if (brand === "" || brand === null || !brand) {
        return res.status(400).json({ error: 'Töltsd ki a mezőt!' })
    }

    pool.query('INSERT INTO brands (brand_id, brand) VALUES (NULL, ?)', [brand], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Adatbázis hiba!' })
        }
        //ha nincs hiba
        return res.status(201).json({
            message: 'Sikeres feltöltés!',
            id: result.insertId
        })
    })
});

// márka törlése
app.delete('/api/brand/delete', authenticateToken, (req, res) => {
    const brand_id = req.body.brand_id;

    if (!brand_id) {
        return res.status(400).json({ error: 'Add meg a márka ID-t!' });
    }

    const sql = 'DELETE FROM brands WHERE brand_id = ?';
    pool.query(sql, [brand_id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Hiba az SQL-ben' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Nincs ilyen márka' });
        }

        return res.status(200).json({ message: 'Márka törölve' });
    });
});

// új kategória
app.post('/api/newcategory', authenticateToken, upload.single('image'), (req, res) => {
    const category = req.body.category;
    const image = req.file ? req.file.filename : null;

    if (category === "" || image === null) {
        return res.status(400).json({ error: "Legyen a kategória neve és képe kitöltve" });
    }

    const sql = 'INSERT INTO category (category_id, category, image) VALUES(NULL, ?, ?)';
    pool.query(sql, [category, image], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Hiba az SQL-ben' });
        }

        return res.status(201).json({ message: 'Kategória feltöltve', category_id: result.insertId });
    })
});

// kategória törlése
app.delete('/api/category/delete', authenticateToken, (req, res) => {
    const category_id = req.body.category_id;

    if (!category_id) {
        return res.status(400).json({ error: 'Add meg a kategória ID-t!' });
    }

    const sql = 'DELETE FROM category WHERE category_id = ?';
    pool.query(sql, [category_id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Hiba az SQL-ben' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Nincs ilyen kategória' });
        }

        return res.status(200).json({ message: 'Kategória törölve' });
    });
});

module.exports = app;