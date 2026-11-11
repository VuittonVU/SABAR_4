const express = require('express');
const jwt = require('jsonwebtoken');
const config = require('../configs/config');
const { query } = require('../configs/database');

const router = express.Router({ mergeParams: true });
const kolomCatatan = 'id_catatan, id_antrian, id_penulis, isi_catatan, created_at, updated_at';

function idValid(value) {
    return typeof value === 'string'
        && /^[1-9][0-9]{0,18}$/.test(value)
        && BigInt(value) <= 9223372036854775807n;
}

function autentikasi(req, res, next) {
    const token = /^Bearer ([^\s]+)$/i.exec(req.get('authorization') ?? '');
    if (!token) {
        return res.status(401).json({ message: 'Token login diperlukan.' });
    }

    if (!config.jwt.secret || config.jwt.secret === 'your_jwt_secret_here') {
        return res.status(503).json({ message: 'Autentikasi belum dikonfigurasi.' });
    }

    let payload;
    try {
        payload = jwt.verify(token[1], config.jwt.secret, { algorithms: ['HS256'] });
    } catch {
        return res.status(401).json({ message: 'Token login tidak valid atau sudah kedaluwarsa.' });
    }

    if (!idValid(payload?.sub) || !Number.isFinite(payload.exp)) {
        return res.status(401).json({ message: 'Identitas pada token login tidak valid.' });
    }

    res.locals.idPengguna = payload.sub;
    next();
}

function validasiId(req, res, next) {
    const { idAntrian, idCatatan } = req.params;
    if (!idValid(idAntrian) || (idCatatan !== undefined && !idValid(idCatatan))) {
        return res.status(400).json({ message: 'ID antrean atau catatan tidak valid.' });
    }
    next();
}

function validasiIsi(req, res, next) {
    const isi = req.body?.isi_catatan;
    if (typeof isi !== 'string' || !isi.trim() || isi.includes('\0')) {
        return res.status(400).json({ message: 'Isi catatan wajib berupa teks yang valid.' });
    }

    res.locals.isiCatatan = isi.trim();
    next();
}

router.use(autentikasi, validasiId);

router.get('/', async (req, res) => {
    const { rows } = await query(`
        SELECT c.id_catatan, c.id_antrian, c.id_penulis, c.isi_catatan, c.created_at, c.updated_at
        FROM antrian a
        JOIN jadwal_bimbingan j ON j.id_jadwal = a.id_jadwal
        LEFT JOIN catatan_bimbingan c ON c.id_antrian = a.id_antrian
        WHERE a.id_antrian = $1 AND (j.id_dosen = $2 OR a.id_mahasiswa = $2)
        ORDER BY c.created_at DESC, c.id_catatan DESC
    `, [req.params.idAntrian, res.locals.idPengguna]);

    if (!rows.length) {
        return res.status(404).json({ message: 'Antrean tidak ditemukan.' });
    }

    return res.json({ data: rows[0].id_catatan === null ? [] : rows });
});

router.post('/', validasiIsi, async (req, res) => {
    const { rows } = await query(`
        INSERT INTO catatan_bimbingan (id_antrian, id_penulis, isi_catatan)
        SELECT a.id_antrian, j.id_dosen, $3
        FROM antrian a
        JOIN jadwal_bimbingan j ON j.id_jadwal = a.id_jadwal
        WHERE a.id_antrian = $1 AND j.id_dosen = $2
        RETURNING ${kolomCatatan}
    `, [req.params.idAntrian, res.locals.idPengguna, res.locals.isiCatatan]);

    if (!rows.length) {
        return res.status(404).json({ message: 'Antrean tidak ditemukan.' });
    }

    return res.status(201).json({ data: rows[0] });
});

router.patch('/:idCatatan', validasiId, validasiIsi, async (req, res) => {
    const { rows } = await query(`
        UPDATE catatan_bimbingan AS c
        SET isi_catatan = $4, updated_at = CURRENT_TIMESTAMP
        WHERE c.id_antrian = $1 AND c.id_catatan = $2 AND c.id_penulis = $3
            AND EXISTS (
                SELECT 1 FROM antrian a
                JOIN jadwal_bimbingan j ON j.id_jadwal = a.id_jadwal
                WHERE a.id_antrian = c.id_antrian AND j.id_dosen = $3
            )
        RETURNING ${kolomCatatan}
    `, [req.params.idAntrian, req.params.idCatatan, res.locals.idPengguna, res.locals.isiCatatan]);

    if (!rows.length) {
        return res.status(404).json({ message: 'Catatan tidak ditemukan.' });
    }

    return res.json({ data: rows[0] });
});

router.use((err, req, res, next) => {
    if (res.headersSent) return next(err);

    console.error('Catatan bimbingan:', err.code ?? err.name);
    return res.status(500).json({ message: 'Terjadi kesalahan saat memproses catatan.' });
});

module.exports = router;
