/**
 * @file Logger para el cliente
 * @module lib/logger/client-logger
 * @description Implementación de logger para el cliente que es seguro de usar en el navegador
 */

import { LogLevel, loggerConfig } from './logger.config';
import { sanitizeSensitiveLogOutput, sanitizeSensitiveLogText } from '@/lib/security/sanitize-sensitive-output';

export interface ClientLoggerOptions {
	context?: string;
	level?: LogLevel;
}

/**
 * Logger para el cliente que es seguro en entornos del navegador
 */
export class ClientLogger {
	private readonly context: string;
	private readonly level: LogLevel;

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
			level: this.level,
		});
	}

	/**
	 * Crea un nuevo logger con opciones personalizadas
	 */
	withOptions(options: Partial<ClientLoggerOptions>): ClientLogger {
		return new ClientLogger({
			context: this.context,
			level: this.level,
			...options,
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
			error: 3,
		};
		return levels[level] >= levels[this.level];
	}

	/**
	 * Formatea un mensaje para la consola del cliente
	 */
	private formatMessage(level: string, message: string): string {
		return `[${level.toUpperCase()}] [${this.context}] ${sanitizeSensitiveLogText(message)}`;
	}

	// Métodos de logging
	debug(message: string, context?: unknown): void {
		if (this.shouldLog('debug') && typeof console !== 'undefined') {
			console.debug(this.formatMessage('debug', message), sanitizeSensitiveLogOutput(context) ?? '');
		}
	}

	info(message: string, context?: unknown): void {
		if (this.shouldLog('info') && typeof console !== 'undefined') {
			console.info(this.formatMessage('info', message), sanitizeSensitiveLogOutput(context) ?? '');
		}
	}

	warn(message: string, context?: unknown): void {
		if (this.shouldLog('warn') && typeof console !== 'undefined') {
			console.warn(this.formatMessage('warn', message), sanitizeSensitiveLogOutput(context) ?? '');
		}
	}

	error(message: string, context?: unknown): void {
		if (this.shouldLog('error') && typeof console !== 'undefined') {
			console.error(this.formatMessage('error', message), sanitizeSensitiveLogOutput(context) ?? '');
		}
	}

	success(message: string, context?: unknown): void {
		if (this.shouldLog('info') && typeof console !== 'undefined') {
			console.info(this.formatMessage('success', message), sanitizeSensitiveLogOutput(context) ?? '');
		}
	}

	// Métodos especiales
	group(label: string): void {
		if (typeof console !== 'undefined' && console.group) {
			console.group(sanitizeSensitiveLogText(label));
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
