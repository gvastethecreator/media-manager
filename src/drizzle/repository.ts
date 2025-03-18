import { serverLogger } from '@/lib/logger/server-logger';
import { eq } from 'drizzle-orm';
import { db } from './db';
import { folders, profiles, queueJobs } from './schema';

/**
 * Repositorio para operaciones de base de datos con Drizzle
 * Proporciona una capa de abstracción sobre las operaciones de Drizzle
 */
export class DrizzleRepository {
	/**
	 * Operaciones para perfiles de usuario
	 */
	static profiles = {
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
	};

	/**
	 * Operaciones para carpetas
	 */
	static folders = {
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
	};

	/**
	 * Operaciones para trabajos de cola
	 */
	static queueJobs = {
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
	};
}
