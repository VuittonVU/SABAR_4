const router = require('express').Router();
const { autentikasi, otorisasi } = require('../middlewares/otorisasi.middleware');
const controller = require('../controllers/admin_audit.controller');

router.use(autentikasi, otorisasi('Admin'));

router.get('/pengguna', controller.daftarPengguna);
router.post('/pengguna', controller.validasiPengguna(true), controller.buatPengguna);
router.patch(
    '/pengguna/:idPengguna',
    controller.validasiId('idPengguna'),
    controller.validasiPengguna(false),
    controller.ubahPengguna,
);
router.patch('/pengguna/:idPengguna/aktifkan', controller.validasiId('idPengguna'), controller.aktifkanPengguna);
router.patch('/pengguna/:idPengguna/nonaktifkan', controller.validasiId('idPengguna'), controller.nonaktifkanPengguna);

router.get('/referensi', controller.daftarReferensi);
router.post('/referensi', controller.validasiReferensi(true), controller.buatReferensi);
router.patch(
    '/referensi/:idReferensi',
    controller.validasiId('idReferensi'),
    controller.validasiReferensi(false),
    controller.ubahReferensi,
);
router.delete('/referensi/:idReferensi', controller.validasiId('idReferensi'), controller.hapusReferensi);
router.get('/log', controller.daftarAudit);

module.exports = router;
