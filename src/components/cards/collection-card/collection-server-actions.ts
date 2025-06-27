'use server';

import { getPrismaClient } from '@/lib/database/db';
import { serverLogger } from '@/lib/logger/server-logger';
import type { CollectionWithStats } from '@/types/entities/collection';

// Logger específico para acciones de CollectionCard
const collectionCardLogger = serverLogger.withContext('CollectionCardActions');

// Interfaz extendida para la tarjeta de colección
export interface CollectionCardData extends CollectionWithStats {
	recentImages?: string[];
	recentVideos?: string[];
	totalSize?: number;
	// Campos procesados para mejor visualización
	parsedEditions?: Array<{ id?: string; name: string; date?: string; version?: string }>;
	parsedFilters?: Array<{ field: string; operator: string; value: string }>;
	// Metadatos adicionales para visualización TCG
	metadata?: {
		rarityLevel: 'Common' | 'Uncommon' | 'Rare' | 'Mythic';
		cardId: string;
		totalItems: number;
	};
}

interface ThumbnailImage {
	id: string;
	name?: string | null;
	thumbnailUrl: string;
	url?: string;
}

interface ThumbnailMedia {
	id: string;
	name?: string | null;
	thumbnailUrl: string;
	url?: string;
	isVideo?: boolean;
}

/**
 * Obtiene las imágenes más recientes de una colección para mostrar en la tarjeta
 * @param collectionId ID de la colección
 * @returns Array de imágenes recientes (máximo 6)
 */
export async function getRecentCollectionImages(collectionId: string): Promise<ThumbnailImage[]> {
	try {
		collectionCardLogger.info('🖼️ Obteniendo imágenes recientes para CollectionCard:', collectionId);
		const prisma = await getPrismaClient();

		// Consultar imágenes de la colección ordenadas por fecha de creación descendente
		const images = await prisma.image.findMany({
			where: {
				collections: {
					some: {
						id: collectionId,
					},
				},
				thumbnail: { not: null }, // Solo imágenes con thumbnail
			},
			orderBy: [{ isFavorite: 'desc' }, { createdAt: 'desc' }],
			take: 6, // Tomar sólo las 6 más recientes para mostrar en la tarjeta
			select: {
				id: true,
				name: true,
				thumbnail: true,
				thumbnailWidth: true,
				thumbnailHeight: true,
				thumbnailSize: true,
			},
		});

		// Convertir los thumbnails a URLs de datos
		const thumbnails: ThumbnailImage[] = images.map((image: any) => {
			let thumbnailUrl = '';

			// Verificar si tenemos un thumbnail válido
			if (image.thumbnail && image.thumbnailSize && image.thumbnailSize < 100000) {
				thumbnailUrl = `data:image/jpeg;base64,${Buffer.from(image.thumbnail).toString('base64')}`;
			}

			return {
				id: image.id,
				name: image.name,
				thumbnailUrl,
				url: `/dashboard/images/${image.id}`,
			};
		});

		collectionCardLogger.info('✅ Imágenes obtenidas para CollectionCard:', thumbnails.length);
		return thumbnails;
	} catch (error) {
		collectionCardLogger.error('❌ Error obteniendo imágenes para CollectionCard:', error);
		// Devolvemos array vacío en caso de error en lugar de lanzar una excepción
		return [];
	}
}

/**
 * Obtiene una colección completa con todas sus relaciones para la tarjeta
 * @param collectionId ID de la colección
 * @returns Objeto completo de colección con relaciones
 */
export async function getCollectionForCard(collectionId: string): Promise<CollectionWithStats> {
	try {
		collectionCardLogger.info('📁 Obteniendo colección completa para CollectionCard:', collectionId);
		const prisma = await getPrismaClient();

		// Verificar que el ID es válido
		if (!collectionId) {
			throw new Error('ID de colección no proporcionado');
		}

		// Obtener la colección con todas sus relaciones relevantes
		const collection = await prisma.collection.findUnique({
			where: {
				id: collectionId,
			},
			include: {
				_count: {
					select: {
						images: true,
						videos: true,
						albums: true,
						tags: true,
						characters: true,
						places: true,
						worldItems: true,
						concepts: true,
						prompts: true,
						notes: true,
						wildcards: true,
						properties: true,
						groups: true,
					},
				},
			},
		});

		if (!collection) {
			throw new Error(`Colección no encontrada: ${collectionId}`);
		}

		collectionCardLogger.info('✅ Colección obtenida para CollectionCard');

		// Convertir a tipo CollectionWithStats
		return collection as unknown as CollectionWithStats;
	} catch (error) {
		collectionCardLogger.error('❌ Error obteniendo colección completa para CollectionCard:', error);
		throw new Error(`No se pudo obtener la colección: ${error instanceof Error ? error.message : 'Error desconocido'}`);
	}
}

