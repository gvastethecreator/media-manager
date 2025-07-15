/**
 * @file Transformador principal para la entidad Character
 * @module transformers/character/transformer
 * @description Contiene la lógica para convertir un objeto Character de Drizzle a nuestros tipos canónicos.
 
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { CharacterWithStats } from '@/types/entities/character';

// Tipos locales equivalentes a Drizzle
type DrizzleCharacterWithCounts = {
	id: string;
	name: string;
	emoji: string;
	color: string;
	level: number;
	class: string;
	race: string;
	alignment: string;
	backstory: string;
	stats: string;
	psychologicalProfile: string;
	socialProfile: string;
	relationships: string;
	goals: string;
	fears: string;
	beliefs: string;
	personality: string;
	skills: string;
	abilities: string;
	sortBy: string;
	filters: string;
	isFavorite: boolean;
	createdAt: Date;
	updatedAt: Date;
	notes?: any[];
	_count?: {
		images?: number;
		videos?: number;
		tags?: number;
		groups?: number;
		properties?: number;
		collections?: number;
		albums?: number;
		places?: number;
		worldItems?: number;
		concepts?: number;
		prompts?: number;
		notes?: number;
		wildcards?: number;
		relatedCharacters?: number;
		relatedTo?: number;
	};
};

type DrizzleCharacterCreateInput = {
	name: string;
	emoji: string;
	color: string;
	level: number;
	class: string;
	race: string;
	alignment: string;
	backstory: string;
	stats: string;
	psychologicalProfile: string;
	socialProfile: string;
	relationships: string;
	goals: string;
	fears: string;
	beliefs: string;
	personality: string;
	skills: string;
	abilities: string;
	sortBy: string;
	filters: string;
	isFavorite: boolean;
};

type DrizzleCharacterUpdateInput = Partial<Omit<DrizzleCharacterCreateInput, 'id'>>;

const logger = serverLogger.withContext('CharacterTransformer');

/**
 * 🔄 Transforma un Character de Drizzle a CharacterWithStats (optimizado).
 * ✅ MIGRADO A DRIZZLE
 *
 * @param drizzleCharacter - Character de Drizzle con conteos
 * @returns CharacterWithStats con estadísticas pre-calculadas
 */
export function fromDrizzleCharacter(drizzleCharacter: DrizzleCharacterWithCounts | null): CharacterWithStats | null {
	if (!drizzleCharacter) {
		return null;
	}

	try {
		const { _count, ...baseData } = drizzleCharacter;
		const now = new Date();

		// Calcular totales desde los conteos
		const totalImages = _count?.images ?? 0;
		const totalVideos = _count?.videos ?? 0;
		const totalTags = _count?.tags ?? 0;
		const totalGroups = _count?.groups ?? 0;
		const totalProperties = _count?.properties ?? 0;
		const totalCollections = _count?.collections ?? 0;
		const totalAlbums = _count?.albums ?? 0;
		const totalPlaces = _count?.places ?? 0;
		const totalWorldItems = _count?.worldItems ?? 0;
		const totalConcepts = _count?.concepts ?? 0;
		const totalPrompts = _count?.prompts ?? 0;
		const totalNotes = _count?.notes ?? 0;
		const totalWildcards = _count?.wildcards ?? 0;
		const totalRelatedCharacters = _count?.relatedCharacters ?? 0;
		const totalRelatedTo = _count?.relatedTo ?? 0;

		const totalAssociations =
			totalImages +
			totalVideos +
			totalTags +
			totalGroups +
			totalProperties +
			totalCollections +
			totalAlbums +
			totalPlaces +
			totalWorldItems +
			totalConcepts +
			totalPrompts +
			totalNotes +
			totalWildcards +
			totalRelatedCharacters +
			totalRelatedTo;

		// Calcular power level basado en nivel y asociaciones
		const powerLevel = calculatePowerLevel(baseData.level, totalAssociations);

		// Determinar rareza basada en power level y nivel
		const rarityLevel = determineRarityLevel(baseData.level, powerLevel, totalAssociations);

		return {
			...baseData,
			// Asegurar campos JSON como strings
			stats: baseData.stats || '{}',
			skills: baseData.skills || '[]',
			relationships: baseData.relationships || '[]',
			goals: baseData.goals || '[]',
			fears: baseData.fears || '[]',
			beliefs: baseData.beliefs || '[]',
			personality: baseData.personality || '[]',
			abilities: baseData.abilities || '[]',
			filters: baseData.filters || '[]',
			psychologicalProfile: baseData.psychologicalProfile || '',
			socialProfile: baseData.socialProfile || '',
			notes: baseData.notes || [], // Simplificado para evitar dependencias

			// Conteos originales para compatibilidad
			_count,

			// Estadísticas pre-calculadas optimizadas
			statistics: {
				totalImages,
				totalVideos,
				totalTags,
				totalGroups,
				totalProperties,
				totalCollections,
				totalAlbums,
				totalPlaces,
				totalWorldItems,
				totalConcepts,
				totalPrompts,
				totalNotes,
				totalWildcards,
				totalRelatedCharacters,
				totalRelatedTo,
				totalAssociations,
				lastUpdated: now,
				powerLevel,
				rarityLevel,
			},
		};
	} catch (error) {
		logger.error('Error al transformar personaje de Drizzle', { error, characterId: drizzleCharacter?.id });
		return null;
	}
}

