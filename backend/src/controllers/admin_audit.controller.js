const service = require('../services/admin_audit.service');
const { idValid } = require('../middlewares/otorisasi.middleware');
const { sendSuccess } = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

const kolomPengguna = ['id_role', 'username', 'password', 'nama', 'email_npm'];
const kolomReferensi = ['tipe', 'nama', 'nilai', 'detail_info'];

function bodyObject(body) {
    return body !== null && typeof body === 'object' && !Array.isArray(body);
}

function validasiId(param) {
    return (req, res, next) => {
        if (!idValid(req.params[param])) return next(ApiError.badRequest('ID tidak valid.'));
        next();
    };
}

function validasiPengguna(buat) {
    return (req, res, next) => {
        const body = req.body;
        const keys = bodyObject(body) ? Object.keys(body) : [];
        const required = buat ? ['id_role', 'username', 'password', 'nama', 'email_npm'] : [];
        if (!keys.length || keys.some((key) => !kolomPengguna.includes(key))
            || required.some((key) => !keys.includes(key))) {
            return next(ApiError.badRequest('Data pengguna tidak valid atau memuat kolom yang tidak diizinkan.'));
        }

        const validText = (key, max) => typeof body[key] === 'string'
            && body[key].trim().length > 0
            && body[key].trim().length <= max;
        if ((body.id_role !== undefined
                && !idValid(typeof body.id_role === 'number' && Number.isSafeInteger(body.id_role)
                    ? String(body.id_role)
                    : body.id_role))
            || (body.username !== undefined && !validText('username', 50))
            || (body.nama !== undefined && !validText('nama', 150))
            || (body.email_npm !== undefined && !validText('email_npm', 100))
            || (body.password !== undefined
                && (typeof body.password !== 'string'
                    || Buffer.byteLength(body.password, 'utf8') < 8
                    || Buffer.byteLength(body.password, 'utf8') > 72))) {
            return next(ApiError.badRequest('Format atau panjang data pengguna tidak valid.'));
        }
        next();
    };
}

function validasiReferensi(buat) {
    return (req, res, next) => {
        const body = req.body;
        const keys = bodyObject(body) ? Object.keys(body) : [];
        const required = buat ? ['tipe', 'nama'] : [];
        if (!keys.length || keys.some((key) => !kolomReferensi.includes(key))
            || required.some((key) => !keys.includes(key))) {
            return next(ApiError.badRequest('Data referensi tidak valid atau memuat kolom yang tidak diizinkan.'));
        }

        const text = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max;
        if ((body.tipe !== undefined && !text(body.tipe, 50))
            || (body.nama !== undefined && !text(body.nama, 100))
            || (body.nilai !== undefined && body.nilai !== null
                && (typeof body.nilai !== 'string' || body.nilai.length > 100))
            || (body.detail_info !== undefined && body.detail_info !== null
                && typeof body.detail_info !== 'string')) {
            return next(ApiError.badRequest('Format atau panjang data referensi tidak valid.'));
        }
        next();
    };
}

function handler(operation, message, status = 200) {
    return async (req, res, next) => {
        try {
            const data = await operation(
                res.locals.idPengguna,
                req.params.idPengguna ?? req.params.idReferensi,
                req.body,
                req.ip,
            );
            return sendSuccess(res, message, data, status);
        } catch (err) {
            next(err);
        }
    };
}

module.exports = {
    validasiId,
    validasiPengguna,
    validasiReferensi,
    daftarPengguna: handler((id, unused, body, ip) => service.daftarPengguna(id, ip), 'Daftar pengguna berhasil diambil.'),
    buatPengguna: handler((id, unused, body, ip) => service.buatPengguna(id, body, ip), 'Pengguna berhasil dibuat.', 201),
    ubahPengguna: handler((id, idTarget, body, ip) => service.ubahPengguna(id, idTarget, body, ip), 'Pengguna berhasil diperbarui.'),
    aktifkanPengguna: handler((id, idTarget, body, ip) => service.ubahStatusPengguna(id, idTarget, true, ip), 'Pengguna berhasil diaktifkan.'),
    nonaktifkanPengguna: handler((id, idTarget, body, ip) => service.ubahStatusPengguna(id, idTarget, false, ip), 'Pengguna berhasil dinonaktifkan.'),
    daftarReferensi: handler((id, unused, body, ip) => service.daftarReferensi(id, ip), 'Daftar referensi berhasil diambil.'),
    buatReferensi: handler((id, unused, body, ip) => service.buatReferensi(id, body, ip), 'Data referensi berhasil dibuat.', 201),
    ubahReferensi: handler((id, idTarget, body, ip) => service.ubahReferensi(id, idTarget, body, ip), 'Data referensi berhasil diperbarui.'),
    hapusReferensi: handler((id, idTarget, body, ip) => service.hapusReferensi(id, idTarget, ip), 'Data referensi berhasil dihapus.'),
    daftarAudit: handler((id, unused, body, ip) => service.daftarAuditLog(id), 'Daftar audit log berhasil diambil.'),
};
