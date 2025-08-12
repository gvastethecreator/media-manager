/**
 * @file Validadores para la entidad Album
 * @module transformers/album/validators
 * ✅ MIGRADO A DRIZZLE - Julio 2025
 
 */

import type { Album, AlbumCreateInput, AlbumUpdateInput } from '@/types/entities/album';
import { CreateAlbumSchema, UpdateAlbumSchema } from '@/types/entities/album';

/**
 * Valida los datos para crear un álbum
 * @param data Datos a validar
 * @returns Datos validados o error
 */
export function validateCreateAlbumData(
	data: AlbumCreateInput
): { success: true; data: AlbumCreateInput } | { success: false; error: string } {
	try {
		const result = CreateAlbumSchema.parse(data);
		return { success: true, data: result };
	} catch (error) {
		// Si es un error de Zod, formateamos el mensaje
		if (error instanceof Error) {
			return { success: false, error: error.message };
		}
		return { success: false, error: 'Datos de álbum inválidos' };
	}
}

/**
 * Valida los datos para actualizar un álbum
 * @param data Datos a validar
 * @returns Datos validados o error
 */
export function validateUpdateAlbumData(
	data: AlbumUpdateInput
): { success: true; data: AlbumUpdateInput } | { success: false; error: string } {
	try {
		const result = UpdateAlbumSchema.parse(data);
		return { success: true, data: result };
	} catch (error) {
		if (error instanceof Error) {
			return { success: false, error: error.message };
		}
		return { success: false, error: 'Datos de actualización de álbum inválidos' };
	}
}

/**
 * Valida un álbum completo
 * @param album Álbum a validar
 * @returns true si es válido, false si no lo es
 */
export function isValidAlbum(album: unknown): album is Album {
	if (!album || typeof album !== 'object') {
		return false;
	}

	const albumObj = album as Record<string, unknown>;

	return (
		typeof albumObj.id === 'string' &&
		typeof albumObj.name === 'string' &&
		albumObj.createdAt instanceof Date &&
		albumObj.updatedAt instanceof Date
	);
}

/**
 * Normaliza los datos de filtros para garantizar valores por defecto
 * @param filters Filtros a normalizar
 * @returns Filtros normalizados
 */
export function normalizeAlbumFilters(filters: {
	searchQuery?: string;
	categories?: string[];
	isFavorite?: boolean;

	startDate?: Date | string;
	endDate?: Date | string;
	limit?: number;
	offset?: number;
}): Required<typeof filters> {
	return {
		searchQuery: filters.searchQuery || '',
		categories: filters.categories || [],
		isFavorite: filters.isFavorite ?? false,

		startDate: filters.startDate || new Date(0),
		endDate: filters.endDate || new Date(),
		limit: Math.min(filters.limit || 20, 100), // Máximo 100
		offset: Math.max(filters.offset || 0, 0), // Mínimo 0
	};
}

/**
 * Valida un nombre de álbum
 * @param name Nombre a validar
 * @returns true si es válido, false si no lo es
 */
export function isValidAlbumName(name: string): boolean {
	return (
		typeof name === 'string' &&
		name.trim().length > 0 &&
		name.length <= 100 && // Máximo 100 caracteres
		!/[<>:"/\\|?*]/.test(name) // No caracteres especiales
	);
}
