const { query } = require('../configs/database');
const ApiError = require('../utils/apiError');
const { idValid } = require('../middlewares/otorisasi.middleware');

/**
 * Mengambil daftar riwayat bimbingan kronologis teragregasi
 * (jadwal, status, catatan, dan berkas revisi) sesuai hak akses.
 */
async function ambilRiwayat(idPengguna, peran) {
    if (!idValid(String(idPengguna))) {
        throw ApiError.badRequest('ID pengguna tidak valid.');
    }

    let filterClause = '';
    const params = [idPengguna];

    if (peran === 'Dosen') {
        filterClause = 'WHERE j.id_dosen = $1';
    } else if (peran === 'Mahasiswa') {
        filterClause = 'WHERE a.id_mahasiswa = $1';
    } else if (peran !== 'Admin') {
        throw ApiError.forbidden('Peran tidak memiliki hak akses melihat riwayat.');
    }

    // Ambil semua sesi antrean utama
    const { rows: antreanList } = await query(`
        SELECT a.id_antrian, a.id_jadwal, a.id_mahasiswa, a.nomor_antrian,
               a.status_antrian, a.versi,
               to_char(a.waktu_daftar, 'YYYY-MM-DD HH24:MI:SS') AS waktu_daftar,
               j.id_dosen,
               to_char(j.tanggal, 'YYYY-MM-DD') AS tanggal,
               to_char(j.jam_mulai, 'HH24:MI') AS jam_mulai,
               to_char(j.jam_selesai, 'HH24:MI') AS jam_selesai,
               j.ruang, j.durasi_menit,
               p_dosen.nama AS nama_dosen,
               p_mhs.nama AS nama_mahasiswa,
               p_mhs.email_npm AS email_npm_mahasiswa
        FROM antrian a
        JOIN jadwal_bimbingan j ON j.id_jadwal = a.id_jadwal
        JOIN pengguna p_dosen ON p_dosen.id_pengguna = j.id_dosen
        JOIN pengguna p_mhs ON p_mhs.id_pengguna = a.id_mahasiswa
        ${filterClause}
        ORDER BY j.tanggal DESC, a.waktu_daftar DESC, a.nomor_antrian ASC
    `, peran === 'Admin' ? [] : params);

    if (!antreanList.length) {
        return [];
    }

    const idAntrianList = antreanList.map((a) => a.id_antrian);

    // Ambil riwayat status transisi secara paralel
    const { rows: statusRows } = await query(`
        SELECT id_riwayat, id_antrian, status_lama, status_baru,
               to_char(waktu_perubahan, 'YYYY-MM-DD HH24:MI:SS') AS waktu_perubahan,
               catatan_perubahan
        FROM riwayat_status
        WHERE id_antrian = ANY($1::bigint[])
        ORDER BY waktu_perubahan ASC, id_riwayat ASC
    `, [idAntrianList]);

    // Ambil catatan bimbingan dosen
    const { rows: catatanRows } = await query(`
        SELECT id_catatan, id_antrian, id_penulis, isi_catatan,
               to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at,
               to_char(updated_at, 'YYYY-MM-DD HH24:MI:SS') AS updated_at
        FROM catatan_bimbingan
        WHERE id_antrian = ANY($1::bigint[])
        ORDER BY created_at DESC, id_catatan DESC
    `, [idAntrianList]);

    // Ambil berkas revisi
    const { rows: berkasRows } = await query(`
        SELECT id_berkas, id_antrian, id_pengunggah, nama_file, tipe_berkas, ukuran_file,
               status_revisi,
               to_char(waktu_upload, 'YYYY-MM-DD HH24:MI:SS') AS waktu_upload
        FROM berkas_revisi
        WHERE id_antrian = ANY($1::bigint[])
        ORDER BY waktu_upload DESC, id_berkas DESC
    `, [idAntrianList]);

    // Kelompokkan data agregasi berdasarkan id_antrian
    const statusMap = new Map();
    for (const r of statusRows) {
        if (!statusMap.has(r.id_antrian)) statusMap.set(r.id_antrian, []);
        statusMap.get(r.id_antrian).push(r);
    }

    const catatanMap = new Map();
    for (const c of catatanRows) {
        if (!catatanMap.has(c.id_antrian)) catatanMap.set(c.id_antrian, []);
        catatanMap.get(c.id_antrian).push(c);
    }

    const berkasMap = new Map();
    for (const b of berkasRows) {
        if (!berkasMap.has(b.id_antrian)) berkasMap.set(b.id_antrian, []);
        berkasMap.get(b.id_antrian).push(b);
    }

    return antreanList.map((item) => {
        const riwayatStatus = statusMap.get(item.id_antrian) || [];
        const catatanList = catatanMap.get(item.id_antrian) || [];
        const berkasList = berkasMap.get(item.id_antrian) || [];

        // Buat string ringkasan linimasa waktu (contoh: 09:12 Menunggu -> 10:03 Dipanggil -> 10:20 Selesai)
        const linimasaText = riwayatStatus.length > 0
            ? riwayatStatus.map((s) => `${s.waktu_perubahan?.slice(11, 16) || ''} ${s.status_baru}`).join(' → ')
            : `${item.status_antrian}`;

        return {
            ...item,
            riwayat_status: riwayatStatus,
            catatan_bimbingan: catatanList,
            berkas_revisi: berkasList,
            catatan_terbaru: catatanList[0]?.isi_catatan || '',
            berkas_terbaru: berkasList[0] || null,
            linimasa: linimasaText,
        };
    });
}

/**
 * Mengambil detail riwayat satu sesi antrean tertentu dengan otorisasi kepemilikan.
 */
async function detailRiwayat(idPengguna, peran, idAntrian) {
    if (!idValid(String(idPengguna)) || !idValid(String(idAntrian))) {
        throw ApiError.badRequest('ID antrean atau pengguna tidak valid.');
    }

    const hasilSemua = await ambilRiwayat(idPengguna, peran);
    const item = hasilSemua.find((h) => String(h.id_antrian) === String(idAntrian));

    if (!item) {
        throw ApiError.notFound('Riwayat sesi bimbingan tidak ditemukan atau tidak berada dalam lingkup hak akses Anda.');
    }

    return item;
}

module.exports = {
    ambilRiwayat,
    detailRiwayat,
};
