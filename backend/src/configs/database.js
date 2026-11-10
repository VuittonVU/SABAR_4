const { Pool } = require('pg');
const config = require('./config');

const pool = new Pool({
    user: config.db.user,
    host: config.db.host,
    database: config.db.database,   
    password: config.db.password,
    port: config.db.port,
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

const query = (text, params) => pool.query(text, params);

const checkConnection = async () => {
    try {
        const res = await pool.query('SELECT NOW()');
        console.log(`Database Connected: ${res.rows[0].now}`);
    } catch (err) {
        console.error(`Database Connection Failed: ${err.message}`);
        process.exit(1);
    }
};

module.exports = {
    query,
    checkConnection,
    pool,
};