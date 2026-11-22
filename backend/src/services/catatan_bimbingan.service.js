const { query } = require('../configs/database');
const transaction = require('../utils/transaction');
const { catatNotifikasi } = require('./notifikasi.service');

async function beriNotifikasi(client, idAntrian) {
    const { rows } = await client.query('SELECT id_mahasiswa FROM antrian WHERE id_antrian=$1', [idAntrian]);
    await catatNotifikasi({
        idPengguna: rows[0].id_mahasiswa,
        idAntrian,
        pesan: 'Catatan bimbingan diperbarui. Buka detail sesi untuk membaca arahan dosen.',
    }, client);
}

const kolomCatatan = 'id_catatan, id_antrian, id_penulis, isi_catatan, created_at, updated_at';

async function ambilCatatan(idAntrian, idPengguna) {
    const { rows } = await query(`
        SELECT c.id_catatan, c.id_antrian, c.id_penulis, c.isi_catatan, c.created_at, c.updated_at
        FROM antrian a
        JOIN jadwal_bimbingan j ON j.id_jadwal = a.id_jadwal
        LEFT JOIN catatan_bimbingan c ON c.id_antrian = a.id_antrian
        WHERE a.id_antrian = $1 AND (j.id_dosen = $2 OR a.id_mahasiswa = $2)
        ORDER BY c.created_at DESC, c.id_catatan DESC
    `, [idAntrian, idPengguna]);

    if (!rows.length) {
        return null;
    }

    return rows[0].id_catatan === null ? [] : rows;
}

async function tambahCatatan(idAntrian, idDosen, isiCatatan) {
    return transaction(async (client) => {
        const { rows } = await client.query(`
            INSERT INTO catatan_bimbingan (id_antrian, id_penulis, isi_catatan)
            SELECT a.id_antrian, j.id_dosen, $3
            FROM antrian a
            JOIN jadwal_bimbingan j ON j.id_jadwal = a.id_jadwal
            WHERE a.id_antrian = $1 AND j.id_dosen = $2
            RETURNING ${kolomCatatan}
        `, [idAntrian, idDosen, isiCatatan]);

        if (!rows.length) {
            return null;
        }

        await beriNotifikasi(client, idAntrian);
        return rows[0];
    });
}

async function ubahCatatan(idAntrian, idCatatan, idDosen, isiCatatan) {
    return transaction(async (client) => {
        const { rows } = await client.query(`
            UPDATE catatan_bimbingan AS c
            SET isi_catatan = $4, updated_at = CURRENT_TIMESTAMP
            WHERE c.id_antrian = $1 AND c.id_catatan = $2 AND c.id_penulis = $3
                AND EXISTS (
                    SELECT 1 FROM antrian a
                    JOIN jadwal_bimbingan j ON j.id_jadwal = a.id_jadwal
                    WHERE a.id_antrian = c.id_antrian AND j.id_dosen = $3
                )
            RETURNING ${kolomCatatan}
        `, [idAntrian, idCatatan, idDosen, isiCatatan]);

        if (!rows.length) {
            return null;
        }

        await beriNotifikasi(client, idAntrian);
        return rows[0];
    });
}

module.exports = {
    ambilCatatan,
    tambahCatatan,
    ubahCatatan,
};
