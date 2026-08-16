/**
 * Logger específico para el servidor con formato mejorado
 *
 * Este logger está optimizado para entornos de servidor y proporciona
 * una salida más detallada y estructurada para facilitar el debugging.
 */

import {
	CONSOLE_COLORS,
	createConsoleTable,
	createElapsedTime,
	createProgressBar,
	createSeparator,
	createSeparatorEnd,
	createTextBlock,
	formatConsoleMessage,
	type LogType,
} from './console-formatter';
import { type LogLevel, loggerConfig } from './logger.config';
import { sanitizeSensitiveLogOutput, sanitizeSensitiveLogText } from '@/lib/security/sanitize-sensitive-output';

// Colores ANSI para la consola del servidor
const SERVER_COLORS = {
	reset: '\x1b[0m',
	bright: '\x1b[1m',
	dim: '\x1b[2m',
	underscore: '\x1b[4m',
	blink: '\x1b[5m',
	reverse: '\x1b[7m',
	hidden: '\x1b[8m',

	// Colores de texto
	black: '\x1b[30m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	magenta: '\x1b[35m',
	cyan: '\x1b[36m',
	white: '\x1b[37m',

	// Colores de fondo
	bgBlack: '\x1b[40m',
	bgRed: '\x1b[41m',
	bgGreen: '\x1b[42m',
	bgYellow: '\x1b[43m',
	bgBlue: '\x1b[44m',
	bgMagenta: '\x1b[45m',
	bgCyan: '\x1b[46m',
	bgWhite: '\x1b[47m',
};

// Estilos para diferentes tipos de logs del servidor
const _SERVER_LOG_STYLES = {
	debug: {
		icon: '🔍',
		label: 'DEBUG',
		color: SERVER_COLORS.blue,
		border: '┌─────┐\n│ 🔍 │\n└─────┘',
	},
	info: {
		icon: 'ℹ️',
		label: 'INFO',
		color: SERVER_COLORS.green,
		border: '┌─────┐\n│ ℹ️ │\n└─────┘',
	},
	warn: {
		icon: '⚠️',
		label: 'WARN',
		color: SERVER_COLORS.yellow,
		border: '┌─────┐\n│ ⚠️ │\n└─────┘',
	},
	error: {
		icon: '❌',
		label: 'ERROR',
		color: SERVER_COLORS.red,
		border: '┌─────┐\n│ ❌ │\n└─────┘',
	},
	success: {
		icon: '✅',
		label: 'SUCCESS',
		color: SERVER_COLORS.cyan,
		border: '┌─────┐\n│ ✅ │\n└─────┘',
	},
	http: {
		icon: '🌐',
		label: 'HTTP',
		color: SERVER_COLORS.magenta,
		border: '┌─────┐\n│ 🌐 │\n└─────┘',
	},
	db: {
		icon: '🗃️',
		label: 'DB',
		color: SERVER_COLORS.cyan,
		border: '┌─────┐\n│ 🗃️ │\n└─────┘',
	},
	api: {
		icon: '🔌',
		label: 'API',
		color: SERVER_COLORS.green,
		border: '┌─────┐\n│ 🔌 │\n└─────┘',
	},
};

export interface ServerLoggerOptions {
	context?: string;
	level?: LogLevel;
	showMemoryUsage?: boolean;
	showPerformance?: boolean;
	showRequestId?: boolean;
	timestamp?: boolean;
}

export class ServerLogger {
	private readonly context: string;
	private readonly timestamp: boolean;
	private readonly level: LogLevel;
	private readonly showRequestId: boolean;
	private readonly showPerformance: boolean;
	private readonly showMemoryUsage: boolean;

	constructor(options: ServerLoggerOptions = {}) {
		this.context = options.context || 'Server';
		this.timestamp = options.timestamp ?? true;
		this.level = options.level || loggerConfig.level;
		this.showRequestId = options.showRequestId ?? false;
		this.showPerformance = options.showPerformance ?? false;
		this.showMemoryUsage = options.showMemoryUsage ?? false;
	}

	private getMemoryUsage(): string {
		if (!this.showMemoryUsage) {
			return '';
		}

		const memoryUsage = process.memoryUsage();
		return `[Mem: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB/${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB]`;
	}

	private formatServerMessage(
		level: LogType,
		message: string,
		context?: unknown,
		requestId?: string,
		startTime?: number
	): string {
		// Agregar información adicional al mensaje
		let enhancedMessage = sanitizeSensitiveLogText(message);
		const sanitizedContext = sanitizeSensitiveLogOutput(context);

		// Agregar ID de solicitud si está habilitado y disponible
		if (this.showRequestId && requestId) {
			enhancedMessage = `${enhancedMessage} ${CONSOLE_COLORS.dim}[ReqID: ${requestId}]${CONSOLE_COLORS.reset}`;
		}

		// Agregar tiempo de rendimiento si está habilitado y disponible
		if (this.showPerformance && startTime) {
			const elapsed = Date.now() - startTime;
			enhancedMessage = `${enhancedMessage} ${CONSOLE_COLORS.dim}[${elapsed}ms]${CONSOLE_COLORS.reset}`;
		}

		// Agregar uso de memoria si está habilitado
		const memoryStr = this.getMemoryUsage();
		if (memoryStr) {
			enhancedMessage = `${enhancedMessage} ${CONSOLE_COLORS.dim}${memoryStr}${CONSOLE_COLORS.reset}`;
		}

		// Usar el formateador de consola para el mensaje final
		return formatConsoleMessage(level, enhancedMessage, sanitizedContext, this.timestamp, this.context);
	}

	withContext(context: string): ServerLogger {
		return new ServerLogger({
			...this,
			context,
		});
	}

	withOptions(options: Partial<ServerLoggerOptions>): ServerLogger {
		return new ServerLogger({
			context: this.context,
			timestamp: this.timestamp,
			level: this.level,
			showRequestId: this.showRequestId,
			showPerformance: this.showPerformance,
			showMemoryUsage: this.showMemoryUsage,
			...options,
		});
	}

	debug(message: string, context?: unknown, requestId?: string, startTime?: number): void {
		if (this.shouldLog('debug')) {
			console.debug(this.formatServerMessage('debug', message, context, requestId, startTime));
		}
	}

	info(message: string, context?: unknown, requestId?: string, startTime?: number): void {
		if (this.shouldLog('info')) {
			console.info(this.formatServerMessage('info', message, context, requestId, startTime));
		}
	}

	warn(message: string, context?: unknown, requestId?: string, startTime?: number): void {
		if (this.shouldLog('warn')) {
			console.warn(this.formatServerMessage('warn', message, context, requestId, startTime));
		}
	}

	error(message: string, context?: unknown, requestId?: string, startTime?: number): void {
		if (this.shouldLog('error')) {
			const safeMessage = String(message);
			console.error(this.formatServerMessage('error', safeMessage, context, requestId, startTime));
		}
	}

	success(message: string, context?: unknown, requestId?: string, startTime?: number): void {
		if (this.shouldLog('info')) {
			console.info(this.formatServerMessage('success', message, context, requestId, startTime));
		}
	}

	http(message: string, context?: unknown, requestId?: string, startTime?: number): void {
		if (this.shouldLog('info')) {
			console.info(this.formatServerMessage('http', message, context, requestId, startTime));
		}
	}

	db(message: string, context?: unknown, requestId?: string, startTime?: number): void {
		if (this.shouldLog('info')) {
			console.info(this.formatServerMessage('db', message, context, requestId, startTime));
		}
	}

	api(message: string, context?: unknown, requestId?: string, startTime?: number): void {
		if (this.shouldLog('info')) {
			console.info(this.formatServerMessage('api', message, context, requestId, startTime));
		}
	}

	system(message: string, context?: unknown, requestId?: string, startTime?: number): void {
		if (this.shouldLog('info')) {
			console.info(this.formatServerMessage('system', message, context, requestId, startTime));
		}
	}

	// Métodos para agrupar logs
	group(label: string): void {
		if (loggerConfig.enableConsole) {
			console.group(`${CONSOLE_COLORS.bright}${sanitizeSensitiveLogText(label)}${CONSOLE_COLORS.reset}`);
		}
	}

	groupCollapsed(label: string): void {
		if (loggerConfig.enableConsole) {
			console.groupCollapsed(`${CONSOLE_COLORS.bright}${sanitizeSensitiveLogText(label)}${CONSOLE_COLORS.reset}`);
		}
	}

	groupEnd(): void {
		if (loggerConfig.enableConsole) {
			console.groupEnd();
		}
	}

	// Método para crear una tabla en la consola
	table<T extends Record<string, unknown>>(
		data: T[],
		options: {
			title?: string;
			columns?: (keyof T)[];
			columnLabels?: Record<string, string>;
		} = {}
	): void {
		if (loggerConfig.enableConsole && this.shouldLog('info')) {
			console.log(
				createConsoleTable(data, {
					...options,
					color: CONSOLE_COLORS.cyan,
				})
			);
		}
	}

	// Método para medir tiempo
	time(label: string): void {
		if (loggerConfig.enableConsole) {
			console.time(label);
		}
	}

	timeEnd(label: string): void {
		if (loggerConfig.enableConsole) {
			console.timeEnd(label);
		}
	}

	// Método para mostrar tiempo transcurrido
	elapsed(label: string, startTime: number, showMs = true): void {
		if (loggerConfig.enableConsole && this.shouldLog('info')) {
			console.log(createElapsedTime(label, startTime, { showMs }));
		}
	}

	// Método para mostrar una barra de progreso
	progress(
		message: string,
		progress: number,
		options: {
			width?: number;
			showPercentage?: boolean;
			showValue?: boolean;
			min?: number;
			max?: number;
		} = {}
	): void {
		if (loggerConfig.enableConsole && this.shouldLog('info')) {
			console.log(createProgressBar(message, progress, options));
		}
	}

	// Método para mostrar un separador
	separator(title?: string): void {
		if (loggerConfig.enableConsole) {
			console.log(createSeparator(title));
		}
	}

	// Método para mostrar un cierre de separador
	separatorEnd(): void {
		if (loggerConfig.enableConsole) {
			console.log(createSeparatorEnd());
		}
	}

	// Método para mostrar un bloque de texto
	textBlock(
		text: string,
		options: {
			title?: string;
			padding?: number;
			width?: number;
		} = {}
	): void {
		if (loggerConfig.enableConsole && this.shouldLog('info')) {
			console.log(createTextBlock(text, options));
		}
	}

	// Método para limpiar la consola
	clear(): void {
		if (loggerConfig.enableConsole) {
			console.clear();
		}
	}

	private shouldLog(level: LogLevel): boolean {
		const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
		return loggerConfig.enableConsole && levels.indexOf(level) >= levels.indexOf(this.level);
	}
}

// Instancia global del logger para servidor
export const serverLogger = new ServerLogger();

// Exportar una función para crear loggers específicos para servicios del servidor
export function createServerServiceLogger(serviceName: string): ServerLogger {
	const serviceConfig = loggerConfig.services[serviceName];

	if (serviceConfig) {
		return new ServerLogger({
			context: serviceName,
			level: serviceConfig.level || loggerConfig.level,
			timestamp: true,
			showRequestId: true,
			showPerformance: true,
			showMemoryUsage: true,
		});
	}

	return serverLogger.withContext(serviceName);
}
