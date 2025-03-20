type LogLevel = 'info' | 'warn' | 'error' | 'debug';
type LogMessage = string | number | boolean | object | null | undefined;

class Logger {
    private log(level: LogLevel, message: LogMessage, ...args: LogMessage[]) {
        const timestamp = new Date().toISOString();
        console[level](`[${timestamp}] ${message}`, ...args);
    }

    info(message: LogMessage, ...args: LogMessage[]) {
        this.log('info', message, ...args);
    }

    warn(message: LogMessage, ...args: LogMessage[]) {
        this.log('warn', message, ...args);
    }

    error(message: LogMessage, ...args: LogMessage[]) {
        this.log('error', message, ...args);
    }

    debug(message: LogMessage, ...args: LogMessage[]) {
        this.log('debug', message, ...args);
    }
}

export const logger = new Logger();
