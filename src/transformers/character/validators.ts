/**
 * @file Validadores para la entidad Character
 * @module transformers/character/validators
 * ✅ MIGRADO A DRIZZLE - Julio 2025
 * Estado: Completo, sin dependencias de Prisma
 */

import type { CharacterCreateInput, CharacterUpdateInput, CharacterWithStats } from '@/types/entities/character';

/**
 * Valida un personaje
 * @param character Personaje a validar
 * @returns true si es válido, false si no lo es
 */
export function isValidCharacter(character: unknown): character is CharacterWithStats {
	if (!character || typeof character !== 'object') return false;

	const characterObj = character as Record<string, unknown>;

	return (
		typeof characterObj.id === 'string' &&
		typeof characterObj.name === 'string' &&
		characterObj.createdAt instanceof Date &&
		characterObj.updatedAt instanceof Date
	);
}

/**
 * Valida los datos para crear un personaje
 * @param data Datos a validar
 * @returns Datos validados o error
 */
export function validateCreateCharacterData(
	data: CharacterCreateInput
): { success: true; data: CharacterCreateInput } | { success: false; error: string } {
	try {
		// Validaciones básicas
		if (!data.name || data.name.trim().length === 0) {
			return { success: false, error: 'El nombre es requerido' };
		}

		if (data.name.length > 100) {
			return { success: false, error: 'El nombre no puede tener más de 100 caracteres' };
		}

		if (data.description && data.description.length > 1000) {
			return { success: false, error: 'La descripción no puede tener más de 1000 caracteres' };
		}

		if (data.level !== undefined && data.level < 0) {
			return { success: false, error: 'El nivel no puede ser negativo' };
		}

		return { success: true, data };
	} catch (error) {
		if (error instanceof Error) {
			return { success: false, error: error.message };
		}
		return { success: false, error: 'Datos de personaje inválidos' };
	}
}

/**
 * Valida los datos para actualizar un personaje
 * @param data Datos a validar
 * @returns Datos validados o error
 */
export function validateUpdateCharacterData(
	data: CharacterUpdateInput
): { success: true; data: CharacterUpdateInput } | { success: false; error: string } {
	try {
		// Validaciones opcionales para actualización
		if (data.name !== undefined && data.name.trim().length === 0) {
			return { success: false, error: 'El nombre no puede estar vacío' };
		}

		if (data.name !== undefined && data.name.length > 100) {
			return { success: false, error: 'El nombre no puede tener más de 100 caracteres' };
		}

		if (data.description !== undefined && data.description && data.description.length > 1000) {
			return { success: false, error: 'La descripción no puede tener más de 1000 caracteres' };
		}

		if (data.level !== undefined && data.level < 0) {
			return { success: false, error: 'El nivel no puede ser negativo' };
		}

		return { success: true, data };
	} catch (error) {
		if (error instanceof Error) {
			return { success: false, error: error.message };
		}
		return { success: false, error: 'Datos de actualización de personaje inválidos' };
	}
}

/**
 * Valida un nombre de personaje
 * @param name Nombre a validar
 * @returns true si es válido, false si no lo es
 */
export function isValidCharacterName(name: string): boolean {
	return (
		typeof name === 'string' && name.trim().length > 0 && name.length <= 100 && !/[<>:"/\\|?*]/.test(name) // No caracteres especiales
	);
}

/**
 * Valida una clase de personaje
 * @param characterClass Clase a validar
 * @returns true si es válido, false si no lo es
 */
export function isValidCharacterClass(characterClass: string): boolean {
	const validClasses = ['warrior', 'mage', 'rogue', 'healer', 'archer', 'paladin', 'necromancer', 'berserker', 'other'];
	return validClasses.includes(characterClass.toLowerCase());
}

/**
 * Normaliza los datos de filtros para garantizar valores por defecto
 * @param filters Filtros a normalizar
 * @returns Filtros normalizados
 */
export function normalizeCharacterFilters(filters: {
	searchQuery?: string;
	categories?: string[];
	classes?: string[];
	races?: string[];
	alignments?: string[];
	minLevel?: number;
	maxLevel?: number;
	isFavorite?: boolean;
	startDate?: Date | string;
	endDate?: Date | string;
	limit?: number;
	offset?: number;
}): Required<typeof filters> {
	return {
		searchQuery: filters.searchQuery || '',
		categories: filters.categories || [],
		classes: filters.classes || [],
		races: filters.races || [],
		alignments: filters.alignments || [],
		minLevel: Math.max(filters.minLevel || 0, 0),
		maxLevel: filters.maxLevel || Number.MAX_SAFE_INTEGER,
		isFavorite: filters.isFavorite ?? false,
		startDate: filters.startDate || new Date(0),
		endDate: filters.endDate || new Date(),
		limit: Math.min(filters.limit || 20, 100), // Máximo 100
		offset: Math.max(filters.offset || 0, 0), // Mínimo 0
	};
}
