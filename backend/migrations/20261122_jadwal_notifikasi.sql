BEGIN;

-- Kolom lama tetap dipertahankan. Durasi lama belum diketahui sehingga tetap NULL.
ALTER TABLE jadwal_bimbingan ADD COLUMN IF NOT EXISTS durasi_menit INTEGER;
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'jadwal_bimbingan'::regclass
            AND conname = 'chk_jadwal_durasi_menit'
    ) THEN
        ALTER TABLE jadwal_bimbingan ADD CONSTRAINT chk_jadwal_durasi_menit
            CHECK (durasi_menit IS NULL OR durasi_menit > 0);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_jadwal_dosen_tanggal
    ON jadwal_bimbingan(id_dosen, tanggal);
CREATE INDEX IF NOT EXISTS idx_notifikasi_penerima_id
    ON notifikasi(id_pengguna, id_notifikasi DESC);

COMMIT;
