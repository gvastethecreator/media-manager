/**
 * @deprecated Este archivo está obsoleto. Usa serverLogger de '@/lib/logger/server-logger' en su lugar.
 * Se mantiene temporalmente por compatibilidad con código existente.
 */

import { type LogLevel, loggerConfig } from './logger.config';

// Colores ANSI para la consola
const LOG_COLORS = {
	debug: '\x1b[34m', // azul
	info: '\x1b[32m', // verde
	warn: '\x1b[33m', // amarillo
	error: '\x1b[31m', // rojo
	success: '\x1b[36m', // cian
	reset: '\x1b[0m', // reset
	bold: '\x1b[1m', // negrita
	dim: '\x1b[2m', // tenue
	italic: '\x1b[3m', // cursiva
	underline: '\x1b[4m', // subrayado
};

// Estilos para diferentes tipos de logs
const LOG_STYLES = {
	debug: {
		icon: '🔍',
		label: 'DEBUG',
		color: LOG_COLORS.debug,
		browserColor: '#3498db', // azul
	},
	info: {
		icon: 'ℹ️',
		label: 'INFO',
		color: LOG_COLORS.info,
		browserColor: '#2ecc71', // verde
	},
	warn: {
		icon: '⚠️',
		label: 'WARN',
		color: LOG_COLORS.warn,
		browserColor: '#f39c12', // amarillo
	},
	error: {
		icon: '❌',
		label: 'ERROR',
		color: LOG_COLORS.error,
		browserColor: '#e74c3c', // rojo
	},
	success: {
		icon: '✅',
		label: 'SUCCESS',
		color: LOG_COLORS.success,
		browserColor: '#1abc9c', // turquesa
	},
};

interface LoggerOptions {
	context?: string;
	timestamp?: boolean;
	level?: LogLevel;
	useColors?: boolean;
	useIcons?: boolean;
	showContext?: boolean;
	enableBrowserStyles?: boolean;
}

export class EnhancedLogger {
	private context: string;
	private timestamp: boolean;
	private level: LogLevel;
	private useColors: boolean;
	private useIcons: boolean;
	private showContext: boolean;
	private enableBrowserStyles: boolean;
	private groupLevel: number = 0;
	private isBrowser: boolean;

	constructor(options: LoggerOptions = {}) {
		this.context = options.context || 'App';
		this.timestamp = options.timestamp ?? loggerConfig.format.timestamp;
		this.level = options.level || loggerConfig.level;
		this.useColors = options.useColors ?? loggerConfig.format.colors;
		this.useIcons = options.useIcons ?? true;
		this.showContext = options.showContext ?? loggerConfig.format.context;
		this.enableBrowserStyles = options.enableBrowserStyles ?? true;
		this.isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';
	}

	private getTimestamp(): string {
		return new Date().toISOString();
	}

	private formatMessage(level: keyof typeof LOG_STYLES, message: string, context?: unknown): string {
		const style = LOG_STYLES[level];
		const timestamp = this.timestamp ? `${LOG_COLORS.dim}[${this.getTimestamp()}]${LOG_COLORS.reset} ` : '';
		const icon = this.useIcons ? `${style.icon} ` : '';
		const levelLabel = this.useColors
			? `${style.color}${LOG_COLORS.bold}${style.label}${LOG_COLORS.reset}`
			: style.label;
		const contextStr = this.showContext ? `${LOG_COLORS.italic}[${this.context}]${LOG_COLORS.reset} ` : '';
		const indentation = this.groupLevel > 0 ? '  '.repeat(this.groupLevel) : '';

		// Formatear el contexto de datos si existe
		let contextData = '';
		if (context) {
			try {
				if (typeof context === 'string') {
					contextData = context;
				} else if (context instanceof Error) {
					contextData = `${context.message}\n${context.stack}`;
				} else {
					contextData = JSON.stringify(context, null, 2);
				}
			} catch (e) {
				contextData = String(context);
			}
		}

		return `${indentation}${timestamp}${icon}${levelLabel} ${contextStr}${message}${contextData ? `\n${indentation}${contextData}` : ''}`;
	}

	private logWithBrowserStyles(level: keyof typeof LOG_STYLES, message: string, context?: unknown): void {
		if (!this.isBrowser || !this.enableBrowserStyles) {
			// Si no estamos en el navegador, usar el formato normal
			const formattedMessage = this.formatMessage(level, message, context);
			switch (level) {
				case 'debug':
					console.debug(formattedMessage);
					break;
				case 'warn':
					console.warn(formattedMessage);
					break;
				case 'error':
					console.error(formattedMessage);
					break;
				case 'info':
				case 'success':
				default:
					console.info(formattedMessage);
					break;
			}
			return;
		}

		const style = LOG_STYLES[level];
		const timestamp = this.timestamp ? `[${this.getTimestamp()}] ` : '';
		const contextStr = this.showContext ? `[${this.context}] ` : '';
		const prefix = `${timestamp}${style.icon} %c${style.label}%c ${contextStr}${message}`;

		// Estilos CSS para el navegador
		const levelStyle = `background: ${style.browserColor}; color: white; padding: 2px 4px; border-radius: 2px; font-weight: bold;`;
		const resetStyle = 'font-weight: normal;';

		// Determinar qué método de console usar
		let consoleMethod: 'debug' | 'info' | 'warn' | 'error' = 'info';
		switch (level) {
			case 'debug':
				consoleMethod = 'debug';
				break;
			case 'warn':
				consoleMethod = 'warn';
				break;
			case 'error':
				consoleMethod = 'error';
				break;
			case 'info':
			case 'success':
			default:
				consoleMethod = 'info';
				break;
		}

		// Imprimir el mensaje con estilos
		if (context) {
			console[consoleMethod](prefix, levelStyle, resetStyle, context);
		} else {
			console[consoleMethod](prefix, levelStyle, resetStyle);
		}
	}

