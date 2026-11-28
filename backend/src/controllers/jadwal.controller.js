const service = require('../services/jadwal.service');
const { idValid } = require('../middlewares/otorisasi.middleware');
const { sendSuccess } = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

const kolom = ['tanggal', 'jam_mulai', 'jam_selesai', 'ruang', 'kuota_mhs', 'status_jadwal', 'durasi_menit'];

function validasiInput(req, res, next) {
    const body = req.body;
    if (!body || Array.isArray(body) || typeof body !== 'object'
        || Object.keys(body).length === 0 || Object.keys(body).some((key) => !kolom.includes(key))) {
        return next(ApiError.badRequest('Isi JSON jadwal tidak valid atau memuat kolom yang tidak diizinkan.'));
    }
    next();
}

function validasiId(req, res, next) {
    if (!idValid(req.params.idJadwal)) return next(ApiError.badRequest('ID jadwal tidak valid.'));
    next();
}

function handler(operation, message, status = 200) {
    return async (req, res, next) => {
        try {
            const data = await operation(res.locals.idPengguna, req.params.idJadwal, req.body);
            return sendSuccess(res, message, data, status);
        } catch (err) { next(err); }
    };
}

async function daftarAktif(req, res, next) {
    try {
        const data = await service.daftarAktif(res.locals.idPengguna);
        return sendSuccess(res, 'Daftar jadwal aktif berhasil diambil.', data);
    } catch (err) {
        next(err);
    }
}

module.exports = {
    validasiInput,
    validasiId,
    daftar: handler((id) => service.daftar(id), 'Daftar jadwal berhasil diambil.'),
    daftarAktif,
    detail: handler(service.detail, 'Detail jadwal berhasil diambil.'),
    tambah: handler((id, unusedId, body) => service.tambah(id, body), 'Jadwal berhasil ditambahkan.', 201),
    ubah: handler(service.ubah, 'Jadwal berhasil diperbarui.'),
    hapus: handler(service.hapus, 'Jadwal berhasil dihapus.'),
};
