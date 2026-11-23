const express = require('express');
const { autentikasi, otorisasi } = require('../middlewares/otorisasi.middleware');
const catatanController = require('../controllers/catatan_bimbingan.controller');

const router = express.Router({ mergeParams: true });

router.use(autentikasi, catatanController.validasiId);

router.get('/', otorisasi('Mahasiswa', 'Dosen'), catatanController.ambilCatatan);
router.post('/', otorisasi('Dosen'), catatanController.validasiIsi, catatanController.tambahCatatan);
router.patch('/:idCatatan', otorisasi('Dosen'), catatanController.validasiId, catatanController.validasiIsi, catatanController.ubahCatatan);

module.exports = router;
