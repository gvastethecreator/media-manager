// Utilidad centralizada para ordenamiento estable de MediaItems
// Sigue convención: recibe lista inmutable y retorna nueva ordenada.
// Permite múltiples criterios (aunque UI actual usa sólo uno) y garantiza estabilidad:
// si todos los criterios empatan, preserva el orden original usando índice inicial.

export interface SortCriterion {
	field: string;
	direction: 'asc' | 'desc';
}

export type GenericRecord = Record<string, any>;

function normalizeValue(v: any): any {
	if (v == null) return '';
	if (v instanceof Date) return v.getTime();
	if (typeof v === 'string') return v.toLowerCase();
	if (typeof v === 'number') return v;
	if (typeof v === 'boolean') return v ? 1 : 0;
	// Intentar parse de fecha string ISO
	if (typeof v === 'string') {
		const ts = Date.parse(v);
		if (!Number.isNaN(ts)) return ts;
	}
	return String(v).toLowerCase();
}

export function sortMediaItems<T extends GenericRecord>(items: T[], criteria: SortCriterion[]): T[] {
	if (!criteria || criteria.length === 0) return items;
	const indexed = items.map((item, index) => ({ item, index }));
	const effective = criteria.filter((c) => !!c.field && (c.direction === 'asc' || c.direction === 'desc'));
	if (effective.length === 0) return items;

	indexed.sort((a, b) => {
		for (const { field, direction } of effective) {
			const dir = direction === 'asc' ? 1 : -1;
			const av = normalizeValue(a.item?.[field]);
			const bv = normalizeValue(b.item?.[field]);
			if (av < bv) return -1 * dir;
			if (av > bv) return 1 * dir;
		}
		// Estabilidad: conservar orden original
		return a.index - b.index;
	});

	return indexed.map((x) => x.item);
}

// Helper específico para interfaz actual (usa sólo un criterio)
export function sortSingleCriterion<T extends GenericRecord>(items: T[], criterion: SortCriterion | undefined): T[] {
	if (!criterion) return items;
	return sortMediaItems(items, [criterion]);
}

// Campos recomendados para selección en UI: name, createdAt, modifiedAt, type, size
export const KNOWN_SORT_FIELDS = new Set(['name', 'createdAt', 'modifiedAt', 'type', 'size']);