/**
 * Obtiene los datos de una colección para mostrar en una tarjeta
 */
export async function getCollectionCardData(collectionId: string, includeRelated = false): Promise<CollectionCardData> {
	const prisma = await getPrismaClient();

	const collection = await prisma.collection.findUnique({
		where: {
			id: collectionId,
		},
		include: {
			_count: {
				select: {
					images: true,
					videos: true,
					albums: true,
					tags: true,
					characters: true,
					places: true,
					worldItems: true,
					concepts: true,
					prompts: true,
					notes: true,
					wildcards: true,
					properties: true,
					groups: true,
				},
			},
			...(includeRelated
				? {
						// Incluir relaciones directas si se solicitan
						tags: {
							select: {
								id: true,
								name: true,
								color: true,
							},
							take: 5,
						},
						// Otras relaciones relevantes
						characters: {
							select: {
								id: true,
								name: true,
								emoji: true,
							},
							take: 3,
						},
					}
				: {}),
		},
	});

	if (!collection) {
		throw new Error(`Colección no encontrada: ${collectionId}`);
	}

	// Obtener imágenes recientes relacionadas con esta colección
	const recentImages = await prisma.image.findMany({
		where: {
			collections: {
				some: {
					id: collectionId,
				},
			},
		},
		select: {
			id: true,
			path: true,
		},
		orderBy: {
			updatedAt: 'desc',
		},
		take: 4,
	});

	const recentImagePaths = recentImages.map((img: any) => {
		// Convertir la ruta del sistema a una URL para el navegador
		const imagePath = `/api/thumbnails/${img.id}`;
		return imagePath;
	});

	// Obtener videos recientes relacionados con esta colección
	const recentVideos = await prisma.video.findMany({
		where: {
			collections: {
				some: {
					id: collectionId,
				},
			},
		},
		select: {
			id: true,
			path: true,
		},
		orderBy: {
			updatedAt: 'desc',
		},
		take: 2,
	});

	const recentVideoPaths = recentVideos.map((video: any) => {
		// Convertir la ruta del sistema a una URL para el navegador
		const videoPath = `/api/video-thumbnails/${video.id}`;
		return videoPath;
	});

	// Parsear campos serializados como JSON
	const parsedFilters = parseJsonField(collection.filters);
	const parsedEditions = parseJsonField(collection.editions);

	// Determinar el nivel de rareza basado en el número total de items
	const totalItems = collection._count?.images || 0 + (collection._count?.videos || 0);
	const rarityLevel = determineRarityLevel(totalItems);

	// Crear metadatos adicionales
	const metadata = {
		rarityLevel,
		cardId: `C${collection.id.substring(0, 6)}`,
		totalItems,
	};

	const { filters, editions, ...restOfCollection } = collection;

	return {
		...restOfCollection,
		filters: parsedFilters,
		editions: parsedEditions,
		recentImages: recentImagePaths,
		recentVideos: [], // Placeholder, no se están obteniendo videos
		metadata,
	};
}

/**
 * Obtiene una lista de colecciones para mostrar en una galería de tarjetas
 */
