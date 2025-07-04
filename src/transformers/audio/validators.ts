/**
 * @file Validadores para la entidad Audio
 * @module transformers/audio/validators
 * ✅ MIGRADO A DRIZZLE - Julio 2025
 * Estado: Completo, sin dependencias de Prisma
 */

import type { AudioCreateInput, AudioUpdateInput, AudioWithStats } from '@/types/entities/audio';

/**
 * Valida un archivo de audio
 * @param audio Audio a validar
 * @returns true si es válido, false si no lo es
 */
export function isValidAudio(audio: unknown): audio is AudioWithStats {
	if (!audio || typeof audio !== 'object') return false;

	const audioObj = audio as Record<string, unknown>;

	return (
		typeof audioObj.id === 'string' &&
		typeof audioObj.name === 'string' &&
		typeof audioObj.path === 'string' &&
		audioObj.createdAt instanceof Date &&
		audioObj.updatedAt instanceof Date
	);
}

/**
 * Valida los datos para crear un audio
 * @param data Datos a validar
 * @returns Datos validados o error
 */
export function validateCreateAudioData(
	data: AudioCreateInput
): { success: true; data: AudioCreateInput } | { success: false; error: string } {
	try {
		// Validaciones básicas
		if (!data.name || data.name.trim().length === 0) {
			return { success: false, error: 'El nombre es requerido' };
		}

		if (!data.path || data.path.trim().length === 0) {
			return { success: false, error: 'La ruta del archivo es requerida' };
		}

		if (data.size !== undefined && data.size < 0) {
			return { success: false, error: 'El tamaño no puede ser negativo' };
		}

		if (data.duration !== undefined && data.duration !== null && data.duration < 0) {
			return { success: false, error: 'La duración no puede ser negativa' };
		}

		return { success: true, data };
	} catch (error) {
		if (error instanceof Error) {
			return { success: false, error: error.message };
		}
		return { success: false, error: 'Datos de audio inválidos' };
	}
}

/**
 * Valida los datos para actualizar un audio
 * @param data Datos a validar
 * @returns Datos validados o error
 */
export function validateUpdateAudioData(
	data: AudioUpdateInput
): { success: true; data: AudioUpdateInput } | { success: false; error: string } {
	try {
		// Validaciones opcionales para actualización
		if (data.name !== undefined && data.name.trim().length === 0) {
			return { success: false, error: 'El nombre no puede estar vacío' };
		}

		if (data.size !== undefined && data.size < 0) {
			return { success: false, error: 'El tamaño no puede ser negativo' };
		}

		if (data.duration !== undefined && data.duration !== null && data.duration < 0) {
			return { success: false, error: 'La duración no puede ser negativa' };
		}

		return { success: true, data };
	} catch (error) {
		if (error instanceof Error) {
			return { success: false, error: error.message };
		}
		return { success: false, error: 'Datos de actualización de audio inválidos' };
	}
}

/**
 * Valida un formato de audio
 * @param format Formato a validar
 * @returns true si es válido, false si no lo es
 */
export function isValidAudioFormat(format: string): boolean {
	const validFormats = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma'];
	return validFormats.includes(format.toLowerCase());
}

/**
 * Normaliza los datos de filtros para garantizar valores por defecto
 * @param filters Filtros a normalizar
 * @returns Filtros normalizados
 */
export function normalizeAudioFilters(filters: {
	searchQuery?: string;
	formats?: string[];
	isFavorite?: boolean;
	isPublic?: boolean;
	minDuration?: number;
	maxDuration?: number;
	minSize?: number;
	maxSize?: number;
	startDate?: Date | string;
	endDate?: Date | string;
	limit?: number;
	offset?: number;
}): Required<typeof filters> {
	return {
		searchQuery: filters.searchQuery || '',
		formats: filters.formats || [],
		isFavorite: filters.isFavorite ?? false,
		isPublic: filters.isPublic ?? true,
		minDuration: Math.max(filters.minDuration || 0, 0),
		maxDuration: filters.maxDuration || Number.MAX_SAFE_INTEGER,
		minSize: Math.max(filters.minSize || 0, 0),
		maxSize: filters.maxSize || Number.MAX_SAFE_INTEGER,
		startDate: filters.startDate || new Date(0),
		endDate: filters.endDate || new Date(),
		limit: Math.min(filters.limit || 20, 100), // Máximo 100
		offset: Math.max(filters.offset || 0, 0), // Mínimo 0
	};
}
