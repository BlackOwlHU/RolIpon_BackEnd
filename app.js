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

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended:true }));
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
    const token = req.headers['authorization'];
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
    const {email, name, psw} = req.body;
    const errors = [];

    if(!validator.isEmail(email)){
        errors.push({ error: 'Nem valós email cím!'});
    }

    if(validator.isEmpty(name)){
        errors.push({ error: 'Töltsd ki a neved!'});
    }

    if(!validator.isLength(psw, {min: 6})){
        errors.push({ error: 'A jelszónak legalább 6 karakternek kell lennie!'});
    }

    if(errors.length > 0){
        return res.status(400).json({ errors });
    }

    bcrypt.hash(psw, 10, (err, hash) => {
        if(err){
            return res.status(500).json({ error: 'Hiba a hashelés során'});
        }
        const sql = 'INSERT INTO users (user_id, email, name, psw, profile_pic) VALUES(NULL, ?, ?, ?, "default.png")';

        pool.query(sql, [email, name, hash], (err, result) => {
            if(err){
                return res.status(500).json({ error: 'Hiba a regisztráció során!' });
            }
            res.status(201).json({ message: 'Sikeres regisztráció!' });
        });
    });
});

// login
app.post('/api/login', (req, res) => {
    const { email, psw } = req.body;
    const errors = [];

    if(!validator.isEmail(email)){
        errors.push({ error: 'Add meg az email címet'});
    }

    if(validator.isEmpty(psw)){
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
        bcrypt.compare(psw, user.psw, (err, isMatch) => {
            if(isMatch){
                const token = jwt.sign({ id: user.user_id },
                JWT_SECRET, {expiresIn: '1y'});
                return res.status(200).json({token});
            } else{
                res.status(401).json({ error: 'Rossz a jelszó'});
            }
        });
    });
});

// tesztelés a jwt-re
app.get('/api/logintest',authenticateToken, (req, res) => {
    return res.status(200).json({ message: 'bent vagy' });
});

// profil tesztelése
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

// az összes meme lekérdezése
app.get('/api/memes', authenticateToken, (err, res) => {
    const sql = 'SELECT uploads.upload_id, uploads.meme, uploads.user_id, users.name, users.profile_pic, COUNT(likes.upload_id) AS "like" FROM uploads JOIN users ON uploads.user_id = users.user_id JOIN likes ON uploads.upload_id = likes.upload_id GROUP BY(upload_id)';

    pool.query(sql, (err, result) => {
        if(err){
            return res.status(500).json({ error: 'Hiba az SQL-ben' });
        }

        if (result.length === 0){
            return res.status(404).json({ error: 'Nincs még meme' });
        }

        return res.status(200).json(result);
    });
});

// új meme feltöltése
app.post('/api/upload', authenticateToken, upload.single('meme'), (req, res) => {
    const user_id = req.user.id;
    const meme = req.file ? req.file.filename : null;
    
    if(meme === null){
        return res.status(400).json({ error: 'Válassz ki egy képet' });
    }

    const sql = 'INSERT INTO uploads (upload_id, user_id, meme) VALUES (NULL, ?, ?)';
    pool.query(sql, [user_id, meme], (err, result) => {
        if(err){
            return res.status(500).json({ error: 'Hiba az SQL-ben' });
        }

        return res.status(201).json({ message: 'Kép feltöltve',  upload_id: result.insertId });
    });
});

// like
app.post('/api/like/:upload_id', authenticateToken, (req, res) => {
    const user_id = req.user.id;
    const upload_id = req.params.upload_id;

    const sqlSelect = 'SELECT * FROM likes WHERE upload_id = ? AND user_id = ?';
    pool.query(sqlSelect, [upload_id, user_id], (err, result) => {
        if(err){
            return res.status(500).json({ error: 'Hiba az SQL-ben' });
        }

        if(result.length !== 0){
            return res.status(409).json({ error: 'Már lájkoltad' });
        }

        const sqlInsert = 'INSERT INTO likes (upload_id, user_id) VALUES (?, ?)';
        pool.query(sqlInsert, [upload_id, user_id], (err, result) => {
            if(err){
                return res.status(500).json({ error: 'Hiba az SQL-ben' });
            }

            return res.status(200).json({ message: 'Tetszik' });
        })
    })
});

// unlike
app.delete('/api/unlike/:upload_id', authenticateToken, (req, res) => {
    const user_id = req.user.id;
    const upload_id = req.params.upload_id;

    const sqlDelete = 'DELETE FROM likes WHERE upload_id = ? AND user_id = ?';
    pool.query(sqlDelete, [upload_id, user_id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Hiba az SQL-ben' });
        }
        return res.status(204).send();
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