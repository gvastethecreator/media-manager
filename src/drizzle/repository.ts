import { serverLogger } from '@/lib/logger/server-logger';
import { eq } from 'drizzle-orm';
import { db } from './db';
import {
	activities,
	albums,
	characters,
	charactersToPlaces,
	collections,
	collectionsToImages,
	folders,
	imageStats,
	images,
	places,
	placesToImages,
	placesToVideos,
	profiles,
	properties,
	queueJobs,
	videos,
} from './schema';

// Utilidades para manejo de JSON
const jsonHelper = {
	parse: <T>(text: string | null): T | null => {
		if (!text) return null;
		try {
			return JSON.parse(text) as T;
		} catch {
			return null;
		}
	},
	stringify: (data: unknown): string => {
		try {
			return JSON.stringify(data);
		} catch {
			return 'empty_array';
		}
	},
};

/**
 * Repositorio para operaciones de base de datos con Drizzle
 * Proporciona una capa de abstracción sobre las operaciones de Drizzle
 */
export const DrizzleRepository = {
	/**
	 * Operaciones para perfiles de usuario
	 */
	profiles: {
		/**
		 * Obtener todos los perfiles
		 */
		getAll: async () => {
			try {
				return await db.select().from(profiles);
			} catch (error) {
				serverLogger.error('Error al obtener perfiles:', error);
				throw new Error('Error al obtener perfiles');
			}
		},

		/**
		 * Obtener un perfil por ID
		 */
		getById: async (id: string) => {
			try {
				const result = await db.select().from(profiles).where(eq(profiles.id, id));
				return result[0] || null;
			} catch (error) {
				serverLogger.error(`Error al obtener perfil con ID ${id}:`, error);
				throw new Error(`Error al obtener perfil con ID ${id}`);
			}
		},

		/**
		 * Crear un nuevo perfil
		 */
		create: async (data: Omit<typeof profiles.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>) => {
			try {
				const result = await db.insert(profiles).values(data).returning();
				return result[0];
			} catch (error) {
				serverLogger.error('Error al crear perfil:', error);
				throw new Error('Error al crear perfil');
			}
		},

		/**
		 * Actualizar un perfil existente
		 */
		update: async (id: string, data: Partial<Omit<typeof profiles.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>>) => {
			try {
				const now = new Date().getTime();
				const result = await db
					.update(profiles)
					.set({ ...data, updatedAt: now })
					.where(eq(profiles.id, id))
					.returning();
				return result[0];
			} catch (error) {
				serverLogger.error(`Error al actualizar perfil con ID ${id}:`, error);
				throw new Error(`Error al actualizar perfil con ID ${id}`);
			}
		},

		/**
		 * Eliminar un perfil
		 */
		delete: async (id: string) => {
			try {
				await db.delete(profiles).where(eq(profiles.id, id));
				return true;
			} catch (error) {
				serverLogger.error(`Error al eliminar perfil con ID ${id}:`, error);
				throw new Error(`Error al eliminar perfil con ID ${id}`);
			}
		},
	},

	/**
	 * Operaciones para carpetas
	 */
	folders: {
		/**
		 * Obtener todas las carpetas
		 */
		getAll: async () => {
			try {
				return await db.select().from(folders);
			} catch (error) {
				serverLogger.error('Error al obtener carpetas:', error);
				throw new Error('Error al obtener carpetas');
			}
		},

		/**
		 * Obtener una carpeta por ID
		 */
		getById: async (id: string) => {
			try {
				const result = await db.select().from(folders).where(eq(folders.id, id));
				return result[0] || null;
			} catch (error) {
				serverLogger.error(`Error al obtener carpeta con ID ${id}:`, error);
				throw new Error(`Error al obtener carpeta con ID ${id}`);
			}
		},

		/**
		 * Obtener una carpeta por ruta
		 */
		getByPath: async (path: string) => {
			try {
				const result = await db.select().from(folders).where(eq(folders.path, path));
				return result[0] || null;
			} catch (error) {
				serverLogger.error(`Error al obtener carpeta con ruta ${path}:`, error);
				throw new Error(`Error al obtener carpeta con ruta ${path}`);
			}
		},

		/**
		 * Crear una nueva carpeta
		 */
		create: async (data: Omit<typeof folders.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>) => {
			try {
				const result = await db.insert(folders).values(data).returning();
				return result[0];
			} catch (error) {
				serverLogger.error('Error al crear carpeta:', error);
				throw new Error('Error al crear carpeta');
			}
		},

		/**
		 * Actualizar una carpeta existente
		 */
		update: async (id: string, data: Partial<Omit<typeof folders.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>>) => {
			try {
				const now = new Date().getTime();
				const result = await db
					.update(folders)
					.set({ ...data, updatedAt: now })
					.where(eq(folders.id, id))
					.returning();
				return result[0];
			} catch (error) {
				serverLogger.error(`Error al actualizar carpeta con ID ${id}:`, error);
				throw new Error(`Error al actualizar carpeta con ID ${id}`);
			}
		},

		/**
		 * Eliminar una carpeta
		 */
		delete: async (id: string) => {
			try {
				await db.delete(folders).where(eq(folders.id, id));
				return true;
			} catch (error) {
				serverLogger.error(`Error al eliminar carpeta con ID ${id}:`, error);
				throw new Error(`Error al eliminar carpeta con ID ${id}`);
			}
		},
	},

	/**
	 * Operaciones para trabajos de cola
	 */
	queueJobs: {
		/**
		 * Obtener todos los trabajos de cola
		 */
		getAll: async () => {
			try {
				return await db.select().from(queueJobs);
			} catch (error) {
				serverLogger.error('Error al obtener trabajos de cola:', error);
				throw new Error('Error al obtener trabajos de cola');
			}
		},

		/**
		 * Obtener un trabajo de cola por ID
		 */
		getById: async (id: string) => {
			try {
				const result = await db.select().from(queueJobs).where(eq(queueJobs.id, id));
				return result[0] || null;
			} catch (error) {
				serverLogger.error(`Error al obtener trabajo de cola con ID ${id}:`, error);
				throw new Error(`Error al obtener trabajo de cola con ID ${id}`);
			}
		},

		/**
		 * Crear un nuevo trabajo de cola
		 */
		create: async (data: Omit<typeof queueJobs.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>) => {
			try {
				const result = await db.insert(queueJobs).values(data).returning();
				return result[0];
			} catch (error) {
				serverLogger.error('Error al crear trabajo de cola:', error);
				throw new Error('Error al crear trabajo de cola');
			}
		},

		/**
		 * Actualizar un trabajo de cola existente
		 */
		update: async (
			id: string,
			data: Partial<Omit<typeof queueJobs.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>>
		) => {
			try {
				const now = new Date().getTime();
				const result = await db
					.update(queueJobs)
					.set({ ...data, updatedAt: now })
					.where(eq(queueJobs.id, id))
					.returning();
				return result[0];
			} catch (error) {
				serverLogger.error(`Error al actualizar trabajo de cola con ID ${id}:`, error);
				throw new Error(`Error al actualizar trabajo de cola con ID ${id}`);
			}
		},

		/**
		 * Eliminar un trabajo de cola
		 */
		delete: async (id: string) => {
			try {
				await db.delete(queueJobs).where(eq(queueJobs.id, id));
				return true;
			} catch (error) {
				serverLogger.error(`Error al eliminar trabajo de cola con ID ${id}:`, error);
				throw new Error(`Error al eliminar trabajo de cola con ID ${id}`);
			}
		},
	},

	/**
	 * Operaciones para imágenes
	 */
	images: {
		getAll: async () => {
			try {
				return await db.select().from(images);
			} catch (error) {
				serverLogger.error('Error al obtener imágenes:', error);
				throw new Error('Error al obtener imágenes');
			}
		},

		getById: async (id: string) => {
			try {
				const result = await db.select().from(images).where(eq(images.id, id));
				return result[0] || null;
			} catch (error) {
				serverLogger.error(`Error al obtener imagen con ID ${id}:`, error);
				throw new Error(`Error al obtener imagen con ID ${id}`);
			}
		},

		create: async (data: Omit<typeof images.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>) => {
			try {
				const result = await db.insert(images).values(data).returning();
				return result[0];
			} catch (error) {
				serverLogger.error('Error al crear imagen:', error);
				throw new Error('Error al crear imagen');
			}
		},

		update: async (id: string, data: Partial<Omit<typeof images.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>>) => {
			try {
				const now = new Date().getTime();
				const result = await db
					.update(images)
					.set({ ...data, updatedAt: now })
					.where(eq(images.id, id))
					.returning();
				return result[0];
			} catch (error) {
				serverLogger.error(`Error al actualizar imagen con ID ${id}:`, error);
				throw new Error(`Error al actualizar imagen con ID ${id}`);
			}
		},

		delete: async (id: string) => {
			try {
				await db.delete(images).where(eq(images.id, id));
				return true;
			} catch (error) {
				serverLogger.error(`Error al eliminar imagen con ID ${id}:`, error);
				throw new Error(`Error al eliminar imagen con ID ${id}`);
			}
		},
	},

	/**
	 * Operaciones para estadísticas de imágenes
	 */
	imageStats: {
		getByImageId: async (imageId: string) => {
			try {
				const result = await db.select().from(imageStats).where(eq(imageStats.imageId, imageId));
				return result[0] || null;
			} catch (error) {
				serverLogger.error(`Error al obtener estadísticas de imagen con ID ${imageId}:`, error);
				throw new Error(`Error al obtener estadísticas de imagen con ID ${imageId}`);
			}
		},

		incrementViews: async (imageId: string) => {
			try {
				const now = new Date().getTime();
				const result = await db
					.update(imageStats)
					.set({
						views: db.raw('views + 1'),
						lastViewed: now,
						updatedAt: now,
					})
					.where(eq(imageStats.imageId, imageId))
					.returning();
				return result[0];
			} catch (error) {
				serverLogger.error(`Error al incrementar vistas de imagen con ID ${imageId}:`, error);
				throw new Error(`Error al incrementar vistas de imagen con ID ${imageId}`);
			}
		},
	},

	/**
	 * Operaciones para actividades
	 */
	activities: {
		getAll: async () => {
			try {
				return await db.select().from(activities);
			} catch (error) {
				serverLogger.error('Error al obtener actividades:', error);
				throw new Error('Error al obtener actividades');
			}
		},

		create: async (data: Omit<typeof activities.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>) => {
			try {
				const result = await db.insert(activities).values(data).returning();
				return result[0];
			} catch (error) {
				serverLogger.error('Error al crear actividad:', error);
				throw new Error('Error al crear actividad');
			}
		},
	},

	/**
	 * Operaciones para videos
	 */
	videos: {
		getAll: async () => {
			try {
				return await db.select().from(videos);
			} catch (error) {
				serverLogger.error('Error al obtener videos:', error);
				throw new Error('Error al obtener videos');
			}
		},

		getById: async (id: string) => {
			try {
				const result = await db.select().from(videos).where(eq(videos.id, id));
				return result[0] || null;
			} catch (error) {
				serverLogger.error(`Error al obtener video con ID ${id}:`, error);
				throw new Error(`Error al obtener video con ID ${id}`);
			}
		},

		create: async (data: Omit<typeof videos.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>) => {
			try {
				const result = await db.insert(videos).values(data).returning();
				return result[0];
			} catch (error) {
				serverLogger.error('Error al crear video:', error);
				throw new Error('Error al crear video');
			}
		},

		update: async (id: string, data: Partial<Omit<typeof videos.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>>) => {
			try {
				const now = new Date().getTime();
				const result = await db
					.update(videos)
					.set({ ...data, updatedAt: now })
					.where(eq(videos.id, id))
					.returning();
				return result[0];
			} catch (error) {
				serverLogger.error(`Error al actualizar video con ID ${id}:`, error);
				throw new Error(`Error al actualizar video con ID ${id}`);
			}
		},

		delete: async (id: string) => {
			try {
				await db.delete(videos).where(eq(videos.id, id));
				return true;
			} catch (error) {
				serverLogger.error(`Error al eliminar video con ID ${id}:`, error);
				throw new Error(`Error al eliminar video con ID ${id}`);
			}
		},
	},

	/**
	 * Operaciones para álbumes
	 */
	albums: {
		getAll: async () => {
			try {
				return await db.select().from(albums);
			} catch (error) {
				serverLogger.error('Error al obtener álbumes:', error);
				throw new Error('Error al obtener álbumes');
			}
		},

		getById: async (id: string) => {
			try {
				const result = await db.select().from(albums).where(eq(albums.id, id));
				return result[0] || null;
			} catch (error) {
				serverLogger.error(`Error al obtener álbum con ID ${id}:`, error);
				throw new Error(`Error al obtener álbum con ID ${id}`);
			}
		},

		create: async (data: Omit<typeof albums.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>) => {
			try {
				const result = await db.insert(albums).values(data).returning();
				return result[0];
			} catch (error) {
				serverLogger.error('Error al crear álbum:', error);
				throw new Error('Error al crear álbum');
			}
		},

		update: async (id: string, data: Partial<Omit<typeof albums.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>>) => {
			try {
				const now = new Date().getTime();
				const result = await db
					.update(albums)
					.set({ ...data, updatedAt: now })
					.where(eq(albums.id, id))
					.returning();
				return result[0];
			} catch (error) {
				serverLogger.error(`Error al actualizar álbum con ID ${id}:`, error);
				throw new Error(`Error al actualizar álbum con ID ${id}`);
			}
		},

		delete: async (id: string) => {
			try {
				await db.delete(albums).where(eq(albums.id, id));
				return true;
			} catch (error) {
				serverLogger.error(`Error al eliminar álbum con ID ${id}:`, error);
				throw new Error(`Error al eliminar álbum con ID ${id}`);
			}
		},
	},

	// Similar operations for collections, tags, groups...
	collections: {
		getAll: async () => {
			try {
				return await db.select().from(collections);
			} catch (error) {
				serverLogger.error('Error al obtener colecciones:', error);
				throw new Error('Error al obtener colecciones');
			}
		},

		getById: async (id: string) => {
			try {
				const result = await db.select().from(collections).where(eq(collections.id, id));
				return result[0]
					? {
							...result[0],
							editions: jsonHelper.parse(result[0].editions),
						}
					: null;
			} catch (error) {
				serverLogger.error(`Error al obtener colección con ID ${id}:`, error);
				throw new Error(`Error al obtener colección con ID ${id}`);
			}
		},

		create: async (data: Omit<typeof collections.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>) => {
			try {
				const result = await db
					.insert(collections)
					.values({
						...data,
						editions: data.editions ? jsonHelper.stringify(data.editions) : 'empty_array',
					})
					.returning();
				return result[0];
			} catch (error) {
				serverLogger.error('Error al crear colección:', error);
				throw new Error('Error al crear colección');
			}
		},

		update: async (
			id: string,
			data: Partial<Omit<typeof collections.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>>
		) => {
			try {
				const now = new Date().getTime();
				const updateData = {
					...data,
					updatedAt: now,
				};
				if (data.editions) {
					updateData.editions = jsonHelper.stringify(data.editions);
				}
				const result = await db.update(collections).set(updateData).where(eq(collections.id, id)).returning();
				return result[0];
			} catch (error) {
				serverLogger.error(`Error al actualizar colección con ID ${id}:`, error);
				throw new Error(`Error al actualizar colección con ID ${id}`);
			}
		},

		delete: async (id: string) => {
			try {
				await db.delete(collections).where(eq(collections.id, id));
				return true;
			} catch (error) {
				serverLogger.error(`Error al eliminar colección con ID ${id}:`, error);
				throw new Error(`Error al eliminar colección con ID ${id}`);
			}
		},

		// Operaciones de relación
		addImage: async (collectionId: string, imageId: string) => {
			try {
				await db.insert(collectionsToImages).values({ collectionId, imageId });
				return true;
			} catch (error) {
				serverLogger.error(`Error al añadir imagen ${imageId} a colección ${collectionId}:`, error);
				throw new Error('Error al añadir imagen a colección');
			}
		},

		removeImage: async (collectionId: string, imageId: string) => {
			try {
				await db
					.delete(collectionsToImages)
					.where(eq(collectionsToImages.collectionId, collectionId))
					.where(eq(collectionsToImages.imageId, imageId));
				return true;
			} catch (error) {
				serverLogger.error(`Error al remover imagen ${imageId} de colección ${collectionId}:`, error);
				throw new Error('Error al remover imagen de colección');
			}
		},
	},

	// Similar operations for characters, places, worldItems...
	characters: {
		getAll: async () => {
			try {
				return await db.select().from(characters);
			} catch (error) {
				serverLogger.error('Error al obtener personajes:', error);
				throw new Error('Error al obtener personajes');
			}
		},

		getById: async (id: string) => {
			try {
				const result = await db.select().from(characters).where(eq(characters.id, id));
				return result[0]
					? {
							...result[0],
							relationships: jsonHelper.parse(result[0].relationships),
							goals: jsonHelper.parse(result[0].goals),
							fears: jsonHelper.parse(result[0].fears),
							beliefs: jsonHelper.parse(result[0].beliefs),
							personality: jsonHelper.parse(result[0].personality),
							skills: jsonHelper.parse(result[0].skills),
							abilities: jsonHelper.parse(result[0].abilities),
						}
					: null;
			} catch (error) {
				serverLogger.error(`Error al obtener personaje con ID ${id}:`, error);
				throw new Error(`Error al obtener personaje con ID ${id}`);
			}
		},

		create: async (data: Omit<typeof characters.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>) => {
			try {
				const result = await db
					.insert(characters)
					.values({
						...data,
						relationships: jsonHelper.stringify(data.relationships),
						goals: jsonHelper.stringify(data.goals),
						fears: jsonHelper.stringify(data.fears),
						beliefs: jsonHelper.stringify(data.beliefs),
						personality: jsonHelper.stringify(data.personality),
						skills: jsonHelper.stringify(data.skills),
						abilities: jsonHelper.stringify(data.abilities),
					})
					.returning();
				return result[0];
			} catch (error) {
				serverLogger.error('Error al crear personaje:', error);
				throw new Error('Error al crear personaje');
			}
		},

		// ... similar update and delete operations ...

		// Operaciones de relación
		addPlace: async (characterId: string, placeId: string) => {
			try {
				await db.insert(charactersToPlaces).values({ characterId, placeId });
				return true;
			} catch (error) {
				serverLogger.error(`Error al añadir lugar ${placeId} a personaje ${characterId}:`, error);
				throw new Error('Error al añadir lugar a personaje');
			}
		},

		removePlace: async (characterId: string, placeId: string) => {
			try {
				await db
					.delete(charactersToPlaces)
					.where(eq(charactersToPlaces.characterId, characterId))
					.where(eq(charactersToPlaces.placeId, placeId));
				return true;
			} catch (error) {
				serverLogger.error(`Error al remover lugar ${placeId} de personaje ${characterId}:`, error);
				throw new Error('Error al remover lugar de personaje');
			}
		},
	},

	// Operaciones para places
	places: {
		getAll: async () => {
			try {
				return await db.select().from(places);
			} catch (error) {
				serverLogger.error('Error al obtener lugares:', error);
				throw new Error('Error al obtener lugares');
			}
		},

		getById: async (id: string) => {
			try {
				const result = await db.select().from(places).where(eq(places.id, id));
				return result[0]
					? {
							...result[0],
							landmarks: jsonHelper.parse(result[0].landmarks),
							resources: jsonHelper.parse(result[0].resources),
							dangers: jsonHelper.parse(result[0].dangers),
						}
					: null;
			} catch (error) {
				serverLogger.error(`Error al obtener lugar con ID ${id}:`, error);
				throw new Error(`Error al obtener lugar con ID ${id}`);
			}
		},

		create: async (data: Omit<typeof places.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>) => {
			try {
				const result = await db
					.insert(places)
					.values({
						...data,
						landmarks: jsonHelper.stringify(data.landmarks),
						resources: jsonHelper.stringify(data.resources),
						dangers: jsonHelper.stringify(data.dangers),
					})
					.returning();
				return result[0];
			} catch (error) {
				serverLogger.error('Error al crear lugar:', error);
				throw new Error('Error al crear lugar');
			}
		},

		update: async (id: string, data: Partial<Omit<typeof places.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>>) => {
			try {
				const now = new Date().getTime();
				const updateData = {
					...data,
					updatedAt: now,
				};
				if (data.landmarks) {
					updateData.landmarks = jsonHelper.stringify(data.landmarks);
				}
				if (data.resources) {
					updateData.resources = jsonHelper.stringify(data.resources);
				}
				if (data.dangers) {
					updateData.dangers = jsonHelper.stringify(data.dangers);
				}
				const result = await db.update(places).set(updateData).where(eq(places.id, id)).returning();
				return result[0];
			} catch (error) {
				serverLogger.error(`Error al actualizar lugar con ID ${id}:`, error);
				throw new Error(`Error al actualizar lugar con ID ${id}`);
			}
		},

		delete: async (id: string) => {
			try {
				await db.delete(places).where(eq(places.id, id));
				return true;
			} catch (error) {
				serverLogger.error(`Error al eliminar lugar con ID ${id}:`, error);
				throw new Error(`Error al eliminar lugar con ID ${id}`);
			}
		},

		// Operaciones de relación
		addImage: async (placeId: string, imageId: string) => {
			try {
				await db.insert(placesToImages).values({ placeId, imageId });
				return true;
			} catch (error) {
				serverLogger.error(`Error al añadir imagen ${imageId} a lugar ${placeId}:`, error);
				throw new Error('Error al añadir imagen a lugar');
			}
		},

		removeImage: async (placeId: string, imageId: string) => {
			try {
				await db
					.delete(placesToImages)
					.where(eq(placesToImages.placeId, placeId))
					.where(eq(placesToImages.imageId, imageId));
				return true;
			} catch (error) {
				serverLogger.error(`Error al remover imagen ${imageId} de lugar ${placeId}:`, error);
				throw new Error('Error al remover imagen de lugar');
			}
		},

		addVideo: async (placeId: string, videoId: string) => {
			try {
				await db.insert(placesToVideos).values({ placeId, videoId });
				return true;
			} catch (error) {
				serverLogger.error(`Error al añadir video ${videoId} a lugar ${placeId}:`, error);
				throw new Error('Error al añadir video a lugar');
			}
		},

		removeVideo: async (placeId: string, videoId: string) => {
			try {
				await db
					.delete(placesToVideos)
					.where(eq(placesToVideos.placeId, placeId))
					.where(eq(placesToVideos.videoId, videoId));
				return true;
			} catch (error) {
				serverLogger.error(`Error al remover video ${videoId} de lugar ${placeId}:`, error);
				throw new Error('Error al remover video de lugar');
			}
		},
	},

	// Operaciones para properties
	properties: {
		getAll: async () => {
			try {
				return await db.select().from(properties);
			} catch (error) {
				serverLogger.error('Error al obtener propiedades:', error);
				throw new Error('Error al obtener propiedades');
			}
		},

		getById: async (id: string) => {
			try {
				const result = await db.select().from(properties).where(eq(properties.id, id));
				return result[0]
					? {
							...result[0],
							validation: jsonHelper.parse(result[0].validation),
							constraints: jsonHelper.parse(result[0].constraints),
							options: jsonHelper.parse(result[0].options),
							metadata: jsonHelper.parse(result[0].metadata),
						}
					: null;
			} catch (error) {
				serverLogger.error(`Error al obtener propiedad con ID ${id}:`, error);
				throw new Error(`Error al obtener propiedad con ID ${id}`);
			}
		},

		create: async (data: Omit<typeof properties.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>) => {
			try {
				const result = await db
					.insert(properties)
					.values({
						...data,
						validation: jsonHelper.stringify(data.validation),
						constraints: jsonHelper.stringify(data.constraints),
						options: jsonHelper.stringify(data.options),
						metadata: jsonHelper.stringify(data.metadata),
					})
					.returning();
				return result[0];
			} catch (error) {
				serverLogger.error('Error al crear propiedad:', error);
				throw new Error('Error al crear propiedad');
			}
		},

		update: async (
			id: string,
			data: Partial<Omit<typeof properties.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>>
		) => {
			try {
				const now = new Date().getTime();
				const updateData = {
					...data,
					updatedAt: now,
				};
				if (data.validation) {
					updateData.validation = jsonHelper.stringify(data.validation);
				}
				if (data.constraints) {
					updateData.constraints = jsonHelper.stringify(data.constraints);
				}
				if (data.options) {
					updateData.options = jsonHelper.stringify(data.options);
				}
				if (data.metadata) {
					updateData.metadata = jsonHelper.stringify(data.metadata);
				}
				const result = await db.update(properties).set(updateData).where(eq(properties.id, id)).returning();
				return result[0];
			} catch (error) {
				serverLogger.error(`Error al actualizar propiedad con ID ${id}:`, error);
				throw new Error(`Error al actualizar propiedad con ID ${id}`);
			}
		},

		delete: async (id: string) => {
			try {
				await db.delete(properties).where(eq(properties.id, id));
				return true;
			} catch (error) {
				serverLogger.error(`Error al eliminar propiedad con ID ${id}:`, error);
				throw new Error(`Error al eliminar propiedad con ID ${id}`);
			}
		},
	},

	/**
	 * Operaciones en lote
	 */
	batch: {
		createMany: async <T extends { id?: string }>(
			table: unknown,
			items: T[],
			options: { returnItems?: boolean } = {}
		) => {
			try {
				const result = await db.insert(table).values(items);
				return options.returnItems ? result : true;
			} catch (error) {
				serverLogger.error('Error en operación por lotes:', error);
				throw new Error('Error en operación por lotes');
			}
		},
	},
};
