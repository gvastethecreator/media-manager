'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export interface RandomImage {
	id: string;
	path: string;
	thumbnail?: string | null;
	width?: number;
	height?: number;
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
		let images: RandomImage[] = [];

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
					images = await prisma.image.findMany({
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
					});
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
					images = await prisma.image.findMany({
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
					});
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
					images = await prisma.image.findMany({
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
					});
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
					images = await prisma.image.findMany({
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
					});
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
					images = await prisma.image.findMany({
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
					});
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
					images = await prisma.image.findMany({
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
					});
				}
				break;
			}

			default: {
				// Si no hay un tipo específico, obtener imágenes aleatorias
				images = await prisma.image.findMany({
					select: {
						id: true,
						path: true,
						thumbnail: true,
						width: true,
						height: true,
					},
					take: count,
					orderBy: { updatedAt: 'desc' },
				});
				break;
			}
		}

		// Si no se encontraron imágenes, buscar cualquier imagen
		if (images.length === 0) {
			images = await prisma.image.findMany({
				select: {
					id: true,
					path: true,
					thumbnail: true,
					width: true,
					height: true,
				},
				take: count,
				orderBy: { updatedAt: 'desc' },
			});
		}

		return {
			success: true,
			data: images,
			message: `Se encontraron ${images.length} imágenes para ${entityType}`,
		};
	} catch (error) {
		console.error(`Error al obtener imágenes aleatorias para ${entityType}:`, error);
		return {
			success: false,
			message: `Error al obtener imágenes para ${entityType}`,
		};
	}
}
