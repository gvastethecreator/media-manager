/**
 * @deprecated Este archivo está obsoleto. Usa serverLogger de '@/lib/logger/server-logger' en su lugar.
 * Se mantiene temporalmente por compatibilidad con código existente.
 */


// Clase simplificada que redirige a ServerLogger
export class EnhancedLogger {
	private context: string;

	constructor(options: { context?: string } = {}) {
		this.context = options.context || 'App';
	}

	debug(message: string, context?: unknown): void {
		// Implementación mínima - delegar a console
		console.debug(`[${this.context}] ${message}`, context);
	}

	info(message: string, context?: unknown): void {
		console.info(`[${this.context}] ${message}`, context);
	}

	warn(message: string, context?: unknown): void {
		console.warn(`[${this.context}] ${message}`, context);
	}

	error(message: string, context?: unknown): void {
		console.error(`[${this.context}] ${message}`, context);
	}

	success(message: string, context?: unknown): void {
		console.info(`[${this.context}] ${message}`, context);
	}
}

// Función para crear instancias de EnhancedLogger para servicios
export function createEnhancedServiceLogger(serviceName: string): EnhancedLogger {
	return new EnhancedLogger({ context: serviceName });
}
