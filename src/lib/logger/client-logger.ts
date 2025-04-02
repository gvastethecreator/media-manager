/**
 * @file Logger para el cliente
 * @module lib/logger/client-logger
 * @description Implementación de logger para el cliente que es seguro de usar en el navegador
 */

import { LogLevel, loggerConfig } from './logger.config';

export interface ClientLoggerOptions {
  context?: string;
  level?: LogLevel;
}

/**
 * Logger para el cliente que es seguro en entornos del navegador
 */
export class ClientLogger {
  private context: string;
  private level: LogLevel;

  constructor(options: ClientLoggerOptions = {}) {
    this.context = options.context || 'Client';
    this.level = options.level || loggerConfig.level;
  }

  /**
   * Crea un nuevo logger con un contexto específico
   */
  withContext(context: string): ClientLogger {
    return new ClientLogger({
      context,
      level: this.level
    });
  }

  /**
   * Crea un nuevo logger con opciones personalizadas
   */
  withOptions(options: Partial<ClientLoggerOptions>): ClientLogger {
    return new ClientLogger({
      context: this.context,
      level: this.level,
      ...options
    });
  }

  /**
   * Comprueba si un nivel de log debe mostrarse según la configuración
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    return levels[level] >= levels[this.level];
  }

  /**
   * Formatea un mensaje para la consola del cliente
   */
  private formatMessage(level: string, message: string): string {
    return `[${level.toUpperCase()}] [${this.context}] ${message}`;
  }

  // Métodos de logging
  debug(message: string, context?: unknown): void {
    if (this.shouldLog('debug') && typeof console !== 'undefined') {
      console.debug(this.formatMessage('debug', message), context || '');
    }
  }

  info(message: string, context?: unknown): void {
    if (this.shouldLog('info') && typeof console !== 'undefined') {
      console.info(this.formatMessage('info', message), context || '');
    }
  }

  warn(message: string, context?: unknown): void {
    if (this.shouldLog('warn') && typeof console !== 'undefined') {
      console.warn(this.formatMessage('warn', message), context || '');
    }
  }

  error(message: string, context?: unknown): void {
    if (this.shouldLog('error') && typeof console !== 'undefined') {
      console.error(this.formatMessage('error', message), context || '');
    }
  }

  success(message: string, context?: unknown): void {
    if (this.shouldLog('info') && typeof console !== 'undefined') {
      console.info(this.formatMessage('success', message), context || '');
    }
  }

  // Métodos especiales
  group(label: string): void {
    if (typeof console !== 'undefined' && console.group) {
      console.group(label);
    }
  }

  groupEnd(): void {
    if (typeof console !== 'undefined' && console.groupEnd) {
      console.groupEnd();
    }
  }

  // Método para compatibilidad con serverLogger
  child({ module }: { module: string }): ClientLogger {
    return this.withContext(module);
  }
}

// Instancia singleton global
export const clientLogger = new ClientLogger();

// Función para crear un logger de servicio
export function createClientServiceLogger(serviceName: string): ClientLogger {
  return clientLogger.withContext(serviceName);
}