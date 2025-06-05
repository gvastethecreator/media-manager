'use server';

import { getPrismaClient } from '@/lib/db';
import type { Group } from '@/types/prisma';

export interface GroupCardData extends Group {
	_count: {
		images: number;
		videos: number;
		albums: number;
		collections: number;
		tags: number;
		characters: number;
		places: number;
		worldItems: number;
		concepts: number;
		prompts: number;
		notes: number;
		wildcards: number;
		properties: number;
	};
	recentImages?: string[];
	recentVideos?: string[];
	filters?: any[]; // Representación JSON de filters

	// Campos de metadatos para el TCG
	power: number;
	rarityLevel: number;
	hp: number;
	mp: number;
	organizationLevel: number;
	flexibilityScore: number;
	organizationType: string;
	cardId: string;
}

/**
 * Obtiene los datos de un grupo para mostrar en una tarjeta
 */
export async function getGroupCardData(groupId: string): Promise<GroupCardData> {
	const prisma = await getPrismaClient();

	const group = await prisma.group.findUnique({
		where: {
			id: groupId,
		},
		include: {
			_count: {
				select: {
					images: true,
					videos: true,
					albums: true,
					collections: true,
					tags: true,
					characters: true,
					places: true,
					worldItems: true,
					concepts: true,
					prompts: true,
					notes: true,
					wildcards: true,
					properties: true,
				},
			},
		},
	});

	if (!group) {
		throw new Error(`Grupo no encontrado: ${groupId}`);
	}

	// Obtener imágenes recientes relacionadas con este grupo
	const recentImages = await prisma.image.findMany({
		where: {
			groups: {
				some: {
					id: groupId,
				},
			},
		},
		select: {
			id: true,
			path: true,
			thumbnailWidth: true,
			thumbnailHeight: true,
		},
		orderBy: {
			updatedAt: 'desc',
		},
		take: 4,
	});

	const recentImagePaths = recentImages.map((img: { id: string }) => {
		// Convertir la ruta del sistema a una URL para el navegador
		const imagePath = `/api/thumbnails/${img.id}`;
		return imagePath;
	});

	// Obtener videos recientes relacionados con este grupo
	const recentVideos = await prisma.video.findMany({
		where: {
			groups: {
				some: {
					id: groupId,
				},
			},
		},
		select: {
			id: true,
			thumbnailPath: true,
		},
		orderBy: {
			updatedAt: 'desc',
		},
		take: 2,
	});

	const recentVideoPaths = recentVideos.map((video: { id: string; thumbnailPath: string | null }) => {
		if (!video.thumbnailPath) return `/api/thumbnails/${video.id}`;
		return `/api/thumbnails/${video.id}`;
	});

	// Intentar parsear el campo filters si existe
	let filters = [];
	if (typeof group.filters === 'string' && group.filters !== 'empty_array') {
		try {
			filters = JSON.parse(group.filters);
		} catch (e) {
			console.error('Error parsing group filters:', e);
		}
	}

	// Calcular metadatos TCG
	const totalEntities =
		group._count.images +
		group._count.videos +
		group._count.albums +
		group._count.collections +
		group._count.tags +
		group._count.characters +
		group._count.places +
		group._count.worldItems +
		group._count.concepts +
		group._count.prompts +
		group._count.notes +
		group._count.wildcards +
		group._count.properties;

	// Determinar nivel de rareza basado en el número de entidades y filtros
	const rarityLevel = calculateRarityLevel(totalEntities, filters.length);

	// Calcular puntos de poder
	const power = calculateGroupPower(group, totalEntities, filters.length);

	// Calcular puntos de salud basados en la diversidad de entidades
	const hp = calculateHealth(group._count);

	// Calcular puntos de maná (MP) basados en filtros y flexibilidad
	const mp = calculateMana(filters.length, group.category);

	// Calcular nivel de organización
	const organizationLevel = calculateOrganizationLevel(group._count);

	// Calcular puntaje de flexibilidad
	const flexibilityScore = calculateFlexibilityScore(filters);

	// Determinar tipo de organización
	const organizationType = determineOrganizationType(group._count);

	return {
		...group,
		recentImages: recentImagePaths,
		recentVideos: recentVideoPaths,
		filters,
		power,
		rarityLevel,
		hp,
		mp,
		organizationLevel,
		flexibilityScore,
		organizationType,
		cardId: `G-${group.id.substring(0, 8)}`,
	};
}

/**
 * Calcula el nivel de rareza del grupo basado en su contenido
 */
