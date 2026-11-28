const { query } = require('../configs/database');
const transaction = require('../utils/transaction');
const ApiError = require('../utils/apiError');
const { idValid } = require('../middlewares/otorisasi.middleware');
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

/**
 * Kalkulasi posisi antrean dan estimasi waktu dilayani berdasarkan durasi rata-rata sesi bimbingan.
 */
async function kalkulasiEstimasi(db, idJadwal, nomorAntrian, durasiMenit = 15, jamMulai = '09:00:00') {
    const durasi = Number.isInteger(durasiMenit) && durasiMenit > 0 ? durasiMenit : 15;

    // Hitung antrean aktif di depan (Menunggu atau Dipanggil dengan nomor lebih kecil)
    const { rows: rowsDepan } = await db.query(`
        SELECT COUNT(*)::int AS antrean_di_depan
        FROM antrian
        WHERE id_jadwal = $1
          AND status_antrian IN ('Menunggu', 'Dipanggil')
          AND nomor_antrian < $2
    `, [idJadwal, nomorAntrian]);

    const antreanDiDepan = rowsDepan[0]?.antrean_di_depan || 0;
    const posisiAntrean = antreanDiDepan + 1;
    const estimasiMenitTunggu = antreanDiDepan * durasi;

    // Kalkulasi jam perkiraan dilayani dari jam_mulai jadwal
    let estimasiWaktuDilayani = null;
    if (jamMulai && typeof jamMulai === 'string') {
        const parts = jamMulai.split(':').map(Number);
        if (parts.length >= 2) {
            const [h, m] = parts;
            const totalMenitMulai = h * 60 + m + ((nomorAntrian - 1) * durasi);
            const estH = Math.floor(totalMenitMulai / 60) % 24;
            const estM = totalMenitMulai % 60;
            estimasiWaktuDilayani = `${String(estH).padStart(2, '0')}:${String(estM).padStart(2, '0')}`;
        }
    }

    return {
        posisi_antrean: posisiAntrean,
        antrean_di_depan: antreanDiDepan,
        durasi_per_sesi_menit: durasi,
        estimasi_menit_tunggu: estimasiMenitTunggu,
        estimasi_waktu_dilayani: estimasiWaktuDilayani,
    };
}

/**
 * Transaksi atomik pengambilan nomor antrean oleh Mahasiswa:
 * 1. Mengunci baris jadwal dengan FOR UPDATE
 * 2. Memvalidasi ketiadaan antrean ganda pada jadwal yang sama
 * 3. Memvalidasi ketersediaan kuota
 * 4. Generate nomor antrean unik sekuensial
 * 5. Menyimpan ke antrian dan riwayat_status dalam satu transaksi atomik
 */
