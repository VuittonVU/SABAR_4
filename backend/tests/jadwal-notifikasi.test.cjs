const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

test('Jadwal dan notifikasi melalui API dengan PostgreSQL terisolasi', async () => {
    assert.ok(process.env.TEST_DATABASE_URL, 'Isi TEST_DATABASE_URL dengan database PostgreSQL uji.');
    const schema = 'sabar_test_' + process.pid + '_' + Date.now();
    const admin = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
    let pool;
    let server;
    try {
        await admin.query(`CREATE SCHEMA ${schema}`);
        pool = new Pool({
            connectionString: process.env.TEST_DATABASE_URL,
            options: '-c search_path=' + schema,
        });
        // Fixture adalah Query Database.txt yang disediakan tim.
        await pool.query(fs.readFileSync(path.join(__dirname, 'fixtures/sabar.sql'), 'utf8'));
        await pool.query(`
            INSERT INTO data_referensi (tipe,nama) VALUES ('role','Dosen'),('role','Mahasiswa');
            INSERT INTO pengguna (id_role,username,kata_sandi_hash,nama,email_npm) VALUES
                (1,'dosen1','unused','Dosen 1','dosen1@example.test'),
                (1,'dosen2','unused','Dosen 2','dosen2@example.test'),
                (2,'mhs1','unused','Mahasiswa 1','mhs1@example.test'),
                (2,'mhs2','unused','Mahasiswa 2','mhs2@example.test');
            INSERT INTO jadwal_bimbingan (id_dosen,tanggal,jam_mulai,jam_selesai,kuota_mhs,status_jadwal)
                VALUES (1,'2026-12-01','07:00','08:00',3,'Aktif');
        `);
        const migration = fs.readFileSync(path.join(__dirname, '../migrations/20261122_jadwal_notifikasi.sql'), 'utf8');
        await pool.query(migration);
        await pool.query(migration);
        const dbPath = require.resolve('../src/configs/database');
        require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true,
            exports: { pool, query: (sql, params) => pool.query(sql, params) } };
        const config = require('../src/configs/config');
        config.jwt.secret = 'sabar-isolated-test-secret';
        config.env = 'production';
        const app = express();
        app.use(express.json());
        app.use('/api/jadwal', require('../src/routes/jadwal.routes'));
        app.use('/api/notifikasi', require('../src/routes/notifikasi.routes'));
        app.use('/api/antrean/:idAntrian/catatan', require('../src/routes/catatan_bimbingan.routes'));
        app.use(require('../src/middlewares/error.middleware').errorHandler);
        server = await new Promise((resolve) => {
            const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
        });
        const base = 'http://127.0.0.1:' + server.address().port;
        const tokens = {
            d1: jwt.sign({ sub: '1', role: 'Dosen' }, config.jwt.secret, { expiresIn: '1h' }),
            d2: jwt.sign({ sub: '2', role: 'Dosen' }, config.jwt.secret, { expiresIn: '1h' }),
            m1: jwt.sign({ sub: '3', role: 'Mahasiswa' }, config.jwt.secret, { expiresIn: '1h' }),
            m2: jwt.sign({ sub: '4', role: 'Mahasiswa' }, config.jwt.secret, { expiresIn: '1h' }),
        };
        async function call(method, url, token, body) {
            const response = await fetch(base + url, {
                method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + tokens[token] } : {}) },
                body: body === undefined ? undefined : JSON.stringify(body),
            });
            return { status: response.status, ...(await response.json()) };
        }
        const data = { tanggal: '2026-12-02', jam_mulai: '09:00', jam_selesai: '10:00',
            kuota_mhs: 3, durasi_menit: 15, ruang: 'R1' };
        assert.equal((await call('GET', '/api/jadwal')).status, 401);
        assert.equal((await call('POST', '/api/jadwal', 'm1', data)).status, 403);
        assert.equal((await call('PATCH', '/api/jadwal/1', 'd1', { durasi_menit: 10 })).status, 200);
        const invalid = [
            { kuota_mhs: 0 }, { kuota_mhs: 1.5 }, { durasi_menit: -1 }, { tanggal: '2026-02-30' },
            { tanggal: '2026-99-99' }, { jam_selesai: '08:00' }, { jam_mulai: '24:00' },
            { ruang: 'x'.repeat(101) }, { id_dosen: '2' }, { status_jadwal: 'Rusak' },
        ];
        for (const patch of invalid) {
            assert.equal((await call('POST', '/api/jadwal', 'd1', { ...data, ...patch })).status, 400, JSON.stringify(patch));
        }
        const concurrent = await Promise.all([
            call('POST', '/api/jadwal', 'd1', data), call('POST', '/api/jadwal', 'd1', data),
        ]);
        assert.deepEqual(concurrent.map((r) => r.status).sort(), [201, 409]);
        const id = concurrent.find((r) => r.status === 201).data.id_jadwal;
        assert.equal((await call('GET', '/api/jadwal/' + id, 'd2')).status, 404);
        assert.equal((await call('PATCH', '/api/jadwal/' + id, 'd2', { ruang: 'R2' })).status, 404);
        assert.equal((await call('DELETE', '/api/jadwal/' + id, 'd2')).status, 404);
        assert.equal((await call('GET', '/api/jadwal', 'd2')).data.length, 0);
        const adjacent = await call('POST', '/api/jadwal', 'd1', { ...data, jam_mulai: '10:00', jam_selesai: '11:00' });
        assert.equal(adjacent.status, 201);
        assert.equal((await call('PATCH', '/api/jadwal/' + adjacent.data.id_jadwal, 'd1', { jam_mulai: '09:30' })).status, 409);
        assert.equal((await call('POST', '/api/jadwal', 'd2', data)).status, 201);
        const inactive = await call('POST', '/api/jadwal', 'd1', { ...data, status_jadwal: 'Nonaktif' });
        assert.equal(inactive.status, 201);
        assert.equal((await call('PATCH', '/api/jadwal/' + inactive.data.id_jadwal, 'd1', { status_jadwal: 'Aktif' })).status, 409);
        const antrian = (await pool.query('INSERT INTO antrian (id_jadwal,id_mahasiswa,nomor_antrian,status_antrian) VALUES ($1,3,1,\'Menunggu\') RETURNING id_antrian', [id])).rows[0].id_antrian;
        await pool.query('INSERT INTO antrian (id_jadwal,id_mahasiswa,nomor_antrian,status_antrian) VALUES ($1,4,2,\'Menunggu\')', [id]);
        assert.equal((await call('DELETE', '/api/jadwal/' + id, 'd1')).status, 409);
        assert.equal((await call('PATCH', '/api/jadwal/' + id, 'd1', { kuota_mhs: 1 })).status, 409);
        assert.equal((await call('PATCH', '/api/jadwal/' + id, 'd1', { ruang: 'R2' })).status, 200);
        let notes = await call('GET', '/api/notifikasi', 'm1');
        assert.equal(notes.data.length, 1);
        assert.equal(notes.data[0].status_dibaca, false);
        const n1 = notes.data[0].id_notifikasi;
        assert.equal((await call('PATCH', '/api/notifikasi/' + n1 + '/dibaca', 'm2')).status, 404);
        const first = await call('PATCH', '/api/notifikasi/' + n1 + '/dibaca', 'm1');
        assert.equal(first.data.status_dibaca, true);
        assert.ok(first.data.waktu_dibaca);
        const repeat = await call('PATCH', '/api/notifikasi/' + n1 + '/dibaca', 'm1');
        assert.equal(first.data.waktu_dibaca, repeat.data.waktu_dibaca);
        const notePath = '/api/antrean/' + antrian + '/catatan';
        assert.equal((await call('POST', notePath, 'd2', { isi_catatan: 'Ditolak' })).status, 404);
        const note = await call('POST', notePath, 'd1', { isi_catatan: 'Revisi uji' });
        assert.equal(note.status, 201);
        assert.equal((await call('PATCH', notePath + '/' + note.data.id_catatan, 'd1', { isi_catatan: 'Perubahan uji' })).status, 200);
        assert.equal((await call('GET', notePath, 'm1')).data[0].isi_catatan, 'Perubahan uji');
        assert.equal((await call('GET', notePath, 'm2')).status, 404);
        assert.equal((await call('GET', '/api/notifikasi?limit=1', 'm1')).data.length, 1);
        const all = await call('PATCH', '/api/notifikasi/dibaca-semua', 'm1');
        assert.equal(all.data.jumlah_diperbarui, 2);
        assert.equal((await call('PATCH', '/api/notifikasi/dibaca-semua', 'm1')).data.jumlah_diperbarui, 0);
        assert.equal((await call('GET', '/api/notifikasi', 'm2')).data[0].status_dibaca, false);
        assert.equal((await call('GET', '/api/notifikasi?limit=0', 'm1')).status, 400);
        assert.equal((await call('PATCH', '/api/notifikasi/0/dibaca', 'm1')).status, 400);
        // Kegagalan INSERT notifikasi harus membatalkan mutasi bisnis.
        await pool.query(`CREATE FUNCTION gagal_notifikasi() RETURNS trigger LANGUAGE plpgsql AS $$
            BEGIN RAISE EXCEPTION 'forced-test-failure'; END $$;
            CREATE TRIGGER gagal_notifikasi BEFORE INSERT ON notifikasi FOR EACH ROW EXECUTE FUNCTION gagal_notifikasi();`);
        assert.equal((await call('PATCH', '/api/jadwal/' + id, 'd1', { ruang: 'ROLLBACK' })).status, 500);
        assert.equal((await call('GET', '/api/jadwal/' + id, 'd1')).data.ruang, 'R2');
        assert.equal((await call('POST', notePath, 'd1', { isi_catatan: 'ROLLBACK' })).status, 500);
        assert.equal((await call('GET', notePath, 'm1')).data.length, 1);
        assert.equal((await call('PATCH', notePath + '/' + note.data.id_catatan, 'd1', { isi_catatan: 'ROLLBACK' })).status, 500);
        assert.equal((await call('GET', notePath, 'm1')).data[0].isi_catatan, 'Perubahan uji');
        await pool.query('DROP TRIGGER gagal_notifikasi ON notifikasi');
        assert.equal((await call('DELETE', '/api/jadwal/' + adjacent.data.id_jadwal, 'd1')).status, 200);
        assert.equal((await call('GET', '/api/jadwal/' + adjacent.data.id_jadwal, 'd1')).status, 404);
        // Query lewat koneksi baru membuktikan status sudah committed.
        const fresh = new Pool({ connectionString: process.env.TEST_DATABASE_URL, options: '-c search_path=' + schema });
        try {
            assert.equal((await fresh.query('SELECT COUNT(*)::int AS jumlah FROM notifikasi WHERE id_pengguna=3 AND status_dibaca=FALSE')).rows[0].jumlah, 0);
        } finally { await fresh.end(); }
    } finally {
        if (server) await new Promise((resolve) => server.close(resolve));
        if (pool) await pool.end();
        await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
        await admin.end();
    }
});