function calculateRarityLevel(totalEntities: number, filtersCount: number): number {
	// Base: 1-10, donde 10 es lo más raro
	let rarityScore = 1;

	// Factores que aumentan rareza:
	// 1. Gran cantidad de entidades
	if (totalEntities > 100) rarityScore += 3;
	else if (totalEntities > 50) rarityScore += 2;
	else if (totalEntities > 20) rarityScore += 1;

	// 2. Filtros complejos
	rarityScore += Math.min(3, Math.floor(filtersCount / 2));

	return Math.min(10, rarityScore);
}

/**
 * Calcula el poder de un grupo basado en sus atributos
 */
function calculateGroupPower(group: Group, totalEntities: number, filtersCount: number): number {
	// Base de poder
	let power = 50;

	// Bonificación por entidades
	power += totalEntities * 2;

	// Bonificación por filtros complejos
	power += filtersCount * 10;

	// Bonificación por ser favorito
	if (group.isFavorite) power += 25;

	// Limitar el poder máximo
	return Math.min(999, power);
}

/**
 * Calcula los puntos de salud basados en la diversidad de entidades
 */
function calculateHealth(counts: GroupCardData['_count']): number {
	// Base HP
	let hp = 100;

	// Contar tipos diferentes de entidades presentes
	const entityTypes = Object.entries(counts).filter(([_, count]) => count > 0).length;

	// Bonificación por diversidad
	hp += entityTypes * 20;

	// Bonificación por volumen total de entidades principales
	const mainEntities = counts.characters + counts.places + counts.worldItems + counts.concepts;
	hp += mainEntities * 5;

	return Math.min(999, hp);
}

/**
 * Calcula los puntos de maná basados en filtros y flexibilidad
 */
function calculateMana(filtersCount: number, category: string | null): number {
	// Base MP
	let mp = 60;

	// Bonificación por filtros (representa "opciones mágicas")
	mp += filtersCount * 15;

	// Bonificación por categoría especializada
	if (category && category !== 'general') {
		mp += 25;
	}

	return Math.min(999, mp);
}

/**
 * Calcula el nivel de organización del grupo
 */
function calculateOrganizationLevel(counts: GroupCardData['_count']): number {
	// Nivel básico: 1-10
	const totalAlbumCollections = counts.albums + counts.collections;
	const totalItems = counts.images + counts.videos;

	if (totalItems === 0) return 1;

	// Relación de organización: cuántos contenedores (albums/colecciones) por item
	const ratio = totalAlbumCollections / totalItems;

	// Convertir ratio a escala 1-10
	return Math.min(10, Math.max(1, Math.round(ratio * 20) + 1));
}

/**
 * Determina el tipo de organización basado en el tipo predominante de entidades
 */
function determineOrganizationType(counts: GroupCardData['_count']): string {
	const media = counts.images + counts.videos;
	const collections = counts.albums + counts.collections;
	const worldBuilding = counts.characters + counts.places + counts.worldItems + counts.concepts;
	const utility = counts.notes + counts.prompts + counts.wildcards + counts.properties;

	const max = Math.max(media, collections, worldBuilding, utility);

	if (max === media) return 'Archivo';
	if (max === collections) return 'Colección';
	if (max === worldBuilding) return 'Mundo';
	if (max === utility) return 'Utilidad';

	return 'Mixto';
}

/**
 * Calcula la flexibilidad basada en los filtros disponibles
 */
function calculateFlexibilityScore(filters: any[]): number {
	// Escala 1-10
	if (!filters.length) return 1;

	// Complejidad basada en número de filtros
	const baseScore = Math.min(10, filters.length + 1);

	return baseScore;
}

/**
 * Obtiene una lista de grupos para mostrar en una galería de tarjetas
 */
export async function getGroupsForCards(options: {
	limit?: number;
	category?: string;
	searchTerm?: string;
	orderBy?: 'name' | 'updatedAt' | 'createdAt';
	orderDir?: 'asc' | 'desc';
}) {
	const { limit = 20, category, searchTerm, orderBy = 'updatedAt', orderDir = 'desc' } = options;

	const prisma = await getPrismaClient();

	const groups = await prisma.group.findMany({
		where: {
			...(category ? { category } : {}),
			...(searchTerm
				? {
						OR: [{ name: { contains: searchTerm } }, { description: { contains: searchTerm } }],
					}
				: {}),
		},
		include: {
			_count: {
				select: {
					images: true,
					videos: true,
					albums: true,
					collections: true,
					tags: true,
					characters: true,
					places: true,
					worldItems: true,
					concepts: true,
					prompts: true,
					notes: true,
					wildcards: true,
					properties: true,
				},
			},
		},
		orderBy: {
			[orderBy]: orderDir,
		},
		take: limit,
	});

	return Promise.all(groups.map((group) => getGroupCardData(group.id)));
}
