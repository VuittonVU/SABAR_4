const router = require('express').Router();
const { autentikasi, otorisasi } = require('../middlewares/otorisasi.middleware');
const controller = require('../controllers/antrean.controller');

router.use(autentikasi);

// Endpoint untuk Mahasiswa
router.get('/aktif', otorisasi('Mahasiswa'), controller.antreanAktif);
router.get('/jadwal-tersedia', otorisasi('Mahasiswa'), controller.jadwalTersedia);
router.post('/ambil', otorisasi('Mahasiswa'), controller.ambilNomorAntrean);
router.post('/', otorisasi('Mahasiswa'), controller.ambilNomorAntrean);
router.patch('/:idAntrian/batal', otorisasi('Mahasiswa'), controller.validasiId, controller.batalAntrean);

// Endpoint untuk Dosen
router.get('/:idAntrian', otorisasi('Dosen'), controller.validasiId, controller.detail);
router.patch('/:idAntrian/status', otorisasi('Dosen'), controller.validasiId, controller.validasiPerubahan, controller.ubahStatus);

module.exports = router;
