/**
 * @file Servicio para operaciones con perfiles
 * @module services/profile
 */

import { and, asc, desc, eq, like, or } from 'drizzle-orm';
// Importar Drizzle para coexistencia
import { db } from '@/lib/drizzle';
import { profiles, settings } from '@/lib/drizzle/schema/index';
import { toServiceError } from '@/lib/utils/errors/service-errors';
import { type ProfileTransformed, transformProfile } from '@/transformers/profile/profile-transformers';
// Importar tipos desde '@/types/entities/profile' y './client'; evitar re-export circular
// export type { CreateProfileInput, ProfileExtended, ProfileFilters, ProfilePaginationOptions, UpdateProfileInput };
import {
	type ProfileCreateInput,
	type ProfileExtended,
	type ProfileFilters,
	type ProfilePaginationOptions,
	type ProfileUpdateInput,
	profileFiltersSchema,
	profilePaginationSchema,
} from '@/types/entities/profile';

const SERVICE_NAME = 'ProfileService';

/**
 * Servicio para gestionar perfiles de usuario
 */
class ProfileServiceImpl {
	private static instance: ProfileServiceImpl;

	private constructor() {
		// Constructor privado para singleton
	}

	/**
	 * Obtiene la instancia única del servicio (Singleton)
	 */
	public static getInstance(): ProfileServiceImpl {
		if (!ProfileServiceImpl.instance) {
			ProfileServiceImpl.instance = new ProfileServiceImpl();
		}
		return ProfileServiceImpl.instance;
	}

	/**
	 * Obtiene todos los perfiles con filtros y paginación
	 *
	 * 🔄 MIGRACIÓN DRIZZLE: Este método usa Drizzle como ORM principal
	 * con validación de tipos en desarrollo para asegurar consistencia.
	 */
	async getProfiles(filters?: ProfileFilters, pagination?: ProfilePaginationOptions): Promise<ProfileExtended[]> {
		try {
			// Validar filtros y paginación
			const validatedFilters = filters ? profileFiltersSchema.parse(filters) : {};
			const validatedPagination = pagination ? profilePaginationSchema.parse(pagination) : {};

			const { search, isActive, theme, language } = validatedFilters;
			const { page = 1, limit = 50, sortBy = 'name', sortDirection = 'asc' } = validatedPagination;

			// 1. Consulta principal con Drizzle (consulta simple sin JOIN para debug)
			let query = db.select().from(profiles);

			// 2. Construir filtros dinámicos
			const conditions = [];

			// Filtro de búsqueda (name OR description)
			if (search) {
				conditions.push(or(like(profiles.name, `%${search}%`), like(profiles.description, `%${search}%`)));
			}

			// Filtro de estado activo
			if (typeof isActive === 'boolean') {
				conditions.push(eq(profiles.isActive, isActive));
			}

			// Filtros de theme y language (en settings)
			if (theme) {
				conditions.push(eq(settings.theme, theme));
			}
			if (language) {
				conditions.push(eq(settings.language, language));
			}

			// Aplicar condiciones si existen
			if (conditions.length > 0) {
				query = query.where(and(...conditions));
			}

			// 3. Aplicar ordenamiento dinámico
			let orderColumn: any;
			switch (sortBy) {
				case 'name':
					orderColumn = profiles.name;
					break;
				case 'isActive':
					orderColumn = profiles.isActive;
					break;
				case 'createdAt':
					orderColumn = profiles.createdAt;
					break;
				case 'updatedAt':
					orderColumn = profiles.updatedAt;
					break;
				default:
					orderColumn = profiles.name;
					break;
			}

			const orderDirection = sortDirection === 'desc' ? desc(orderColumn) : asc(orderColumn);
			query = query.orderBy(orderDirection);

			// 4. Aplicar paginación
			const queryWithPagination = query.limit(limit).offset((page - 1) * limit);

			// 5. Ejecutar consulta
			const drizzleProfiles = await queryWithPagination;

			// 6. Validar que el resultado sea un array (puede estar vacío)
			if (!Array.isArray(drizzleProfiles)) {
				// Si no es un array, devolver array vacío (caso común cuando no hay perfiles)
				console.warn('ProfileService: Query did not return array, returning empty array', drizzleProfiles);
				return [];
			}

			// 7. Restructurar resultados para compatibilidad con el tipo ProfileExtended
			const drizzleResults = drizzleProfiles.map((raw: any) => ({
				id: raw.id,
				name: raw.name,
				emoji: raw.emoji,
				color: raw.color,
				description: raw.description,
				isActive: raw.isActive,
				createdAt: raw.createdAt,
				updatedAt: raw.updatedAt,
				settingsId: raw.settingsId,
				imageId: raw.imageId,
				settings: null, // Simplificar por ahora
			}));

			// 7. Retornar resultados de Drizzle
			return drizzleResults;
		} catch (error) {
			throw toServiceError(error, {
				serviceName: SERVICE_NAME,
				message: 'Error al obtener perfiles',
				context: { filters, pagination },
			});
		}
	}
	/**
	 * Crea un nuevo perfil
	 */
	async createProfile(data: ProfileCreateInput): Promise<ProfileTransformed> {
		try {
			const result = await db.insert(profiles).values(data).returning();
			if (!result || result.length === 0) {
				throw new Error('No se pudo crear el perfil');
			}
			return transformProfile(result[0]);
		} catch (error) {
			throw toServiceError(error, {
				serviceName: SERVICE_NAME,
				message: 'Error al crear perfil',
				context: { data },
			});
		}
	}

