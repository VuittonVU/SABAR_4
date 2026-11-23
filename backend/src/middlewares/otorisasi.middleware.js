const jwt = require('jsonwebtoken');
const config = require('../configs/config');
const ApiError = require('../utils/apiError');

const PERAN = Object.freeze(['Mahasiswa', 'Dosen', 'Admin']);

function idValid(value) {
    return typeof value === 'string'
        && /^[1-9][0-9]{0,18}$/.test(value)
        && BigInt(value) <= 9223372036854775807n;
}

function autentikasi(req, res, next) {
    const token = /^Bearer ([^\s]+)$/i.exec(req.get('authorization') ?? '');
    if (!token) {
        return next(ApiError.unauthorized('Token login diperlukan.'));
    }

    if (!config.jwt.secret) {
        return next(ApiError.serviceUnavailable('Autentikasi belum dikonfigurasi.'));
    }

    let payload;
    try {
        payload = jwt.verify(token[1], config.jwt.secret, { algorithms: ['HS256'] });
    } catch {
        return next(ApiError.unauthorized('Token login tidak valid atau sudah kedaluwarsa.'));
    }

    if (!idValid(payload?.sub) || !Number.isFinite(payload.exp)) {
        return next(ApiError.unauthorized('Identitas pada token login tidak valid.'));
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
            return next(ApiError.forbidden('Anda tidak memiliki izin untuk mengakses sumber daya ini.'));
        }
        next();
    };
}

module.exports = { autentikasi, otorisasi, PERAN, idValid };
