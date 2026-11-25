import { useEffect, useState } from 'react';
import './App.css';
import { KelolaJadwal } from './Pages/Kelola_Jadwal/Kelola_Jadwal.jsx';
import { DashboardDosen } from "./Pages/Dashboard_Dosen/Dashboard_Dosen.jsx";

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

function AuthForm({ path, go }) {
  const config = forms[path];
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  function submit(event) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    setError('');
    setNotice('');

    if (path === '/login' && !data.identifier.trim()) {
      setError('Masukkan NIM atau email.');
      return;
    }
    if (path === '/registrasi' && !data.name.trim()) {
      setError('Masukkan nama lengkap.');
      return;
    }
    if (data.confirmation !== undefined && data.password !== data.confirmation) {
      setError('Kedua kata sandi harus sama.');
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
        <input id={name} name={name} type={type} required {...props} />
      </div>)}
      {path === '/login' && <div className="form-link">
        <RouteLink to="/lupa-kata-sandi" go={go}>Lupa kata sandi?</RouteLink>
      </div>}
      <button className="primary" type="submit">{config.submit}</button>
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

  function go(nextPath) {
    window.history.pushState(null, '', nextPath);
    setPath(nextPath);
    window.scrollTo(0, 0);
  }

  useEffect(() => {
    const onPop = () => setPath(getRoute());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
///===========================================
 // Halaman Dashboard Dosen
if (path === "/dashboard-dosen") {
  return <DashboardDosen onNavigate={go} />;
}

// Halaman Kelola Jadwal
if (path === "/kelola-jadwal") {
  return <KelolaJadwal onNavigate={go} />;
}

// Halaman yang belum dibuat
if (path === "/kelola-antrean" || path === "/riwayat") {
  const namaHalaman =
    path === "/kelola-antrean"
      ? "Kelola Antrean"
      : "Riwayat Bimbingan";

  return (
    <div style={{ padding: "40px" }}>
      <h1>{namaHalaman}</h1>
      <p>Halaman ini belum tersedia.</p>

      <button
        type="button"
        onClick={() => go("/dashboard-dosen")}
      >
        Kembali ke Dashboard
      </button>
    </div>
  );
}

  const formPath = Object.hasOwn(forms, path) ? path : '/login';

  return <div className="auth-shell">
    <aside className="brand" aria-label="Tentang SABAR">
      <div className="brand-name">Sabar</div>
      <p>Sistem Antrean Bimbingan &amp; Arsip Revisi</p>
    </aside>
    <main className="content">
      <div className="auth-panel">
        <AuthForm key={formPath} path={formPath} go={go} />
      </div>
    </main>
  </div>;
}
