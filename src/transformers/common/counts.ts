/**
 * @file Shared Relation Counts
 * @module transformers/common
 * @description Utilidad centralizada para normalizar y sumar conteos de relaciones desde Drizzle _count.
 */

export interface RelationCounts {
	images?: number;
	videos?: number;
	audios?: number;
	albums?: number;
	collections?: number;
	tags?: number;
	characters?: number;
	places?: number;
	worldItems?: number;
	concepts?: number;
	prompts?: number;
	notes?: number;
	wildcards?: number;
	properties?: number;
	groups?: number;
	children?: number;
	documents?: number;
	jsonFiles?: number;
	file3Ds?: number;
	childWildcards?: number;
	relatedCharacters?: number;
	relatedTo?: number;
	folders?: number;
	tagEntities?: number;
}

const ALL_COUNT_KEYS = [
	'images',
	'videos',
	'audios',
	'albums',
	'collections',
	'tags',
	'characters',
	'places',
	'worldItems',
	'concepts',
	'prompts',
	'notes',
	'wildcards',
	'properties',
	'groups',
	'children',
	'documents',
	'jsonFiles',
	'file3Ds',
	'childWildcards',
	'relatedCharacters',
	'relatedTo',
	'folders',
	'tagEntities',
] as const;

/**
 * Conjunto estándar de campos de conteo compartido por la mayoría de entidades.
 */
export const STANDARD_COUNT_KEYS = [
	'images',
	'videos',
	'albums',
	'collections',
	'tags',
	'characters',
	'places',
	'worldItems',
	'concepts',
	'prompts',
	'notes',
	'wildcards',
	'properties',
	'groups',
] as const satisfies ReadonlyArray<keyof RelationCounts>;

/**
 * Normaliza un objeto _count parcial (posiblemente undefined/null) a un objeto con todos los campos a 0.
 * Usa el set estándar de campos de conteo.
 */
export function normalizeCounts(
	counts: RelationCounts | null | undefined
): Record<(typeof STANDARD_COUNT_KEYS)[number], number> {
	const result = {} as Record<(typeof STANDARD_COUNT_KEYS)[number], number>;
	for (const key of STANDARD_COUNT_KEYS) {
		result[key] = counts?.[key] ?? 0;
	}
	return result;
}

/**
 * Normaliza un objeto _count parcial retornando todos los campos conocidos con valor 0 por defecto.
 */
export function normalizeAllCounts(
	counts: RelationCounts | null | undefined
): Record<(typeof ALL_COUNT_KEYS)[number], number> {
	const result = {} as Record<(typeof ALL_COUNT_KEYS)[number], number>;
	for (const key of ALL_COUNT_KEYS) {
		result[key] = counts?.[key as keyof RelationCounts] ?? 0;
	}
	return result;
}

/**
 * Suma todos los conteos de un objeto _count (posiblemente undefined/null).
 * Opcionalmente acepta una lista de campos específicos a sumar.
 */
export function sumCounts(
	counts: RelationCounts | null | undefined,
	fields?: readonly (keyof RelationCounts)[]
): number {
	const normalized = normalizeAllCounts(counts);
	const keys = fields ?? (ALL_COUNT_KEYS as unknown as readonly (keyof RelationCounts)[]);
	let sum = 0;
	for (const key of keys) {
		sum += normalized[key as (typeof ALL_COUNT_KEYS)[number]] ?? 0;
	}
	return sum;
}

/**
 * Crea una función de ayuda que extrae y retorna un campo específico ya normalizado a 0.
 */
export function countOf(
	counts: RelationCounts | null | undefined
): Record<(typeof STANDARD_COUNT_KEYS)[number], number> {
	return normalizeCounts(counts);
}
