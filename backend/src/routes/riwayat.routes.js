const express = require('express');
const { autentikasi, otorisasi } = require('../middlewares/otorisasi.middleware');
const controller = require('../controllers/riwayat.controller');

const router = express.Router();

router.use(autentikasi, otorisasi('Mahasiswa', 'Dosen', 'Admin'));

router.get('/', controller.daftar);
router.get('/:idAntrian', controller.validasiId, controller.detail);

module.exports = router;
