const router = require('express').Router();
const { autentikasi, otorisasi } = require('../middlewares/otorisasi.middleware');
const controller = require('../controllers/jadwal.controller');

router.use(autentikasi);

// Endpoint pembacaan daftar jadwal aktif beserta kalkulasi peserta dan sisa kuota untuk Mahasiswa
router.get('/aktif', otorisasi('Mahasiswa', 'Dosen', 'Admin'), controller.daftarAktif);

// Endpoint CRUD jadwal khusus untuk Dosen
router.get('/', otorisasi('Dosen'), controller.daftar);
router.post('/', otorisasi('Dosen'), controller.validasiInput, controller.tambah);
router.get('/:idJadwal', otorisasi('Dosen'), controller.validasiId, controller.detail);
router.patch('/:idJadwal', otorisasi('Dosen'), controller.validasiId, controller.validasiInput, controller.ubah);
router.delete('/:idJadwal', otorisasi('Dosen'), controller.validasiId, controller.hapus);

module.exports = router;
