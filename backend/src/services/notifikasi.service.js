const { pool } = require('../configs/database');
const { idValid } = require('../middlewares/otorisasi.middleware');
const ApiError = require('../utils/apiError');

const kolom = 'id_notifikasi, id_pengguna, id_antrian, pesan, waktu_dibuat, status_dibaca, waktu_dibaca';

// Dipanggil service aplikasi dengan penerima hasil pemeriksaan ownership.
// Teruskan client transaksi agar perubahan bisnis dan notifikasi bersifat atomik.
async function catatNotifikasi({ idPengguna, idAntrian = null, pesan }, client = pool) {
    if (!idValid(idPengguna) || (idAntrian !== null && !idValid(idAntrian))
        || typeof pesan !== 'string' || !pesan.trim() || pesan.includes('\0')) {
        throw ApiError.badRequest('Data notifikasi tidak valid.');
    }
    const { rows } = await client.query(`
        INSERT INTO notifikasi (id_pengguna, id_antrian, pesan)
        VALUES ($1, $2, $3) RETURNING ${kolom}
    `, [idPengguna, idAntrian, pesan.trim()]);
    return rows[0];
}

async function daftar(idPengguna, { sebelum, limit }) {
    const { rows } = await pool.query(`
        SELECT ${kolom} FROM notifikasi
        WHERE id_pengguna = $1 AND ($2::bigint IS NULL OR id_notifikasi < $2)
        ORDER BY id_notifikasi DESC LIMIT $3
    `, [idPengguna, sebelum, limit]);
    return rows;
}

async function tandaiDibaca(idPengguna, idNotifikasi) {
    const { rows } = await pool.query(`
        UPDATE notifikasi
        SET waktu_dibaca = CASE WHEN status_dibaca THEN waktu_dibaca ELSE CURRENT_TIMESTAMP END,
            status_dibaca = TRUE
        WHERE id_notifikasi = $1 AND id_pengguna = $2
        RETURNING ${kolom}
    `, [idNotifikasi, idPengguna]);
    if (!rows.length) throw ApiError.notFound('Notifikasi tidak ditemukan.');
    return rows[0];
}

async function tandaiSemuaDibaca(idPengguna) {
    const { rowCount } = await pool.query(`
        UPDATE notifikasi SET status_dibaca = TRUE, waktu_dibaca = CURRENT_TIMESTAMP
        WHERE id_pengguna = $1 AND status_dibaca = FALSE
    `, [idPengguna]);
    return { jumlah_diperbarui: rowCount };
}

module.exports = { catatNotifikasi, daftar, tandaiDibaca, tandaiSemuaDibaca };
