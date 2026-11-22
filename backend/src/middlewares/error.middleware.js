const ApiError = require('../utils/apiError');
const { sendError } = require('../utils/apiResponse');
const logger = require('../utils/logger');
const config = require('../configs/config');

function notFoundHandler(req, res, next) {
    next(ApiError.notFound(`Endpoint ${req.method} ${req.originalUrl} tidak ditemukan.`));
}

function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

    let statusCode = err.statusCode || 500;
    let message = err.message || 'Terjadi kesalahan internal pada server.';
    let errors = err.errors || null;

    // Penanganan khusus error database PostgreSQL
    if (err.code === '23505') {
        statusCode = 409;
        message = 'Data yang dikirimkan sudah terdaftar atau mengalami duplikasi.';
    } else if (err.code === '23503') {
        statusCode = 400;
        message = 'Data relasi atau referensi yang dipilih tidak valid.';
    } else if (err.code === '22P02') {
        statusCode = 400;
        message = 'Format data yang dikirimkan tidak sesuai.';
    }

    // Penanganan khusus JWT
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Token login tidak valid.';
    } else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token login sudah kedaluwarsa.';
    }

    // Jika terjadi error sistem (500) di environment produksi, sembunyikan detail teknis
    if (statusCode >= 500) {
        logger.error(`[${req.method} ${req.originalUrl}] Server Error: ${err.message}`, err);
        if (config.env === 'production') {
            message = 'Terjadi kesalahan internal pada server.';
        }
    } else {
        logger.warn(`[${req.method} ${req.originalUrl}] Client Error (${statusCode}): ${message}`);
    }

    return sendError(res, message, statusCode, errors);
}

module.exports = {
    notFoundHandler,
    errorHandler,
};
