BEGIN;

ALTER TABLE antrian
    ADD COLUMN IF NOT EXISTS versi INTEGER NOT NULL DEFAULT 1;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'antrian'::regclass
            AND conname = 'chk_antrian_versi'
    ) THEN
        ALTER TABLE antrian ADD CONSTRAINT chk_antrian_versi CHECK (versi > 0);
    END IF;
END $$;

ALTER TABLE riwayat_status
    ADD COLUMN IF NOT EXISTS jadwal_lama JSONB,
    ADD COLUMN IF NOT EXISTS jadwal_baru JSONB;

COMMIT;
