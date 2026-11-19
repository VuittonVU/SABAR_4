/**
 * Kelas Error Kustom untuk HTTP API
 */
class ApiError extends Error {
    constructor(statusCode, message, errors = null) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }

    static badRequest(message = 'Permintaan tidak valid.', errors = null) {
        return new ApiError(400, message, errors);
    }

    static unauthorized(message = 'Autentikasi diperlukan.', errors = null) {
        return new ApiError(401, message, errors);
    }

    static forbidden(message = 'Anda tidak memiliki izin untuk mengakses sumber daya ini.', errors = null) {
        return new ApiError(403, message, errors);
    }

    static notFound(message = 'Sumber daya tidak ditemukan.', errors = null) {
        return new ApiError(404, message, errors);
    }

    static conflict(message = 'Terjadi konflik data.', errors = null) {
        return new ApiError(409, message, errors);
    }

    static serviceUnavailable(message = 'Layanan saat ini tidak tersedia.', errors = null) {
        return new ApiError(503, message, errors);
    }

    static internal(message = 'Terjadi kesalahan internal pada server.', errors = null) {
        return new ApiError(500, message, errors);
    }
}

module.exports = ApiError;
