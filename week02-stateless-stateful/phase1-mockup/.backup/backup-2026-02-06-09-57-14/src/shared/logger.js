/**
 * Simple logging utility for the mockup server
 * Provides consistent logging format for both stateless and stateful servers
 */

const fs = require('fs');
const path = require('path');

class Logger {
    constructor(options = {}) {
        this.level = options.level || 'info';
        this.logToConsole = options.logToConsole !== false;
        this.logToFile = options.logToFile || false;
        this.logDirectory = options.logDirectory || './logs';

        // Create log directory if needed
        if (this.logToFile && !fs.existsSync(this.logDirectory)) {
            fs.mkdirSync(this.logDirectory, { recursive: true });
        }

        this.levels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3
        };
    }

    _shouldLog(level) {
        return this.levels[level] <= this.levels[this.level];
    }

    _formatMessage(level, message, meta = {}) {
        const timestamp = new Date().toISOString();
        const metaStr = Object.keys(meta).length > 0
            ? ` ${JSON.stringify(meta)}`
            : '';

        return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
    }

    _writeToFile(level, formattedMessage) {
        if (!this.logToFile) return;

        const date = new Date().toISOString().split('T')[0];
        const logFile = path.join(this.logDirectory, `server-${date}.log`);

        try {
            fs.appendFileSync(logFile, formattedMessage + '\n', 'utf8');
        } catch (error) {
            // If file writing fails, log to console as error
            console.error(`Failed to write to log file: ${error.message}`);
        }
    }

    log(level, message, meta = {}) {
        if (!this._shouldLog(level)) return;

        const formattedMessage = this._formatMessage(level, message, meta);

        if (this.logToConsole) {
            const consoleMethod = level === 'error' ? console.error :
                level === 'warn' ? console.warn :
                    level === 'info' ? console.info :
                        console.log;
            consoleMethod(formattedMessage);
        }

        this._writeToFile(level, formattedMessage);
    }

    error(message, meta = {}) {
        this.log('error', message, meta);
    }

    warn(message, meta = {}) {
        this.log('warn', message, meta);
    }

    info(message, meta = {}) {
        this.log('info', message, meta);
    }

    debug(message, meta = {}) {
        this.log('debug', message, meta);
    }

    // HTTP request logging helper
    logRequest(req, res, responseTime) {
        const meta = {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            responseTime: `${responseTime}ms`,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent') || 'unknown'
        };

        let level = 'info';
        if (res.statusCode >= 500) level = 'error';
        else if (res.statusCode >= 400) level = 'warn';

        this.log(level, `HTTP ${req.method} ${req.url}`, meta);
    }

    // Server lifecycle logging
    logServerStart(serverType, port) {
        this.info(`${serverType} server started on port ${port}`);
    }

    logServerStop(serverType) {
        this.info(`${serverType} server stopped`);
    }
}

// Create default logger instance
const defaultLogger = new Logger({
    level: process.env.LOG_LEVEL || 'info',
    logToConsole: true,
    logToFile: false
});

module.exports = {
    Logger,
    defaultLogger
};