async function ambilNomorAntrean(idMahasiswa, idJadwal) {
    if (!idValid(String(idJadwal))) {
        throw ApiError.badRequest('ID jadwal tidak valid.');
    }
    if (!idValid(String(idMahasiswa))) {
        throw ApiError.badRequest('ID mahasiswa tidak valid.');
    }

    return transaction(async (client) => {
        // 1. Kunci baris jadwal dengan FOR UPDATE untuk mencegah race condition kuota
        const { rows: jadwalRows } = await client.query(`
            SELECT j.id_jadwal, j.id_dosen, to_char(j.tanggal, 'YYYY-MM-DD') AS tanggal,
                   to_char(j.jam_mulai, 'HH24:MI:SS') AS jam_mulai,
                   to_char(j.jam_selesai, 'HH24:MI:SS') AS jam_selesai,
                   j.ruang, j.kuota_mhs, j.status_jadwal, j.durasi_menit,
                   p.nama AS nama_dosen
            FROM jadwal_bimbingan j
            JOIN pengguna p ON p.id_pengguna = j.id_dosen
            WHERE j.id_jadwal = $1
            FOR UPDATE OF j
        `, [idJadwal]);

        if (!jadwalRows.length) {
            throw ApiError.notFound('Jadwal bimbingan tidak ditemukan.');
        }

        const jadwal = jadwalRows[0];
        if (jadwal.status_jadwal.toLowerCase() !== 'aktif') {
            throw ApiError.conflict('Jadwal bimbingan tidak aktif atau sudah ditutup.');
        }

        // 2. Validasi ketiadaan antrean aktif ganda pada jadwal yang sama
        const { rows: antreanEksis } = await client.query(`
            SELECT id_antrian, nomor_antrian, status_antrian
            FROM antrian
            WHERE id_jadwal = $1 AND id_mahasiswa = $2
            LIMIT 1
        `, [idJadwal, idMahasiswa]);

        if (antreanEksis.length && antreanEksis[0].status_antrian !== 'Dibatalkan') {
            throw ApiError.conflict(`Anda sudah terdaftar pada jadwal ini dengan nomor antrean #${antreanEksis[0].nomor_antrian} (Status: ${antreanEksis[0].status_antrian}).`);
        }

        // Validasi mahasiswa tidak memiliki antrean aktif lain yang masih berjalan
        const { rows: antreanAktifLain } = await client.query(`
            SELECT a.id_antrian, a.nomor_antrian, a.status_antrian, to_char(j.tanggal, 'YYYY-MM-DD') AS tanggal
            FROM antrian a
            JOIN jadwal_bimbingan j ON j.id_jadwal = a.id_jadwal
            WHERE a.id_mahasiswa = $1 AND a.status_antrian IN ('Menunggu', 'Dipanggil')
              AND a.id_jadwal <> $2
            LIMIT 1
        `, [idMahasiswa, idJadwal]);

        if (antreanAktifLain.length) {
            throw ApiError.conflict(`Anda masih memiliki antrean aktif (#${antreanAktifLain[0].nomor_antrian}) pada tanggal ${antreanAktifLain[0].tanggal}. Selesaikan atau batalkan terlebih dahulu.`);
        }

        // 3. Validasi ketersediaan kuota
        const { rows: hitungRows } = await client.query(`
            SELECT COUNT(*)::int AS total_terdaftar,
                   COALESCE(MAX(nomor_antrian), 0)::int AS nomor_terakhir
            FROM antrian
            WHERE id_jadwal = $1 AND status_antrian NOT IN ('Dibatalkan')
        `, [idJadwal]);

        const totalTerdaftar = hitungRows[0].total_terdaftar;
        if (totalTerdaftar >= jadwal.kuota_mhs) {
            throw ApiError.conflict(`Kuota bimbingan untuk jadwal ini sudah penuh (${jadwal.kuota_mhs}/${jadwal.kuota_mhs}).`);
        }

        // 4. Generate nomor antrean unik sekuensial
        const nomorAntrianBaru = hitungRows[0].nomor_terakhir + 1;

        // 5. Simpan entri ke tabel antrian dengan status awal 'Menunggu'
        let antreanBaru;
        if (antreanEksis.length) {
            const { rows: updateRows } = await client.query(`
                UPDATE antrian
                SET nomor_antrian = $1, status_antrian = 'Menunggu', waktu_daftar = CURRENT_TIMESTAMP, versi = versi + 1
                WHERE id_antrian = $2
                RETURNING id_antrian, id_jadwal, id_mahasiswa, nomor_antrian, status_antrian,
                          to_char(waktu_daftar, 'YYYY-MM-DD HH24:MI:SS') AS waktu_daftar, versi
            `, [nomorAntrianBaru, antreanEksis[0].id_antrian]);
            antreanBaru = updateRows[0];
        } else {
            const { rows: insertRows } = await client.query(`
                INSERT INTO antrian (
                    id_jadwal,
                    id_mahasiswa,
                    nomor_antrian,
                    status_antrian,
                    waktu_daftar,
                    versi
                ) VALUES ($1, $2, $3, 'Menunggu', CURRENT_TIMESTAMP, 1)
                RETURNING id_antrian, id_jadwal, id_mahasiswa, nomor_antrian, status_antrian,
                          to_char(waktu_daftar, 'YYYY-MM-DD HH24:MI:SS') AS waktu_daftar, versi
            `, [idJadwal, idMahasiswa, nomorAntrianBaru]);
            antreanBaru = insertRows[0];
        }

        // 6. Simpan entri awal ke tabel riwayat_status dalam satu transaksi atomik
        await client.query(`
            INSERT INTO riwayat_status (
                id_antrian,
                id_user,
                status_lama,
                status_baru,
                jadwal_lama,
                jadwal_baru,
                catatan_perubahan
            ) VALUES ($1, $2, NULL, 'Menunggu', NULL, $3::jsonb, 'Pengambilan nomor antrean bimbingan')
        `, [
            antreanBaru.id_antrian,
            idMahasiswa,
            JSON.stringify(snapshot(jadwal))
        ]);

        // 7. Notifikasi persisten untuk mahasiswa
        await catatNotifikasi({
            idPengguna: idMahasiswa,
            idAntrian: antreanBaru.id_antrian,
            pesan: `Nomor antrean #${antreanBaru.nomor_antrian} berhasil diambil untuk jadwal bimbingan dengan ${jadwal.nama_dosen}.`,
        }, client);

        // 8. Hitung estimasi waktu tunggu & posisi
        const estimasi = await kalkulasiEstimasi(
            client,
            idJadwal,
            antreanBaru.nomor_antrian,
            jadwal.durasi_menit,
            jadwal.jam_mulai
        );

        return {
            ...antreanBaru,
            jadwal: {
                id_jadwal: jadwal.id_jadwal,
                id_dosen: jadwal.id_dosen,
                nama_dosen: jadwal.nama_dosen,
                tanggal: jadwal.tanggal,
                jam_mulai: jadwal.jam_mulai,
                jam_selesai: jadwal.jam_selesai,
                ruang: jadwal.ruang,
                durasi_menit: jadwal.durasi_menit,
            },
            estimasi,
        };
    });
}

