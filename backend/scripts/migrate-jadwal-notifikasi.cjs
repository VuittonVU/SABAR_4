const fs = require('node:fs');
const path = require('node:path');
const { pool } = require('../src/configs/database');

async function main() {
    try {
        const migrations = [
            '20261122_jadwal_notifikasi.sql',
            '20261123_antrean_status.sql',
        ];
        for (const migration of migrations) {
            const sql = fs.readFileSync(path.join(__dirname, '../migrations', migration), 'utf8');
            await pool.query(sql);
        }
        console.log('Migrasi jadwal, notifikasi, dan status antrean berhasil.');
    } catch (err) {
        console.error('Migrasi gagal:', err.code || err.name);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

main();
