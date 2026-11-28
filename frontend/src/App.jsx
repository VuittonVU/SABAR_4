import { useEffect, useState } from 'react';
import './App.css';
import { KelolaJadwal } from './Pages/Kelola_Jadwal/Kelola_Jadwal.jsx';
import { DashboardDosen } from './Pages/Dashboard_Dosen/Dashboard_Dosen.jsx';
import { KelolaAntrean } from './Pages/Kelola_Antrean/Kelola_Antrean.jsx';
import { Riwayat } from './Pages/Riwayat/Riwayat.jsx';
import { DashboardMahasiswa } from './Pages/DashboardMahasiswa.jsx';
import { AmbilAntrean } from './Pages/AmbilAntrean.jsx';
import { BerkasRevisi } from './Pages/BerkasRevisi.jsx';
import { DashboardAdmin } from './Pages/DashboardAdmin.jsx';

const forms = {
  '/login': {
    title: 'Selamat Datang',
    description: 'Masuk untuk membuka ruang bimbingan SABAR.',
    submit: 'Masuk',
    fields: [
      { name: 'identifier', label: 'NIM atau email', placeholder: 'Masukkan NIM atau email', autoComplete: 'username' },
      { name: 'password', label: 'Kata sandi', placeholder: 'Masukkan kata sandi', type: 'password', autoComplete: 'current-password' },
    ],
  },
  '/registrasi': {
    title: 'Daftar Akun',
    description: 'Buat akun mahasiswa untuk mengakses SABAR.',
    submit: 'Daftar',
    fields: [
      { name: 'name', label: 'Nama lengkap', autoComplete: 'name' },
      { name: 'nim', label: 'NIM', inputMode: 'numeric', pattern: '[0-9]+' },
      { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
      { name: 'password', label: 'Kata sandi', type: 'password', minLength: 8, autoComplete: 'new-password' },
      { name: 'confirmation', label: 'Ulangi kata sandi', type: 'password', minLength: 8, autoComplete: 'new-password' },
    ],
  },
  '/lupa-kata-sandi': {
    title: 'Lupa Kata Sandi',
    description: 'Masukkan email akun untuk meminta tautan pemulihan.',
    submit: 'Kirim tautan',
    fields: [{ name: 'email', label: 'Email', placeholder: 'Masukkan email akun', type: 'email', autoComplete: 'email' }],
  },
  '/reset-kata-sandi': {
    title: 'Atur Ulang Kata Sandi',
    description: 'Buat kata sandi baru dengan minimal 8 karakter.',
    submit: 'Simpan kata sandi',
    fields: [
      { name: 'password', label: 'Kata sandi baru', type: 'password', minLength: 8, autoComplete: 'new-password' },
      { name: 'confirmation', label: 'Ulangi kata sandi baru', type: 'password', minLength: 8, autoComplete: 'new-password' },
    ],
  },
};

function getRoute() {
  const path = window.location.pathname.replace(/\/+$/, '');
  return path || '/login';
}

function RouteLink({ to, go, children }) {
  return <a href={to} onClick={(event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    go(to);
  }}>{children}</a>;
}

function AuthForm({ path, go, onLoginSuccess }) {
  const config = forms[path];
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    setError('');
    setNotice('');

    if (path === '/login') {
      const identifier = data.identifier?.trim();
      const password = data.password;

      if (!identifier) {
        setError('Masukkan NIM atau email.');
        return;
      }
      if (!password) {
        setError('Masukkan kata sandi.');
        return;
      }

      setLoading(true);
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nim: identifier,
            username: identifier,
            password: password,
          }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Login gagal. Periksa kembali NIM/email dan kata sandi Anda.');
        }

        if (onLoginSuccess) {
          onLoginSuccess(result.data);
        }
      } catch (err) {
        setError(err.message || 'Terjadi kesalahan saat menghubungi server.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (path === '/registrasi') {
      if (!data.name?.trim()) {
        setError('Masukkan nama lengkap.');
        return;
      }
      if (data.confirmation !== undefined && data.password !== data.confirmation) {
        setError('Kedua kata sandi harus sama.');
        return;
      }
      setNotice('Pendaftaran akun mahasiswa akan segera diproses.');
      return;
    }

    setNotice('Form sudah diperiksa. Pengiriman belum tersedia.');
  }

  return <>
    <h1>{config.title}</h1>
    <p className="description">{config.description}</p>
    {notice && <p className="feedback" role="status">{notice}</p>}
    {error && <p className="feedback error" role="alert">{error}</p>}
    <form onSubmit={submit}>
      {config.fields.map(({ label, name, type = 'text', ...props }) => <div className="field" key={name}>
        <label htmlFor={name}>{label}</label>
        <input id={name} name={name} type={type} required disabled={loading} {...props} />
      </div>)}
      {path === '/login' && <div className="form-link">
        <RouteLink to="/lupa-kata-sandi" go={go}>Lupa kata sandi?</RouteLink>
      </div>}
      <button className="primary" type="submit" disabled={loading}>
        {loading ? 'Memproses...' : config.submit}
      </button>
    </form>
    <p className="alternate">
      {path === '/login' ? <>Belum punya akun mahasiswa? <RouteLink to="/registrasi" go={go}>Daftar</RouteLink></>
        : <RouteLink to="/login" go={go}>Kembali ke halaman masuk</RouteLink>}
      {path === '/lupa-kata-sandi' && <> · <RouteLink to="/reset-kata-sandi" go={go}>Pratinjau reset</RouteLink></>}
    </p>
  </>;
}

