import React, { useEffect, useState } from 'react';

export function DashboardAdmin({ user, onNavigate, onLogout }) {
  const namaUser = user?.nama || 'Administrator';
  const username = user?.username || 'admin';

  // tab: 'overview' | 'pengguna' | 'referensi' | 'audit'
  const [tabAktif, setTabAktif] = useState('pengguna');
  const [loading, setLoading] = useState(false);
  const [pesan, setPesan] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Data states
  const [daftarPengguna, setDaftarPengguna] = useState([]);
  const [daftarReferensi, setDaftarReferensi] = useState([]);
  const [daftarAudit, setDaftarAudit] = useState([]);

  // Form Pengguna
  const [formPengguna, setFormPengguna] = useState({
    id_role: '2',
    username: '',
    password: '',
    nama: '',
    email_npm: '',
  });
  const [modeEditPengguna, setModeEditPengguna] = useState(null); // idPengguna or null

  // Form Referensi
  const [formReferensi, setFormReferensi] = useState({
    tipe: 'role',
    nama: '',
    nilai: '',
    detail_info: '',
  });
  const [modeEditReferensi, setModeEditReferensi] = useState(null); // idReferensi or null

  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // Muat data sesuai tab aktif
  const muatPengguna = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/admin-audit/pengguna', { headers });
      const json = await res.json();
      if (res.ok && json.success) {
        setDaftarPengguna(json.data || []);
      }
    } catch {
      setErrorMsg('Gagal memuat daftar pengguna.');
    } finally {
      setLoading(false);
    }
  };

  const muatReferensi = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/admin-audit/referensi', { headers });
      const json = await res.json();
      if (res.ok && json.success) {
        setDaftarReferensi(json.data || []);
      }
    } catch {
      setErrorMsg('Gagal memuat data referensi.');
    } finally {
      setLoading(false);
    }
  };

  const muatAudit = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/admin-audit/log', { headers });
      const json = await res.json();
      if (res.ok && json.success) {
        setDaftarAudit(json.data || []);
      }
    } catch {
      setErrorMsg('Gagal memuat riwayat audit log.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tabAktif === 'pengguna') muatPengguna();
    if (tabAktif === 'referensi') muatReferensi();
    if (tabAktif === 'audit') muatAudit();
  }, [tabAktif]);

  // Aksi Pengguna
  const handleSimpanPengguna = async (e) => {
    e.preventDefault();
    setPesan('');
    setErrorMsg('');

    try {
      if (modeEditPengguna) {
        const payload = {
          id_role: Number(formPengguna.id_role),
          username: formPengguna.username,
          nama: formPengguna.nama,
          email_npm: formPengguna.email_npm,
        };
        if (formPengguna.password) payload.password = formPengguna.password;

        const res = await fetch(`/api/admin-audit/pengguna/${modeEditPengguna}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || 'Gagal mengubah pengguna.');
        setPesan('Data pengguna berhasil diperbarui.');
      } else {
        const res = await fetch('/api/admin-audit/pengguna', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            ...formPengguna,
            id_role: Number(formPengguna.id_role),
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || 'Gagal membuat pengguna baru.');
        setPesan('Pengguna baru berhasil ditambahkan.');
      }
      setModeEditPengguna(null);
      setFormPengguna({ id_role: '2', username: '', password: '', nama: '', email_npm: '' });
      muatPengguna();
    } catch (err) {
      setErrorMsg(err.message || 'Terjadi kesalahan pada server.');
    }
  };

  const handleToggleStatusPengguna = async (idPengguna, statusAktifSaatIni) => {
    try {
      const endpoint = statusAktifSaatIni ? 'nonaktifkan' : 'aktifkan';
      const res = await fetch(`/api/admin-audit/pengguna/${idPengguna}/${endpoint}`, {
        method: 'PATCH',
        headers,
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Gagal mengubah status.');
      muatPengguna();
    } catch (err) {
      alert(err.message || 'Gagal mengubah status akun pengguna.');
    }
  };

  // Aksi Referensi
  const handleSimpanReferensi = async (e) => {
    e.preventDefault();
    setPesan('');
    setErrorMsg('');

    try {
      if (modeEditReferensi) {
        const res = await fetch(`/api/admin-audit/referensi/${modeEditReferensi}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(formReferensi),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || 'Gagal mengubah data referensi.');
        setPesan('Data referensi berhasil diperbarui.');
      } else {
        const res = await fetch('/api/admin-audit/referensi', {
          method: 'POST',
          headers,
          body: JSON.stringify(formReferensi),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || 'Gagal membuat data referensi.');
        setPesan('Data referensi berhasil dibuat.');
      }
      setModeEditReferensi(null);
      setFormReferensi({ tipe: 'role', nama: '', nilai: '', detail_info: '' });
      muatReferensi();
    } catch (err) {
      setErrorMsg(err.message || 'Terjadi kesalahan.');
    }
  };

  const handleHapusReferensi = async (idReferensi) => {
    if (!window.confirm('Yakin ingin menghapus data referensi ini?')) return;
    try {
      const res = await fetch(`/api/admin-audit/referensi/${idReferensi}`, {
        method: 'DELETE',
        headers,
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Gagal menghapus referensi.');
      muatReferensi();
    } catch (err) {
      alert(err.message || 'Gagal menghapus referensi.');
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#f4f7f7',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Sidebar Admin */}
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
          ADMINISTRATOR
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <button
            type="button"
            onClick={() => setTabAktif('pengguna')}
            style={{
              textAlign: 'left',
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: tabAktif === 'pengguna' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
              color: '#ffffff',
              border: 'none',
              fontWeight: tabAktif === 'pengguna' ? '700' : '500',
              cursor: 'pointer',
              fontSize: '15px'
            }}
          >
            👥 Kelola Pengguna
          </button>
          <button
            type="button"
            onClick={() => setTabAktif('referensi')}
            style={{
              textAlign: 'left',
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: tabAktif === 'referensi' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
              color: '#ffffff',
              border: 'none',
              fontWeight: tabAktif === 'referensi' ? '700' : '500',
              cursor: 'pointer',
              fontSize: '15px'
            }}
          >
            🗂️ Data Referensi
          </button>
          <button
            type="button"
            onClick={() => setTabAktif('audit')}
            style={{
              textAlign: 'left',
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: tabAktif === 'audit' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
              color: '#ffffff',
              border: 'none',
              fontWeight: tabAktif === 'audit' ? '700' : '500',
              cursor: 'pointer',
              fontSize: '15px'
            }}
          >
            🛡️ Audit Log
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
        <header style={{ marginBottom: '24px' }}>
          <h1 style={{ margin: '0 0 6px 0', fontSize: '30px', color: '#153b36', fontWeight: '800' }}>
            Halaman Administrasi SABAR
          </h1>
          <p style={{ margin: 0, color: '#55635e', fontSize: '15px' }}>
            Panel kontrol terpadu untuk Akun Pengguna, Master Data Referensi, dan Pengawasan Audit Log.
          </p>
        </header>

        {/* Tab Navigation Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', borderBottom: '1px solid #dce6e3', paddingBottom: '12px' }}>
          <button
            type="button"
            onClick={() => setTabAktif('pengguna')}
            style={{
              padding: '8px 18px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: tabAktif === 'pengguna' ? '#087568' : '#e5f2ef',
              color: tabAktif === 'pengguna' ? '#ffffff' : '#087568',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Tab Pengguna ({daftarPengguna.length})
          </button>
          <button
            type="button"
            onClick={() => setTabAktif('referensi')}
            style={{
              padding: '8px 18px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: tabAktif === 'referensi' ? '#087568' : '#e5f2ef',
              color: tabAktif === 'referensi' ? '#ffffff' : '#087568',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Tab Data Referensi ({daftarReferensi.length})
          </button>
          <button
            type="button"
            onClick={() => setTabAktif('audit')}
            style={{
              padding: '8px 18px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: tabAktif === 'audit' ? '#087568' : '#e5f2ef',
              color: tabAktif === 'audit' ? '#ffffff' : '#087568',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Tab Audit Log ({daftarAudit.length})
          </button>
        </div>

        {pesan && (
          <div style={{ padding: '12px 16px', marginBottom: '20px', backgroundColor: '#e3f2ee', border: '1px solid #a3cfc4', borderRadius: '8px', color: '#087568', fontWeight: '600' }}>
            {pesan}
          </div>
        )}

        {errorMsg && (
          <div style={{ padding: '12px 16px', marginBottom: '20px', backgroundColor: '#fdf2f2', border: '1px solid #f8b4b4', borderRadius: '8px', color: '#9b1c1c' }}>
            {errorMsg}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 1: PENGGUNA */}
        {/* ============================================================== */}
        {tabAktif === 'pengguna' && (
          <div>
            {/* Form Buat / Edit Pengguna */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '24px', border: '1px solid #e7eeeb', marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 16px', color: '#153b36', fontSize: '18px' }}>
                {modeEditPengguna ? 'Ubah Data Akun Pengguna' : 'Tambah Pengguna Baru'}
              </h3>
              <form onSubmit={handleSimpanPengguna} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#4a5568', marginBottom: '4px' }}>Role</label>
                  <select
                    value={formPengguna.id_role}
                    onChange={(e) => setFormPengguna({ ...formPengguna, id_role: e.target.value })}
                    style={{ width: '100%', height: '38px', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e0' }}
                  >
                    <option value="1">Dosen (ID: 1)</option>
                    <option value="2">Mahasiswa (ID: 2)</option>
                    <option value="3">Admin (ID: 3)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#4a5568', marginBottom: '4px' }}>Username / NIM</label>
                  <input
                    type="text"
                    required
                    value={formPengguna.username}
                    onChange={(e) => setFormPengguna({ ...formPengguna, username: e.target.value })}
                    style={{ width: '100%', height: '38px', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#4a5568', marginBottom: '4px' }}>Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={formPengguna.nama}
                    onChange={(e) => setFormPengguna({ ...formPengguna, nama: e.target.value })}
                    style={{ width: '100%', height: '38px', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#4a5568', marginBottom: '4px' }}>Email / NPM</label>
                  <input
                    type="text"
                    required
                    value={formPengguna.email_npm}
                    onChange={(e) => setFormPengguna({ ...formPengguna, email_npm: e.target.value })}
                    style={{ width: '100%', height: '38px', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#4a5568', marginBottom: '4px' }}>
                    Kata Sandi {modeEditPengguna && '(Kosongkan jika tidak diubah)'}
                  </label>
                  <input
                    type="password"
                    required={!modeEditPengguna}
                    minLength={8}
                    value={formPengguna.password}
                    onChange={(e) => setFormPengguna({ ...formPengguna, password: e.target.value })}
                    style={{ width: '100%', height: '38px', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                  <button
                    type="submit"
                    style={{ height: '38px', padding: '0 20px', backgroundColor: '#087568', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    {modeEditPengguna ? 'Simpan' : 'Tambah'}
                  </button>
                  {modeEditPengguna && (
                    <button
                      type="button"
                      onClick={() => {
                        setModeEditPengguna(null);
                        setFormPengguna({ id_role: '2', username: '', password: '', nama: '', email_npm: '' });
                      }}
                      style={{ height: '38px', padding: '0 16px', backgroundColor: '#e2e8f0', color: '#4a5568', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      Batal
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Tabel Daftar Pengguna */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e7eeeb', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead style={{ backgroundColor: '#f8faf9', borderBottom: '1px solid #e7eeeb' }}>
                  <tr>
                    <th style={{ padding: '14px 18px' }}>ID</th>
                    <th style={{ padding: '14px 18px' }}>Role</th>
                    <th style={{ padding: '14px 18px' }}>Username</th>
                    <th style={{ padding: '14px 18px' }}>Nama</th>
                    <th style={{ padding: '14px 18px' }}>Email / NPM</th>
                    <th style={{ padding: '14px 18px' }}>Status</th>
                    <th style={{ padding: '14px 18px' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {daftarPengguna.map((p) => (
                    <tr key={p.id_pengguna} style={{ borderBottom: '1px solid #edf2f0' }}>
                      <td style={{ padding: '12px 18px' }}>#{p.id_pengguna}</td>
                      <td style={{ padding: '12px 18px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', backgroundColor: p.id_role === 1 ? '#e0f2fe' : p.id_role === 2 ? '#dcfce7' : '#fef3c7', color: p.id_role === 1 ? '#0369a1' : p.id_role === 2 ? '#15803d' : '#b45309' }}>
                          {p.id_role === 1 ? 'Dosen' : p.id_role === 2 ? 'Mahasiswa' : 'Admin'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 18px', fontWeight: '600' }}>{p.username}</td>
                      <td style={{ padding: '12px 18px' }}>{p.nama}</td>
                      <td style={{ padding: '12px 18px' }}>{p.email_npm}</td>
                      <td style={{ padding: '12px 18px' }}>
                        <span style={{ color: p.status_aktif ? '#15803d' : '#b91c1c', fontWeight: '700' }}>
                          ● {p.status_aktif ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 18px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setModeEditPengguna(p.id_pengguna);
                            setFormPengguna({
                              id_role: String(p.id_role),
                              username: p.username,
                              password: '',
                              nama: p.nama,
                              email_npm: p.email_npm,
                            });
                          }}
                          style={{ marginRight: '8px', padding: '4px 8px', border: '1px solid #cbd5e0', borderRadius: '4px', background: '#ffffff', cursor: 'pointer', fontSize: '12px' }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatusPengguna(p.id_pengguna, p.status_aktif)}
                          style={{
                            padding: '4px 8px',
                            border: 'none',
                            borderRadius: '4px',
                            backgroundColor: p.status_aktif ? '#fee2e2' : '#dcfce7',
                            color: p.status_aktif ? '#991b1b' : '#166534',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}
                        >
                          {p.status_aktif ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: DATA REFERENSI */}
        {/* ============================================================== */}
        {tabAktif === 'referensi' && (
          <div>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '24px', border: '1px solid #e7eeeb', marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 16px', color: '#153b36', fontSize: '18px' }}>
                {modeEditReferensi ? 'Ubah Data Referensi' : 'Tambah Data Referensi Baru'}
              </h3>
              <form onSubmit={handleSimpanReferensi} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#4a5568', marginBottom: '4px' }}>Tipe</label>
                  <input
                    type="text"
                    required
                    placeholder="misal: role, kategori, dll"
                    value={formReferensi.tipe}
                    onChange={(e) => setFormReferensi({ ...formReferensi, tipe: e.target.value })}
                    style={{ width: '100%', height: '38px', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#4a5568', marginBottom: '4px' }}>Nama</label>
                  <input
                    type="text"
                    required
                    value={formReferensi.nama}
                    onChange={(e) => setFormReferensi({ ...formReferensi, nama: e.target.value })}
                    style={{ width: '100%', height: '38px', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#4a5568', marginBottom: '4px' }}>Nilai (Opsional)</label>
                  <input
                    type="text"
                    value={formReferensi.nilai}
                    onChange={(e) => setFormReferensi({ ...formReferensi, nilai: e.target.value })}
                    style={{ width: '100%', height: '38px', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#4a5568', marginBottom: '4px' }}>Detail Info</label>
                  <input
                    type="text"
                    value={formReferensi.detail_info}
                    onChange={(e) => setFormReferensi({ ...formReferensi, detail_info: e.target.value })}
                    style={{ width: '100%', height: '38px', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                  <button
                    type="submit"
                    style={{ height: '38px', padding: '0 20px', backgroundColor: '#087568', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    {modeEditReferensi ? 'Simpan' : 'Tambah'}
                  </button>
                  {modeEditReferensi && (
                    <button
                      type="button"
                      onClick={() => {
                        setModeEditReferensi(null);
                        setFormReferensi({ tipe: 'role', nama: '', nilai: '', detail_info: '' });
                      }}
                      style={{ height: '38px', padding: '0 16px', backgroundColor: '#e2e8f0', color: '#4a5568', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      Batal
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e7eeeb', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead style={{ backgroundColor: '#f8faf9', borderBottom: '1px solid #e7eeeb' }}>
                  <tr>
                    <th style={{ padding: '14px 18px' }}>ID</th>
                    <th style={{ padding: '14px 18px' }}>Tipe</th>
                    <th style={{ padding: '14px 18px' }}>Nama</th>
                    <th style={{ padding: '14px 18px' }}>Nilai</th>
                    <th style={{ padding: '14px 18px' }}>Detail Info</th>
                    <th style={{ padding: '14px 18px' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {daftarReferensi.map((r) => (
                    <tr key={r.id_referensi} style={{ borderBottom: '1px solid #edf2f0' }}>
                      <td style={{ padding: '12px 18px' }}>#{r.id_referensi}</td>
                      <td style={{ padding: '12px 18px', fontWeight: '700', color: '#087568' }}>{r.tipe}</td>
                      <td style={{ padding: '12px 18px', fontWeight: '600' }}>{r.nama}</td>
                      <td style={{ padding: '12px 18px' }}>{r.nilai || '-'}</td>
                      <td style={{ padding: '12px 18px' }}>{r.detail_info || '-'}</td>
                      <td style={{ padding: '12px 18px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setModeEditReferensi(r.id_referensi);
                            setFormReferensi({
                              tipe: r.tipe,
                              nama: r.nama,
                              nilai: r.nilai || '',
                              detail_info: r.detail_info || '',
                            });
                          }}
                          style={{ marginRight: '8px', padding: '4px 8px', border: '1px solid #cbd5e0', borderRadius: '4px', background: '#ffffff', cursor: 'pointer', fontSize: '12px' }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleHapusReferensi(r.id_referensi)}
                          style={{ padding: '4px 8px', border: 'none', borderRadius: '4px', backgroundColor: '#fee2e2', color: '#991b1b', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: AUDIT LOG */}
        {/* ============================================================== */}
        {tabAktif === 'audit' && (
          <div>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '20px', border: '1px solid #e7eeeb', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 4px', color: '#153b36', fontSize: '17px' }}>
                  Rekaman Otomatis Audit Log
                </h3>
                <p style={{ margin: 0, color: '#718096', fontSize: '13px' }}>
                  Merekam aktivitas id_user, aksi, nama_tabel, id_data, waktu, ip_address, dan status operasional tanpa memuat kata sandi atau isi berkas.
                </p>
              </div>
              <button
                type="button"
                onClick={muatAudit}
                style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #c7e3dc', backgroundColor: '#ffffff', color: '#153b36', fontWeight: '600', cursor: 'pointer' }}
              >
                🔄 Segarkan
              </button>
            </div>

            <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e7eeeb', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead style={{ backgroundColor: '#f8faf9', borderBottom: '1px solid #e7eeeb' }}>
                  <tr>
                    <th style={{ padding: '14px 16px' }}>ID Log</th>
                    <th style={{ padding: '14px 16px' }}>Waktu</th>
                    <th style={{ padding: '14px 16px' }}>Pelaku (User)</th>
                    <th style={{ padding: '14px 16px' }}>Aksi</th>
                    <th style={{ padding: '14px 16px' }}>Tabel Target</th>
                    <th style={{ padding: '14px 16px' }}>ID Data</th>
                    <th style={{ padding: '14px 16px' }}>IP Address</th>
                    <th style={{ padding: '14px 16px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {daftarAudit.map((log) => (
                    <tr key={log.id_log} style={{ borderBottom: '1px solid #edf2f0' }}>
                      <td style={{ padding: '12px 16px' }}>#{log.id_log}</td>
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>{log.waktu}</td>
                      <td style={{ padding: '12px 16px' }}>
                        {log.nama_user ? `${log.nama_user} (${log.username})` : `User #${log.id_user || '-'}`}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '700',
                          backgroundColor: log.aksi === 'AKSES_DITOLAK' ? '#fee2e2' : log.aksi === 'BUAT' ? '#dcfce7' : log.aksi === 'HAPUS' ? '#ffedd5' : '#e0f2fe',
                          color: log.aksi === 'AKSES_DITOLAK' ? '#991b1b' : log.aksi === 'BUAT' ? '#166534' : log.aksi === 'HAPUS' ? '#9a3412' : '#0369a1'
                        }}>
                          {log.aksi}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>{log.nama_tabel}</td>
                      <td style={{ padding: '12px 16px' }}>{log.id_data ? `#${log.id_data}` : '-'}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#718096' }}>{log.ip_address || '-'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          fontWeight: '700',
                          color: log.status === 'berhasil' ? '#15803d' : '#b91c1c'
                        }}>
                          ● {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default DashboardAdmin;
