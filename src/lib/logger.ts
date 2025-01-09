export class Logger {
  private context: string = '';

  withContext(context: string): Logger {
    const logger = new Logger();
    logger.context = context;
    return logger;
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const contextStr = this.context ? `[${this.context}] ` : '';
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    return `${timestamp} ${level} ${contextStr}${message}${dataStr}`;
  }

  info(message: string, data?: any): void {
    console.log(this.formatMessage('INFO', message, data));
  }

  error(message: string, data?: any): void {
    console.error(this.formatMessage('ERROR', message, data));
  }

  warn(message: string, data?: any): void {
    console.warn(this.formatMessage('WARN', message, data));
  }

  debug(message: string, data?: any): void {
    console.debug(this.formatMessage('DEBUG', message, data));
  }
}

export const logger = new Logger();