export default function App() {
  const [path, setPath] = useState(getRoute);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  function go(nextPath) {
    window.history.pushState(null, '', nextPath);
    setPath(nextPath);
    window.scrollTo(0, 0);
  }

  async function handleLogout() {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setCurrentUser(null);
      go('/login');
    }
  }

  function handleLoginSuccess(authData) {
    localStorage.setItem('token', authData.token);
    localStorage.setItem('user', JSON.stringify(authData.user));
    setCurrentUser(authData.user);

    // Pengalihan dashboard sesuai peran pengguna
    const role = (authData.user?.role || '').toLowerCase();
    if (role === 'dosen') {
      go('/dashboard-dosen');
    } else if (role === 'admin') {
      go('/dashboard-admin');
    } else if (role === 'mahasiswa') {
      go('/dashboard-mahasiswa');
    } else {
      go('/dashboard-mahasiswa');
    }
  }

  useEffect(() => {
    const onPop = () => setPath(getRoute());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Jika sudah login dan mengakses root atau login, arahkan ke dashboard yang sesuai
  useEffect(() => {
    if ((path === '/' || path === '/login') && currentUser) {
      const role = (currentUser.role || '').toLowerCase();
      if (role === 'dosen') {
        go('/dashboard-dosen');
      } else if (role === 'admin') {
        go('/dashboard-admin');
      } else if (role === 'mahasiswa') {
        go('/dashboard-mahasiswa');
      }
    }
  }, [path, currentUser]);

  // Halaman Dashboard Dosen
  if (path === "/dashboard-dosen") {
    return <DashboardDosen onNavigate={go} onLogout={handleLogout} user={currentUser} />;
  }

  // Halaman Kelola Jadwal
  if (path === "/kelola-jadwal") {
    return <KelolaJadwal onNavigate={go} onLogout={handleLogout} user={currentUser} />;
  }

  // Halaman Kelola Antrean
  if (path === "/kelola-antrean") {
    return <KelolaAntrean onNavigate={go} onLogout={handleLogout} user={currentUser} />;
  }

  // Halaman Riwayat
  if (path === "/riwayat") {
    return <Riwayat onNavigate={go} onLogout={handleLogout} user={currentUser} />;
  }

  // Halaman Dashboard Mahasiswa
  if (path === "/dashboard-mahasiswa") {
    return <DashboardMahasiswa onNavigate={go} onLogout={handleLogout} user={currentUser} />;
  }

  // Halaman Ambil Nomor Antrean Mahasiswa
  if (path === "/ambil-antrean") {
    return <AmbilAntrean onNavigate={go} onLogout={handleLogout} user={currentUser} />;
  }

  // Halaman Berkas Revisi & Catatan Bimbingan Mahasiswa
  if (path === "/berkas-revisi") {
    return <BerkasRevisi onNavigate={go} onLogout={handleLogout} user={currentUser} />;
  }

  // Halaman Dashboard Admin
  if (path === "/dashboard-admin") {
    return <DashboardAdmin onNavigate={go} onLogout={handleLogout} user={currentUser} />;
  }

  const formPath = Object.hasOwn(forms, path) ? path : '/login';

  return <div className="auth-shell">
    <aside className="brand" aria-label="Tentang SABAR">
      <div className="brand-name">Sabar</div>
      <p>Sistem Antrean Bimbingan &amp; Arsip Revisi</p>
    </aside>
    <main className="content">
      <div className="auth-panel">
        <AuthForm key={formPath} path={formPath} go={go} onLoginSuccess={handleLoginSuccess} />
      </div>
    </main>
  </div>;
}
