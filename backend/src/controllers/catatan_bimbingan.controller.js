const { idValid } = require('../middlewares/otorisasi.middleware');
const catatanService = require('../services/catatan_bimbingan.service');
const ApiError = require('../utils/apiError');
const { sendSuccess } = require('../utils/apiResponse');

function validasiId(req, res, next) {
    const { idAntrian, idCatatan } = req.params;
    if (!idValid(idAntrian) || (idCatatan !== undefined && !idValid(idCatatan))) {
        return next(ApiError.badRequest('ID antrean atau catatan tidak valid.'));
    }
    next();
}

function validasiIsi(req, res, next) {
    const isi = req.body?.isi_catatan;
    if (typeof isi !== 'string' || !isi.trim() || isi.includes('\0')) {
        return next(ApiError.badRequest('Isi catatan wajib berupa teks yang valid.'));
    }

    res.locals.isiCatatan = isi.trim();
    next();
}

async function ambilCatatan(req, res, next) {
    try {
        const { idAntrian } = req.params;
        const idPengguna = res.locals.idPengguna;

        const catatan = await catatanService.ambilCatatan(idAntrian, idPengguna);

        if (catatan === null) {
            throw ApiError.notFound('Antrean tidak ditemukan.');
        }

        return sendSuccess(res, 'Daftar catatan bimbingan berhasil diambil.', catatan, 200);
    } catch (err) {
        next(err);
    }
}

async function tambahCatatan(req, res, next) {
    try {
        const { idAntrian } = req.params;
        const idPengguna = res.locals.idPengguna;
        const isiCatatan = res.locals.isiCatatan;

        const catatanBaru = await catatanService.tambahCatatan(idAntrian, idPengguna, isiCatatan);

        if (!catatanBaru) {
            throw ApiError.notFound('Antrean tidak ditemukan.');
        }

        return sendSuccess(res, 'Catatan bimbingan berhasil ditambahkan.', catatanBaru, 201);
    } catch (err) {
        next(err);
    }
}

async function ubahCatatan(req, res, next) {
    try {
        const { idAntrian, idCatatan } = req.params;
        const idPengguna = res.locals.idPengguna;
        const isiCatatan = res.locals.isiCatatan;

        const catatanDiubah = await catatanService.ubahCatatan(idAntrian, idCatatan, idPengguna, isiCatatan);

        if (!catatanDiubah) {
            throw ApiError.notFound('Catatan tidak ditemukan.');
        }

        return sendSuccess(res, 'Catatan bimbingan berhasil diperbarui.', catatanDiubah, 200);
    } catch (err) {
        next(err);
    }
}

module.exports = {
    validasiId,
    validasiIsi,
    ambilCatatan,
    tambahCatatan,
    ubahCatatan,
};
