/**
 * @file Servicio para operaciones con perfiles
 * @module services/profile
 */

import { prisma } from '@/lib/database/prisma';
import { and, asc, desc, eq, like, or } from 'drizzle-orm';
// Importar Drizzle para coexistencia
import { db } from '@/lib/drizzle';
import { profiles, settings } from '@/lib/drizzle/schema';
import { toServiceError } from '@/lib/utils/errors/service-errors';
import { transformProfile, transformProfiles } from '@/transformers/profile/profile-transformers';
import {
    type ProfileCreateInput,
    type ProfileExtended,
    type ProfileFilters,
    type ProfilePaginationOptions,
    type ProfileUpdateInput,
    profileFiltersSchema,
    profilePaginationSchema,
} from '@/types/entities/profile';
import { CreateProfileInput, UpdateProfileInput } from './client';

const SERVICE_NAME = 'ProfileService';

/**
 * Función de validación para comparar resultados entre Prisma y Drizzle
 * Solo se ejecuta en desarrollo
 */
function validateProfileResults(drizzleResult: any, prismaResult: any, context: string) {
	if (process.env.NODE_ENV !== 'development') return;

	const drizzleJson = JSON.stringify(drizzleResult);
	const prismaJson = JSON.stringify(prismaResult);

	if (drizzleJson !== prismaJson) {
		console.warn(`[PROFILE VALIDATION] Diferencia encontrada en ${context}:`, {
			drizzle: drizzleResult,
			prisma: prismaResult
		});
	} else {
		console.log(`[PROFILE VALIDATION] ✅ ${context} - Resultados idénticos`);
	}
}

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
	 * con validación de Prisma en desarrollo para asegurar consistencia.
	 */
	async getProfiles(filters?: ProfileFilters, pagination?: ProfilePaginationOptions): Promise<ProfileExtended[]> {
		try {
			// Validar filtros y paginación
			const validatedFilters = filters ? profileFiltersSchema.parse(filters) : {};
			const validatedPagination = pagination ? profilePaginationSchema.parse(pagination) : {};

			const { search, isActive, theme, language } = validatedFilters;
			const { page = 1, limit = 50, sortBy = 'name', sortDirection = 'asc' } = validatedPagination;

			// 1. Consulta principal con Drizzle (incluir settings con LEFT JOIN)
			let query = db.select({
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
				.leftJoin(settings, eq(settings.profileId, profiles.id));

			// 2. Construir filtros dinámicos
			const conditions = [];

			// Filtro de búsqueda (name OR description)
			if (search) {
				conditions.push(
					or(
						like(profiles.name, `%${search}%`),
						like(profiles.description, `%${search}%`)
					)
				);
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
			const orderColumn = sortBy === 'name' ? profiles.name :
			                  sortBy === 'isActive' ? profiles.isActive :
			                  sortBy === 'createdAt' ? profiles.createdAt :
			                  sortBy === 'updatedAt' ? profiles.updatedAt :
			                  profiles.name; // default fallback

			const orderDirection = sortDirection === 'desc' ? desc(orderColumn) : asc(orderColumn);
			query = query.orderBy(orderDirection);

			// 4. Aplicar paginación
			query = query.limit(limit).offset((page - 1) * limit);

			// 5. Ejecutar consulta
			const drizzleProfiles = await query;

			// 6. Restructurar resultados para compatibilidad con Prisma
			const drizzleResults = drizzleProfiles.map(raw => ({
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
				// Crear objeto settings compatible con Prisma
				settings: raw.settingsRealId ? {
					id: raw.settingsRealId,
					theme: raw.settingsTheme,
					language: raw.settingsLanguage,
					data: raw.settingsData,
					profileId: raw.id,
				} : null,
			}));

			// 7. Validación con Prisma (solo en desarrollo)
			if (process.env.NODE_ENV === 'development') {
				// Construir where clause para Prisma
				const prismaWhere: any = {};
				if (search) {
					prismaWhere.OR = [{ name: { contains: search } }, { description: { contains: search } }];
				}
				if (typeof isActive === 'boolean') prismaWhere.isActive = isActive;
				if (theme) prismaWhere.settings = { theme };
				if (language) prismaWhere.settings = { ...prismaWhere.settings, language };

				const prismaProfiles = await prisma.profile.findMany({
					where: prismaWhere,
					include: { settings: true },
					orderBy: { [sortBy]: sortDirection },
					skip: (page - 1) * limit,
					take: limit,
				});

				// Validar que ambas consultas devuelvan la misma cantidad de resultados
				if (drizzleResults.length !== prismaProfiles.length) {
					console.warn(`[PROFILE VALIDATION] getProfiles - Diferente cantidad de resultados: Drizzle=${drizzleResults.length}, Prisma=${prismaProfiles.length}`);
				} else {
					console.log(`[PROFILE VALIDATION] ✅ getProfiles - ${drizzleResults.length} resultados en ambos ORMs`);
				}
			}

			// 8. Transformar y retornar resultados de Drizzle
			return transformProfiles(drizzleResults);
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
	async createProfile(data: ProfileCreateInput): Promise<ProfileExtended> {
		try {
			const profile = await prisma.profile.create({ data });
			return transformProfile(profile);
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
	async updateProfile(id: string, data: ProfileUpdateInput): Promise<ProfileExtended> {
		try {
			const profile = await prisma.profile.update({
				where: { id },
				data,
			});
			return transformProfile(profile);
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
			await prisma.profile.updateMany({
				where: { isActive: true },
				data: { isActive: false },
			});

			// Activar el perfil seleccionado
			await prisma.profile.update({
				where: { id },
				data: { isActive: true },
			});
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
	 * con validación de Prisma en desarrollo para asegurar consistencia.
	 */
	async getActiveProfile(): Promise<ProfileExtended | null> {
				try {
						// 1. Consulta principal con Drizzle (incluir settings con LEFT JOIN)
			const drizzleProfile = await db.select({
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

						// Restructurar el resultado para que sea compatible con el transformador de Prisma
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
					// Crear objeto settings compatible con Prisma
					settings: raw.settingsRealId ? {
						id: raw.settingsRealId,
						theme: raw.settingsTheme,
						language: raw.settingsLanguage,
						data: raw.settingsData,
						profileId: raw.id,
					} : null,
				};
			}

						// 2. Validación con Prisma (solo en desarrollo)
			if (process.env.NODE_ENV === 'development') {
				const prismaProfile = await prisma.profile.findFirst({
					where: { isActive: true },
					include: {
						settings: true,
					},
				});

				validateProfileResults(drizzleResult, prismaProfile, 'getActiveProfile');
			}

			// 3. Transformar y retornar resultado de Drizzle
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
	 * con validación de Prisma en desarrollo para asegurar consistencia.
	 */
	async getById(id: string): Promise<ProfileExtended | null> {
						try {
			// 1. Consulta principal con Drizzle (incluir settings con LEFT JOIN)
			const drizzleProfile = await db.select({
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

			// Restructurar el resultado para que sea compatible con el transformador de Prisma
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
					// Crear objeto settings compatible con Prisma
					settings: raw.settingsRealId ? {
						id: raw.settingsRealId,
						theme: raw.settingsTheme,
						language: raw.settingsLanguage,
						data: raw.settingsData,
						profileId: raw.id,
					} : null,
				};
			}

						// 2. Validación con Prisma (solo en desarrollo)
			if (process.env.NODE_ENV === 'development') {
				const prismaProfile = await prisma.profile.findUnique({
					where: { id },
					include: {
						settings: true,
					},
				});

				validateProfileResults(drizzleResult, prismaProfile, `getById(${id})`);
			}

			// 3. Transformar y retornar resultado de Drizzle
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
			await prisma.profile.delete({
				where: { id },
			});
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

// Exportar tipos útiles para los consumidores del servicio
export type { CreateProfileInput, ProfileExtended, ProfileFilters, ProfilePaginationOptions, UpdateProfileInput };

