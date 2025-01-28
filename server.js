app = require('./app');
const { PORT, HOSTNAME } = require('./config/dotenvConfig').config;

app.listen(PORT, HOSTNAME, ()=>{
    console.log(`IP:http://${HOSTNAME}:${PORT}`);
});