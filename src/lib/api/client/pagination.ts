/**
 * Utilidades para respuestas paginadas de la API.
 *
 * En este proyecto conviven respuestas de tipo:
 * - T[]
 * - { data: T[]; pagination: ... }
 * - { items: T[]; ... }
 */

export type MaybePaginatedResponse<T> =
	| T[]
	| {
			data?: T[];
			items?: T[];
			[key: string]: unknown;
	  };

export function unwrapArrayResponse<T>(result: MaybePaginatedResponse<T> | unknown): T[] {
	if (Array.isArray(result)) {
		return result as T[];
	}

	if (result && typeof result === 'object') {
		const r = result as { data?: unknown; items?: unknown };
		if (Array.isArray(r.data)) return r.data as T[];
		if (Array.isArray(r.items)) return r.items as T[];
	}

	return [];
}
