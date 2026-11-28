const { idValid } = require('../middlewares/otorisasi.middleware');
const antreanService = require('../services/antrean.service');
const ApiError = require('../utils/apiError');
const { sendSuccess } = require('../utils/apiResponse');

function validasiId(req, res, next) {
    if (!idValid(req.params.idAntrian)) {
        return next(ApiError.badRequest('ID antrean tidak valid.'));
    }
    next();
}

function validasiPerubahan(req, res, next) {
    const body = req.body;
    const kolom = ['status_antrian', 'versi', 'id_jadwal_baru', 'catatan_perubahan'];
    if (!body || Array.isArray(body) || typeof body !== 'object'
        || Object.keys(body).some((key) => !kolom.includes(key))
        || typeof body.status_antrian !== 'string'
        || !Number.isInteger(body.versi)
        || (body.id_jadwal_baru !== undefined && !idValid(body.id_jadwal_baru))
        || (body.catatan_perubahan !== undefined && typeof body.catatan_perubahan !== 'string')) {
        return next(ApiError.badRequest('Isi JSON perubahan status tidak valid.'));
    }
    next();
}

async function detail(req, res, next) {
    try {
        const data = await antreanService.detail(res.locals.idPengguna, req.params.idAntrian);
        return sendSuccess(res, 'Detail antrean berhasil diambil.', data);
    } catch (err) {
        next(err);
    }
}

async function ubahStatus(req, res, next) {
    try {
        const data = await antreanService.ubahStatus(
            res.locals.idPengguna, req.params.idAntrian, req.body,
        );
        return sendSuccess(res, 'Status antrean berhasil diperbarui.', data);
    } catch (err) {
        next(err);
    }
}

async function ambilNomorAntrean(req, res, next) {
    try {
        const idJadwal = req.body?.id_jadwal;
        if (!idJadwal || !idValid(String(idJadwal))) {
            return next(ApiError.badRequest('ID jadwal wajib diisi dan harus berupa angka valid.'));
        }

        const data = await antreanService.ambilNomorAntrean(res.locals.idPengguna, String(idJadwal));
        return sendSuccess(res, 'Nomor antrean berhasil diambil.', data, 201);
    } catch (err) {
        next(err);
    }
}

async function antreanAktif(req, res, next) {
    try {
        const data = await antreanService.antreanAktifMahasiswa(res.locals.idPengguna);
        return sendSuccess(res, 'Data antrean aktif berhasil diambil.', data);
    } catch (err) {
        next(err);
    }
}

async function jadwalTersedia(req, res, next) {
    try {
        const data = await antreanService.daftarJadwalTersedia(res.locals.idPengguna);
        return sendSuccess(res, 'Daftar jadwal bimbingan tersedia berhasil diambil.', data);
    } catch (err) {
        next(err);
    }
}

async function batalAntrean(req, res, next) {
    try {
        const data = await antreanService.batalAntreanMahasiswa(res.locals.idPengguna, req.params.idAntrian);
        return sendSuccess(res, 'Antrean berhasil dibatalkan.', data);
    } catch (err) {
        next(err);
    }
}

module.exports = {
    validasiId,
    validasiPerubahan,
    detail,
    ubahStatus,
    ambilNomorAntrean,
    antreanAktif,
    jadwalTersedia,
    batalAntrean,
};