/**
 * Mendapatkan antrean aktif milik mahasiswa (status Menunggu, Dipanggil, atau Ditunda)
 * beserta detail posisi antrean dan estimasi waktu dilayani.
 */
async function antreanAktifMahasiswa(idMahasiswa) {
    if (!idValid(String(idMahasiswa))) {
        throw ApiError.badRequest('ID mahasiswa tidak valid.');
    }

    const { rows } = await query(`
        SELECT a.id_antrian, a.id_jadwal, a.id_mahasiswa, a.nomor_antrian,
               a.status_antrian, a.versi,
               to_char(a.waktu_daftar, 'YYYY-MM-DD HH24:MI:SS') AS waktu_daftar,
               j.id_dosen, to_char(j.tanggal, 'YYYY-MM-DD') AS tanggal,
               to_char(j.jam_mulai, 'HH24:MI:SS') AS jam_mulai,
               to_char(j.jam_selesai, 'HH24:MI:SS') AS jam_selesai,
               j.ruang, j.durasi_menit, j.kuota_mhs,
               p.nama AS nama_dosen
        FROM antrian a
        JOIN jadwal_bimbingan j ON j.id_jadwal = a.id_jadwal
        JOIN pengguna p ON p.id_pengguna = j.id_dosen
        WHERE a.id_mahasiswa = $1
          AND a.status_antrian IN ('Menunggu', 'Dipanggil', 'Ditunda')
        ORDER BY a.waktu_daftar DESC
        LIMIT 1
    `, [idMahasiswa]);

    if (!rows.length) {
        return null;
    }

    const item = rows[0];
    const estimasi = await kalkulasiEstimasi(
        { query },
        item.id_jadwal,
        item.nomor_antrian,
        item.durasi_menit,
        item.jam_mulai
    );

    return {
        id_antrian: item.id_antrian,
        nomor_antrian: item.nomor_antrian,
        status_antrian: item.status_antrian,
        versi: item.versi,
        waktu_daftar: item.waktu_daftar,
        jadwal: {
            id_jadwal: item.id_jadwal,
            id_dosen: item.id_dosen,
            nama_dosen: item.nama_dosen,
            tanggal: item.tanggal,
            jam_mulai: item.jam_mulai,
            jam_selesai: item.jam_selesai,
            ruang: item.ruang,
            durasi_menit: item.durasi_menit,
            kuota_mhs: item.kuota_mhs,
        },
        estimasi,
    };
}