	/**
	 * Actualiza un perfil existente
	 */
	async updateProfile(id: string, data: ProfileUpdateInput): Promise<ProfileTransformed> {
		try {
			const result = await db.update(profiles).set(data).where(eq(profiles.id, id)).returning();
			if (!result || result.length === 0) {
				throw new Error('No se pudo actualizar el perfil');
			}
			return transformProfile(result[0]);
		} catch (error) {
			throw toServiceError(error, {
				serviceName: SERVICE_NAME,
				message: 'Error al actualizar perfil',
				context: { id, data },
			});
		}
	}

	/**
	 * Establece un perfil como activo
	 */
	async setActiveProfile(id: string): Promise<void> {
		try {
			// Desactivar todos los perfiles
			await db.update(profiles).set({ isActive: false }).where(eq(profiles.isActive, true));

			// Activar el perfil seleccionado
			await db.update(profiles).set({ isActive: true }).where(eq(profiles.id, id));
		} catch (error) {
			throw toServiceError(error, {
				serviceName: SERVICE_NAME,
				message: 'Error al activar perfil',
				context: { id },
			});
		}
	}

	/**
	 * Obtiene el perfil activo actual
	 *
	 * 🔄 MIGRACIÓN DRIZZLE: Este método usa Drizzle como ORM principal
	 * con validación de tipos en desarrollo para asegurar consistencia.
	 */
	async getActiveProfile(): Promise<ProfileTransformed | null> {
		try {
			// 1. Consulta principal con Drizzle (incluir settings con LEFT JOIN)
			const drizzleProfile = await db
				.select({
					// Campos del perfil
					id: profiles.id,
					name: profiles.name,
					emoji: profiles.emoji,
					color: profiles.color,
					description: profiles.description,
					isActive: profiles.isActive,
					createdAt: profiles.createdAt,
					updatedAt: profiles.updatedAt,
					settingsId: profiles.settingsId,
					imageId: profiles.imageId,
					// Campos de settings (planos para luego restructurar)
					settingsRealId: settings.id,
					settingsData: settings.data,
					settingsTheme: settings.theme,
					settingsLanguage: settings.language,
				})
				.from(profiles)
				.leftJoin(settings, eq(settings.profileId, profiles.id))
				.where(eq(profiles.isActive, true))
				.limit(1);

			// Restructurar el resultado para que sea compatible con el transformador legacy
			let drizzleResult = null;
			if (drizzleProfile.length > 0) {
				const raw = drizzleProfile[0];
				drizzleResult = {
					id: raw.id,
					name: raw.name,
					emoji: raw.emoji,
					color: raw.color,
					description: raw.description,
					isActive: raw.isActive,
					createdAt: raw.createdAt,
					updatedAt: raw.updatedAt,
					settingsId: raw.settingsId,
					imageId: raw.imageId,
					// Crear objeto settings compatible con transformador legacy
					settings: raw.settingsRealId
						? {
								id: raw.settingsRealId,
								theme: raw.settingsTheme,
								language: raw.settingsLanguage,
								data: raw.settingsData,
								profileId: raw.id,
							}
						: null,
				};
			}

			// 2. Transformar y retornar resultado de Drizzle
			return drizzleResult ? transformProfile(drizzleResult) : null;
		} catch (error) {
			throw toServiceError(error, {
				serviceName: SERVICE_NAME,
				message: 'Error al obtener perfil activo',
			});
		}
	}

