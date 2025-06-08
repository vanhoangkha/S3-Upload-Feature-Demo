/**
 * Simple logger utility for the Documents API
 * Provides structured logging with different levels
 */

export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private log(level: LogLevel, message: string, data?: any): void {
    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      data
    };

    // In development, use pretty console logging
    if (this.isDevelopment) {
      const prefix = this.getColoredPrefix(level);
      if (data) {
        console.log(`${prefix} ${message}`, data);
      } else {
        console.log(`${prefix} ${message}`);
      }
    } else {
      // In production, use structured JSON logging
      console.log(JSON.stringify(logEntry));
    }
  }

  private getColoredPrefix(level: LogLevel): string {
    switch (level) {
      case LogLevel.ERROR:
        return '🔴 [ERROR]';
      case LogLevel.WARN:
        return '🟡 [WARN]';
      case LogLevel.INFO:
        return '🔵 [INFO]';
      case LogLevel.DEBUG:
        return '🟣 [DEBUG]';
      default:
        return '[LOG]';
    }
  }

  error(message: string, data?: any): void {
    this.log(LogLevel.ERROR, message, data);
  }

  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  debug(message: string, data?: any): void {
    // Only log debug messages in development
    if (this.isDevelopment) {
      this.log(LogLevel.DEBUG, message, data);
    }
  }

  // Server startup logging with special formatting
  serverInfo(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.log(`🚀 ${message}`, data ? data : '');
    } else {
      this.info(message, data);
    }
  }

  configInfo(message: string): void {
    if (this.isDevelopment) {
      console.log(`📊 ${message}`);
    } else {
      this.info(message);
    }
  }
}

export const logger = new Logger();
