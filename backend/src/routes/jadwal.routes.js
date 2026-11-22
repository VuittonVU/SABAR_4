const router = require('express').Router();
const { autentikasi, otorisasi } = require('../middlewares/otorisasi.middleware');
const controller = require('../controllers/jadwal.controller');

router.use(autentikasi, otorisasi('Dosen'));
router.get('/', controller.daftar);
router.post('/', controller.validasiInput, controller.tambah);
router.get('/:idJadwal', controller.validasiId, controller.detail);
router.patch('/:idJadwal', controller.validasiId, controller.validasiInput, controller.ubah);
router.delete('/:idJadwal', controller.validasiId, controller.hapus);

module.exports = router;
