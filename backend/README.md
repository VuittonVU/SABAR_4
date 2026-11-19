# Backend SABAR

Backend menggunakan Express.js untuk menyediakan API dan menjalankan
logika sistem, seperti login, hak akses, jadwal, dan antrean bimbingan.

## Middleware autentikasi dan otorisasi

Gunakan `autentikasi` sebelum `otorisasi(...)` pada route yang dilindungi.
Middleware membaca JWT dari header `Authorization: Bearer <token>` dan
menaruh ID pengguna serta perannya di `res.locals.idPengguna` dan
`res.locals.peran`. Token harus memuat `sub` sebagai ID pengguna dan `role`
(atau alias `peran`) dengan nilai `Mahasiswa`, `Dosen`, atau `Admin`.

Contoh:

```js
const { autentikasi, otorisasi } = require('./middlewares/otorisasi');

router.get('/admin', autentikasi, otorisasi('Admin'), handler);
router.get('/jadwal', autentikasi, otorisasi('Mahasiswa', 'Dosen'), handler);
```

Token yang tidak ada atau tidak valid menghasilkan `401`; pengguna yang
perannya tidak diizinkan menghasilkan `403`. Pada endpoint catatan bimbingan,
Mahasiswa dan Dosen dapat membaca catatan, sedangkan hanya Dosen yang dapat
membuat atau mengubahnya.
