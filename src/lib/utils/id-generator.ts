/**
 * @file Generador de IDs legibles para entidades
 * @module lib/utils/id-generator
 * @description Utilidades para generar IDs únicos y legibles tipo: tipo-nombre-numero
 * @example tag-naturaleza-01, folder-imagenes-02, album-vacaciones-01
 */

import { nanoid } from 'nanoid';

// Tipos de entidades soportados
export type EntityType =
	| 'folder'
	| 'album'
	| 'collection'
	| 'tag'
	| 'property'
	| 'character'
	| 'place'
	| 'world-item'
	| 'concept'
	| 'prompt'
	| 'note'
	| 'wildcard'
	| 'group'
	| 'profile'
	| 'image'
	| 'video'
	| 'audio'
	| 'document'
	| 'json'
	| 'file3d'
	| 'file'
	| 'thumbnail'
	| 'metadata'
	| 'activity'
	| 'favorite'
	| 'task'
	| 'queue-job'
	| 'setting';

// Mapeo de prefijos por tipo de entidad
const ENTITY_PREFIXES: Record<EntityType, string> = {
	folder: 'fld',
	album: 'alb',
	collection: 'col',
	tag: 'tag',
	property: 'prop',
	character: 'char',
	place: 'place',
	'world-item': 'item',
	concept: 'cpt',
	prompt: 'prmpt',
	note: 'note',
	wildcard: 'wild',
	group: 'grp',
	profile: 'prof',
	image: 'img',
	video: 'vid',
	audio: 'aud',
	document: 'doc',
	json: 'json',
	file3d: 'file3d',
	file: 'file',
	thumbnail: 'thumb',
	metadata: 'meta',
	activity: 'act',
	favorite: 'fav',
	task: 'task',
	'queue-job': 'job',
	setting: 'cfg',
};

/**
 * Normaliza un nombre para usarlo en un ID
 * - Convierte a minúsculas
 * - Remueve acentos y caracteres especiales
 * - Reemplaza espacios con guiones
 * - Limita la longitud
 * @param name - Nombre a normalizar
 * @param maxLength - Longitud máxima (default: 30)
 * @returns Nombre normalizado
 */
export function normalizeNameForId(name: string, maxLength = 30): string {
	if (!name || typeof name !== 'string') {
		return 'unknown';
	}

	let normalized = name
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '') // Remover acentos
		.replace(/[^a-z0-9\s-]/g, '') // Solo letras, números, espacios y guiones
		.replace(/\s+/g, '-') // Espacios a guiones
		.replace(/-+/g, '-') // Múltiples guiones a uno solo
		.replace(/^-+|-+$/g, ''); // Remover guiones al inicio y final

	// Limitar longitud
	if (normalized.length > maxLength) {
		normalized = normalized.substring(0, maxLength);
	}

	// Asegurar que no esté vacío
	if (!normalized) {
		normalized = 'unknown';
	}

	return normalized;
}

/**
 * Genera un ID legible para una entidad
 * Formato: prefijo-nombre-numero
 * @example generateReadableId('folder', 'Mis Imágenes') // 'fld-mis-imagenes-01'
 * @param entityType - Tipo de entidad
 * @param name - Nombre de la entidad
 * @param sequence - Número de secuencia (default: 1)
 * @returns ID legible generado
 */
export function generateReadableId(entityType: EntityType, name: string, sequence = 1): string {
	const prefix = ENTITY_PREFIXES[entityType] || entityType;
	const normalizedName = normalizeNameForId(name);
	const sequenceStr = sequence.toString().padStart(2, '0');

	return `${prefix}-${normalizedName}-${sequenceStr}`;
}

/**
 * Genera un ID corto para casos donde el nombre es muy largo o no disponible
 * @param entityType - Tipo de entidad
 * @param sequence - Número de secuencia opcional
 * @returns ID corto
 */
export function generateShortId(entityType: EntityType, sequence?: number): string {
	const prefix = ENTITY_PREFIXES[entityType] || entityType;
	const suffix = sequence !== undefined ? `-${sequence.toString().padStart(3, '0')}` : `-${nanoid(4)}`;

	return `${prefix}${suffix}`;
}

/**
 * Verifica si un string es un ID legible válido
 * @param id - ID a verificar
 * @returns true si es un ID legible válido
 */
export function isReadableId(id: string): boolean {
	if (!id || typeof id !== 'string') return false;

	// Formato esperado: prefijo-nombre-secuencia
	const readableIdRegex = /^[a-z]+-[a-z0-9-]+-\d{2,}$/;
	return readableIdRegex.test(id) && id.length <= 100;
}

/**
 * Extrae el tipo de entidad de un ID legible
 * @param id - ID legible
 * @returns El tipo de entidad o null si no se puede determinar
 */
export function getEntityTypeFromId(id: string): EntityType | null {
	if (!isReadableId(id)) return null;

	const prefix = id.split('-')[0];

	// Buscar el tipo de entidad por prefijo
	const entry = Object.entries(ENTITY_PREFIXES).find(([, p]) => p === prefix);
	return entry ? (entry[0] as EntityType) : null;
}

/**
 * Genera un ID único con fallback a nanoid si es necesario
 * Útil para casos donde no tenemos un nombre disponible
 * @param entityType - Tipo de entidad
 * @param name - Nombre opcional
 * @returns ID único
 */
export function generateUniqueId(entityType: EntityType, name?: string): string {
	if (name?.trim()) {
		return generateReadableId(entityType, name, 1);
	}

	// Fallback a nanoid si no hay nombre
	const prefix = ENTITY_PREFIXES[entityType] || entityType;
	return `${prefix}-${nanoid(8)}`;
}

/**
 * Genera múltiples IDs candidatos para verificar unicidad
 * @param entityType - Tipo de entidad
 * @param name - Nombre base
 * @param count - Cantidad de IDs a generar (default: 10)
 * @returns Array de IDs candidatos
 */
export function generateIdCandidates(entityType: EntityType, name: string, count = 10): string[] {
	const candidates: string[] = [];

	for (let i = 1; i <= count; i++) {
		candidates.push(generateReadableId(entityType, name, i));
	}

	return candidates;
}

/**
 * Genera un ID para archivos basado en su nombre y extensión
 * @param fileName - Nombre del archivo
 * @param entityType - Tipo de entidad (default: 'file')
 * @returns ID para el archivo
 */
export function generateFileId(fileName: string, entityType: EntityType = 'file'): string {
	// Extraer nombre sin extensión
	const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
	return generateReadableId(entityType, nameWithoutExt, 1);
}

// Exportar alias para compatibilidad hacia atrás
export const createId = generateUniqueId;
export const createReadableId = generateReadableId;
