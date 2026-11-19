const logger = require('../utils/logger');

function requestLogger(req, res, next) {
    const start = Date.now();
    const { method, originalUrl } = req;
    const ip = req.ip || req.connection.remoteAddress || '-';

    res.on('finish', () => {
        const duration = Date.now() - start;
        const statusCode = res.statusCode;
        const logText = `${method} ${originalUrl} ${statusCode} - ${duration}ms [IP: ${ip}]`;

        if (statusCode >= 500) {
            logger.error(`HTTP ${logText}`);
        } else if (statusCode >= 400) {
            logger.warn(`HTTP ${logText}`);
        } else {
            logger.http(`HTTP ${logText}`);
        }
    });

    next();
}

module.exports = requestLogger;
