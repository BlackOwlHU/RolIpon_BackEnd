//everytime you make something stupid add to this: 0
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

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended:true }));
app.use(cors({
    origin: 'http://127.0.0.1:5500',
    credentials: true
}));
app.use(cookieParser())

// az uploads mappa fájlok elérése
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

dotenv.config();
const PORT = process.env.PORT;
const HOSTNAME = process.env.HOSTNAME;

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    timezone: 'Z',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const uploadDir = 'uploads/';

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        if(!fs.existsSync(uploadDir)){
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function(req, file, cb){
        const now = new Date().toISOString().split('T')[0];
        cb(null, `${req.user.id}-${now}-${file.originalname}`)
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: function(req, file, cb){
        const filetypes = /jpeg|jpg|png|gif|webp|avif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if(extname && mimetype){
            return cb(null, true);
        }
        else{
            cb(new Error('Csak képformátumok megengedettek!'));
        }
    }
});

const JWT_SECRET = process.env.JWT_SECRET;

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

// API végpontpok
app.post('/api/register', (req, res) => {
    const {username, email, password} = req.body;
    const errors = [];

    if(validator.isEmpty(username)){
        errors.push({ error: 'Töltsd ki a neved!'});
    }

    if(!validator.isEmail(email)){
        errors.push({ error: 'Nem valós email cím!'});
    }

    if(!validator.isLength(password, {min: 6})){
        errors.push({ error: 'A jelszónak legalább 6 karakternek kell lennie!'});
    }

    if(errors.length > 0){
        return res.status(400).json({ errors });
    }

    bcrypt.hash(password, 10, (err, hash) => {
        if(err){
            return res.status(500).json({ error: 'Hiba a hashelés során'});
        }
        const sql = 'INSERT INTO users (user_id, username, email, password) VALUES(NULL, ?, ?, ?)';

        pool.query(sql, [username, email, hash], (err, result) => {
            if(err){
                return res.status(500).json({ error: 'Hiba a regisztráció során!' });
            }

            // Az új user_id megszerzése
            const user_id = result.insertId;

            // Automatikus kosár létrehozása a user_id alapján
            const cartSql = 'INSERT INTO cart (user_id) VALUES (?)';
            pool.query(cartSql, [user_id], (err, cartResult) => {
                if (err) {
                    return res.status(500).json({ error: 'Hiba a kosár létrehozása során!' });
                }

                // Sikeres regisztráció és kosár hozzáadása
                res.status(201).json({
                    message: 'Sikeres regisztráció és kosár létrehozva!',
                    userId: user_id,
                    cartId: cartResult.insertId,
                });
            });
        });
    });
});

// login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const errors = [];

    if(!validator.isEmail(email)){
        errors.push({ error: 'Add meg az email címet'});
    }

    if(validator.isEmpty(password)){
        errors.push({ error: 'Add meg a jelszót'});
    }

    if(errors.length > 0){
        return res.status(400).json({errors});
    }

    const sql = 'SELECT * FROM users WHERE email LIKE ?';
    pool.query(sql, [email], (err, result) => {
        if(err){
            return res.status(500).json({ error: 'Hiba az SQL-ben' })
        }

        if(result.length === 0){
            return res.status(404).json({ error: 'A felhasználó nem található' });
        }

        const user = result[0];
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if(isMatch){
                const token = jwt.sign({ id: user.user_id },
                JWT_SECRET, {expiresIn: '1y'});

                res.cookie('auth_token', token, {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'none',
                    maxAge: 1000 * 60 * 60 * 24 * 30 * 12
                });
                return res.status(200).json({message: 'Sikeres bejelentkezés'});
            } else{
                res.status(401).json({ error: 'Rossz a jelszó'});
            }
        });
    });
});

// logout
app.post('/api/logout', authenticateToken, (req, res) => {
    res.clearCookie('auth_token', {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
    });
    return res.status(200).json({ message: 'Sikeres kijelentkezés!'});
});

// tesztelés a jwt-re
app.get('/api/logintest',authenticateToken, (req, res) => {
    return res.status(200).json({ message: 'bent vagy' });
});

