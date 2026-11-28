const bcrypt = require('bcryptjs');
const { pool } = require('../configs/database');
const ApiError = require('../utils/apiError');

const kolomPengguna = `
    id_pengguna, id_role, username, nama, email_npm, status_aktif, created_at
`;
const kolomReferensi = 'id_referensi, tipe, nama, nilai, detail_info';

async function dalamTransaksi(work) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await work(client);
        await client.query('COMMIT');
        return result;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

async function catat(client, idUser, aksi, namaTabel, idData, ipAddress, status = 'berhasil') {
    await client.query(`
        INSERT INTO audit_log (id_user, aksi, nama_tabel, id_data, ip_address, status)
        VALUES ($1, $2, $3, $4, $5, $6);
    `, [idUser, aksi, namaTabel, idData, ipAddress || null, status]);
}

async function validasiRole(client, idRole) {
    const { rowCount } = await client.query(
        `SELECT 1 FROM data_referensi WHERE id_referensi = $1 AND tipe = 'role'`,
        [idRole],
    );
    if (!rowCount) throw ApiError.badRequest('Role pengguna tidak valid.');
}

async function daftarPengguna(idAdmin, ipAddress) {
    return dalamTransaksi(async (client) => {
        const { rows } = await client.query(`
            SELECT ${kolomPengguna}
            FROM pengguna
            ORDER BY id_pengguna;
        `);
        await catat(client, idAdmin, 'DAFTAR', 'pengguna', null, ipAddress);
        return rows;
    });
}

async function buatPengguna(idAdmin, data, ipAddress) {
    const hash = await bcrypt.hash(data.password, 10);
    return dalamTransaksi(async (client) => {
        await validasiRole(client, data.id_role);
        const { rows } = await client.query(`
            INSERT INTO pengguna (id_role, username, kata_sandi_hash, nama, email_npm)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING ${kolomPengguna};
        `, [data.id_role, data.username.trim(), hash, data.nama.trim(), data.email_npm.trim().toLowerCase()]);
        await catat(client, idAdmin, 'BUAT', 'pengguna', rows[0].id_pengguna, ipAddress);
        return rows[0];
    });
}

async function ubahPengguna(idAdmin, idPengguna, data, ipAddress) {
    const values = [];
    const updates = [];
    const kolom = { id_role: 'id_role', username: 'username', nama: 'nama', email_npm: 'email_npm' };

    for (const [field, column] of Object.entries(kolom)) {
        if (data[field] !== undefined) {
            if (field === 'id_role') {
                values.push(data[field]);
            } else {
                const normalized = field === 'email_npm' ? data[field].trim().toLowerCase() : data[field].trim();
                values.push(normalized);
            }
            updates.push(`${column} = $${values.length}`);
        }
    }
    if (data.password !== undefined) {
        values.push(await bcrypt.hash(data.password, 10));
        updates.push(`kata_sandi_hash = $${values.length}`);
    }

    return dalamTransaksi(async (client) => {
        if (data.id_role !== undefined) await validasiRole(client, data.id_role);
        values.push(idPengguna);
        const { rows } = await client.query(`
            UPDATE pengguna
            SET ${updates.join(', ')}
            WHERE id_pengguna = $${values.length}
            RETURNING ${kolomPengguna};
        `, values);
        if (!rows[0]) throw ApiError.notFound('Pengguna tidak ditemukan.');
        await catat(client, idAdmin, 'UBAH', 'pengguna', idPengguna, ipAddress);
        return rows[0];
    });
}

async function ubahStatusPengguna(idAdmin, idPengguna, statusAktif, ipAddress) {
    return dalamTransaksi(async (client) => {
        const { rows } = await client.query(`
            UPDATE pengguna
            SET status_aktif = $1
            WHERE id_pengguna = $2
            RETURNING ${kolomPengguna};
        `, [statusAktif, idPengguna]);
        if (!rows[0]) throw ApiError.notFound('Pengguna tidak ditemukan.');
        await catat(
            client,
            idAdmin,
            statusAktif ? 'AKTIFKAN' : 'NONAKTIFKAN',
            'pengguna',
            idPengguna,
            ipAddress,
        );
        return rows[0];
    });
}

async function daftarReferensi(idAdmin, ipAddress) {
    return dalamTransaksi(async (client) => {
        const { rows } = await client.query(`
            SELECT ${kolomReferensi}
            FROM data_referensi
            ORDER BY id_referensi;
        `);
        await catat(client, idAdmin, 'DAFTAR', 'data_referensi', null, ipAddress);
        return rows;
    });
}

async function buatReferensi(idAdmin, data, ipAddress) {
    return dalamTransaksi(async (client) => {
        const { rows } = await client.query(`
            INSERT INTO data_referensi (tipe, nama, nilai, detail_info)
            VALUES ($1, $2, $3, $4)
            RETURNING ${kolomReferensi};
        `, [data.tipe.trim(), data.nama.trim(), data.nilai ?? null, data.detail_info ?? null]);
        await catat(client, idAdmin, 'BUAT', 'data_referensi', rows[0].id_referensi, ipAddress);
        return rows[0];
    });
}

async function ubahReferensi(idAdmin, idReferensi, data, ipAddress) {
    const kolom = { tipe: 'tipe', nama: 'nama', nilai: 'nilai', detail_info: 'detail_info' };
    const values = [];
    const updates = [];
    for (const [field, column] of Object.entries(kolom)) {
        if (data[field] !== undefined) {
            values.push(typeof data[field] === 'string' && ['tipe', 'nama'].includes(field)
                ? data[field].trim()
                : data[field]);
            updates.push(`${column} = $${values.length}`);
        }
    }

    return dalamTransaksi(async (client) => {
        values.push(idReferensi);
        const { rows } = await client.query(`
            UPDATE data_referensi
            SET ${updates.join(', ')}
            WHERE id_referensi = $${values.length}
            RETURNING ${kolomReferensi};
        `, values);
        if (!rows[0]) throw ApiError.notFound('Data referensi tidak ditemukan.');
        await catat(client, idAdmin, 'UBAH', 'data_referensi', idReferensi, ipAddress);
        return rows[0];
    });
}

async function hapusReferensi(idAdmin, idReferensi, ipAddress) {
    return dalamTransaksi(async (client) => {
        const { rowCount } = await client.query(
            'DELETE FROM data_referensi WHERE id_referensi = $1',
            [idReferensi],
        );
        if (!rowCount) throw ApiError.notFound('Data referensi tidak ditemukan.');
        await catat(client, idAdmin, 'HAPUS', 'data_referensi', idReferensi, ipAddress);
        return { id_referensi: idReferensi };
    });
}

async function catatAksesDitolak(idUser, idData, ipAddress) {
    await pool.query(`
        INSERT INTO audit_log (id_user, aksi, nama_tabel, id_data, ip_address, status)
        VALUES ($1, 'AKSES_DITOLAK', 'berkas_revisi', $2, $3, 'ditolak');
    `, [idUser, idData, ipAddress || null]);
}

module.exports = {
    daftarPengguna,
    buatPengguna,
    ubahPengguna,
    ubahStatusPengguna,
    daftarReferensi,
    buatReferensi,
    ubahReferensi,
    hapusReferensi,
    catatAksesDitolak,
};