export async function getCollectionsForCards(options: {
	limit?: number;
	category?: string;
	searchTerm?: string;
	orderBy?: 'name' | 'updatedAt' | 'createdAt';
	orderDir?: 'asc' | 'desc';
	isFavorite?: boolean;
	platform?: string;
	includeStats?: boolean;
}) {
	const {
		limit = 20,
		category,
		searchTerm,
		orderBy = 'updatedAt',
		orderDir = 'desc',
		isFavorite,
		platform,
		includeStats = false,
	} = options;

	const prisma = await getPrismaClient();

	// Construir la consulta base
	const collections = await prisma.collection.findMany({
		where: {
			...(category ? { category } : {}),
			...(isFavorite !== undefined ? { isFavorite } : {}),
			...(platform ? { platform } : {}),
			...(searchTerm
				? {
						OR: [
							{ name: { contains: searchTerm } },
							{ description: { contains: searchTerm } },
							{ platform: { contains: searchTerm } },
							{ network: { contains: searchTerm } },
						],
					}
				: {}),
		},
		include: {
			_count: {
				select: {
					images: true,
					videos: true,
					albums: true,
					tags: true,
					characters: true,
					places: true,
					worldItems: true,
					concepts: true,
					prompts: true,
					notes: true,
					wildcards: true,
					properties: true,
					groups: true,
				},
			},
		},
		orderBy: {
			[orderBy]: orderDir,
		},
		take: limit,
	});

	// Si se solicitan estadísticas adicionales, procesarlas para cada colección
	if (includeStats) {
		const collectionsWithStats = await Promise.all(
			collections.map(async (collection: any) => {
				// Obtener imágenes y videos recientes
				const recentMedia = await getRecentCollectionMedia(collection.id, 4);
				const recentImagePaths = recentMedia.filter((media) => !media.isVideo).map((media) => media.thumbnailUrl);
				const recentVideoPaths = recentMedia.filter((media) => media.isVideo).map((media) => media.thumbnailUrl);

				// Parsear campos serializados como JSON
				const parsedEditions = parseJsonField(collection.editions);
				const parsedFilters = parseJsonField(collection.filters);

				// Calcular nivel de rareza
				const totalRelatedItems =
					(collection._count.images || 0) + (collection._count.videos || 0) + (collection._count.characters || 0);

				const rarityLevel = determineRarityLevel(totalRelatedItems);

				// Generar metadata para visualización tipo TCG
				const metadata = {
					rarityLevel,
					cardId: `COL-${collection.id.substring(0, 6)}`,
					totalItems: totalRelatedItems,
				};

				return {
					...collection,
					recentImages: recentImagePaths,
					recentVideos: recentVideoPaths,
					parsedEditions,
					parsedFilters,
					metadata,
				};
			})
		);

		return collectionsWithStats;
	}

	return collections;
}

/**
 * Obtiene las imágenes y videos más recientes de una colección para mostrar en la tarjeta
 */
export async function getRecentCollectionMedia(collectionId: string, limit = 6): Promise<ThumbnailMedia[]> {
	const prisma = await getPrismaClient();

	// Cargar imágenes recientes
	const recentImages = await prisma.image.findMany({
		where: {
			collections: {
				some: {
					id: collectionId,
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
		take: Math.ceil(limit * 0.7), // 70% del límite para imágenes
	});

	// Cargar videos recientes
	const recentVideos = await prisma.video.findMany({
		where: {
			collections: {
				some: {
					id: collectionId,
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
		take: Math.ceil(limit * 0.3), // 30% del límite para videos
	});

	// Combinar y formatear los resultados
	const imageResults: ThumbnailMedia[] = recentImages.map((img: any) => ({
		id: img.id,
		name: img.name,
		thumbnailUrl: `/api/thumbnails/${img.id}`,
		url: `/api/images/${img.id}`,
		isVideo: false,
	}));

	const videoResults: ThumbnailMedia[] = recentVideos.map((video: any) => ({
		id: video.id,
		name: video.name,
		thumbnailUrl: `/api/video-thumbnails/${video.id}`,
		url: `/api/videos/${video.id}`,
		isVideo: true,
	}));

	// Combinar y ordenar por ID (como proxy de fecha)
	return [...imageResults, ...videoResults].sort((a, b) => (a.id > b.id ? -1 : 1)).slice(0, limit);
}

// Función para determinar el nivel de rareza basado en el número total de elementos relacionados
function determineRarityLevel(totalItems: number): 'Common' | 'Uncommon' | 'Rare' | 'Mythic' {
	if (totalItems > 100) return 'Mythic';
	if (totalItems > 50) return 'Rare';
	if (totalItems > 20) return 'Uncommon';
	return 'Common';
}

// Función auxiliar para parsear campos JSON
function parseJsonField(jsonStr: string | any): any {
	// Si no es un string o es 'empty_array', devolver array vacío
	if (typeof jsonStr !== 'string' || jsonStr === 'empty_array') {
		return [];
	}

	try {
		return JSON.parse(jsonStr);
	} catch (error) {
		console.error('Error parsing JSON field:', error);
		return [];
	}
}
