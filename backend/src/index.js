const config = require('./configs/config');
const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { checkConnection } = require('./configs/database');
const requestLogger = require('./middlewares/logger.middleware');
const { notFoundHandler, errorHandler } = require('./middlewares/error.middleware');
const logger = require('./utils/logger');

const app = express();

app.use(cors({
  origin: config.cors.origin || '*',
}));

app.use(express.json());

// Logging setiap request HTTP yang masuk
app.use(requestLogger);

// Routing utama
app.use('/api', routes);

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'SABAR Backend is Running',
        data: null,
    });
});

// Penanganan route tidak ditemukan (404)
app.use(notFoundHandler);

// Penanganan error terpusat (Global Error Handler)
app.use(errorHandler);

let server;
checkConnection().then(() => {
    server = app.listen(config.port, () => {
        logger.info(`Server berjalan di port ${config.port} dalam mode ${config.env || 'development'}`);
    });
}).catch((err) => {
    logger.error('Gagal menghubungkan ke database saat startup:', err);
    process.exit(1);
});
