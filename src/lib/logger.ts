type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogStyles {
  color: string;
  emoji: string;
}

const LOG_STYLES: Record<LogLevel, LogStyles> = {
  debug: { color: '#9ca3af', emoji: '🔍' },
  info: { color: '#60a5fa', emoji: 'ℹ️' },
  warn: { color: '#fbbf24', emoji: '⚠️' },
  error: { color: '#ef4444', emoji: '❌' }
};

class Logger {
  private context: string;

  constructor(context: string = 'App') {
    this.context = context;
  }

  private log(level: LogLevel, message: string, ...args: any[]) {
    const timestamp = new Date().toISOString();
    const { color, emoji } = LOG_STYLES[level];

    const prefix = `%c${emoji} [${this.context}] [${level.toUpperCase()}] ${timestamp}:`;
    const style = `color: ${color}; font-weight: bold;`;

    if (args.length > 0) {
      console.log(prefix, style, message, ...args);
    } else {
      console.log(prefix, style, message);
    }
  }

  debug(message: string, ...args: any[]) {
    this.log('debug', message, ...args);
  }

  info(message: string, ...args: any[]) {
    this.log('info', message, ...args);
  }

  warn(message: string, ...args: any[]) {
    this.log('warn', message, ...args);
  }

  error(message: string, ...args: any[]) {
    this.log('error', message, ...args);
  }

  // Crear una nueva instancia con un contexto específico
  withContext(context: string): Logger {
    return new Logger(context);
  }
}

// Exportar una instancia por defecto
export const logger = new Logger();

// Exportar la clase para crear instancias personalizadas
export { Logger };