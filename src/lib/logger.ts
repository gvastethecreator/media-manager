/** Niveles de log disponibles */
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

/** Estructura de un mensaje de log */
export interface LogMessage {
    /** Mensaje principal */
    message: string;
    /** Error asociado si existe */
    error?: unknown;
    /** Contexto adicional */
    context?: Record<string, unknown>;
}

/** Interfaz para datos de log */
interface LogData {
    timestamp: string;
    level: LogLevel;
    message: string;
    error?: unknown;
    context?: Record<string, unknown>;
}

/** Clase para gestionar el logging de la aplicación */
class Logger {
    private log(level: LogLevel, { message, error, context }: LogMessage) {
        const timestamp = new Date().toISOString();
        const logData: LogData = {
            timestamp,
            level,
            message
        };

        if (error !== undefined) {
            logData.error = error;
        }

        if (context !== undefined) {
            logData.context = context;
        }

        console[level](`[${timestamp}]`, JSON.stringify(logData, null, 2));
    }

    info(message: LogMessage) {
        this.log('info', message);
    }

    warn(message: LogMessage) {
        this.log('warn', message);
    }

    error(message: LogMessage) {
        this.log('error', message);
    }

    debug(message: LogMessage) {
        this.log('debug', message);
    }
}

export const logger = new Logger();
