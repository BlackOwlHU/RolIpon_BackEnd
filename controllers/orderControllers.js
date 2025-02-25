const db = require('../models/database');

const ordersGet =(req, res) => {
    const user_id = req.user.id;
    const sql = 'SELECT users.firstname, users.surname, users.city, users.postcode, users.address, users.tel, orders.order_id, orders.order_date, orders.total_amount FROM users JOIN orders ON users.user_id = orders.user_id WHERE users.user_id = ?';
    db.query(sql, [user_id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Hiba az SQL-ben' });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: 'Nincs még rendelés' });
        }

        return res.status(200).json(result);
    });
};

const orderedItems = (req, res) => {
    const order_id = req.params.order_id;
    const sql = 'SELECT order_items.product_id, order_items.quantity, order_items.unit_price, products.product_name FROM order_items JOIN products ON order_items.product_id = products.product_id WHERE order_items.order_id = ?';

    db.query(sql, [order_id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Hiba az SQL-ben' });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: 'Nincs még rendelt termék' });
        }

        return res.status(200).json(result);
    });
};

const createOrder = (req, res) => {
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
    db.query(sqlInsertOrder, [user_id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Hiba az SQL-ben' });
        }
        const order_id = result.insertId;
        db.query(sqlSelectCart_Items, [cart_id], (err, result) => {
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
                db.query(sqlInsertOrder_Items, [order_id, item.product_id, item.quantity, item.price], (err, result) => {
                    if (err) {
                        return res.status(500).json({ error: 'Hiba az SQL-ben' });
                    }
                });
            const sqlDeleteCart_Items = 'DELETE FROM cart_items WHERE cart_id = ?';
            db.query(sqlDeleteCart_Items, [cart_id], (err, result) => {
                if (err) {
                    return res.status(500).json({ error: 'Hiba az SQL-ben' });
                }
                const sqlUpdateOrder = 'UPDATE orders SET total_amount = ? WHERE order_id = ?';
                db.query(sqlUpdateOrder, [total_amount, order_id], (err, result) => {
                    if (err) {
                        return res.status(500).json({ error: 'Hiba az SQL-ben' });
                    }
                    });
                });
            });
            return res.status(200).json({ message: 'Rendelés sikeres' });
        });
    });
};

const deleteOrder = (req, res) => {
    const user_id = req.params.id;
    const order_id = req.params.id;

    const sql = 'DELETE FROM orders WHERE order_id = ?';
    const sqlDeleteOrder_Items = 'DELETE FROM order_items WHERE order_id = ?';
    const sqlSelectOrderId = 'SELECT order_id FROM orders WHERE order_id = ?';

    db.query(sqlSelectOrderId, [user_id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Hiba az SQL-ben' });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: 'Nincs ilyen rendelés' });
        }

        db.query(sqlDeleteOrder_Items, [order_id], (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Hiba az SQL-ben, rendelési termékek.' });
            }
        });

        db.query(sql, [order_id], (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Hiba az SQL-ben' });
            }

            return res.status(200).json({ message: 'Rendelés törölve' });
        });
    });
};

module.exports = {
    ordersGet,
    orderedItems,
    createOrder,
    deleteOrder
};