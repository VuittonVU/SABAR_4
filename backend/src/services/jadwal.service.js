const { query } = require('../configs/database');
const transaction = require('../utils/transaction');
const ApiError = require('../utils/apiError');
const { catatNotifikasi } = require('./notifikasi.service');

const kolom = `j.id_jadwal, j.id_dosen, to_char(j.tanggal, 'YYYY-MM-DD') AS tanggal,
    j.jam_mulai, j.jam_selesai, j.ruang, j.kuota_mhs, j.status_jadwal, j.durasi_menit`;

function waktu(value) {
    if (typeof value !== 'string' || !/^([01][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/.test(value)) {
        throw ApiError.badRequest('Jam harus dalam format HH:mm atau HH:mm:ss.');
    }
    const [h, m, s = 0] = value.split(':').map(Number);
    return h * 3600 + m * 60 + s;
}

function validasi(data) {
    const parsed = typeof data.tanggal === 'string' ? new Date(data.tanggal + 'T00:00:00Z') : new Date(NaN);
    if (Number.isNaN(parsed.getTime()) || typeof data.tanggal !== 'string' || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(data.tanggal)
        || data.tanggal < '0001-01-01'
        || parsed.toISOString().slice(0, 10) !== data.tanggal) {
        throw ApiError.badRequest('Tanggal harus valid dalam format YYYY-MM-DD.');
    }
    const mulai = waktu(data.jam_mulai);
    const selesai = waktu(data.jam_selesai);
    if (selesai <= mulai) throw ApiError.badRequest('Jam selesai harus setelah jam mulai pada hari yang sama.');
    if (!Number.isInteger(data.kuota_mhs) || data.kuota_mhs < 1 || data.kuota_mhs > 2147483647
        || !Number.isInteger(data.durasi_menit) || data.durasi_menit < 1 || data.durasi_menit > 2147483647) {
        throw ApiError.badRequest('Kuota dan durasi menit wajib berupa bilangan bulat positif.');
    }
    if (!['Aktif', 'Nonaktif'].includes(data.status_jadwal)) {
        throw ApiError.badRequest('Status jadwal harus Aktif atau Nonaktif.');
    }
    if (data.ruang !== null && (typeof data.ruang !== 'string' || data.ruang.length > 100 || data.ruang.includes('\0'))) {
        throw ApiError.badRequest('Ruang maksimal 100 karakter.');
    }
}

// Semua perubahan jadwal satu dosen dikunci lewat baris pengguna yang sama.
async function kunciDosen(client, idDosen) {
    const { rows } = await client.query('SELECT id_pengguna FROM pengguna WHERE id_pengguna = $1 FOR UPDATE', [idDosen]);
    if (!rows.length) throw ApiError.notFound('Dosen tidak ditemukan.');
}

async function cekBenturan(client, idDosen, data, idJadwal = null) {
    if (data.status_jadwal !== 'Aktif') return;
    const { rows } = await client.query(`
        SELECT id_jadwal FROM jadwal_bimbingan
        WHERE id_dosen = $1 AND tanggal = $2 AND LOWER(status_jadwal) = 'aktif'
            AND jam_mulai < $4::time AND jam_selesai > $3::time
            AND ($5::bigint IS NULL OR id_jadwal <> $5)
        LIMIT 1
    `, [idDosen, data.tanggal, data.jam_mulai, data.jam_selesai, idJadwal]);
    if (rows.length) throw ApiError.conflict('Jadwal berbenturan dengan jadwal aktif dosen.');
}

async function daftar(idDosen) {
    const { rows } = await query(`SELECT ${kolom} FROM jadwal_bimbingan j
        WHERE j.id_dosen = $1 ORDER BY j.tanggal, j.jam_mulai, j.id_jadwal`, [idDosen]);
    return rows;
}

async function ambil(client, idDosen, idJadwal, lock = false) {
    const { rows } = await client.query(`SELECT ${kolom} FROM jadwal_bimbingan j
        WHERE j.id_jadwal = $1 AND j.id_dosen = $2 ${lock ? 'FOR UPDATE' : ''}`, [idJadwal, idDosen]);
    if (!rows.length) throw ApiError.notFound('Jadwal tidak ditemukan.');
    return rows[0];
}

async function detail(idDosen, idJadwal) {
    return ambil({ query }, idDosen, idJadwal);
}

async function tambah(idDosen, input) {
    const data = { status_jadwal: 'Aktif', ruang: null, ...input };
    validasi(data);
    return transaction(async (client) => {
        await kunciDosen(client, idDosen);
        await cekBenturan(client, idDosen, data);
        const { rows } = await client.query(`
            INSERT INTO jadwal_bimbingan (id_dosen, tanggal, jam_mulai, jam_selesai, ruang, kuota_mhs, status_jadwal, durasi_menit)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id_jadwal
        `, [idDosen, data.tanggal, data.jam_mulai, data.jam_selesai, data.ruang, data.kuota_mhs, data.status_jadwal, data.durasi_menit]);
        return ambil(client, idDosen, rows[0].id_jadwal);
    });
}

async function ubah(idDosen, idJadwal, input) {
    return transaction(async (client) => {
        await kunciDosen(client, idDosen);
        const lama = await ambil(client, idDosen, idJadwal, true);
        const data = { ...lama, ...input };
        validasi(data);
        const peserta = await client.query('SELECT COUNT(*)::int AS jumlah FROM antrian WHERE id_jadwal = $1', [idJadwal]);
        if (data.kuota_mhs < peserta.rows[0].jumlah) {
            throw ApiError.conflict('Kuota tidak boleh kurang dari jumlah peserta terdaftar.');
        }
        await cekBenturan(client, idDosen, data, idJadwal);
        await client.query(`
            UPDATE jadwal_bimbingan SET tanggal=$3, jam_mulai=$4, jam_selesai=$5,
                ruang=$6, kuota_mhs=$7, status_jadwal=$8, durasi_menit=$9
            WHERE id_jadwal=$1 AND id_dosen=$2
        `, [idJadwal, idDosen, data.tanggal, data.jam_mulai, data.jam_selesai,
            data.ruang, data.kuota_mhs, data.status_jadwal, data.durasi_menit]);
        const baru = await ambil(client, idDosen, idJadwal);
        const berubah = Object.keys(input).some((key) => lama[key] !== baru[key]);
        if (berubah) {
            const { rows } = await client.query('SELECT id_antrian, id_mahasiswa FROM antrian WHERE id_jadwal=$1', [idJadwal]);
            for (const peserta of rows) {
                await catatNotifikasi({
                    idPengguna: peserta.id_mahasiswa,
                    idAntrian: peserta.id_antrian,
                    pesan: `Jadwal bimbingan #${idJadwal} diperbarui. Periksa detail jadwal terbaru.`,
                }, client);
            }
        }
        return baru;
    });
}

async function hapus(idDosen, idJadwal) {
    return transaction(async (client) => {
        await kunciDosen(client, idDosen);
        await ambil(client, idDosen, idJadwal, true);
        const { rows } = await client.query('SELECT 1 FROM antrian WHERE id_jadwal=$1 LIMIT 1', [idJadwal]);
        if (rows.length) throw ApiError.conflict('Jadwal sudah memiliki antrean. Gunakan status Nonaktif.');
        await client.query('DELETE FROM jadwal_bimbingan WHERE id_jadwal=$1 AND id_dosen=$2', [idJadwal, idDosen]);
        return null;
    });
}

module.exports = { daftar, detail, tambah, ubah, hapus };
