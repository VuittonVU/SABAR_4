const router = require('express').Router();
const { autentikasi, otorisasi } = require('../middlewares/otorisasi.middleware');
const controller = require('../controllers/notifikasi.controller');

router.use(autentikasi, otorisasi('Mahasiswa', 'Dosen', 'Admin'));
router.get('/', controller.daftar);
router.patch('/dibaca-semua', controller.tandaiSemuaDibaca);
router.patch('/:idNotifikasi/dibaca', controller.tandaiDibaca);

module.exports = router;
