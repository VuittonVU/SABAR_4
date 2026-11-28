const riwayatService = require('../services/riwayat.service');
const { idValid } = require('../middlewares/otorisasi.middleware');
const { sendSuccess } = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

function validasiId(req, res, next) {
    if (!idValid(req.params.idAntrian)) {
        return next(ApiError.badRequest('ID antrean tidak valid.'));
    }
    next();
}

async function daftar(req, res, next) {
    try {
        const idPengguna = res.locals.idPengguna;
        const peran = res.locals.peran;
        const data = await riwayatService.ambilRiwayat(idPengguna, peran);
        return sendSuccess(res, 'Riwayat bimbingan berhasil diambil.', data);
    } catch (err) {
        next(err);
    }
}

async function detail(req, res, next) {
    try {
        const idPengguna = res.locals.idPengguna;
        const peran = res.locals.peran;
        const idAntrian = req.params.idAntrian;
        const data = await riwayatService.detailRiwayat(idPengguna, peran, idAntrian);
        return sendSuccess(res, 'Detail riwayat bimbingan berhasil diambil.', data);
    } catch (err) {
        next(err);
    }
}

module.exports = {
    validasiId,
    daftar,
    detail,
};
