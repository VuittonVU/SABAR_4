const router = require('express').Router();
const { autentikasi, otorisasi } = require('../middlewares/otorisasi.middleware');
const controller = require('../controllers/antrean.controller');

router.use(autentikasi, otorisasi('Dosen'));
router.get('/:idAntrian', controller.validasiId, controller.detail);
router.patch('/:idAntrian/status', controller.validasiId, controller.validasiPerubahan, controller.ubahStatus);

module.exports = router;
