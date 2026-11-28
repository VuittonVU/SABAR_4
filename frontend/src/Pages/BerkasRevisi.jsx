import React, { useEffect, useState } from 'react';

export function BerkasRevisi({ user, onNavigate, onLogout }) {
  const namaUser = user?.nama || 'Mahasiswa';
  const nimUser = user?.username || '-';

  const [riwayatList, setRiwayatList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [expandedCatatan, setExpandedCatatan] = useState({});

  const token = localStorage.getItem('token');

  const muatRiwayatDanCatatan = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/antrean/riwayat-saya', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      if (res.ok && json.success && Array.isArray(json.data)) {
        setRiwayatList(json.data);
      } else {
        // Jika belum ada antrean di riwayat, coba periksa antrean aktif
        const resAktif = await fetch('/api/antrean/aktif', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        const jsonAktif = await resAktif.json();
        if (resAktif.ok && jsonAktif.success && jsonAktif.data) {
          const aktif = jsonAktif.data;
          setRiwayatList([{
            id_antrian: aktif.id_antrian,
            id_jadwal: aktif.jadwal?.id_jadwal,
            nomor_antrian: aktif.nomor_antrian,
            status_antrian: aktif.status_antrian,
            waktu_daftar: aktif.waktu_daftar,
            nama_dosen: aktif.jadwal?.nama_dosen,
            tanggal: aktif.jadwal?.tanggal,
            jam_mulai: aktif.jadwal?.jam_mulai,
            jam_selesai: aktif.jadwal?.jam_selesai,
            ruang: aktif.jadwal?.ruang,
            catatan: '',
          }]);
        } else {
          setRiwayatList([]);
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memuat arsip berkas revisi dan catatan bimbingan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    muatRiwayatDanCatatan();
  }, []);

  const toggleDetailCatatan = async (idAntrian) => {
    if (expandedCatatan[idAntrian]) {
      setExpandedCatatan((prev) => ({ ...prev, [idAntrian]: null }));
      return;
    }

    try {
      const res = await fetch(`/api/antrean/${idAntrian}/catatan`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setExpandedCatatan((prev) => ({
          ...prev,
          [idAntrian]: json.data || [],
        }));
      }
    } catch {
      // Abaikan jika fetch catatan gagal
    }
  };

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
            onClick={() => onNavigate && onNavigate('/berkas-revisi')}
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

      {/* Konten Utama */}
      <main style={{ flex: 1, padding: '40px 48px', boxSizing: 'border-box' }}>
        <header style={{ marginBottom: '32px' }}>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', color: '#153b36', fontWeight: '800' }}>
            Berkas Revisi &amp; Catatan Bimbingan
          </h1>
          <p style={{ margin: 0, color: '#55635e', fontSize: '16px' }}>
            Pantau catatan arahan resmi dan hasil evaluasi revisi dari dosen pembimbing untuk setiap sesi bimbingan Anda.
          </p>
        </header>

        {errorMsg && (
          <div style={{
            padding: '12px 16px',
            marginBottom: '20px',
            backgroundColor: '#fdf2f2',
            border: '1px solid #f8b4b4',
            borderRadius: '8px',
            color: '#9b1c1c'
          }}>
            {errorMsg}
          </div>
        )}

        {loading ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            color: '#087568',
            fontWeight: '600',
            border: '1px solid #e7eeeb'
          }}>
            Memuat arsip berkas dan catatan bimbingan...
          </div>
        ) : riwayatList.length === 0 ? (
          <div style={{
            padding: '48px 32px',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e7eeeb',
            maxWidth: '600px'
          }}>
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>📝</span>
            <h2 style={{ margin: '0 0 10px', color: '#153b36', fontSize: '20px' }}>
              Belum Ada Catatan Bimbingan
            </h2>
            <p style={{ margin: '0 0 24px', color: '#55635e', fontSize: '14px', lineHeight: 1.6 }}>
              Anda belum memiliki sesi antrean bimbingan yang terdaftar. Catatan arahan revisi akan otomatis tampil di sini setelah dosen memberikan evaluasi pada sesi bimbingan.
            </p>
            <button
              type="button"
              className="primary"
              style={{ padding: '12px 24px', fontSize: '14px' }}
              onClick={() => onNavigate && onNavigate('/ambil-antrean')}
            >
              + Ambil Nomor Antrean Sekarang
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {riwayatList.map((item) => {
              const statusClass = (item.status_antrian || '').toLowerCase();
              const catatanAda = Boolean(item.catatan && item.catatan.trim());
              const detailCatatan = expandedCatatan[item.id_antrian];

              return (
                <div
                  key={item.id_antrian}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e7eeeb',
                    padding: '28px',
                    boxShadow: '0 3px 12px rgba(0, 0, 0, 0.035)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px'
                  }}
                >
                  {/* Bagian Header Kartu Sesi */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '12px',
                    borderBottom: '1px solid #edf2f0',
                    paddingBottom: '16px'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <span style={{
                          backgroundColor: '#1b382b',
                          color: '#c4f036',
                          fontWeight: '800',
                          fontSize: '15px',
                          padding: '4px 10px',
                          borderRadius: '6px'
                        }}>
                          Antrean #{item.nomor_antrian}
                        </span>
                        <span style={{
                          fontSize: '13px',
                          fontWeight: '700',
                          padding: '4px 10px',
                          borderRadius: '16px',
                          backgroundColor:
                            statusClass === 'selesai' ? '#dcfce7' :
                            statusClass === 'dipanggil' ? '#fef9c3' :
                            statusClass === 'ditunda' ? '#fee2e2' : '#e0f2fe',
                          color:
                            statusClass === 'selesai' ? '#166534' :
                            statusClass === 'dipanggil' ? '#854d0e' :
                            statusClass === 'ditunda' ? '#991b1b' : '#075985',
                        }}>
                          ● {item.status_antrian}
                        </span>
                      </div>
                      <h3 style={{ margin: 0, fontSize: '18px', color: '#153b36', fontWeight: '700' }}>
                        Dosen Pembimbing: {item.nama_dosen}
                      </h3>
                    </div>

                    <div style={{ textAlign: 'right', fontSize: '13px', color: '#718096' }}>
                      <div>Tanggal Sesi: <strong>{item.tanggal || '-'}</strong></div>
                      <div>Waktu: {item.jam_mulai?.slice(0, 5)} - {item.jam_selesai?.slice(0, 5)} WIB</div>
                      {item.ruang && <div>Ruangan: {item.ruang}</div>}
                    </div>
                  </div>

                  {/* Panel Eksklusif Catatan Arahan Dosen */}
                  <div style={{
                    backgroundColor: catatanAda ? '#f0f9f6' : '#fafcfb',
                    border: catatanAda ? '1px solid #cce8de' : '1px dashed #dce6e3',
                    borderRadius: '10px',
                    padding: '20px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '10px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>📌</span>
                        <h4 style={{ margin: 0, fontSize: '15px', color: '#155e56', fontWeight: '700' }}>
                          Catatan Arahan &amp; Revisi Dosen
                        </h4>
                      </div>

                      {item.catatan_updated_at && (
                        <span style={{ fontSize: '11px', color: '#718096' }}>
                          Terakhir diperbarui: {item.catatan_updated_at}
                        </span>
                      )}
                    </div>

                    {catatanAda ? (
                      <div>
                        <div style={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #d7ebe3',
                          borderRadius: '8px',
                          padding: '14px 18px',
                          color: '#2d3748',
                          fontSize: '14px',
                          lineHeight: '1.6',
                          whiteSpace: 'pre-wrap',
                          fontStyle: 'italic'
                        }}>
                          "{item.catatan}"
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginTop: '8px',
                          fontSize: '11px',
                          color: '#087568',
                          fontWeight: '600'
                        }}>
                          <span>🔒 Catatan ini bersifat privat dan hanya dapat diakses oleh Anda.</span>
                        </div>
                      </div>
                    ) : (
                      <p style={{ margin: 0, color: '#879791', fontSize: '13px', fontStyle: 'italic' }}>
                        Dosen pembimbing belum memberikan catatan arahan revisi untuk sesi antrean ini. Catatan akan muncul di sini setelah sesi bimbingan berlangsung.
                      </p>
                    )}

                    {/* Tombol toggle riwayat catatan jika ada */}
                    <div style={{ marginTop: '12px' }}>
                      <button
                        type="button"
                        onClick={() => toggleDetailCatatan(item.id_antrian)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#087568',
                          fontWeight: '600',
                          fontSize: '12px',
                          cursor: 'pointer',
                          padding: 0,
                          textDecoration: 'underline'
                        }}
                      >
                        {expandedCatatan[item.id_antrian] ? '▲ Sembunyikan Log Catatan' : '▼ Periksa Riwayat Log Catatan'}
                      </button>

                      {detailCatatan && detailCatatan.length > 0 && (
                        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {detailCatatan.map((c, idx) => (
                            <div key={c.id_catatan || idx} style={{
                              padding: '10px 14px',
                              backgroundColor: '#ffffff',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              fontSize: '13px'
                            }}>
                              <div style={{ fontSize: '11px', color: '#718096', marginBottom: '4px' }}>
                                Catatan #{idx + 1} • {c.updated_at || c.created_at}
                              </div>
                              <p style={{ margin: 0, color: '#2d3748' }}>{c.isi_catatan}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Panel Informasi Berkas Revisi */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    backgroundColor: '#f8faf9',
                    borderRadius: '8px',
                    border: '1px solid #e7eeeb'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '24px' }}>📄</span>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '14px', color: '#294b47' }}>
                          Draft Revisi Bimbingan (Sesi #{item.nomor_antrian})
                        </div>
                        <div style={{ fontSize: '12px', color: '#718096' }}>
                          Status berkas: Siap dikaji • Terhubung dengan sesi bimbingan dosen
                        </div>
                      </div>
                    </div>

                    <span style={{
                      fontSize: '12px',
                      color: '#087568',
                      fontWeight: '700',
                      backgroundColor: '#e5f2ef',
                      padding: '4px 10px',
                      borderRadius: '4px'
                    }}>
                      Tervalidasi
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default BerkasRevisi;