/**
 * Daftar jadwal aktif yang tersedia untuk dipilih oleh Mahasiswa saat mengambil antrean.
 */
async function daftarJadwalTersedia(idMahasiswa = null) {
    const { rows } = await query(`
        SELECT j.id_jadwal, j.id_dosen,
               to_char(j.tanggal, 'YYYY-MM-DD') AS tanggal,
               to_char(j.jam_mulai, 'HH24:MI') AS jam_mulai,
               to_char(j.jam_selesai, 'HH24:MI') AS jam_selesai,
               j.ruang, j.kuota_mhs, j.durasi_menit, j.status_jadwal,
               p.nama AS nama_dosen,
               COUNT(a.id_antrian)::int AS total_terdaftar,
               BOOL_OR(a.id_mahasiswa = $1) AS sudah_terdaftar
        FROM jadwal_bimbingan j
        JOIN pengguna p ON p.id_pengguna = j.id_dosen
        LEFT JOIN antrian a ON a.id_jadwal = j.id_jadwal AND a.status_antrian NOT IN ('Dibatalkan')
        WHERE LOWER(j.status_jadwal) = 'aktif'
        GROUP BY j.id_jadwal, p.nama
        ORDER BY j.tanggal ASC, j.jam_mulai ASC
    `, [idMahasiswa]);

    return rows.map((j) => ({
        ...j,
        total_terdaftar: Number(j.total_terdaftar),
        peserta: Number(j.total_terdaftar),
        sisa_kuota: Math.max(0, j.kuota_mhs - Number(j.total_terdaftar)),
        is_penuh: Number(j.total_terdaftar) >= j.kuota_mhs,
        sudah_terdaftar: Boolean(j.sudah_terdaftar),
    }));
}

/**
 * Mahasiswa membatalkan antrean yang masih berstatus 'Menunggu'
 */
async function batalAntreanMahasiswa(idMahasiswa, idAntrian) {
    if (!idValid(String(idAntrian))) throw ApiError.badRequest('ID antrean tidak valid.');

    return transaction(async (client) => {
        const { rows } = await client.query(`
            SELECT a.id_antrian, a.id_jadwal, a.nomor_antrian, a.status_antrian, a.versi,
                   j.id_dosen, to_char(j.tanggal, 'YYYY-MM-DD') AS tanggal,
                   to_char(j.jam_mulai, 'HH24:MI:SS') AS jam_mulai,
                   to_char(j.jam_selesai, 'HH24:MI:SS') AS jam_selesai, j.ruang
            FROM antrian a
            JOIN jadwal_bimbingan j ON j.id_jadwal = a.id_jadwal
            WHERE a.id_antrian = $1 AND a.id_mahasiswa = $2
            FOR UPDATE OF a
        `, [idAntrian, idMahasiswa]);

        if (!rows.length) {
            throw ApiError.notFound('Antrean tidak ditemukan.');
        }

        const antrean = rows[0];
        if (antrean.status_antrian !== 'Menunggu') {
            throw ApiError.conflict(`Hanya antrean berstatus 'Menunggu' yang dapat dibatalkan. Status saat ini: ${antrean.status_antrian}.`);
        }

        await client.query(`
            UPDATE antrian
            SET status_antrian = 'Dibatalkan', versi = versi + 1
            WHERE id_antrian = $1
        `, [idAntrian]);

        await client.query(`
            INSERT INTO riwayat_status (
                id_antrian, id_user, status_lama, status_baru, jadwal_lama, jadwal_baru, catatan_perubahan
            ) VALUES ($1, $2, 'Menunggu', 'Dibatalkan', $3::jsonb, $3::jsonb, 'Dibatalkan oleh mahasiswa')
        `, [idAntrian, idMahasiswa, JSON.stringify(snapshot(antrean))]);

        return { id_antrian: idAntrian, status_antrian: 'Dibatalkan' };
    });
}

module.exports = {
    detail,
    ubahStatus,
    kalkulasiEstimasi,
    ambilNomorAntrean,
    antreanAktifMahasiswa,
    daftarJadwalTersedia,
    batalAntreanMahasiswa,
};
