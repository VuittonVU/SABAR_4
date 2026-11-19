const { Pool } = require('pg');
const config = require('./config');
const logger = require('../utils/logger');

const pool = new Pool({
    user: config.db.user,
    host: config.db.host,
    database: config.db.database,   
    password: config.db.password,
    port: config.db.port,
});

pool.on('error', (err) => {
    logger.error('Unexpected error on idle database client', err);
    process.exit(-1);
});

const query = (text, params) => pool.query(text, params);

const checkConnection = async () => {
    try {
        const res = await pool.query('SELECT NOW()');
        logger.info(`Database Connected: ${res.rows[0].now}`);
    } catch (err) {
        logger.error(`Database Connection Failed: ${err.message}`, err);
        process.exit(1);
    }
};

module.exports = {
    query,
    checkConnection,
    pool,
};
