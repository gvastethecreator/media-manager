/**
 * Console Utils - Utilidades para manejo consistente de consola
 *
 * Este archivo proporciona wrappers controlados para console.log/warn/error
 * que pueden ser deshabilitados en producción y redirigidos al sistema
 * de logging centralizado.
 */

import { clientLogger } from '@/lib/logger/client-logger';

// Guardar referencias originales
const originalConsole = {
	log: console.log.bind(console),
	warn: console.warn.bind(console),
	error: console.error.bind(console),
	info: console.info.bind(console),
	debug: console.debug.bind(console),
	group: console.group?.bind(console),
	groupCollapsed: console.groupCollapsed?.bind(console),
	groupEnd: console.groupEnd?.bind(console),
	table: console.table?.bind(console),
	clear: console.clear?.bind(console),
};

/**
 * Verifica si estamos en modo desarrollo
 */
function isDev(): boolean {
	return import.meta.env?.DEV ?? process.env.NODE_ENV === 'development';
}

/**
 * Opciones para el manejo de logs
 */
interface ConsoleOptions {
	/** Incluir timestamp */
	includeTimestamp?: boolean;
	/** Prefijo para los mensajes */
	prefix?: string;
	/** Redirigir al sistema de logging */
	redirectToLogger?: boolean;
}

const defaultOptions: ConsoleOptions = {
	redirectToLogger: true,
	includeTimestamp: false,
	prefix: '',
};

/**
 * Formatea un mensaje con timestamp y prefijo opcional
 */
function formatMessage(message: unknown, options: ConsoleOptions): string {
	let formatted = '';

	if (options.includeTimestamp) {
		formatted += `[${new Date().toISOString()}] `;
	}

	if (options.prefix) {
		formatted += `${options.prefix} `;
	}

	if (typeof message === 'string') {
		formatted += message;
	} else {
		try {
			formatted += JSON.stringify(message);
		} catch {
			formatted += String(message);
		}
	}

	return formatted;
}

/**
 * Obtiene las opciones y argumentos restantes de los parámetros
 */
function parseArgs(arg2: unknown, rest: unknown[]): { options: ConsoleOptions; args: unknown[] } {
	const isOptions =
		typeof arg2 === 'object' &&
		arg2 !== null &&
		!Array.isArray(arg2) &&
		('redirectToLogger' in arg2 || 'includeTimestamp' in arg2 || 'prefix' in arg2);

	if (isOptions) {
		return {
			options: { ...defaultOptions, ...(arg2 as ConsoleOptions) },
			args: rest,
		};
	}

	return {
		options: defaultOptions,
		args: arg2 !== undefined ? [arg2, ...rest] : rest,
	};
}

/**
 * Wrapper controlado para console.log
 * En producción, redirige al sistema de logging
 */
export function log(message: unknown, ...args: unknown[]): void;
export function log(message: unknown, options: ConsoleOptions, ...args: unknown[]): void;
export function log(message: unknown, ...allArgs: unknown[]): void {
	const [arg2, ...rest] = allArgs;
	const { options, args } = parseArgs(arg2, rest);

	if (!isDev() && options.redirectToLogger) {
		clientLogger.info(formatMessage(message, options), args.length > 0 ? { args } : undefined);
		return;
	}

	originalConsole.log(formatMessage(message, options), ...args);
}

/**
 * Wrapper controlado para console.warn
 */
export function warn(message: unknown, ...args: unknown[]): void;
export function warn(message: unknown, options: ConsoleOptions, ...args: unknown[]): void;
export function warn(message: unknown, ...allArgs: unknown[]): void {
	const [arg2, ...rest] = allArgs;
	const { options, args } = parseArgs(arg2, rest);

	if (!isDev() && options.redirectToLogger) {
		clientLogger.warn(formatMessage(message, options), args.length > 0 ? { args } : undefined);
		return;
	}

	originalConsole.warn(formatMessage(message, options), ...args);
}

/**
 * Wrapper controlado para console.error
 */
export function error(message: unknown, ...args: unknown[]): void;
export function error(message: unknown, options: ConsoleOptions, ...args: unknown[]): void;
export function error(message: unknown, ...allArgs: unknown[]): void {
	const [arg2, ...rest] = allArgs;
	const { options, args } = parseArgs(arg2, rest);

	if (!isDev() && options.redirectToLogger) {
		clientLogger.error(formatMessage(message, options), args.length > 0 ? { args } : undefined);
		return;
	}

	originalConsole.error(formatMessage(message, options), ...args);
}

/**
 * Wrapper controlado para console.debug
 * Solo funciona en modo desarrollo
 */
export function debug(message: unknown, ...args: unknown[]): void {
	if (!isDev()) return;
	originalConsole.debug(`[DEBUG] ${message}`, ...args);
}

/**
 * Wrapper controlado para console.info
 */
export function info(message: unknown, ...args: unknown[]): void {
	if (!isDev()) return;
	originalConsole.info(`[INFO] ${message}`, ...args);
}

/**
 * Agrupa mensajes de consola (solo en desarrollo)
 */
export function group(label: string, collapsed = false): void {
	if (!isDev()) return;
	if (collapsed && originalConsole.groupCollapsed) {
		originalConsole.groupCollapsed(label);
	} else if (originalConsole.group) {
		originalConsole.group(label);
	}
}

/**
 * Cierra el grupo actual (solo en desarrollo)
 */
export function groupEnd(): void {
	if (!isDev()) return;
	originalConsole.groupEnd?.();
}

/**
 * Muestra una tabla en consola (solo en desarrollo)
 */
export function table(data: unknown[], columns?: string[]): void {
	if (!isDev()) return;
	originalConsole.table?.(data, columns);
}

/**
 * Limpia la consola (solo en desarrollo)
 */
export function clear(): void {
	if (!isDev()) return;
	originalConsole.clear?.();
}

/**
 * Deshabilita todos los console.* excepto error
 * Útil para tests o producción
 */
export function silence(): void {
	console.log = () => {};
	console.warn = () => {};
	console.info = () => {};
	console.debug = () => {};
}

/**
 * Restaura los console.* originales
 */
export function restore(): void {
	console.log = originalConsole.log;
	console.warn = originalConsole.warn;
	console.error = originalConsole.error;
	console.info = originalConsole.info;
	console.debug = originalConsole.debug;
}

/**
 * Logger con contexto para componentes/servicios específicos
 */
export function createContextLogger(context: string) {
	return {
		log: (message: unknown, ...args: unknown[]) => log(message, { prefix: `[${context}]` }, ...args),
		warn: (message: unknown, ...args: unknown[]) => warn(message, { prefix: `[${context}]` }, ...args),
		error: (message: unknown, ...args: unknown[]) => error(message, { prefix: `[${context}]` }, ...args),
		debug: (message: unknown, ...args: unknown[]) => {
			if (isDev()) {
				debug(`[${context}] ${message}`, ...args);
			}
		},
	};
}

// Exportar namespace para uso conveniente
export const consoleUtils = {
	log,
	warn,
	error,
	debug,
	info,
	group,
	groupEnd,
	table,
	clear,
	silence,
	restore,
	createContextLogger,
};

export default consoleUtils;
