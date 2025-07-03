/**
 * @file Transformador principal para la entidad Character
 * @module transformers/character/transformer
 * @description Contiene la lógica para convertir un objeto Character de Prisma a nuestros tipos canónicos.
 */

import type { Prisma } from '@prisma/client';
import { serverLogger } from '@/lib/logger/server-logger';
import type { CharacterWithStats, PrismaCharacterWithCounts } from '@/types/entities/character';

const logger = serverLogger.withContext('CharacterTransformer');

/**
 * 🔄 Transforma un Character de Prisma a CharacterWithStats (optimizado).
 *
 * @param prismaCharacter - Character de Prisma con conteos
 * @returns CharacterWithStats con estadísticas pre-calculadas
 */
export function fromPrismaCharacter(prismaCharacter: PrismaCharacterWithCounts | null): CharacterWithStats | null {
	if (!prismaCharacter) {
		return null;
	}

	try {
		const { _count, ...baseData } = prismaCharacter;
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
			notes: baseData.notes?.map(fromPrismaNote).filter((n): n is any => n !== null) || [],

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
		logger.error('Error al transformar personaje de Prisma', { error, characterId: prismaCharacter?.id });
		return null;
	}
}

/**
 * 🔄 Transforma una lista de personajes de Prisma a CharacterWithStats.
 *
 * @param prismaCharacters - Array de personajes de Prisma
 * @returns Array de CharacterWithStats
 */
export function fromPrismaCharacters(prismaCharacters: PrismaCharacterWithCounts[]): CharacterWithStats[] {
	return prismaCharacters.map(fromPrismaCharacter).filter((c): c is CharacterWithStats => c !== null);
}

/**
 * 🔄 Convierte CharacterWithStats a datos para Prisma (create).
 *
 * @param character - Character con estadísticas
 * @returns Datos preparados para Prisma.character.create()
 */
export function toPrismaCharacterCreate(character: Partial<CharacterWithStats>): Prisma.CharacterCreateInput {
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
 * 🔄 Convierte CharacterWithStats a datos para Prisma (update).
 *
 * @param character - Character con estadísticas parcial
 * @returns Datos preparados para Prisma.character.update()
 */
export function toPrismaCharacterUpdate(character: Partial<CharacterWithStats>): Prisma.CharacterUpdateInput {
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
