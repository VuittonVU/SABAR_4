import React, { useEffect, useState } from 'react';

export function AmbilAntrean({ user, onNavigate, onLogout }) {
  const [jadwalList, setJadwalList] = useState([]);
  const [antreanAktif, setAntreanAktif] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);
  const [penolakan, setPenolakan] = useState(null);
  const [sukses, setSukses] = useState(null);

  const token = localStorage.getItem('token');

  async function muatData() {
    setLoading(true);
    setPenolakan(null);
    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      // Ambil status antrean aktif mahasiswa saat ini
      const resAktif = await fetch('/api/antrean/aktif', { headers });
      const dataAktif = await resAktif.json();
      if (resAktif.ok && dataAktif.success && dataAktif.data) {
        setAntreanAktif(dataAktif.data);
      } else {
        setAntreanAktif(null);
      }

      // Ambil daftar jadwal aktif beserta kalkulasi peserta dan sisa kuota
      let resJadwal = await fetch('/api/jadwal/aktif', { headers });
      if (!resJadwal.ok) {
        resJadwal = await fetch('/api/antrean/jadwal-tersedia', { headers });
      }
      const dataJadwal = await resJadwal.json();
      if (resJadwal.ok && dataJadwal.success) {
        setJadwalList(dataJadwal.data || []);
      }
    } catch (err) {
      setPenolakan({
        judul: 'Gagal Memuat Data',
        pesan: err.message || 'Tidak dapat terhubung ke server SABAR.',
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    muatData();
  }, []);

  async function handleAmbilAntrean(idJadwal) {
    setSubmittingId(idJadwal);
    setPenolakan(null);
    setSukses(null);

    try {
      const res = await fetch('/api/antrean/ambil', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id_jadwal: idJadwal }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        // Alasan penolakan dari backend
        setPenolakan({
          judul: 'Pengambilan Antrean Ditolak',
          pesan: json.message || 'Kuota jadwal penuh atau Anda sudah terdaftar dalam antrean aktif.',
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // Berhasil
      setSukses({
        judul: 'Nomor Antrean Berhasil Didapatkan!',
        pesan: `Anda terdaftar pada urutan #${json.data.nomor_antrian} dengan dosen ${json.data.jadwal.nama_dosen}.`,
      });
      setAntreanAktif(json.data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setPenolakan({
        judul: 'Terjadi Kesalahan Koneksi',
        pesan: err.message || 'Gagal mengirim permintaan pengambilan antrean.',
      });
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#f4f7f7',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Sidebar Mahasiswa */}
      <aside style={{
        width: '260px',
        backgroundColor: '#1b382b',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        padding: '32px 20px',
        boxSizing: 'border-box'
      }}>
        <div style={{ fontSize: '28px', fontWeight: '800', color: '#c4f036', marginBottom: '4px' }}>
          Sabar
        </div>
        <div style={{
          fontSize: '12px',
          fontWeight: '700',
          letterSpacing: '1px',
          color: '#a3b899',
          marginBottom: '36px'
        }}>
          MAHASISWA
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('/dashboard-mahasiswa')}
            style={{
              textAlign: 'left',
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              color: '#d1e0d3',
              border: 'none',
              fontWeight: '500',
              cursor: 'pointer',
              fontSize: '15px'
            }}
          >
            Beranda
          </button>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('/ambil-antrean')}
            style={{
              textAlign: 'left',
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              border: 'none',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '15px'
            }}
          >
            Ambil Antrean
          </button>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('/berkas-revisi')}
            style={{
              textAlign: 'left',
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              color: '#d1e0d3',
              border: 'none',
              fontWeight: '500',
              cursor: 'pointer',
              fontSize: '15px'
            }}
          >
            Berkas &amp; Catatan Revisi
          </button>
        </nav>

        <button
          type="button"
          onClick={onLogout}
          style={{
            marginTop: 'auto',
            textAlign: 'left',
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: 'transparent',
            color: '#ffb4ab',
            border: '1px solid rgba(255, 180, 171, 0.3)',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Keluar
        </button>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '40px 48px', boxSizing: 'border-box' }}>
        <header style={{ marginBottom: '28px' }}>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', color: '#153b36', fontWeight: '800' }}>
            Ambil Nomor Antrean
          </h1>
          <p style={{ margin: 0, color: '#55635e', fontSize: '16px' }}>
            Pilih sesi bimbingan dosen yang aktif untuk mengambil tiket antrean bimbingan Anda.
          </p>
        </header>

        {/* Alert Alasan Penolakan */}
        {penolakan && (
          <div className="alert-penolakan" style={{ marginBottom: '24px' }}>
            <span className="alert-icon">⚠️</span>
            <div className="alert-body">
              <span className="alert-title">{penolakan.judul}</span>
              <p className="alert-message">{penolakan.pesan}</p>
              <span className="alert-sub">Sistem mencegah nomor ganda dan kuota terlampaui saat akses bersamaan.</span>
            </div>
            <button
              type="button"
              className="alert-close"
              onClick={() => setPenolakan(null)}
              title="Tutup pesan"
            >
              ✕
            </button>
          </div>
        )}

        {/* Alert Sukses */}
        {sukses && (
          <div className="alert-sukses" style={{ marginBottom: '24px' }}>
            <span className="alert-icon">✅</span>
            <div className="alert-body">
              <span className="alert-title">{sukses.judul}</span>
              <p className="alert-message">{sukses.pesan}</p>
              <span className="alert-sub">Transaksi atomik berhasil tercatat pada tabel antrian dan riwayat status.</span>
            </div>
            <button
              type="button"
              className="alert-close"
              onClick={() => setSukses(null)}
              title="Tutup pesan"
            >
              ✕
            </button>
          </div>
        )}

        {/* Kartu Antrean Aktif (Jika Sudah Mengambil) */}
        {antreanAktif && (
          <div style={{ marginBottom: '36px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', color: '#153b36', fontWeight: '800' }}>
                Tiket Antrean Aktif Anda
              </h2>
              <button
                type="button"
                onClick={muatData}
                style={{
                  background: 'transparent',
                  border: '1px solid #c7e3dc',
                  color: '#153b36',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                🔄 Perbarui Status
              </button>
            </div>

            <div className="active-queue-card">
              <div className="queue-card-top">
                <div className="queue-number-box">
                  <span className="queue-label">Nomor Antrean Anda</span>
                  <span className="queue-number">#{antreanAktif.nomor_antrian}</span>
                </div>
                <div className="queue-status-tag">
                  <span className={`status-pill ${antreanAktif.status_antrian.toLowerCase()}`}>
                    ● {antreanAktif.status_antrian}
                  </span>
                  <span className="register-time">
                    Waktu Daftar: {antreanAktif.waktu_daftar}
                  </span>
                </div>
              </div>

              <div className="queue-grid-info">
                <div className="info-item">
                  <span className="info-title">Dosen Pembimbing</span>
                  <span className="info-value">{antreanAktif.jadwal?.nama_dosen}</span>
                </div>
                <div className="info-item">
                  <span className="info-title">Tanggal Bimbingan</span>
                  <span className="info-value">{antreanAktif.jadwal?.tanggal}</span>
                </div>
                <div className="info-item">
                  <span className="info-title">Jam Sesi</span>
                  <span className="info-value">
                    {antreanAktif.jadwal?.jam_mulai?.slice(0, 5)} - {antreanAktif.jadwal?.jam_selesai?.slice(0, 5)} WIB
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-title">Ruang</span>
                  <span className="info-value">{antreanAktif.jadwal?.ruang || 'Online / Belum ditentukan'}</span>
                </div>
              </div>

              {/* Banner Estimasi & Posisi */}
              {antreanAktif.estimasi && (
                <div className="estimation-banner">
                  <h3>⏱️ Posisi Antrean &amp; Estimasi Waktu Tunggu</h3>
                  <div className="estimation-metrics">
                    <div className="metric-box highlight">
                      <span className="metric-number">#{antreanAktif.estimasi.posisi_antrean}</span>
                      <span className="metric-label">Posisi Anda</span>
                    </div>
                    <div className="metric-box">
                      <span className="metric-number">{antreanAktif.estimasi.antrean_di_depan}</span>
                      <span className="metric-label">Antrean di Depan</span>
                    </div>
                    <div className="metric-box">
                      <span className="metric-number">{antreanAktif.estimasi.estimasi_menit_tunggu} m</span>
                      <span className="metric-label">Estimasi Tunggu</span>
                    </div>
                    <div className="metric-box highlight">
                      <span className="metric-number">{antreanAktif.estimasi.estimasi_waktu_dilayani || '-'}</span>
                      <span className="metric-label">Perkiraan Dilayani</span>
                    </div>
                  </div>
                  <p className="estimation-hint">
                    * Estimasi waktu dihitung berdasarkan rata-rata durasi {antreanAktif.estimasi.durasi_per_sesi_menit || 15} menit per sesi bimbingan.
                  </p>
                </div>
              )}

              <div className="queue-card-actions">
                <button
                  type="button"
                  className="primary"
                  style={{ width: 'auto', minWidth: '180px' }}
                  onClick={() => onNavigate && onNavigate('/dashboard-mahasiswa')}
                >
                  Kembali ke Dashboard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Section Daftar Jadwal Bimbingan Tersedia */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '20px', color: '#153b36', fontWeight: '800' }}>
              Jadwal Bimbingan yang Tersedia
            </h2>
            <span style={{ fontSize: '14px', color: '#55635e' }}>
              Total: <strong>{jadwalList.length}</strong> jadwal aktif
            </span>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p style={{ margin: 0, color: '#55635e', fontWeight: '600' }}>Memuat jadwal bimbingan aktif...</p>
            </div>
          ) : jadwalList.length === 0 ? (
            <div className="empty-state-card">
              <span className="empty-icon">📅</span>
              <h2>Belum Ada Jadwal Aktif</h2>
              <p className="description">
                Saat ini dosen pembimbing belum membuka jadwal bimbingan baru. Silakan periksa kembali secara berkala.
              </p>
            </div>
          ) : (
            <div className="jadwal-grid">
              {jadwalList.map((j) => {
                const isSubmitting = submittingId === j.id_jadwal;
                const isSudah = antreanAktif && String(antreanAktif.id_jadwal) === String(j.id_jadwal);
                const isPenuh = j.is_penuh;

                return (
                  <div
                    key={j.id_jadwal}
                    className={`jadwal-card ${isPenuh ? 'disabled-card' : ''} ${isSudah ? 'registered-card' : ''}`}
                  >
                    <div className="jadwal-card-header">
                      <div>
                        <span className="jadwal-dosen-title">Dosen Pembimbing</span>
                        <h3 className="jadwal-dosen-name">{j.nama_dosen}</h3>
                      </div>
                      <span className="quota-pill">
                        {isPenuh ? 'Kuota Penuh' : `Sisa Kuota: ${j.sisa_kuota}/${j.kuota_mhs}`}
                      </span>
                    </div>

                    <div className="jadwal-details-list">
                      <div className="detail-row">
                        <span className="detail-icon">📅</span>
                        <span className="detail-text">{j.tanggal}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-icon">⏰</span>
                        <span className="detail-text">{j.jam_mulai} - {j.jam_selesai} WIB</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-icon">📍</span>
                        <span className="detail-text">{j.ruang || 'Online / Belum ditentukan'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-icon">⏱️</span>
                        <span className="detail-text">± {j.durasi_menit || 15} menit / sesi</span>
                      </div>
                    </div>

                    <div className="jadwal-card-footer">
                      {isSudah ? (
                        <button
                          type="button"
                          disabled
                          style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '8px',
                            backgroundColor: '#e7f5f1',
                            color: '#027a48',
                            border: '1px solid #8dc5b8',
                            fontWeight: '700',
                            cursor: 'default'
                          }}
                        >
                          ✓ Terdaftar pada Sesi Ini
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="primary"
                          disabled={isPenuh || isSubmitting || Boolean(antreanAktif)}
                          onClick={() => handleAmbilAntrean(j.id_jadwal)}
                          title={
                            antreanAktif
                              ? 'Anda sudah memiliki antrean aktif pada sesi lain.'
                              : isPenuh
                                ? 'Kuota sesi ini sudah penuh.'
                                : 'Ambil nomor antrean untuk jadwal ini'
                          }
                        >
                          {isSubmitting
                            ? 'Memproses Tiket...'
                            : isPenuh
                              ? 'Kuota Penuh'
                              : antreanAktif
                                ? 'Ada Antrean Aktif'
                                : 'Ambil Nomor Antrean'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default AmbilAntrean;
