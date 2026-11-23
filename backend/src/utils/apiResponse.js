/**
 * Standar Kontrak Respons JSON REST API
 */

function sendSuccess(res, message = 'Operasi berhasil.', data = null, statusCode = 200) {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
}

function sendError(res, message = 'Terjadi kesalahan pada server.', statusCode = 500, errors = null) {
    return res.status(statusCode).json({
        success: false,
        message,
        errors,
    });
}

module.exports = {
    sendSuccess,
    sendError,
};
