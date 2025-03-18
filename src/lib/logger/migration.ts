/**
 * @deprecated Este archivo está obsoleto. Usa serverLogger de '@/lib/logger/server-logger' en su lugar.
 * Se eliminará en futuras versiones.
 *
 * Script de migración para facilitar la transición del logger antiguo al nuevo
 *
 * Este archivo proporciona compatibilidad hacia atrás para código que todavía
 * usa el logger antiguo, redirigiendo todas las llamadas al nuevo EnhancedLogger.
 */

import { EnhancedLogger } from './enhanced-logger';

// Clase de compatibilidad que imita la API del logger antiguo
export class Logger {
	private enhancedLogger: EnhancedLogger;

	constructor(options: Record<string, unknown> = {}) {
		// Crear una nueva instancia de EnhancedLogger directamente
		this.enhancedLogger = new EnhancedLogger({
			context: options.context || 'App',
			timestamp: options.timestamp,
			level: options.level,
			useColors: options.useColors,
			useIcons: options.useIcons,
			showContext: options.showContext,
		});
	}

	withContext(context: string): Logger {
		const newLogger = new Logger();
		// Crear una nueva instancia con el contexto
		newLogger.enhancedLogger = new EnhancedLogger({
			context,
			// Copiar las opciones actuales
			timestamp: this.enhancedLogger.timestamp,
			level: this.enhancedLogger.level,
			useColors: this.enhancedLogger.useColors,
			useIcons: this.enhancedLogger.useIcons,
			showContext: this.enhancedLogger.showContext,
		});
		return newLogger;
	}

	withOptions(options: Record<string, unknown>): Logger {
		const newLogger = new Logger();
		// Crear una nueva instancia con las opciones combinadas
		newLogger.enhancedLogger = new EnhancedLogger({
			context: options.context || this.enhancedLogger.context,
			timestamp: options.timestamp !== undefined ? options.timestamp : this.enhancedLogger.timestamp,
			level: options.level || this.enhancedLogger.level,
			useColors: options.useColors !== undefined ? options.useColors : this.enhancedLogger.useColors,
			useIcons: options.useIcons !== undefined ? options.useIcons : this.enhancedLogger.useIcons,
			showContext: options.showContext !== undefined ? options.showContext : this.enhancedLogger.showContext,
		});
		return newLogger;
	}

	debug(message: string, context?: unknown): void {
		this.enhancedLogger.debug(message, context);
	}

	info(message: string, context?: unknown): void {
		this.enhancedLogger.info(message, context);
	}

	warn(message: string, context?: unknown): void {
		this.enhancedLogger.warn(message, context);
	}

	error(message: string, context?: unknown): void {
		this.enhancedLogger.error(message, context);
	}

	success(message: string, context?: unknown): void {
		this.enhancedLogger.success(message, context);
	}

	group(label: string): void {
		console.group(label);
	}

	groupCollapsed(label: string): void {
		console.groupCollapsed(label);
	}

	groupEnd(): void {
		console.groupEnd();
	}

	table(data: unknown[], columns?: string[]): void {
		console.table(data, columns);
	}

	time(label: string): void {
		console.time(label);
	}

	timeEnd(label: string): void {
		console.timeEnd(label);
	}

	clear(): void {
		console.clear();
	}
}

// Exportar una instancia global del logger para compatibilidad
export const logger = new Logger();

// Función para crear loggers específicos para servicios
export function createServerServiceLogger(serviceName: string): Logger {
	const serviceLogger = new Logger({ context: serviceName });
	return serviceLogger;
}

// Mensaje de advertencia para la consola
console.warn(
	'⚠️ Estás usando la versión de compatibilidad del serverLogger. ' +
		'Considera migrar a serverLogger para aprovechar todas las funcionalidades. ' +
		'import { serverLogger } from "@/lib/logger/server-logger";'
);
