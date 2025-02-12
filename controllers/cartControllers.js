const db = require('../models/database');

// termék lekérése
const getCart = (req, res) => {
    const user_id = req.user.id;

    // Get the user's cart ID
    db.query('SELECT cart_id FROM cart WHERE user_id = ?', [user_id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error! 1' });
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
                cart_items.quantity,
                image
            FROM cart_items
            JOIN products ON cart_items.product_id = products.product_id
            WHERE cart_items.cart_id = ?
        `;

        db.query(sql, [cart_id], (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Database error! 2' });
            }
            if (results.length === 0) {
                return res.status(404).json({ error: 'Nincs termék a kosárban!' });
            }

            return res.status(200).json(results);
        });
    });
};

// termék kosárhoz adása
const addCart = (req, res) => {
    const user_id = req.user.id; // Assuming the user ID is stored in the token
    const { product_id, quantity } = req.body;

    if (!product_id || !quantity) {
        return res.status(400).json({ error: 'Product ID and quantity are required!' });
    }

    // Check if the product exists
    db.query('SELECT * FROM products WHERE product_id = ?', [product_id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error! 1' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Product not found!' });
        }

        // Get the user's cart ID
        db.query('SELECT cart_id FROM cart WHERE user_id = ?', [user_id], (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Database error! 2' });
            }

            let cart_id;
            db.query('SELECT * FROM cart_items WHERE product_id = ? AND  cart_id = ?', [product_id, cart_id], (err, results) => {
                if(err){
                    return res.status(500).json({ error: 'Database error! 3' });
                }
                if(results.length > 0){
                    return res.status(200).json({ message: 'Van már ilyen termék a kosárban!' });
                }
                else{
                    if (results.length === 0) {
                        // Create a new cart if the user doesn't have one
                        db.query('INSERT INTO carts (user_id) VALUES (?)', [user_id], (err, result) => {
                            if (err) {
                                return res.status(500).json({ error: 'Database error! 4' });
                            }
                            return res.status(201).json({ message: 'Kosár elkészítve!' });
                        });
                    } else {
                        cart_id = results[0].cart_id;
                        const sqlInsert = 'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)';
                        db.query(sqlInsert, [cart_id, product_id, quantity], (err, result) => {
                            if (err) {
                                return res.status(500).json({ error: 'Database error! 5' });
                            }
                            return res.status(201).json({ message: 'Termék felvéve!' });
                        });
                    }
                }
            });
        });
    });
};

// termék kivétele kosárból
const removeCart = (req, res) => {
    const user_id = req.user.id;
    const { cart_items_id } = req.params;

    if (!cart_items_id) {
        return res.status(400).json({ error: 'Cart item ID is required!' });
    }

    const sql = `
        DELETE cart_items
        FROM cart_items
        JOIN cart ON cart_items.cart_id = cart.cart_id
        WHERE cart.user_id = ? AND cart_items.cart_items_id = ?
    `;

    db.query(sql, [user_id, cart_items_id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Database error!' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Nincs ilyen termék a kosárban!' });
        }

        return res.status(200).json({ message: 'Kosárban lévő termék törölve!' });
    });
};

module.exports = {
    getCart,
    addCart,
    removeCart
};