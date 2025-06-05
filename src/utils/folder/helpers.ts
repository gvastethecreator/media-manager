/**
 * @file Funciones auxiliares para la entidad Folder
 * @module utils/folder/helpers
 */

import type { FolderExtended } from '@/types/entities/folder';
import { FOLDER_DEFAULT_COLORS, FOLDER_DEFAULT_EMOJIS } from '@/types/entities/folder';

/**
 * Formatea el tamaño de una carpeta en bytes a una representación legible
 * @param bytes Tamaño en bytes
 * @param decimals Número de decimales a mostrar
 * @returns Tamaño formateado (ej: "1.5 MB")
 */
export function formatFolderSize(bytes: number | undefined, decimals = 2): string {
	if (bytes === undefined || bytes === 0) return '0 Bytes';

	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${Number.parseFloat((bytes / k ** i).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Formatea la fecha de última indexación de una carpeta
 * @param date Fecha de última indexación
 * @returns Fecha formateada o texto indicando que nunca fue indexada
 */
export function formatLastIndexed(date: Date | string | null | undefined): string {
	if (!date) return 'Nunca';

	const dateObj = typeof date === 'string' ? new Date(date) : date;
	return dateObj.toLocaleDateString('es-ES', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}

/**
 * Genera una ruta segura para carpetas basada en el nombre
 * @param name Nombre de la carpeta
 * @param parentPath Ruta del padre (opcional)
 * @returns Ruta segura para usar en el sistema de archivos
 */
export function generateSafeFolderPath(name: string, parentPath?: string): string {
	// Eliminar caracteres no permitidos
	const safeName = name
		.trim()
		.toLowerCase()
		.normalize('NFD') // Normalizar acentos
		.replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
		.replace(/[^a-z0-9_-]/g, '-') // Reemplazar caracteres especiales por guiones
		.replace(/-+/g, '-') // Evitar múltiples guiones consecutivos
		.replace(/^-|-$/g, ''); // Eliminar guiones al inicio y final

	if (parentPath) {
		return `${parentPath.endsWith('/') ? parentPath : `${parentPath}/`}${safeName}`;
	}

	return safeName;
}

/**
 * Obtiene un color adecuado para una carpeta basado en sus propiedades
 * @param folder Carpeta a evaluar
 * @returns Color para la carpeta
 */
export function getFolderColor(folder: Partial<FolderExtended>): string {
	if (folder.color) return folder.color;

	if (folder.isFavorite) return FOLDER_DEFAULT_COLORS.FAVORITE;

	// Si la ruta sugiere que es una carpeta del sistema
	if (folder.path && (folder.path.startsWith('/system') || folder.path.includes('/config/'))) {
		return FOLDER_DEFAULT_COLORS.SYSTEM;
	}

	return FOLDER_DEFAULT_COLORS.DEFAULT;
}

/**
 * Obtiene un emoji adecuado para una carpeta basado en sus propiedades
 * @param folder Carpeta a evaluar
 * @returns Emoji para la carpeta
 */
export function getFolderEmoji(folder: Partial<FolderExtended>): string {
	if (folder.emoji) return folder.emoji;

	if (folder.isFavorite) return FOLDER_DEFAULT_EMOJIS.FAVORITE;

	// Detectar carpetas especiales por su nombre o ruta
	const name = folder.name?.toLowerCase() || '';
	const path = folder.path?.toLowerCase() || '';

	if (name.includes('photo') || name.includes('foto') || path.includes('photos')) {
		return FOLDER_DEFAULT_EMOJIS.PHOTOS;
	}

	if (name.includes('video') || path.includes('videos')) {
		return FOLDER_DEFAULT_EMOJIS.VIDEOS;
	}

	if (name.includes('download') || name.includes('descarga')) {
		return FOLDER_DEFAULT_EMOJIS.DOWNLOADS;
	}

	return FOLDER_DEFAULT_EMOJIS.DEFAULT;
}

/**
 * Comprueba si una carpeta es ancestro de otra
 * @param possibleAncestor Posible carpeta ancestro
 * @param folder Carpeta a comprobar
 * @param allFolders Todas las carpetas disponibles
 * @returns true si possibleAncestor es ancestro de folder
 */
export function isFolderAncestor(
	possibleAncestor: FolderExtended,
	folder: FolderExtended,
	allFolders: FolderExtended[]
): boolean {
	if (!folder.parentId) return false;
	if (folder.parentId === possibleAncestor.id) return true;

	const parent = allFolders.find((f) => f.id === folder.parentId);
	if (!parent) return false;

	return isFolderAncestor(possibleAncestor, parent, allFolders);
}
