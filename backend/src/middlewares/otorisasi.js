const jwt = require('jsonwebtoken');
const config = require('../configs/config');

const PERAN = Object.freeze(['Mahasiswa', 'Dosen', 'Admin']);

function idValid(value) {
    return typeof value === 'string'
        && /^[1-9][0-9]{0,18}$/.test(value)
        && BigInt(value) <= 9223372036854775807n;
}

function autentikasi(req, res, next) {
    const token = /^Bearer ([^\s]+)$/i.exec(req.get('authorization') ?? '');
    if (!token) {
        return res.status(401).json({ message: 'Token login diperlukan.' });
    }

    if (!config.jwt.secret || config.jwt.secret === 'your_jwt_secret_here') {
        return res.status(503).json({ message: 'Autentikasi belum dikonfigurasi.' });
    }

    let payload;
    try {
        payload = jwt.verify(token[1], config.jwt.secret, { algorithms: ['HS256'] });
    } catch {
        return res.status(401).json({ message: 'Token login tidak valid atau sudah kedaluwarsa.' });
    }

    if (!idValid(payload?.sub) || !Number.isFinite(payload.exp)) {
        return res.status(401).json({ message: 'Identitas pada token login tidak valid.' });
    }

    res.locals.idPengguna = payload.sub;
    res.locals.peran = payload.role ?? payload.peran;
    next();
}

function otorisasi(...peranDiizinkan) {
    if (!peranDiizinkan.length || peranDiizinkan.some((peran) => !PERAN.includes(peran))) {
        throw new Error('Daftar peran otorisasi tidak valid.');
    }

    return (req, res, next) => {
        if (!peranDiizinkan.includes(res.locals.peran)) {
            return res.status(403).json({ message: 'Anda tidak memiliki izin untuk mengakses sumber daya ini.' });
        }
        next();
    };
}

module.exports = { autentikasi, otorisasi, PERAN, idValid };
