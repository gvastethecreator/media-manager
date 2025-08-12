/**
 * @file Utilidades para obtener propiedades básicas de entidades
 * @module lib/utils/entity-properties
 * @description Helper functions para obtener propiedades comunes de diferentes tipos de entidades
 */

import type { AnyEntityWithStats } from '@/types/migration';

/**
 * Obtiene el tamaño de una entidad en bytes
 */
export function getEntitySize(entity: AnyEntityWithStats): number {
	// Para imágenes y videos, usar el campo size directo
	if ('size' in entity && typeof entity.size === 'number') {
		return entity.size;
	}

	// Para entidades con estadísticas que incluyen size
	if (entity.stats && 'size' in entity.stats && typeof entity.stats.size === 'number') {
		return entity.stats.size;
	}

	// Para entidades con statistics legacy
	if (
		'statistics' in entity &&
		entity.statistics &&
		'size' in entity.statistics &&
		typeof entity.statistics.size === 'number'
	) {
		return entity.statistics.size;
	}

	return 0;
}

/**
 * Verifica si una entidad es un directorio/carpeta
 */
export function isEntityDirectory(entity: AnyEntityWithStats): boolean {
	// Verificar por entityType
	if (entity.entityType === 'folder') {
		return true;
	}

	// Verificar por propiedades específicas
	if ('isDirectory' in entity && typeof entity.isDirectory === 'boolean') {
		return entity.isDirectory;
	}

	// Para estadísticas con método isDirectory
	if (entity.stats && 'isDirectory' in entity.stats && typeof entity.stats.isDirectory === 'function') {
		return entity.stats.isDirectory();
	}

	return false;
}

/**
 * Verifica si una entidad es un archivo
 */
export function isEntityFile(entity: AnyEntityWithStats): boolean {
	// Los directorios no son archivos
	if (isEntityDirectory(entity)) {
		return false;
	}

	// Verificar por propiedades específicas
	if ('isDirectory' in entity && typeof entity.isDirectory === 'boolean') {
		return !entity.isDirectory;
	}

	// Para estadísticas con método isFile
	if (entity.stats && 'isFile' in entity.stats && typeof entity.stats.isFile === 'function') {
		return entity.stats.isFile();
	}

	// La mayoría de entidades que no son carpetas son archivos
	return !isEntityDirectory(entity);
}

/**
 * Obtiene la ruta de una entidad
 */
export function getEntityPath(entity: AnyEntityWithStats): string {
	if ('path' in entity && typeof entity.path === 'string') {
		return entity.path;
	}

	if ('absolutePath' in entity && typeof entity.absolutePath === 'string') {
		return entity.absolutePath;
	}

	return '';
}

/**
 * Obtiene el nombre de una entidad
 */
export function getEntityName(entity: AnyEntityWithStats): string {
	// Verificar nombre directo
	if ('name' in entity && typeof entity.name === 'string') {
		return entity.name;
	}

	// Para algunos tipos de entidades, el nombre puede estar en el title
	if ('title' in entity && typeof entity.title === 'string') {
		return entity.title;
	}

	// Extraer nombre del path si está disponible
	const path = getEntityPath(entity);
	if (path) {
		const parts = path.split(/[\\/]/);
		return parts.at(-1) || '';
	}

	// Fallback genérico
	return `${entity.entityType}_${entity.id}`;
}

/**
 * Obtiene el tipo MIME de una entidad
 */
export function getEntityMimeType(entity: AnyEntityWithStats): string {
	if ('mimeType' in entity && typeof entity.mimeType === 'string') {
		return entity.mimeType;
	}

	// Inferir por entityType
	switch (entity.entityType) {
		case 'image':
			return 'image/*';
		case 'video':
			return 'video/*';
		case 'audio':
			return 'audio/*';
		case 'document':
			return 'application/pdf';
		case 'folder':
			return 'inode/directory';
		default:
			return 'application/octet-stream';
	}
}

/**
 * Obtiene la extensión de archivo de una entidad
 */
export function getEntityExtension(entity: AnyEntityWithStats): string {
	if ('extension' in entity && typeof entity.extension === 'string') {
		return entity.extension;
	}

	// Extraer de la ruta
	const path = getEntityPath(entity);
	if (path) {
		const lastDot = path.lastIndexOf('.');
		if (lastDot > 0) {
			return path.slice(lastDot + 1);
		}
	}

	// Extraer del nombre
	const name = entity.name;
	if (name) {
		const lastDot = name.lastIndexOf('.');
		if (lastDot > 0) {
			return name.slice(lastDot + 1);
		}
	}

	return '';
}

/**
 * Verifica si una entidad tiene una propiedad específica
 */
export function hasEntityProperty(entity: AnyEntityWithStats, property: string): boolean {
	return property in entity;
}

/**
 * Obtiene una propiedad de entidad de forma segura
 */
export function getEntityProperty<T = any>(
	entity: AnyEntityWithStats,
	property: string,
	defaultValue?: T
): T | undefined {
	if (property in entity) {
		return (entity as any)[property];
	}
	return defaultValue;
}