/**
 * 🔄 Transforma una lista de personajes de Drizzle a CharacterWithStats.
 * ✅ MIGRADO A DRIZZLE
 *
 * @param drizzleCharacters - Array de personajes de Drizzle
 * @returns Array de CharacterWithStats
 */
export function fromDrizzleCharacters(drizzleCharacters: DrizzleCharacterWithCounts[]): CharacterWithStats[] {
	return drizzleCharacters.map(fromDrizzleCharacter).filter((c): c is CharacterWithStats => c !== null);
}

/**
 * 🔄 Convierte CharacterWithStats a datos para Drizzle (create).
 * ✅ MIGRADO A DRIZZLE
 *
 * @param character - Character con estadísticas
 * @returns Datos preparados para Drizzle character create
 */
export function toDrizzleCharacterCreate(character: Partial<CharacterWithStats>): DrizzleCharacterCreateInput {
	const {
		id, // Omitir ID en create
		_count, // Omitir conteos calculados
		statistics, // Omitir estadísticas calculadas
		createdAt, // Omitir timestamps
		updatedAt,
		...baseData
	} = character;

	return {
		...baseData,
		// Asegurar campos requeridos con defaults
		name: baseData.name || 'Nuevo Personaje',
		emoji: baseData.emoji || '👤',
		color: baseData.color || '#CCCCCC',
		level: baseData.level || 1,
		class: baseData.class || 'warrior',
		race: baseData.race || 'human',
		alignment: baseData.alignment || 'true neutral',
		backstory: baseData.backstory || '',
		stats: baseData.stats || '{}',
		psychologicalProfile: baseData.psychologicalProfile || '',
		socialProfile: baseData.socialProfile || '',
		relationships: baseData.relationships || '[]',
		goals: baseData.goals || '[]',
		fears: baseData.fears || '[]',
		beliefs: baseData.beliefs || '[]',
		personality: baseData.personality || '[]',
		skills: baseData.skills || '[]',
		abilities: baseData.abilities || '[]',
		sortBy: baseData.sortBy || '',
		filters: baseData.filters || '[]',
		isFavorite: baseData.isFavorite || false,
	};
}

/**
 * 🔄 Convierte CharacterWithStats a datos para Drizzle (update).
 * ✅ MIGRADO A DRIZZLE
 *
 * @param character - Character con estadísticas parcial
 * @returns Datos preparados para Drizzle character update
 */
export function toDrizzleCharacterUpdate(character: Partial<CharacterWithStats>): DrizzleCharacterUpdateInput {
	const {
		id, // Omitir ID en update
		_count, // Omitir conteos calculados
		statistics, // Omitir estadísticas calculadas
		createdAt, // Omitir createdAt
		...updateData
	} = character;

	return updateData;
}

/**
 * 📊 Calcula el power level de un personaje basado en nivel y asociaciones.
 * ✅ MIGRADO A DRIZZLE
 *
 * @param level - Nivel del personaje
 * @param totalAssociations - Total de asociaciones
 * @returns Power level calculado
 */
function calculatePowerLevel(level: number, totalAssociations: number): number {
	// Fórmula: nivel base + bonificación por asociaciones + multiplicador por nivel alto
	const baseLevel = level * 10;
	const associationBonus = Math.floor(totalAssociations * 2);
	const highLevelMultiplier = level > 10 ? Math.floor((level - 10) * 5) : 0;

	return baseLevel + associationBonus + highLevelMultiplier;
}

/**
 * 🎭 Determina el nivel de rareza basado en power level y métricas.
 * ✅ MIGRADO A DRIZZLE
 *
 * @param level - Nivel del personaje
 * @param powerLevel - Power level calculado
 * @param totalAssociations - Total de asociaciones
 * @returns Nivel de rareza
 */
function determineRarityLevel(
	level: number,
	powerLevel: number,
	totalAssociations: number
): 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' {
	if (level >= 20 || powerLevel >= 500 || totalAssociations >= 100) {
		return 'legendary';
	}
	if (level >= 15 || powerLevel >= 300 || totalAssociations >= 50) {
		return 'epic';
	}
	if (level >= 10 || powerLevel >= 200 || totalAssociations >= 25) {
		return 'rare';
	}
	if (level >= 5 || powerLevel >= 100 || totalAssociations >= 10) {
		return 'uncommon';
	}
	return 'common';
}
