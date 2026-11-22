const fs = require('node:fs');
const path = require('node:path');
const { pool } = require('../src/configs/database');

async function main() {
    try {
        const sql = fs.readFileSync(path.join(__dirname, '../migrations/20261122_jadwal_notifikasi.sql'), 'utf8');
        await pool.query(sql);
        console.log('Migrasi jadwal dan indeks notifikasi berhasil.');
    } catch (err) {
        console.error('Migrasi gagal:', err.code || err.name);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

main();