// profil tesztelése, javításra váró
app.put('/api/editprofile',authenticateToken, upload.single('profile_pic'), (req, res) => {
    const {name, psw} = req.body;
    const user_id = req.user.id;
    const profile_pic = req.file ? req.file.filename : null;

    if(!validator.isLength(psw, {min: 6})){
        return res.status(400).json({ error: 'A jelszónak legalább 6 hosszúnak kell lenni' });
    }

    const sql = 'UPDATE users SET name = COALESCE(NULLIF(?, ""), name), psw = COALESCE(NULLIF(?, ""), psw), profile_pic = COALESCE(NULLIF(?, ""), profile_pic)  WHERE user_id = ?';

    bcrypt.hash(psw, 10, (err, hash) => {
        if (err){
            return res.status(500).json({ error: 'Hiba a sózáskor!' });
        }

        pool.query(sql, [name, hash, profile_pic, user_id], (err, result) => {
            if(err){
                return res.status(500).json({ error: 'Hiba az SQL-ben' });
            }

            return res.status(200).json({ message: 'Profil frissítve' });
        });
    });
});

// termékek
app.get('/api/products',authenticateToken, (req, res) => {
    const sql = 'SELECT * FROM products';
    pool.query(sql, (err, result) => {
        if(err){
            return res.status(500).json({ error: 'Hiba az SQL-ben' });
        }

        if (result.length === 0){
            return res.status(404).json({ error: 'Nincs még termék' });
        }
        
        return res.status(200).json(result);
    });
});

// márka lekérdezése
app.get('/api/brands', authenticateToken, (req, res) => {
    const sql = 'SELECT* FROM brands';
    pool.query(sql, (err, result) => {
        if(err){
            return res.status(500).json({ error: 'Hiba az SQL-ben' });
        }

        if (result.length === 0){
            return res.status(404).json({ error: 'Nincs még márka' });
        }
        
        return res.status(200).json(result);
    });
});

// kategória lekérdezése
app.get('/api/category', authenticateToken, (req, res) => {
    const sql = 'SELECT * FROM category';
    pool.query(sql, (err, result) => {
        if(err){
            return res.status(500).json({ error: 'Hiba az SQL-ben' });
        }

        if (result.length === 0){
            return res.status(404).json({ error: 'Nincs még kategória' });
        }
        
        return res.status(200).json(result);
    });
});

// termék kosárhoz adása
app.post('/api/addCart', authenticateToken, (req, res) => {
    const {cart_id, product_id, quantity} = req.body;
});

// termék kivétele kosárból

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


// új márka
app.post('/api/newbrand', authenticateToken ,(req, res) => {
    const brand = req.body.brand;
    
    //ellenőrzés
    if(brand === "" || brand === null || !brand){
        return res.status(400).json({error: 'Töltsd ki a mezőt!'})
    }

    pool.query('INSERT INTO brands (brand_id, brand) VALUES (NULL, ?)', [brand], (err, result) => {
        if (err){
            return res.status(500).json({error: 'Adatbázis hiba!'})
        }
        //ha nincs hiba
        return res.status(201).json({
            message: 'Sikeres feltöltés!',
            id: result.insertId
        })
    })
});

// új kategória
app.post('/api/newcategory', authenticateToken, upload.single('image'), (req, res) => {
    const category = req.body.category;
    const image = req.file ? req.file.filename : null;

    if(category === "" || image === null) {
        return res.status(400).json({ error: "Legyen a kategória neve és képe kitöltve"});
    }

    const sql = 'INSERT INTO category (category_id, category, image) VALUES(NULL, ?, ?)';
    pool.query(sql, [category, image], (err, result) => {
        if(err){
            return res.status(500).json({ error: 'Hiba az SQL-ben' });
        }

        return res.status(201).json({ message: 'Kategória feltöltve',  category_id: result.insertId });
    })
});

app.listen(PORT, HOSTNAME, ()=>{
    console.log(`IP:http://${HOSTNAME}:${PORT}`);
});

/*const now = new Date();
const year = String(now.getFullYear()).padStart(2,'0');
const month = String(now.getMonth()+1).padStart(2,'0');
const day = String(now.getDate()).padStart(2,'0');
const formattedDate = `${year}-${month}-${day}`
console.log(formattedDate);*/