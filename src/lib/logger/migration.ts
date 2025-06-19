/**
 * @deprecated Este archivo está DESHABILITADO y será eliminado
 *
 * ⚠️ ARCHIVO DESHABILITADO - Causaba errores de TypeScript
 *
 * Usa serverLogger de '@/lib/logger/server-logger' directamente:
 * import { serverLogger } from '@/lib/logger/server-logger';
 *
 * TODO: Eliminar este archivo una vez que se confirme que no se usa en ningún lugar
 */

// Error para prevenir el uso de este archivo deprecated
const MIGRATION_DISABLED_ERROR = 'Logger migration disabled - Use serverLogger from @/lib/logger/server-logger instead';

export class Logger {
	constructor() {
		throw new Error(MIGRATION_DISABLED_ERROR);
	}

	withContext(): never {
		throw new Error(MIGRATION_DISABLED_ERROR);
	}

	withOptions(): never {
		throw new Error(MIGRATION_DISABLED_ERROR);
	}

	debug(): never {
		throw new Error(MIGRATION_DISABLED_ERROR);
	}

	info(): never {
		throw new Error(MIGRATION_DISABLED_ERROR);
	}

	warn(): never {
		throw new Error(MIGRATION_DISABLED_ERROR);
	}

	error(): never {
		throw new Error(MIGRATION_DISABLED_ERROR);
	}

	success(): never {
		throw new Error(MIGRATION_DISABLED_ERROR);
	}

	group(): never {
		throw new Error(MIGRATION_DISABLED_ERROR);
	}

	groupCollapsed(): never {
		throw new Error(MIGRATION_DISABLED_ERROR);
	}

	groupEnd(): never {
		throw new Error(MIGRATION_DISABLED_ERROR);
	}

	table(): never {
		throw new Error(MIGRATION_DISABLED_ERROR);
	}

	time(): never {
		throw new Error(MIGRATION_DISABLED_ERROR);
	}

	timeEnd(): never {
		throw new Error(MIGRATION_DISABLED_ERROR);
	}

	clear(): never {
		throw new Error(MIGRATION_DISABLED_ERROR);
	}
}

export const logger = {
	withContext: () => { throw new Error(MIGRATION_DISABLED_ERROR); },
	debug: () => { throw new Error(MIGRATION_DISABLED_ERROR); },
	info: () => { throw new Error(MIGRATION_DISABLED_ERROR); },
	warn: () => { throw new Error(MIGRATION_DISABLED_ERROR); },
	error: () => { throw new Error(MIGRATION_DISABLED_ERROR); },
	success: () => { throw new Error(MIGRATION_DISABLED_ERROR); },
};

export function createServerServiceLogger(): never {
	throw new Error(MIGRATION_DISABLED_ERROR);
}
