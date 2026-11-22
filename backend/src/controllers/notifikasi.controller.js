const service = require('../services/notifikasi.service');
const { idValid } = require('../middlewares/otorisasi.middleware');
const { sendSuccess } = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

async function daftar(req, res, next) {
    try {
        const sebelum = req.query.sebelum ?? null;
        const limitText = req.query.limit ?? '50';
        if ((sebelum !== null && !idValid(sebelum))
            || typeof limitText !== 'string' || !/^[1-9][0-9]*$/.test(limitText)
            || Number(limitText) > 100) {
            throw ApiError.badRequest('Parameter sebelum atau limit tidak valid.');
        }
        const data = await service.daftar(res.locals.idPengguna, { sebelum, limit: Number(limitText) });
        return sendSuccess(res, 'Daftar notifikasi berhasil diambil.', data);
    } catch (err) { next(err); }
}

async function tandaiDibaca(req, res, next) {
    try {
        if (!idValid(req.params.idNotifikasi)) throw ApiError.badRequest('ID notifikasi tidak valid.');
        const data = await service.tandaiDibaca(res.locals.idPengguna, req.params.idNotifikasi);
        return sendSuccess(res, 'Notifikasi ditandai dibaca.', data);
    } catch (err) { next(err); }
}

async function tandaiSemuaDibaca(req, res, next) {
    try {
        const data = await service.tandaiSemuaDibaca(res.locals.idPengguna);
        return sendSuccess(res, 'Semua notifikasi ditandai dibaca.', data);
    } catch (err) { next(err); }
}

module.exports = { daftar, tandaiDibaca, tandaiSemuaDibaca };
