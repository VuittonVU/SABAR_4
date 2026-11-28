# API Admin & Audit

Semua endpoint memakai `Authorization: Bearer <token>` dan hanya dapat
digunakan oleh peran `Admin`. ID harus berupa bilangan positif.

## Akun pengguna

| Metode | Endpoint | Keterangan |
| --- | --- | --- |
| GET | `/api/admin-audit/pengguna` | Daftar akun tanpa hash kata sandi |
| POST | `/api/admin-audit/pengguna` | Membuat akun dengan `id_role`, `username`, `password`, `nama`, dan `email_npm` |
| PATCH | `/api/admin-audit/pengguna/:idPengguna` | Mengubah `id_role`, `username`, `password`, `nama`, dan/atau `email_npm` |
| PATCH | `/api/admin-audit/pengguna/:idPengguna/aktifkan` | Mengaktifkan akun |
| PATCH | `/api/admin-audit/pengguna/:idPengguna/nonaktifkan` | Menonaktifkan akun |

Akun baru aktif secara default. Kata sandi minimal 8 dan maksimal 72 byte,
disimpan sebagai hash, dan tidak pernah dikembalikan pada respons. Autentikasi
memeriksa status dan peran akun terbaru dari basis data sehingga token akun
nonaktif atau yang perannya berubah tidak tetap berwenang.

## Data referensi

| Metode | Endpoint | Keterangan |
| --- | --- | --- |
| GET | `/api/admin-audit/referensi` | Daftar seluruh data referensi |
| POST | `/api/admin-audit/referensi` | Membuat data dengan `tipe`, `nama`, dan opsional `nilai`, `detail_info` |
| PATCH | `/api/admin-audit/referensi/:idReferensi` | Mengubah kolom referensi yang dikirim |
| DELETE | `/api/admin-audit/referensi/:idReferensi` | Menghapus data yang tidak sedang direferensikan |

## Audit dan berkas revisi

Setiap operasi akun/referensi, termasuk daftar, menulis `id_user`, `aksi`,
`nama_tabel`, `id_data`, `waktu`, `ip_address`, dan `status` ke `audit_log`
bersama transaksi bisnis. Kata sandi, hash kata sandi, dan isi berkas tidak
disimpan dalam audit. Percobaan Admin pada `/api/berkas-revisi/*` ditolak
dengan `403` dan dicatat sebagai `AKSES_DITOLAK` pada tabel `berkas_revisi`.
Endpoint akses dan unduh berkas revisi belum disediakan oleh backend.
