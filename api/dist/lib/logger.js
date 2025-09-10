"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const security_1 = require("./security");
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 3] = "DEBUG";
})(LogLevel || (LogLevel = {}));
const levelMap = {
    error: LogLevel.ERROR,
    warn: LogLevel.WARN,
    info: LogLevel.INFO,
    debug: LogLevel.DEBUG
};
const currentLevel = levelMap[LOG_LEVEL.toLowerCase()] ?? LogLevel.INFO;
const log = (level, levelName, message, meta = {}) => {
    if (level > currentLevel)
        return;
    const entry = {
        ts: new Date().toISOString(),
        level: levelName,
        message,
        ...(0, security_1.sanitizeForLog)(meta)
    };
    console.log(JSON.stringify(entry));
};
exports.logger = {
    error: (message, meta) => log(LogLevel.ERROR, 'error', message, meta),
    warn: (message, meta) => log(LogLevel.WARN, 'warn', message, meta),
    info: (message, meta) => log(LogLevel.INFO, 'info', message, meta),
    debug: (message, meta) => log(LogLevel.DEBUG, 'debug', message, meta)
};
