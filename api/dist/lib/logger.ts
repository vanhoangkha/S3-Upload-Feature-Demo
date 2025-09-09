const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

const levelMap: Record<string, LogLevel> = {
  error: LogLevel.ERROR,
  warn: LogLevel.WARN,
  info: LogLevel.INFO,
  debug: LogLevel.DEBUG
};

const currentLevel = levelMap[LOG_LEVEL.toLowerCase()] ?? LogLevel.INFO;

interface LogEntry {
  ts: string;
  level: string;
  message: string;
  requestId?: string;
  actor?: {
    userId: string;
    vendorId: string;
    roles: string[];
  };
  action?: string;
  resource?: {
    type: string;
    id: string;
  };
  result?: 'success' | 'error';
  latency_ms?: number;
  error?: string;
  [key: string]: any;
}

const log = (level: LogLevel, levelName: string, message: string, meta: any = {}) => {
  if (level > currentLevel) return;

  const entry: LogEntry = {
    ts: new Date().toISOString(),
    level: levelName,
    message,
    ...meta
  };

  console.log(JSON.stringify(entry));
};

export const logger = {
  error: (message: string, meta?: any) => log(LogLevel.ERROR, 'error', message, meta),
  warn: (message: string, meta?: any) => log(LogLevel.WARN, 'warn', message, meta),
  info: (message: string, meta?: any) => log(LogLevel.INFO, 'info', message, meta),
  debug: (message: string, meta?: any) => log(LogLevel.DEBUG, 'debug', message, meta)
};
