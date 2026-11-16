# Halaman autentikasi SABAR

Pratinjau frontend untuk login, registrasi mahasiswa, lupa kata sandi, dan reset kata sandi. Dosen dan Admin memakai form login bersama melalui email. Identitas dan peran akun akan ditentukan oleh server setelah integrasi.

## Menjalankan

Ekstrak ZIP, lalu dari folder yang berisi `frontend/` jalankan:

```powershell
npm ci --prefix frontend
npm run dev --prefix frontend
```

Buka alamat yang ditampilkan Vite. Halaman tersedia di `/`, `/login`, `/registrasi`, `/lupa-kata-sandi`, dan `/reset-kata-sandi`. Dari halaman lupa kata sandi, tautan **Pratinjau reset** membuka desain reset tanpa email.

Form memeriksa input di browser. Kata sandi baru memakai minimum delapan karakter untuk pratinjau. Submit memberi status lokal. Frontend ini tidak membuat akun, masuk, membuka dashboard, mengirim email, menyimpan sesi, atau mengubah kata sandi.

## Penggabungan ke repo

Untuk repo yang sudah punya folder frontend, bandingkan dan gabungkan `frontend/index.html`, `frontend/src/App.jsx`, `frontend/src/App.css`, serta `frontend/src/index.css`. File `AUTH-INTEGRASI.md` dapat disalin sebagai catatan. Jika sebelumnya sudah menyalin ZIP versi pertama, hapus `frontend/src/auth-api.js` dan `frontend/.env.example` dari versi tersebut jika belum dipakai oleh perubahan lain, lalu gabungkan konfigurasi Vite dasar dari ZIP revisi untuk menghapus proxy autentikasi yang sebelumnya ditambahkan.

Pada `branchBintang` commit `8e95137`, router backend memasang Catatan Bimbingan dan middleware memverifikasi Bearer JWT. Tidak ada endpoint autentikasi yang dipanggil oleh pratinjau ini. Tim dapat menyambungkan handler form di `src/App.jsx` saat endpoint dan strategi sesi disepakati.

Untuk build produksi, jalankan `npm run build --prefix frontend` dan aktifkan fallback ke `index.html` pada rute halaman frontend.
