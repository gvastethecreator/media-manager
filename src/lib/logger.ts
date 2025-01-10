import { loggerConfig, LogLevel } from '@/config/logger.config'

const LOG_COLORS = {
  debug: '\x1b[34m', // blue
  info: '\x1b[32m',  // green
  warn: '\x1b[33m',  // yellow
  error: '\x1b[31m', // red
  reset: '\x1b[0m',  // reset
}

export class Logger {
  private context: string = ''
  private config = loggerConfig

  withContext(context: string): Logger {
    const logger = new Logger()
    logger.context = context
    return logger
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enableConsole) return false
    
    const serviceConfig = this.context ? this.config.services[this.context] : null
    if (serviceConfig && !serviceConfig.enabled) return false

    const logLevel = serviceConfig?.level || this.config.level
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error']
    return levels.indexOf(level) >= levels.indexOf(logLevel)
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const parts: string[] = []

    if (this.config.format.timestamp) {
      parts.push(new Date().toISOString())
    }

    const levelStr = level.toUpperCase()
    if (this.config.format.colors) {
      parts.push(`${LOG_COLORS[level]}${levelStr}${LOG_COLORS.reset}`)
    } else {
      parts.push(levelStr)
    }

    if (this.config.format.context && this.context) {
      parts.push(`[${this.context}]`)
    }

    parts.push(message)

    if (data) {
      try {
        const dataStr = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
        parts.push(dataStr)
      } catch (error) {
        parts.push('[Error serializing data]')
      }
    }

    return parts.join(' ')
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, data))
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, data))
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, data))
    }
  }

  error(message: string, data?: any): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, data))
    }
  }
}

export const logger = new Logger()