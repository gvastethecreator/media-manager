/**
 * @file Transformador principal para la entidad Character
 * @module transformers/character/transformer
 * @description Contiene la lógica para convertir un objeto Character de Drizzle a nuestros tipos canónicos.

 */

import { createDefaultEntityStats } from '@/lib/utils';
import { serverLogger } from '../../lib/logger/server-logger';
import type { CharacterAssociationStats, CharacterWithStats } from '../../types/entities/character';

// Tipos locales equivalentes a Drizzle
type DrizzleCharacterWithCounts = {
	id: string;
	name: string;
	description?: string | null;
	emoji?: string | null;
	color?: string | null;
	category?: string | null;

	isFavorite: boolean;
	totalImages?: number;
	totalVideos?: number;
	age?: string | null;
	gender?: string | null;
	species?: string | null;
	occupation?: string | null;
	personality?: string | null;
	background?: string | null;
	relationships?: string | null;
	skills?: string | null;
	equipment?: string | null;
	notes?: string | null;
	featuredImage?: string | null;
	parentId?: string | null;
	createdAt: Date;
	updatedAt: Date;
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
	description?: string | null;
	emoji?: string | null;
	color?: string | null;
	category?: string | null;
	isFavorite?: boolean;
	age?: string | null;
	gender?: string | null;
	species?: string | null;
	occupation?: string | null;
	personality?: string | null;
	background?: string | null;
	relationships?: string | null;
	skills?: string | null;
	equipment?: string | null;
	notes?: string | null;
	featuredImage?: string | null;
	parentId?: string | null;
};

type DrizzleCharacterUpdateInput = Partial<DrizzleCharacterCreateInput>;

const logger = serverLogger.withContext('CharacterTransformer');

/**
 * 🔄 Transforma un Character de Drizzle a CharacterWithStats (optimizado).
 * ✅ MIGRADO A DRIZZLE
 *
 * @param drizzleCharacter - Character de Drizzle con conteos
 * @returns CharacterWithStats con estadísticas pre-calculadas
 */
export function fromDrizzleCharacter(drizzleCharacter: DrizzleCharacterWithCounts): CharacterWithStats | null {
	try {
		if (!drizzleCharacter) {
			return null;
		}

		const now = new Date();
		const { _count, ...baseData } = drizzleCharacter;

		// Calcular totales desde los conteos (permitir _count undefined)
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

		// Calcular power level basado en asociaciones (sin nivel)
		const powerLevel = calculatePowerLevel(1, totalAssociations);

		// Determinar rareza basada en power level
		const rarityLevel = determineRarityLevel(1, powerLevel, totalAssociations);

		// Crear estadísticas
		const statistics: CharacterAssociationStats = {
			...createDefaultEntityStats({
				imageCount: totalImages,
				videoCount: totalVideos,
				tagCount: totalTags,
				groupCount: totalGroups,
				propertyCount: totalProperties,
				collectionCount: totalCollections,
				albumCount: totalAlbums,
				placeCount: totalPlaces,
				worldItemCount: totalWorldItems,
				conceptCount: totalConcepts,
				promptCount: totalPrompts,
				noteCount: totalNotes,
				wildcardCount: totalWildcards,
				totalItems: totalAssociations,
				type: 'character',
			}),
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
			isDirectory: false,
			isFile: true,
		};

		const result: CharacterWithStats = {
			id: baseData.id,
			name: baseData.name,
			description: baseData.description ?? null,
			emoji: baseData.emoji ?? '👤',
			color: baseData.color ?? null,
			category: baseData.category ?? null,
			isFavorite: baseData.isFavorite,
			age: baseData.age ?? null,
			gender: baseData.gender ?? null,
			species: baseData.species ?? null,
			occupation: baseData.occupation ?? null,
			personality: baseData.personality ?? null,
			background: baseData.background ?? null,
			relationships: baseData.relationships ?? null,
			skills: baseData.skills ?? null,
			equipment: baseData.equipment ?? null,
			notes: baseData.notes ?? null,
			featuredImage: baseData.featuredImage ?? null,
			parentId: baseData.parentId ?? null,
			createdAt: baseData.createdAt,
			updatedAt: baseData.updatedAt,
			// Conteos calculados para compatibilidad
			totalImages,
			totalVideos,
			_count: _count ?? {},
			// Tipo de entidad
			entityType: 'character' as const,
			// Estadísticas
			statistics,
			// Alias para compatibilidad
			stats: statistics,
		};

		return result;
	} catch (error) {
		console.error('❌ Error detallado en transformación:', error);
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
		// Asegurar campos requeridos con defaults
		name: baseData.name || 'Nuevo Personaje',
		description: baseData.description || null,
		emoji: baseData.emoji || '👤',
		color: baseData.color || '#CCCCCC',
		category: baseData.category || null,

		isFavorite: baseData.isFavorite,
		age: baseData.age || null,
		gender: baseData.gender || null,
		species: baseData.species || null,
		occupation: baseData.occupation || null,
		personality: baseData.personality || null,
		background: baseData.background || null,
		relationships: baseData.relationships || null,
		skills: baseData.skills || null,
		equipment: baseData.equipment || null,
		notes: baseData.notes || null,
		featuredImage: baseData.featuredImage || null,
		parentId: baseData.parentId || null,
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
