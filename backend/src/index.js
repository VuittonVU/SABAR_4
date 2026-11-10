const config = require('./configs/config');
const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { pool, checkConnection } = require('./configs/database');

const app = express();
app.use(cors({
  origin: config.cors.origin || '*',
}));

app.use(express.json());

app.use('/api', routes);
app.get('/', (req, res) => {
    res.send('SABAR Backend is Running');
});

let server;
checkConnection().then(() => {
    server = app.listen(config.port, () => {
        console.log(`Server running on port ${config.port}`);
    });
});
