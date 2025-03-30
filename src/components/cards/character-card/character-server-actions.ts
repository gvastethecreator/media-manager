'use server';

import { getPrismaClient } from '@/lib/db';
import type { Character } from '@/types/entities/character';

export interface CharacterCardData extends Character {
	_count: {
		images: number;
		videos: number;
		collections: number;
		tags: number;
		places: number;
		worldItems: number;
		concepts: number;
		prompts: number;
		notes: number;
		wildcards: number;
		properties: number;
		groups: number;
		relatedCharacters: number;
		relatedTo: number;
	};
	recentImages?: string[];
	recentVideos?: string[];
	totalSize?: number;
	// Campos parseados para mejor visualización en la UI
	parsedStats?: Record<string, number>;
	parsedRelationships?: Array<{id?: string; name: string; type: string; description?: string}>;
	parsedGoals?: string[];
	parsedFears?: string[];
	parsedBeliefs?: string[];
	parsedPersonality?: string[];
	parsedSkills?: string[];
	parsedAbilities?: string[];
	// Metadatos adicionales
	metadata?: {
		power: number; // Poder de la carta calculado en base a nivel y estadísticas
		rarityLevel: 'Common' | 'Uncommon' | 'Rare' | 'Mythic';
		cardId: string; // ID único para la carta estilo TCG
		healthPoints?: number;
		manaPoints?: number;
		totalAttacks?: number;
	};
}

/**
 * Obtiene los datos de un personaje para mostrar en una tarjeta
 */
