import React, { useEffect, useState } from 'react';

export function DashboardMahasiswa({ user, onNavigate, onLogout }) {
  const namaUser = user?.nama || 'Mahasiswa';
  const nimUser = user?.username || '-';

  const [antreanAktif, setAntreanAktif] = useState(null);
  const [loading, setLoading] = useState(true);
  const [batalLoading, setBatalLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const token = localStorage.getItem('token');

  async function fetchAntreanAktif() {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/antrean/aktif', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setAntreanAktif(json.data);
      } else {
        setAntreanAktif(null);
      }
    } catch (err) {
      setErrorMsg('Gagal memuat status antrean terbaru.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAntreanAktif();
  }, []);

  async function handleBatalAntrean(idAntrian) {
    if (!window.confirm('Apakah Anda yakin ingin membatalkan nomor antrean ini?')) {
      return;
    }

    setBatalLoading(true);
    try {
      const res = await fetch(`/api/antrean/${idAntrian}/batal`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(json.message || 'Gagal membatalkan nomor antrean.');
        return;
      }
      alert('Antrean bimbingan berhasil dibatalkan.');
      fetchAntreanAktif();
    } catch (err) {
      alert('Terjadi kesalahan saat membatalkan antrean.');
    } finally {
      setBatalLoading(false);
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
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              border: 'none',
              fontWeight: '600',
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
              backgroundColor: 'transparent',
              color: '#d1e0d3',
              border: 'none',
              fontWeight: '500',
              cursor: 'pointer',
              fontSize: '15px'
            }}
          >
            Ambil Antrean
          </button>
          <button
            type="button"
            onClick={() => alert('Fitur Riwayat Bimbingan segera hadir!')}
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
            Riwayat Bimbingan
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
        <header style={{ marginBottom: '32px' }}>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', color: '#153b36', fontWeight: '800' }}>
            Dashboard Mahasiswa
          </h1>
          <p style={{ margin: 0, color: '#55635e', fontSize: '16px' }}>
            Selamat datang, <strong>{namaUser}</strong> (NIM: {nimUser})
          </p>
        </header>

        {errorMsg && (
          <p className="feedback error" style={{ marginBottom: '20px' }}>{errorMsg}</p>
        )}

        {/* Section Kartu Antrean Aktif */}
        <section style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h2 style={{ margin: 0, fontSize: '20px', color: '#153b36', fontWeight: '800' }}>
              Status Antrean Anda
            </h2>
            {antreanAktif && (
              <button
                type="button"
                onClick={fetchAntreanAktif}
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
                🔄 Perbarui
              </button>
            )}
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p style={{ margin: 0, color: '#55635e', fontWeight: '600' }}>Memeriksa status antrean aktif...</p>
            </div>
          ) : antreanAktif ? (
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
                    Waktu Ambil: {antreanAktif.waktu_daftar}
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
                  <span className="info-title">Ruang Sesi</span>
                  <span className="info-value">{antreanAktif.jadwal?.ruang || 'Online / Belum ditentukan'}</span>
                </div>
              </div>

              {/* Banner Estimasi Waktu & Posisi Antrean */}
              {antreanAktif.estimasi && (
                <div className="estimation-banner">
                  <h3>⏱️ Kalkulasi Posisi &amp; Estimasi Waktu Dilayani</h3>
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
                    * Estimasi waktu dihitung otomatis berdasarkan rata-rata durasi sesi ({antreanAktif.estimasi.durasi_per_sesi_menit || 15} menit) dan jumlah antrean di depan Anda.
                  </p>
                </div>
              )}

              <div className="queue-card-actions">
                {antreanAktif.status_antrian === 'Menunggu' && (
                  <button
                    type="button"
                    className="btn-danger-outline"
                    disabled={batalLoading}
                    onClick={() => handleBatalAntrean(antreanAktif.id_antrian)}
                  >
                    {batalLoading ? 'Membatalkan...' : 'Batalkan Antrean'}
                  </button>
                )}
                <button
                  type="button"
                  className="primary"
                  style={{ width: 'auto', minWidth: '160px' }}
                  onClick={() => onNavigate && onNavigate('/ambil-antrean')}
                >
                  Lihat Jadwal Lain
                </button>
              </div>
            </div>
          ) : (
            <div className="empty-state-card">
              <span className="empty-icon">🎟️</span>
              <h2>Belum Ada Antrean Aktif</h2>
              <p className="description">
                Anda belum mengambil nomor antrean untuk bimbingan hari ini. Silakan periksa jadwal aktif dosen pembimbing dan ambil tiket antrean Anda.
              </p>
              <button
                type="button"
                className="primary"
                style={{ width: 'auto', minWidth: '220px' }}
                onClick={() => onNavigate && onNavigate('/ambil-antrean')}
              >
                + Ambil Nomor Antrean Sekarang
              </button>
            </div>
          )}
        </section>

        {/* Quick Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '17px', color: '#153b36' }}>Kesiapan Berkas</h3>
            <p style={{ margin: 0, color: '#55635e', fontSize: '14px' }}>
              Pastikan draft skripsi atau lembar revisi sudah siap sebelum giliran Anda dipanggil oleh dosen pembimbing.
            </p>
          </div>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '17px', color: '#153b36' }}>Notifikasi Realtime</h3>
            <p style={{ margin: 0, color: '#55635e', fontSize: '14px' }}>
              Setiap perubahan status tiket bimbingan akan dicatat secara persisten dan dapat dipantau langsung dari dashboard.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default DashboardMahasiswa;
