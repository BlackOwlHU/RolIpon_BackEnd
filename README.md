# 📒 RolIpon Backend Dokumentáció

## 🗒️ Tartalomjegyzék
- [Bevezetés](#Bevezetés)

- [Szerkezet](#Projekt_szerkezet)

- [Adatbázis](#Adatbázis)

- [Telepítés](#Telepítés)

- [Használat](#Használat)

- [Dokumentáció](#Dokumentacio)

## 🏪 Bevezetés

## 📁 Projekt szerkezet

```markdown
├── config/
│   └── dotenvConfig.js
├── controllers/
│   ├── authControllers.js
│   ├── cartControllers.js
│   ├── filterControllers.js
│   ├── orderControllers.js
│   ├── productsControllers.js
│   └── productsControllers.js
├── middleware/
│   ├── adminAuth.js
│   ├── jwtAuth.js
│   └── multer.js
├── routes/
│   ├── adminRoutes.js
│   ├── authRoutes.js
│   ├── cartRoutes.js
│   ├── filterRoutes.js
│   ├── orderRoutes.js
│   ├── productsRoutes.js
│   └── profileRoutes.js
├── package.json
├── app.js
├── server.js
└── README.md
```

## 🗃️ Adatbázis
![image](https://github.com/user-attachments/assets/a193d3a4-a52e-4836-97e5-0cbf48a3a471)

| 💄️ DrawSQL | Adatbázis diagram | [Megtekintés](https://drawsql.app/teams/blackowlhu/diagrams/rolipon) |

| 🧪 Postman | API tesztek | [Megtekintés](https://gold-equinox-349152.postman.co/workspace/RolIpon~16d80b71-9fbc-4792-b4ea-144853d3a13b/collection/39908184-e15c1e2d-c0ea-4bd9-8926-adb44815972e?action=share&creator=39908184) |

## ⬇️ Telepítés

NPM parancsok telepítéshes:

```markdown
npm clone https://github.com/BlackOwlHU/RolIpon_BackEnd.git (GitHub-ról letöltés)
```

## 🛍️ Használat

NPM parancs a szerver futtatásához:
```markdown
npm install (Csak egyszer kell, telepítés után!)
npm run dev (Szerver futtatása.)
```

## 📋 Használt függőségek
Szerveren használt npm modulok:
```markdown
- Bcryptjs
- Cookie-parser
- Cors
- Dotenv
- Express
- Jsonwebtoken
- Multer
- Mysql2
- Validator
- Nodemon(Dev)
```
