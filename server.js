app = require('./app');
const { PORT, HOSTNAME } = require('./config/dotenvConfig').config;

app.listen(PORT, ()=>{
    console.log(`IP:https://${HOSTNAME}:${PORT}`);
});