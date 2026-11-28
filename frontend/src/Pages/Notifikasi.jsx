import React, { useEffect, useState } from 'react';

export function Notifikasi({ user, onNavigate, onLogout }) {
  const [notifikasiList, setNotifikasiList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('semua'); // 'semua' | 'belum_dibaca'
  const [aksiLoading, setAksiLoading] = useState(false);
  const [pesanFeedback, setPesanFeedback] = useState('');

  const token = localStorage.getItem('token');
  const role = (user?.role || 'Mahasiswa').toLowerCase();

  const muatNotifikasi = async () => {
    setLoading(true);
    setPesanFeedback('');
    try {
      const res = await fetch('/api/notifikasi?limit=50', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setNotifikasiList(json.data || []);
      }
    } catch {
      setPesanFeedback('Gagal memuat daftar notifikasi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    muatNotifikasi();
  }, []);

  const handleTandaiDibaca = async (idNotifikasi) => {
    try {
      const res = await fetch(`/api/notifikasi/${idNotifikasi}/dibaca`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setNotifikasiList((prev) =>
          prev.map((n) =>
            n.id_notifikasi === idNotifikasi
              ? { ...n, status_dibaca: true, waktu_dibaca: new Date().toISOString() }
              : n
          )
        );
      }
    } catch {
      // Abaikan jika gagal
    }
  };

  const handleTandaiSemuaDibaca = async () => {
    setAksiLoading(true);
    try {
      const res = await fetch('/api/notifikasi/dibaca-semua', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setNotifikasiList((prev) =>
          prev.map((n) => ({
            ...n,
            status_dibaca: true,
            waktu_dibaca: n.waktu_dibaca || new Date().toISOString(),
          }))
        );
        setPesanFeedback('Semua notifikasi berhasil ditandai telah dibaca.');
      }
    } catch {
      setPesanFeedback('Gagal menandai semua notifikasi.');
    } finally {
      setAksiLoading(false);
    }
  };

  const notifikasiFiltered = notifikasiList.filter((n) => {
    if (filter === 'belum_dibaca') return !n.status_dibaca;
    return true;
  });

  const jumlahBelumDibaca = notifikasiList.filter((n) => !n.status_dibaca).length;

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#f4f7f7',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Sidebar Navigasi Sesuai Role */}
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
          {role.toUpperCase()}
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          {role === 'dosen' ? (
            <>
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('/dashboard-dosen')}
                style={{ textAlign: 'left', padding: '12px 16px', borderRadius: '8px', backgroundColor: 'transparent', color: '#d1e0d3', border: 'none', fontWeight: '500', cursor: 'pointer', fontSize: '15px' }}
              >
                Beranda
              </button>
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('/kelola-jadwal')}
                style={{ textAlign: 'left', padding: '12px 16px', borderRadius: '8px', backgroundColor: 'transparent', color: '#d1e0d3', border: 'none', fontWeight: '500', cursor: 'pointer', fontSize: '15px' }}
              >
                Jadwal &amp; Kuota
              </button>
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('/kelola-antrean')}
                style={{ textAlign: 'left', padding: '12px 16px', borderRadius: '8px', backgroundColor: 'transparent', color: '#d1e0d3', border: 'none', fontWeight: '500', cursor: 'pointer', fontSize: '15px' }}
              >
                Kelola Antrean
              </button>
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('/riwayat')}
                style={{ textAlign: 'left', padding: '12px 16px', borderRadius: '8px', backgroundColor: 'transparent', color: '#d1e0d3', border: 'none', fontWeight: '500', cursor: 'pointer', fontSize: '15px' }}
              >
                Riwayat
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('/dashboard-mahasiswa')}
                style={{ textAlign: 'left', padding: '12px 16px', borderRadius: '8px', backgroundColor: 'transparent', color: '#d1e0d3', border: 'none', fontWeight: '500', cursor: 'pointer', fontSize: '15px' }}
              >
                Beranda
              </button>
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('/ambil-antrean')}
                style={{ textAlign: 'left', padding: '12px 16px', borderRadius: '8px', backgroundColor: 'transparent', color: '#d1e0d3', border: 'none', fontWeight: '500', cursor: 'pointer', fontSize: '15px' }}
              >
                Ambil Antrean
              </button>
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('/berkas-revisi')}
                style={{ textAlign: 'left', padding: '12px 16px', borderRadius: '8px', backgroundColor: 'transparent', color: '#d1e0d3', border: 'none', fontWeight: '500', cursor: 'pointer', fontSize: '15px' }}
              >
                Berkas &amp; Catatan Revisi
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => onNavigate && onNavigate('/notifikasi')}
            style={{
              textAlign: 'left',
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              border: 'none',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '15px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span>Pusat Notifikasi</span>
            {jumlahBelumDibaca > 0 && (
              <span style={{
                backgroundColor: '#c4f036',
                color: '#1b382b',
                fontSize: '11px',
                fontWeight: '800',
                padding: '2px 7px',
                borderRadius: '12px'
              }}>
                {jumlahBelumDibaca}
              </span>
            )}
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

      {/* Main Panel */}
      <main style={{ flex: 1, padding: '40px 48px', boxSizing: 'border-box' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: '0 0 6px 0', fontSize: '32px', color: '#153b36', fontWeight: '800' }}>
              Pusat Notifikasi
            </h1>
            <p style={{ margin: 0, color: '#55635e', fontSize: '15px' }}>
              Pemberitahuan perubahan status antrean, jadwal baru, dan catatan arahan bimbingan.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {jumlahBelumDibaca > 0 && (
              <button
                type="button"
                disabled={aksiLoading}
                onClick={handleTandaiSemuaDibaca}
                style={{
                  backgroundColor: '#e5f2ef',
                  color: '#087568',
                  border: '1px solid #cce8de',
                  borderRadius: '6px',
                  padding: '9px 16px',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                {aksiLoading ? 'Memproses...' : 'Tandai Semua Dibaca'}
              </button>
            )}
          </div>
        </header>

        {pesanFeedback && (
          <div style={{
            padding: '12px 16px',
            marginBottom: '20px',
            backgroundColor: '#e3f2ee',
            border: '1px solid #a3cfc4',
            borderRadius: '8px',
            color: '#087568',
            fontSize: '13px',
            fontWeight: '600'
          }}>
            {pesanFeedback}
          </div>
        )}

        {/* Filter Tab */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <button
            type="button"
            onClick={() => setFilter('semua')}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: filter === 'semua' ? '1px solid #087568' : '1px solid #dce6e3',
              backgroundColor: filter === 'semua' ? '#087568' : '#ffffff',
              color: filter === 'semua' ? '#ffffff' : '#4a5568',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Semua ({notifikasiList.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('belum_dibaca')}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: filter === 'belum_dibaca' ? '1px solid #087568' : '1px solid #dce6e3',
              backgroundColor: filter === 'belum_dibaca' ? '#087568' : '#ffffff',
              color: filter === 'belum_dibaca' ? '#ffffff' : '#4a5568',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Belum Dibaca ({jumlahBelumDibaca})
          </button>
        </div>

        {/* Daftar Notifikasi */}
        {loading ? (
          <div style={{ padding: '36px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '10px', color: '#087568', fontWeight: '600' }}>
            Memuat notifikasi...
          </div>
        ) : notifikasiFiltered.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e7eeeb' }}>
            <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>🔔</span>
            <h3 style={{ margin: '0 0 6px', color: '#153b36' }}>Tidak Ada Notifikasi</h3>
            <p style={{ margin: 0, color: '#718096', fontSize: '14px' }}>
              {filter === 'belum_dibaca' ? 'Semua notifikasi sudah Anda baca.' : 'Belum ada notifikasi yang tercatat untuk akun Anda.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {notifikasiFiltered.map((item) => (
              <div
                key={item.id_notifikasi}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '18px 22px',
                  backgroundColor: item.status_dibaca ? '#ffffff' : '#f0f9f6',
                  borderRadius: '10px',
                  border: item.status_dibaca ? '1px solid #e7eeeb' : '1px solid #b6e2d6',
                  boxShadow: item.status_dibaca ? 'none' : '0 2px 8px rgba(8, 117, 104, 0.06)'
                }}
              >
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', flex: 1, marginRight: '16px' }}>
                  <span style={{ fontSize: '20px', marginTop: '2px' }}>
                    {item.status_dibaca ? '📨' : '📩'}
                  </span>
                  <div>
                    <p style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#2d3748', lineHeight: 1.5, fontWeight: item.status_dibaca ? '400' : '600' }}>
                      {item.pesan}
                    </p>
                    <span style={{ fontSize: '12px', color: '#718096' }}>
                      {new Date(item.waktu_dibuat).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                {!item.status_dibaca && (
                  <button
                    type="button"
                    onClick={() => handleTandaiDibaca(item.id_notifikasi)}
                    style={{
                      background: 'none',
                      border: '1px solid #cce8de',
                      color: '#087568',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Tandai Dibaca
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Notifikasi;