	/**
	 * Obtiene un perfil por ID
	 *
	 * 🔄 MIGRACIÓN DRIZZLE: Este método usa Drizzle como ORM principal
	 * con validación de tipos en desarrollo para asegurar consistencia.
	 */
	async getById(id: string): Promise<ProfileTransformed | null> {
		try {
			// 1. Consulta principal con Drizzle (incluir settings con LEFT JOIN)
			const drizzleProfile = await db
				.select({
					// Campos del perfil
					id: profiles.id,
					name: profiles.name,
					emoji: profiles.emoji,
					color: profiles.color,
					description: profiles.description,
					isActive: profiles.isActive,
					createdAt: profiles.createdAt,
					updatedAt: profiles.updatedAt,
					settingsId: profiles.settingsId,
					imageId: profiles.imageId,
					// Campos de settings (planos para luego restructurar)
					settingsRealId: settings.id,
					settingsData: settings.data,
					settingsTheme: settings.theme,
					settingsLanguage: settings.language,
				})
				.from(profiles)
				.leftJoin(settings, eq(settings.profileId, profiles.id))
				.where(eq(profiles.id, id))
				.limit(1);

			// Restructurar el resultado para que sea compatible con el transformador legacy
			let drizzleResult = null;
			if (drizzleProfile.length > 0) {
				const raw = drizzleProfile[0];
				drizzleResult = {
					id: raw.id,
					name: raw.name,
					emoji: raw.emoji,
					color: raw.color,
					description: raw.description,
					isActive: raw.isActive,
					createdAt: raw.createdAt,
					updatedAt: raw.updatedAt,
					settingsId: raw.settingsId,
					imageId: raw.imageId,
					// Crear objeto settings compatible con transformador legacy
					settings: raw.settingsRealId
						? {
								id: raw.settingsRealId,
								theme: raw.settingsTheme,
								language: raw.settingsLanguage,
								data: raw.settingsData,
								profileId: raw.id,
							}
						: null,
				};
			}

			// 2. Transformar y retornar resultado de Drizzle
			return drizzleResult ? transformProfile(drizzleResult) : null;
		} catch (error) {
			throw toServiceError(error, {
				serviceName: SERVICE_NAME,
				message: 'Error al obtener perfil por ID',
				context: { id },
			});
		}
	}

	/**
	 * Elimina un perfil por ID
	 */
	async delete(id: string): Promise<void> {
		try {
			await db.delete(profiles).where(eq(profiles.id, id));
		} catch (error) {
			throw toServiceError(error, {
				serviceName: SERVICE_NAME,
				message: 'Error al eliminar perfil',
				context: { id },
			});
		}
	}
}

// Exportar instancia única del servicio
export const profileService = ProfileServiceImpl.getInstance();

// Exportar funciones individuales para compatibilidad con el cliente
export const getProfiles = (filters?: ProfileFilters, pagination?: ProfilePaginationOptions) =>
	profileService.getProfiles(filters, pagination);

export const createProfile = (data: ProfileCreateInput) => profileService.createProfile(data);

export const updateProfile = (id: string, data: ProfileUpdateInput) => profileService.updateProfile(id, data);

export const activateProfile = (id: string) => profileService.setActiveProfile(id);

export const getActiveProfile = () => profileService.getActiveProfile();

export const getProfile = (id: string) => profileService.getById(id);

export const deleteProfile = (id: string) => profileService.delete(id);

// Los tipos se exportan desde './client' para evitar duplicados circulares
