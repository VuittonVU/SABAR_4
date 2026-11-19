const fs = require('fs');
const path = require('path');

const logDir = path.resolve(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

const combinedLogFile = path.join(logDir, 'app.log');
const errorLogFile = path.join(logDir, 'error.log');

function formatTimestamp() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const yyyy = now.getFullYear();
    const mm = pad(now.getMonth() + 1);
    const dd = pad(now.getDate());
    const hh = pad(now.getHours());
    const min = pad(now.getMinutes());
    const ss = pad(now.getSeconds());
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

function writeToFile(filePath, logMessage) {
    fs.appendFile(filePath, logMessage + '\n', (err) => {
        if (err) {
            console.error('Gagal menulis log ke file:', err);
        }
    });
}

function log(level, message, meta = null) {
    const timestamp = formatTimestamp();
    let metaStr = '';

    if (meta !== null && meta !== undefined) {
        if (meta instanceof Error) {
            metaStr = `\n${meta.stack || meta.message}`;
        } else if (typeof meta === 'object') {
            try {
                metaStr = ` ${JSON.stringify(meta)}`;
            } catch {
                metaStr = ` [Circular]`;
            }
        } else {
            metaStr = ` ${meta}`;
        }
    }

    const logMessage = `[${timestamp}] [${level}] ${message}${metaStr}`;

    switch (level) {
        case 'ERROR':
            console.error(logMessage);
            break;
        case 'WARN':
            console.warn(logMessage);
            break;
        case 'DEBUG':
            console.debug(logMessage);
            break;
        default:
            console.log(logMessage);
            break;
    }

    writeToFile(combinedLogFile, logMessage);
    if (level === 'ERROR') {
        writeToFile(errorLogFile, logMessage);
    }
}

const logger = {
    info: (message, meta) => log('INFO', message, meta),
    warn: (message, meta) => log('WARN', message, meta),
    error: (message, meta) => log('ERROR', message, meta),
    debug: (message, meta) => log('DEBUG', message, meta),
    http: (message, meta) => log('HTTP', message, meta),
};

module.exports = logger;
