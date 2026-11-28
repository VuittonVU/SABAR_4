const { query } = require('../configs/database');
const transaction = require('../utils/transaction');
const ApiError = require('../utils/apiError');
const { catatNotifikasi } = require('./notifikasi.service');

const kolomJadwal = `j.id_jadwal, to_char(j.tanggal, 'YYYY-MM-DD') AS tanggal,
    to_char(j.jam_mulai, 'HH24:MI:SS') AS jam_mulai,
    to_char(j.jam_selesai, 'HH24:MI:SS') AS jam_selesai, j.ruang`;
const transisi = new Map([
    ['Menunggu', ['Dipanggil', 'Ditunda']],
    ['Dipanggil', ['Selesai', 'Ditunda']],
    ['Ditunda', ['Dijadwalkan Ulang', 'Menunggu']],
]);

function snapshot(jadwal) {
    return {
        id_jadwal: jadwal.id_jadwal,
        tanggal: jadwal.tanggal,
        jam_mulai: jadwal.jam_mulai,
        jam_selesai: jadwal.jam_selesai,
        ruang: jadwal.ruang,
    };
}

async function ambilAntrean(client, idDosen, idAntrian, lock = false) {
    const { rows } = await client.query(`
        SELECT a.id_antrian, a.id_jadwal, a.id_mahasiswa, a.nomor_antrian,
            a.status_antrian, a.versi, j.id_dosen,
            to_char(j.tanggal, 'YYYY-MM-DD') AS tanggal,
            to_char(j.jam_mulai, 'HH24:MI:SS') AS jam_mulai,
            to_char(j.jam_selesai, 'HH24:MI:SS') AS jam_selesai, j.ruang
        FROM antrian a
        JOIN jadwal_bimbingan j ON j.id_jadwal = a.id_jadwal
        WHERE a.id_antrian = $1 AND j.id_dosen = $2
        ${lock ? 'FOR UPDATE OF a' : ''}
    `, [idAntrian, idDosen]);
    if (!rows.length) throw ApiError.notFound('Antrean tidak ditemukan.');
    return rows[0];
}

async function jadwalTujuan(client, idDosen, idJadwal) {
    const { rows } = await client.query(`
        SELECT ${kolomJadwal}, j.kuota_mhs, j.status_jadwal
        FROM jadwal_bimbingan j
        WHERE j.id_jadwal = $1 AND j.id_dosen = $2
        FOR UPDATE
    `, [idJadwal, idDosen]);
    if (!rows.length) throw ApiError.notFound('Jadwal baru tidak ditemukan.');
    if (rows[0].status_jadwal.toLowerCase() !== 'aktif') {
        throw ApiError.conflict('Jadwal baru tidak aktif.');
    }
    return rows[0];
}

async function ubahStatus(idDosen, idAntrian, input) {
    const { status_antrian: statusBaru, versi, id_jadwal_baru: idJadwalBaru = null,
        catatan_perubahan: catatan = null } = input;

    if (!Number.isInteger(versi) || versi < 1) {
        throw ApiError.badRequest('Versi antrean wajib berupa bilangan bulat positif.');
    }
    if (typeof statusBaru !== 'string' || typeof idDosen !== 'string' || typeof idAntrian !== 'string') {
        throw ApiError.badRequest('Data perubahan status tidak valid.');
    }
    if (catatan !== null && (typeof catatan !== 'string' || catatan.length > 1000 || catatan.includes('\0'))) {
        throw ApiError.badRequest('Catatan perubahan maksimal 1000 karakter.');
    }

    return transaction(async (client) => {
        const lama = await ambilAntrean(client, idDosen, idAntrian, true);
        if (lama.versi !== versi) {
            throw ApiError.conflict('Data antrean sudah berubah. Muat ulang sebelum mencoba kembali.');
        }
        if (!transisi.get(lama.status_antrian)?.includes(statusBaru)) {
            throw ApiError.conflict(`Transisi status ${lama.status_antrian} ke ${statusBaru} tidak diizinkan.`);
        }

        const butuhJadwalBaru = lama.status_antrian === 'Ditunda'
            && ['Dijadwalkan Ulang', 'Menunggu'].includes(statusBaru);
        if (butuhJadwalBaru !== (idJadwalBaru !== null)) {
            throw ApiError.badRequest(butuhJadwalBaru
                ? 'ID jadwal baru wajib diisi untuk melanjutkan antrean yang ditunda.'
                : 'ID jadwal baru hanya boleh diisi saat melanjutkan antrean yang ditunda.');
        }

        let jadwalBaru = lama;
        let nomorAntrian = lama.nomor_antrian;
        if (butuhJadwalBaru) {
            if (idJadwalBaru === lama.id_jadwal) {
                throw ApiError.badRequest('Jadwal baru harus berbeda dari jadwal lama.');
            }
            jadwalBaru = await jadwalTujuan(client, idDosen, idJadwalBaru);
            const { rows } = await client.query(`
                SELECT COUNT(*)::int AS jumlah, COALESCE(MAX(nomor_antrian), 0)::int AS nomor_terakhir
                FROM antrian WHERE id_jadwal = $1
            `, [idJadwalBaru]);
            if (rows[0].jumlah >= jadwalBaru.kuota_mhs) {
                throw ApiError.conflict('Kuota jadwal baru sudah penuh.');
            }
            nomorAntrian = rows[0].nomor_terakhir + 1;
        }

        const { rows: antreanRows } = await client.query(`
            UPDATE antrian SET status_antrian = $3, id_jadwal = $4,
                nomor_antrian = $5, versi = versi + 1
            WHERE id_antrian = $1 AND versi = $2
            RETURNING id_antrian, id_jadwal, id_mahasiswa, nomor_antrian, status_antrian, versi
        `, [idAntrian, versi, statusBaru, jadwalBaru.id_jadwal, nomorAntrian]);
        if (!antreanRows.length) {
            throw ApiError.conflict('Data antrean sudah berubah. Muat ulang sebelum mencoba kembali.');
        }

        await client.query(`
            INSERT INTO riwayat_status
                (id_antrian, id_user, status_lama, status_baru, jadwal_lama, jadwal_baru, catatan_perubahan)
            VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7)
        `, [idAntrian, idDosen, lama.status_antrian, statusBaru,
            JSON.stringify(snapshot(lama)), JSON.stringify(snapshot(jadwalBaru)),
            catatan?.trim() || null]);

        await catatNotifikasi({
            idPengguna: lama.id_mahasiswa,
            idAntrian,
            pesan: `Status antrean #${idAntrian} berubah menjadi ${statusBaru}.`,
        }, client);

        return antreanRows[0];
    });
}

async function detail(idDosen, idAntrian) {
    return ambilAntrean({ query }, idDosen, idAntrian);
}

module.exports = { detail, ubahStatus };
