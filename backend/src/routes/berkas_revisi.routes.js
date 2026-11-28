const router = require('express').Router();
const { autentikasi, otorisasi, idValid } = require('../middlewares/otorisasi.middleware');
const service = require('../services/admin_audit.service');
const ApiError = require('../utils/apiError');

router.use(autentikasi);
router.use(async (req, res, next) => {
    if (res.locals.peran !== 'Admin') return next();

    const id = /^\/([1-9][0-9]{0,18})(?:\/|$)/.exec(req.path)?.[1];
    try {
        await service.catatAksesDitolak(
            res.locals.idPengguna,
            idValid(id) ? id : null,
            req.ip,
        );
        return next(ApiError.forbidden('Admin tidak diizinkan mengakses atau mengunduh berkas revisi.'));
    } catch (err) {
        return next(err);
    }
});
router.use(otorisasi('Mahasiswa', 'Dosen'));

module.exports = router;
