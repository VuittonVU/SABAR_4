# API Catatan Bimbingan

Jalankan dari folder `backend` dengan `npm ci` dan `npm run dev`. Isi `backend/.env` berdasarkan `backend/.env.example` dengan konfigurasi PostgreSQL dan JWT milik tim. Gunakan database yang sudah memuat skema SABAR. Untuk database uji kosong, jalankan Query Database.txt terlebih dahulu.

API menggunakan header `Authorization: Bearer <token login>`. Token harus bertanda tangan HS256 dengan `JWT_SECRET` yang sama, memuat `sub` berupa string ID pengguna, dan memiliki masa berlaku `exp`. Jika login tim sudah tersedia, cek format token login terhadap kontrak ini.

## Demo lokal sebelum login tim siap

Jalankan `npm run demo --prefix uji-catatan` dari folder utama SABAR_4 setelah memasang paket `SABAR_Uji_API_Lokal.zip` dan dependensinya. Demo berjalan di `127.0.0.1:3001` dengan database sementara. Server demo memasang token dosen contoh secara otomatis sehingga Postman bisa memakai **No Auth**.

### Checklist sebelum integrasi atau rilis

- [ ] Matikan server demo dan jalankan backend aplikasi dengan `npm run dev` dari folder `backend`.
- [ ] Sambungkan frontend ke backend aplikasi dan kirim token yang diterbitkan oleh login tim melalui header `Authorization`. Pastikan kontrak token di atas sesuai dengan implementasi login.
- [ ] Uji request tanpa token dan dengan token kedaluwarsa. Keduanya harus menghasilkan HTTP 401. Uji juga bahwa mahasiswa hanya bisa membaca catatannya sendiri dan dosen hanya bisa menulis catatan sesuai aksesnya.

Backend aplikasi sudah mewajibkan JWT. Checklist ini memastikan integrasi memakai token login sungguhan dan aksesnya berfungsi sebelum rilis.

| Metode | Path | Hasil |
| --- | --- | --- |
| GET | /api/antrean/:idAntrian/catatan | 200 dengan daftar catatan, terbaru dulu. Daftar kosong jika belum ada catatan. |
| POST | /api/antrean/:idAntrian/catatan | 201 dengan catatan baru. |
| PATCH | /api/antrean/:idAntrian/catatan/:idCatatan | 200 dengan catatan yang sudah diperbarui. |

Kirim `Content-Type: application/json` untuk POST dan PATCH.

```json
{"isi_catatan":"Perjelas metode dan alasan pemilihan sampel."}
```

Respons sukses menggunakan properti `data`. Setiap catatan berisi `id_catatan`, `id_antrian`, `id_penulis`, `isi_catatan`, `created_at`, dan `updated_at`. ID PostgreSQL BIGINT dikirim sebagai string oleh driver pg. Gunakan `id_antrian` asli dari database, bukan nomor antrean yang tampil di layar.

Dosen yang menangani jadwal dapat membaca dan menambah catatan. Dosen dapat mengedit catatan yang ia tulis selama masih menangani jadwal tersebut. Mahasiswa hanya dapat membaca catatan pada antreannya sendiri. ID penulis diambil dari identitas login yang cocok dengan dosen pada jadwal.

Respons 400 menandai ID atau isi catatan yang tidak valid. Respons 401 menandai token yang tidak ada atau tidak valid. Respons 404 dipakai untuk antrean atau catatan yang tidak tersedia bagi pengguna.

Saat menghubungkan panel React, gunakan GET ketika memilih antrean. Pakai POST untuk menambah catatan baru dan simpan `id_catatan` yang dikembalikan. Gunakan PATCH dengan ID tersebut ketika mengedit catatan yang dipilih.

## Uji lewat PowerShell

Isi port, ID antrean yang dimiliki dosen penguji, dan token login dosen. Jalankan contoh ini dengan data uji.

```powershell
$port = 3000
$idAntrian = '1'
$token = Read-Host 'Token login dosen'
$headers = @{ Authorization = "Bearer $token" }
$url = "http://localhost:$port/api/antrean/$idAntrian/catatan"

$awal = Invoke-RestMethod -Method Post -Uri $url -Headers $headers -ContentType 'application/json' -Body '{"isi_catatan":"Perjelas metode penelitian."}'
$idCatatan = $awal.data.id_catatan
Invoke-RestMethod -Method Patch -Uri "$url/$idCatatan" -Headers $headers -ContentType 'application/json' -Body '{"isi_catatan":"Perjelas metode dan alasan pemilihan sampel."}'
(Invoke-RestMethod -Method Get -Uri $url -Headers $headers).data
```

Hasil GET harus memuat catatan dengan ID yang sama dan isi yang sudah diperbarui.
