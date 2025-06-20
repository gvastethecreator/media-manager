'use server';

import { getPrismaClient } from '@/lib/db';
import { serverLogger } from '@/lib/logger/server-logger';
import { toServiceError } from '@/utils/errors/service-errors';

const SERVER_ACTION_NAME = 'ImagesRandom';
const randomImageLogger = serverLogger.withContext(SERVER_ACTION_NAME);

export interface RandomImage {
	id: string;
	path: string;
	thumbnail?: string | null;
	width?: number;
	height?: number;
}

// Tipo para los datos que vienen directamente de Prisma
interface ImageData {
	id: string;
	path: string;
	thumbnail: Buffer | null;
	width: number | null;
	height: number | null;
}

/**
 * Obtiene imágenes aleatorias de la base de datos según el tipo de entidad
 * @param entityType Tipo de entidad para la que se quieren obtener imágenes
 * @param count Número de imágenes a obtener
 */
export async function getRandomImagesForEntity(
	entityType: string,
	count = 6
): Promise<{ success: boolean; data?: RandomImage[]; message?: string }> {
	try {
		const prisma = await getPrismaClient();
		let imagesData: ImageData[] = [];

		// Obtener imágenes según el tipo de entidad
		switch (entityType) {
			case 'album': {
				// Buscar imágenes de un álbum aleatorio
				const randomAlbum = await prisma.album.findFirst({
					select: { id: true },
					orderBy: { updatedAt: 'desc' },
					take: 1,
				});

				if (randomAlbum) {
					imagesData = (await prisma.image.findMany({
						where: { albums: { some: { id: randomAlbum.id } } },
						select: {
							id: true,
							path: true,
							thumbnail: true,
							width: true,
							height: true,
						},
						take: count,
						orderBy: { updatedAt: 'desc' },
					})) as unknown as ImageData[];
				}
				break;
			}

			case 'collection': {
				// Buscar imágenes de una colección aleatoria
				const randomCollection = await prisma.collection.findFirst({
					select: { id: true },
					orderBy: { updatedAt: 'desc' },
					take: 1,
				});

				if (randomCollection) {
					imagesData = (await prisma.image.findMany({
						where: { collections: { some: { id: randomCollection.id } } },
						select: {
							id: true,
							path: true,
							thumbnail: true,
							width: true,
							height: true,
						},
						take: count,
						orderBy: { updatedAt: 'desc' },
					})) as unknown as ImageData[];
				}
				break;
			}

			case 'tag': {
				// Buscar imágenes de una etiqueta aleatoria
				const randomTag = await prisma.tag.findFirst({
					select: { id: true },
					orderBy: { updatedAt: 'desc' },
					take: 1,
				});

				if (randomTag) {
					imagesData = (await prisma.image.findMany({
						where: { tags: { some: { id: randomTag.id } } },
						select: {
							id: true,
							path: true,
							thumbnail: true,
							width: true,
							height: true,
						},
						take: count,
						orderBy: { updatedAt: 'desc' },
					})) as unknown as ImageData[];
				}
				break;
			}

			case 'character': {
				// Buscar imágenes de un personaje aleatorio
				const randomCharacter = await prisma.character.findFirst({
					select: { id: true },
					orderBy: { updatedAt: 'desc' },
					take: 1,
				});

				if (randomCharacter) {
					imagesData = (await prisma.image.findMany({
						where: { characters: { some: { id: randomCharacter.id } } },
						select: {
							id: true,
							path: true,
							thumbnail: true,
							width: true,
							height: true,
						},
						take: count,
						orderBy: { updatedAt: 'desc' },
					})) as unknown as ImageData[];
				}
				break;
			}

			case 'place': {
				// Buscar imágenes de un lugar aleatorio
				const randomPlace = await prisma.place.findFirst({
					select: { id: true },
					orderBy: { updatedAt: 'desc' },
					take: 1,
				});

				if (randomPlace) {
					imagesData = (await prisma.image.findMany({
						where: { places: { some: { id: randomPlace.id } } },
						select: {
							id: true,
							path: true,
							thumbnail: true,
							width: true,
							height: true,
						},
						take: count,
						orderBy: { updatedAt: 'desc' },
					})) as unknown as ImageData[];
				}
				break;
			}

			case 'world-item': {
				// Buscar imágenes de un objeto del mundo aleatorio
				const randomWorldItem = await prisma.worldItem.findFirst({
					select: { id: true },
					orderBy: { updatedAt: 'desc' },
					take: 1,
				});

				if (randomWorldItem) {
					imagesData = (await prisma.image.findMany({
						where: { worldItems: { some: { id: randomWorldItem.id } } },
						select: {
							id: true,
							path: true,
							thumbnail: true,
							width: true,
							height: true,
						},
						take: count,
						orderBy: { updatedAt: 'desc' },
					})) as unknown as ImageData[];
				}
				break;
			}

			case 'folder': {
				const [folderId, count] = entityType.split(':');
				// Buscar imágenes de una carpeta específica
				const whereClause = folderId ? { folderId: folderId } : { folderId: { not: null } };

				imagesData = (await prisma.image.findMany({
					where: whereClause,
					select: {
						id: true,
						path: true,
						thumbnail: true,
						width: true,
						height: true,
					},
					take: Number(count) || 4,
					orderBy: { updatedAt: 'desc' },
				})) as unknown as ImageData[];
				break;
			}

			default: {
				// Si no hay un tipo específico, obtener imágenes aleatorias
				imagesData = (await prisma.image.findMany({
					select: {
						id: true,
						path: true,
						thumbnail: true,
						width: true,
						height: true,
					},
					take: count,
					orderBy: { updatedAt: 'desc' },
				})) as unknown as ImageData[];
				break;
			}
		}

		// Si no se encontraron imágenes, buscar cualquier imagen
		if (imagesData.length === 0) {
			imagesData = (await prisma.image.findMany({
				select: {
					id: true,
					path: true,
					thumbnail: true,
					width: true,
					height: true,
				},
				take: count,
				orderBy: { updatedAt: 'desc' },
			})) as unknown as ImageData[];
		}

		// Transformar los datos para asegurar la compatibilidad con el tipo RandomImage
		const images: RandomImage[] = imagesData.map((image) => ({
			id: image.id,
			path: image.path,
			// No necesitamos incluir el thumbnail ya que se accede vía API
			thumbnail: null,
			width: image.width || undefined,
			height: image.height || undefined,
		}));

		randomImageLogger.info(`Se encontraron ${images.length} imágenes para ${entityType}`);

		return {
			success: true,
			data: images,
			message: `Se encontraron ${images.length} imágenes para ${entityType}`,
		};
	} catch (error) {
		// Usar el sistema de manejo de errores estandarizado
		const serviceError = toServiceError(error, {
			serviceName: SERVER_ACTION_NAME,
			message: `Error al obtener imágenes aleatorias para ${entityType}`,
		});

		randomImageLogger.error(`Error al obtener imágenes aleatorias para ${entityType}:`, serviceError);

		return {
			success: false,
			message: serviceError.message,
		};
	}
}