export async function getCharacterCardData(
	characterId: string,
	includeRelated = false
): Promise<CharacterCardData> {
	const prisma = await getPrismaClient();

	const character = await prisma.character.findUnique({
		where: {
			id: characterId,
		},
		include: {
			_count: {
				select: {
					images: true,
					videos: true,
					collections: true,
					tags: true,
					places: true,
					worldItems: true,
					concepts: true,
					prompts: true,
					notes: true,
					wildcards: true,
					properties: true,
					groups: true,
					relatedCharacters: true,
					relatedTo: true,
				},
			},
			...(includeRelated ? {
				// Incluir relaciones directas si se solicitan
				relatedCharacters: {
					select: {
						id: true,
						name: true,
						emoji: true,
						color: true,
					},
					take: 5,
				},
				// Añadir otras relaciones relevantes
				tags: {
					select: {
						id: true,
						name: true,
						color: true,
					},
					take: 5,
				},
			} : {}),
		},
	});

	if (!character) {
		throw new Error(`Personaje no encontrado: ${characterId}`);
	}

	// Obtener imágenes recientes relacionadas con este personaje
	const recentImages = await prisma.image.findMany({
		where: {
			characters: {
				some: {
					id: characterId,
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
		take: 6,
	});

	const recentImagePaths = recentImages.map((img: { id: string }) => {
		// Convertir la ruta del sistema a una URL para el navegador
		const imagePath = `/api/thumbnails/${img.id}`;
		return imagePath;
	});

	// Obtener videos recientes relacionados con este personaje
	const recentVideos = await prisma.video.findMany({
		where: {
			characters: {
				some: {
					id: characterId,
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
		take: 3,
	});

	const recentVideoPaths = recentVideos.map((video: { id: string }) => {
		// Convertir la ruta del sistema a una URL para el navegador
		const videoPath = `/api/video-thumbnails/${video.id}`;
		return videoPath;
	});

	// Parsear campos serializados como JSON
	const parsedStats = parseJsonField(character.stats);
	const parsedRelationships = parseJsonField(character.relationships);
	const parsedGoals = parseJsonField(character.goals);
	const parsedFears = parseJsonField(character.fears);
	const parsedBeliefs = parseJsonField(character.beliefs);
	const parsedPersonality = parseJsonField(character.personality);
	const parsedSkills = parseJsonField(character.skills);
	const parsedAbilities = parseJsonField(character.abilities);

	// Calcular metadatos para la tarjeta TCG
	const power = calculateCharacterPower(character.level, parsedStats);
	const rarityLevel = determineRarityLevel(character.level, power, parsedSkills?.length || 0, parsedAbilities?.length || 0);
	const metadata = {
		power,
		rarityLevel,
		cardId: `C${character.id.substring(0, 6)}-${character.level}`, // ID de carta TCG
		healthPoints: calculateHealthPoints(parsedStats?.constitution || 10, character.level),
		manaPoints: calculateManaPoints(parsedStats?.intelligence || 10, character.level),
		totalAttacks: parsedAbilities?.length || 0,
	};

	return {
		...character,
		recentImages: recentImagePaths,
		recentVideos: recentVideoPaths,
		parsedStats,
		parsedRelationships,
		parsedGoals,
		parsedFears,
		parsedBeliefs,
		parsedPersonality,
		parsedSkills,
		parsedAbilities,
		metadata,
	};
}

/**
 * Obtiene una lista de personajes para mostrar en una galería de tarjetas
 */
export async function getCharactersForCards(options: {
	limit?: number;
	category?: string;
	searchTerm?: string;
	orderBy?: 'name' | 'updatedAt' | 'createdAt' | 'level';
	orderDir?: 'asc' | 'desc';
	isFavorite?: boolean;
	includeStats?: boolean;
	class?: string;
	race?: string;
	minLevel?: number;
	maxLevel?: number;
}) {
	const {
		limit = 20,
		category,
		searchTerm,
		orderBy = 'updatedAt',
		orderDir = 'desc',
		isFavorite,
		includeStats = false,
		class: characterClass,
		race,
		minLevel,
		maxLevel,
	} = options;

	const prisma = await getPrismaClient();

	// Construir la consulta base
	const characters = await prisma.character.findMany({
		where: {
			...(category ? { category } : {}),
			...(isFavorite !== undefined ? { isFavorite } : {}),
			...(characterClass ? { class: characterClass } : {}),
			...(race ? { race } : {}),
			...(minLevel !== undefined ? { level: { gte: minLevel } } : {}),
			...(maxLevel !== undefined ? { level: { lte: maxLevel } } : {}),
			...(searchTerm
				? {
						OR: [
							{ name: { contains: searchTerm } },
							{ description: { contains: searchTerm } },
							{ class: { contains: searchTerm } },
							{ race: { contains: searchTerm } },
						],
				  }
				: {}),
		},
		include: {
			_count: {
				select: {
					images: true,
					videos: true,
					collections: true,
					tags: true,
					places: true,
					worldItems: true,
					concepts: true,
					prompts: true,
					notes: true,
					wildcards: true,
					properties: true,
					groups: true,
					relatedCharacters: true,
					relatedTo: true,
				},
			},
		},
		orderBy: {
			[orderBy]: orderDir,
		},
		take: limit,
	});

	// Si se solicitan estadísticas adicionales, procesarlas para cada personaje
	if (includeStats) {
		const charactersWithStats = await Promise.all(
			characters.map(async (character) => {
				// Obtener imágenes y videos recientes
				const recentMedia = await getRecentCharacterMedia(character.id, 4);
				const recentImagePaths = recentMedia
					.filter(media => !media.isVideo)
					.map(media => media.thumbnailUrl);
				const recentVideoPaths = recentMedia
					.filter(media => media.isVideo)
					.map(media => media.thumbnailUrl);

				// Parsear campos serializados como JSON
				const parsedStats = parseJsonField(character.stats);
				const parsedRelationships = parseJsonField(character.relationships);
				const parsedGoals = parseJsonField(character.goals);
				const parsedFears = parseJsonField(character.fears);
				const parsedBeliefs = parseJsonField(character.beliefs);
				const parsedPersonality = parseJsonField(character.personality);
				const parsedSkills = parseJsonField(character.skills);
				const parsedAbilities = parseJsonField(character.abilities);

				// Calcular metadatos para TCG
				const power = calculateCharacterPower(character.level, parsedStats);
				const rarityLevel = determineRarityLevel(character.level, power, parsedSkills?.length || 0, parsedAbilities?.length || 0);
				const metadata = {
					power,
					rarityLevel,
					cardId: `C${character.id.substring(0, 6)}-${character.level}`,
					healthPoints: calculateHealthPoints(parsedStats?.constitution || 10, character.level),
					manaPoints: calculateManaPoints(parsedStats?.intelligence || 10, character.level),
					totalAttacks: parsedAbilities?.length || 0,
				};

				return {
					...character,
					recentImages: recentImagePaths,
					recentVideos: recentVideoPaths,
					parsedStats,
					parsedRelationships,
					parsedGoals,
					parsedFears,
					parsedBeliefs,
					parsedPersonality,
					parsedSkills,
					parsedAbilities,
					metadata,
				};
			})
		);

		return charactersWithStats;
	}

	return characters;
}

// Función auxiliar para parsear campos JSON
function parseJsonField(jsonStr: string): any {
	if (!jsonStr || jsonStr === 'empty_array') {
		return [];
	}

	try {
		return JSON.parse(jsonStr);
	} catch (error) {
		console.error('Error parsing JSON field:', error);
		return [];
	}
}

// Función para calcular el poder del personaje basado en nivel y estadísticas
function calculateCharacterPower(level: number, stats?: Record<string, number>): number {
	if (!stats) return level * 10;

	// Sumar todas las estadísticas y multiplicar por nivel para un poder base
	const totalStats = Object.values(stats).reduce((sum, stat) => sum + (stat || 0), 0);
	return Math.floor((totalStats / 6) * level * 1.5);
}

// Determinar el nivel de rareza de la carta basado en poder y habilidades
function determineRarityLevel(level: number, power: number, skillsCount: number, abilitiesCount: number): 'Common' | 'Uncommon' | 'Rare' | 'Mythic' {
	const totalScore = power + (skillsCount * 5) + (abilitiesCount * 10);

	if (totalScore > 300 || level >= 30) return 'Mythic';
	if (totalScore > 200 || level >= 20) return 'Rare';
	if (totalScore > 100 || level >= 10) return 'Uncommon';
	return 'Common';
}

// Calcular puntos de salud basados en constitución y nivel
function calculateHealthPoints(constitution: number, level: number): number {
	return constitution * 5 + (level * 10);
}

// Calcular puntos de maná basados en inteligencia y nivel
function calculateManaPoints(intelligence: number, level: number): number {
	return intelligence * 5 + (level * 5);
}

// Interfaz para las imágenes thumbnail
interface ThumbnailImage {
	id: string;
	name?: string | null;
	thumbnailUrl: string;
	url?: string;
	isVideo?: boolean;
}

/**
 * Obtiene las imágenes y videos recientes de un personaje para mostrar en la tarjeta
 */
export async function getRecentCharacterMedia(characterId: string, limit = 6): Promise<ThumbnailImage[]> {
	const prisma = await getPrismaClient();

	// Cargar imágenes recientes
	const recentImages = await prisma.image.findMany({
		where: {
			characters: {
				some: {
					id: characterId,
				},
			},
		},
		select: {
			id: true,
			name: true,
			path: true,
		},
		orderBy: {
			updatedAt: 'desc',
		},
		take: Math.ceil(limit / 2),
	});

	// Cargar videos recientes
	const recentVideos = await prisma.video.findMany({
		where: {
			characters: {
				some: {
					id: characterId,
				},
			},
		},
		select: {
			id: true,
			name: true,
			path: true,
		},
		orderBy: {
			updatedAt: 'desc',
		},
		take: Math.floor(limit / 2),
	});

	// Combinar y formatear los resultados
	const imageResults: ThumbnailImage[] = recentImages.map(img => ({
		id: img.id,
		name: img.name,
		thumbnailUrl: `/api/thumbnails/${img.id}`,
		url: `/api/images/${img.id}`,
		isVideo: false
	}));

	const videoResults: ThumbnailImage[] = recentVideos.map(video => ({
		id: video.id,
		name: video.name,
		thumbnailUrl: `/api/video-thumbnails/${video.id}`,
		url: `/api/videos/${video.id}`,
		isVideo: true
	}));

	// Combinar y ordenar por ID (como proxy de fecha)
	return [...imageResults, ...videoResults]
		.sort((a, b) => a.id > b.id ? -1 : 1)
		.slice(0, limit);
}

/**
 * Obtiene personajes relacionados con el personaje especificado
 */
export async function getRelatedCharacters(characterId: string, limit = 5): Promise<CharacterCardData[]> {
	const prisma = await getPrismaClient();

	// Obtener personajes directamente relacionados
	const relatedCharacters = await prisma.character.findMany({
		where: {
			OR: [
				{
					relatedCharacters: {
						some: {
							id: characterId
						}
					}
				},
				{
					relatedTo: {
						some: {
							id: characterId
						}
					}
				}
			]
		},
		include: {
			_count: {
				select: {
					images: true,
					videos: true,
					relatedCharacters: true,
					relatedTo: true,
				},
			},
		},
		take: limit,
	});

	// Procesar los personajes relacionados
	const processedCharacters = await Promise.all(
		relatedCharacters.map(async (character) => {
			// Parsear campos serializados
			const parsedStats = parseJsonField(character.stats);
			const parsedAbilities = parseJsonField(character.abilities);

			// Calcular metadatos básicos
			const power = calculateCharacterPower(character.level, parsedStats);
			const metadata = {
				power,
				rarityLevel: determineRarityLevel(character.level, power, 0, parsedAbilities?.length || 0),
				cardId: `C${character.id.substring(0, 6)}-${character.level}`,
			};

			return {
				...character,
				parsedStats,
				parsedAbilities,
				metadata,
			};
		})
	);

	return processedCharacters;
}