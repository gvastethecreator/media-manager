/**
 * Convierte cualquier valor a string de forma segura
 */
export function safeStr(value: unknown): string {
	if (value === null || value === undefined) {
		return '';
	}

	if (typeof value === 'object') {
		try {
			return JSON.stringify(value);
		} catch (_error) {
			return String(value);
		}
	}

	return String(value);
}

/**
 * Obtiene un parámetro extra de forma segura a partir de un objeto
 */
export function getExtraParam(params: Record<string, unknown>, key: string): string | null {
	if (!params || typeof params !== 'object') {
		return null;
	}

	if (key in params && params[key] !== null && params[key] !== undefined) {
		return safeStr(params[key]);
	}

	return null;
}

/**
 * Logger para debugging de metadatos de IA
 */
export const aiLogger = {
	debug: (message: string, data?: unknown) => {
		console.debug(`[AIGeneration] ${message}`, data || '');
	},
	info: (message: string, data?: unknown) => {
		console.info(`[AIGeneration] ${message}`, data || '');
	},
	warn: (message: string, data?: unknown) => {
		console.warn(`[AIGeneration] ${message}`, data || '');
	},
	error: (message: string, data?: unknown) => {
		console.error(`[AIGeneration] ${message}`, data || '');
	},
};
