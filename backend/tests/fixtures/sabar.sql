
-- ==========================================
-- 1. TABEL DATA_REFERENSI
-- ==========================================

CREATE TABLE data_referensi (
    id_referensi BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tipe VARCHAR(50) NOT NULL,
    nama VARCHAR(100) NOT NULL,
    nilai VARCHAR(100),
    detail_info TEXT
);


-- ==========================================
-- 2. TABEL PENGGUNA
-- ==========================================

CREATE TABLE pengguna (
    id_pengguna BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_role BIGINT NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    kata_sandi_hash VARCHAR(255) NOT NULL,
    nama VARCHAR(150) NOT NULL,
    email_npm VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_pengguna_role
        FOREIGN KEY (id_role)
        REFERENCES data_referensi(id_referensi)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);


-- ==========================================
-- 3. TABEL JADWAL_BIMBINGAN
-- ==========================================

CREATE TABLE jadwal_bimbingan (
    id_jadwal BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_dosen BIGINT NOT NULL,
    tanggal DATE NOT NULL,
    jam_mulai TIME NOT NULL,
    jam_selesai TIME NOT NULL,
    ruang VARCHAR(100),
    kuota_mhs INTEGER NOT NULL,
    status_jadwal VARCHAR(30) NOT NULL,

    CONSTRAINT fk_jadwal_dosen
        FOREIGN KEY (id_dosen)
        REFERENCES pengguna(id_pengguna)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_jadwal_jam
        CHECK (jam_selesai > jam_mulai),

    CONSTRAINT chk_jadwal_kuota
        CHECK (kuota_mhs > 0)
);


-- ==========================================
-- 4. TABEL ANTRIAN
-- ==========================================

CREATE TABLE antrian (
    id_antrian BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_jadwal BIGINT NOT NULL,
    id_mahasiswa BIGINT NOT NULL,
    nomor_antrian INTEGER NOT NULL,
    waktu_daftar TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status_antrian VARCHAR(30) NOT NULL,
    waktu_dilayani TIMESTAMP,
    waktu_feedback TIMESTAMP,

    CONSTRAINT fk_antrian_jadwal
        FOREIGN KEY (id_jadwal)
        REFERENCES jadwal_bimbingan(id_jadwal)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_antrian_mahasiswa
        FOREIGN KEY (id_mahasiswa)
        REFERENCES pengguna(id_pengguna)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_nomor_antrian
        CHECK (nomor_antrian > 0),

    CONSTRAINT uq_antrian_nomor
        UNIQUE (id_jadwal, nomor_antrian),

    CONSTRAINT uq_antrian_mahasiswa
        UNIQUE (id_jadwal, id_mahasiswa)
);


-- ==========================================
-- 5. TABEL NOTIFIKASI
-- ==========================================

CREATE TABLE notifikasi (
    id_notifikasi BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_pengguna BIGINT NOT NULL,
    id_antrian BIGINT,
    pesan TEXT NOT NULL,
    waktu_dibuat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status_dibaca BOOLEAN NOT NULL DEFAULT FALSE,
    waktu_dibaca TIMESTAMP,

    CONSTRAINT fk_notifikasi_pengguna
        FOREIGN KEY (id_pengguna)
        REFERENCES pengguna(id_pengguna)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_notifikasi_antrian
        FOREIGN KEY (id_antrian)
        REFERENCES antrian(id_antrian)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);


-- ==========================================
-- 6. TABEL BERKAS_REVISI
-- ==========================================

CREATE TABLE berkas_revisi (
    id_berkas BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_antrian BIGINT NOT NULL,
    id_pengunggah BIGINT NOT NULL,
    nama_file VARCHAR(255) NOT NULL,
    tipe_berkas VARCHAR(50),
    ukuran_file BIGINT,
    status_revisi VARCHAR(30) NOT NULL,
    waktu_upload TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_berkas_antrian
        FOREIGN KEY (id_antrian)
        REFERENCES antrian(id_antrian)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_berkas_pengunggah
        FOREIGN KEY (id_pengunggah)
        REFERENCES pengguna(id_pengguna)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_ukuran_file
        CHECK (ukuran_file IS NULL OR ukuran_file >= 0)
);


-- ==========================================
-- 7. TABEL CATATAN_BIMBINGAN
-- ==========================================

CREATE TABLE catatan_bimbingan (
    id_catatan BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_antrian BIGINT NOT NULL,
    id_penulis BIGINT NOT NULL,
    isi_catatan TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,

    CONSTRAINT fk_catatan_antrian
        FOREIGN KEY (id_antrian)
        REFERENCES antrian(id_antrian)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_catatan_penulis
        FOREIGN KEY (id_penulis)
        REFERENCES pengguna(id_pengguna)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);


-- ==========================================
-- 8. TABEL RIWAYAT_STATUS
-- ==========================================

CREATE TABLE riwayat_status (
    id_riwayat BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_antrian BIGINT NOT NULL,
    id_user BIGINT NOT NULL,
    status_lama VARCHAR(30),
    status_baru VARCHAR(30) NOT NULL,
    waktu_perubahan TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    catatan_perubahan TEXT,

    CONSTRAINT fk_riwayat_antrian
        FOREIGN KEY (id_antrian)
        REFERENCES antrian(id_antrian)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_riwayat_user
        FOREIGN KEY (id_user)
        REFERENCES pengguna(id_pengguna)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);


-- ==========================================
-- 9. TABEL AUDIT_LOG
-- ==========================================

CREATE TABLE audit_log (
    id_log BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_user BIGINT NOT NULL,
    aksi VARCHAR(100) NOT NULL,
    nama_tabel VARCHAR(100) NOT NULL,
    id_data BIGINT,
    waktu TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    status VARCHAR(30),

    CONSTRAINT fk_audit_user
        FOREIGN KEY (id_user)
        REFERENCES pengguna(id_pengguna)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);


-- ==========================================
-- 10. INDEX TAMBAHAN
-- ==========================================

CREATE INDEX idx_jadwal_dosen
    ON jadwal_bimbingan(id_dosen);

CREATE INDEX idx_jadwal_tanggal
    ON jadwal_bimbingan(tanggal);

CREATE INDEX idx_antrian_jadwal
    ON antrian(id_jadwal);

CREATE INDEX idx_antrian_mahasiswa
    ON antrian(id_mahasiswa);

CREATE INDEX idx_antrian_status
    ON antrian(status_antrian);

CREATE INDEX idx_notifikasi_pengguna
    ON notifikasi(id_pengguna);

CREATE INDEX idx_berkas_antrian
    ON berkas_revisi(id_antrian);

CREATE INDEX idx_catatan_antrian
    ON catatan_bimbingan(id_antrian);

CREATE INDEX idx_riwayat_antrian
    ON riwayat_status(id_antrian);

CREATE INDEX idx_audit_user
    ON audit_log(id_user);

CREATE INDEX idx_audit_waktu
    ON audit_log(waktu);