	withContext(context: string): EnhancedLogger {
		const newLogger = new EnhancedLogger({
			...this,
			context,
		});
		newLogger.groupLevel = this.groupLevel;
		return newLogger;
	}

	withOptions(options: Partial<LoggerOptions>): EnhancedLogger {
		const newLogger = new EnhancedLogger({
			context: this.context,
			timestamp: this.timestamp,
			level: this.level,
			useColors: this.useColors,
			useIcons: this.useIcons,
			showContext: this.showContext,
			enableBrowserStyles: this.enableBrowserStyles,
			...options,
		});
		newLogger.groupLevel = this.groupLevel;
		return newLogger;
	}

	debug(message: string, context?: unknown): void {
		if (this.shouldLog('debug')) {
			if (this.isBrowser && this.enableBrowserStyles) {
				this.logWithBrowserStyles('debug', message, context);
			} else {
				console.debug(this.formatMessage('debug', message, context));
			}
		}
	}

	info(message: string, context?: unknown): void {
		if (this.shouldLog('info')) {
			if (this.isBrowser && this.enableBrowserStyles) {
				this.logWithBrowserStyles('info', message, context);
			} else {
				console.info(this.formatMessage('info', message, context));
			}
		}
	}

	warn(message: string, context?: unknown): void {
		if (this.shouldLog('warn')) {
			if (this.isBrowser && this.enableBrowserStyles) {
				this.logWithBrowserStyles('warn', message, context);
			} else {
				console.warn(this.formatMessage('warn', message, context));
			}
		}
	}

	error(message: string, context?: unknown): void {
		if (this.shouldLog('error')) {
			if (this.isBrowser && this.enableBrowserStyles) {
				this.logWithBrowserStyles('error', message, context);
			} else {
				console.error(this.formatMessage('error', message, context));
			}
		}
	}

	success(message: string, context?: unknown): void {
		if (this.shouldLog('info')) {
			if (this.isBrowser && this.enableBrowserStyles) {
				this.logWithBrowserStyles('success', message, context);
			} else {
				console.info(this.formatMessage('success', message, context));
			}
		}
	}

	// Métodos para agrupar logs
	group(label: string): void {
		if (loggerConfig.enableConsole) {
			if (typeof console.group === 'function') {
				console.group(this.useColors ? `${LOG_COLORS.bold}${label}${LOG_COLORS.reset}` : label);
				this.groupLevel++;
			}
		}
	}

	groupCollapsed(label: string): void {
		if (loggerConfig.enableConsole) {
			if (typeof console.groupCollapsed === 'function') {
				console.groupCollapsed(this.useColors ? `${LOG_COLORS.bold}${label}${LOG_COLORS.reset}` : label);
				this.groupLevel++;
			} else {
				// Fallback si groupCollapsed no está disponible
				this.group(label);
			}
		}
	}

	groupEnd(): void {
		if (loggerConfig.enableConsole) {
			if (typeof console.groupEnd === 'function') {
				console.groupEnd();
				if (this.groupLevel > 0) {
					this.groupLevel--;
				}
			}
		}
	}

	// Método para crear una tabla en la consola
	table(data: unknown[], columns?: string[]): void {
		if (loggerConfig.enableConsole && this.shouldLog('info')) {
			if (typeof console.table === 'function') {
				if (columns) {
					console.table(data, columns);
				} else {
					console.table(data);
				}
			} else {
				this.info('Tabla de datos', data);
			}
		}
	}

	// Método para medir tiempo
	time(label: string): void {
		if (loggerConfig.enableConsole) {
			if (typeof console.time === 'function') {
				console.time(label);
			}
		}
	}

	timeEnd(label: string): void {
		if (loggerConfig.enableConsole) {
			if (typeof console.timeEnd === 'function') {
				console.timeEnd(label);
			}
		}
	}

	// Método para limpiar la consola
	clear(): void {
		if (loggerConfig.enableConsole) {
			if (typeof console.clear === 'function') {
				console.clear();
			}
		}
	}

	private shouldLog(level: LogLevel): boolean {
		const logLevels: LogLevel[] = ['error', 'warn', 'info', 'debug'];
		const configLevelIndex = logLevels.indexOf(this.level);
		const currentLevelIndex = logLevels.indexOf(level);
		return currentLevelIndex <= configLevelIndex && loggerConfig.enableConsole;
	}
}

// Crear una instancia global del logger
export const enhancedLogger = new EnhancedLogger();

// Exportar una función para crear loggers específicos para servicios
export function createEnhancedServiceLogger(serviceName: string): EnhancedLogger {
	const serviceConfig = loggerConfig.services[serviceName];

	if (serviceConfig) {
		return new EnhancedLogger({
			context: serviceName,
			level: serviceConfig.level || loggerConfig.level,
			timestamp: loggerConfig.format.timestamp,
			useColors: loggerConfig.format.colors,
			showContext: loggerConfig.format.context,
		});
	}

	return enhancedLogger.withContext(serviceName);
}
