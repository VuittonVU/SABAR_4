import React from 'react';

export function DashboardAdmin({ user, onNavigate, onLogout }) {
  const namaUser = user?.nama || 'Administrator';
  const username = user?.username || 'admin';

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
            onClick={() => onNavigate && onNavigate('/dashboard-admin')}
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
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => alert('Menu Kelola Pengguna')}
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
            Kelola Pengguna
          </button>
          <button
            type="button"
            onClick={() => alert('Menu Data Referensi')}
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
            Data Referensi
          </button>
          <button
            type="button"
            onClick={() => alert('Menu Audit Log')}
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
            Audit Log
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
            Dashboard Admin
          </h1>
          <p style={{ margin: 0, color: '#55635e', fontSize: '16px' }}>
            Selamat datang, <strong>{namaUser}</strong> ({username})
          </p>
        </header>

        {/* Admin Overview Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#153b36' }}>Manajemen Pengguna</h3>
            <p style={{ margin: '0 0 16px 0', color: '#55635e', fontSize: '14px' }}>
              Kelola akun mahasiswa, dosen, dan staf administrasi.
            </p>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#1b382b' }}>
              Endpoint: /api/admin-audit/pengguna
            </span>
          </div>

          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#153b36' }}>Data Referensi</h3>
            <p style={{ margin: '0 0 16px 0', color: '#55635e', fontSize: '14px' }}>
              Kelola nilai referensi master sistem seperti daftar role dan kategori.
            </p>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#1b382b' }}>
              Endpoint: /api/admin-audit/referensi
            </span>
          </div>

          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#153b36' }}>Audit Log & Keamanan</h3>
            <p style={{ margin: '0 0 16px 0', color: '#55635e', fontSize: '14px' }}>
              Pantau riwayat operasi, perubahan data, dan pencegahan pelanggaran akses.
            </p>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#1b382b' }}>
              Status: Aktif & Terlindungi
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}

export default DashboardAdmin;
