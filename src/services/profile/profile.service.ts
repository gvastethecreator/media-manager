/**
 * @file Servicio para operaciones con perfiles
 * @module services/profile
 */

import { prisma } from '@/lib/database/prisma';
import {
	type ProfileCreateInput,
	type ProfileExtended,
	type ProfileFilters,
	type ProfilePaginationOptions,
	type ProfileUpdateInput,
	profileFiltersSchema,
	profilePaginationSchema,
} from '@/types/entities/profile';
import { toServiceError } from '@/lib/utils/errors/service-errors';

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
	 */
	async getProfiles(filters?: ProfileFilters, pagination?: ProfilePaginationOptions): Promise<ProfileExtended[]> {
		try {
			// Validar filtros y paginación
			const validatedFilters = filters ? profileFiltersSchema.parse(filters) : {};
			const validatedPagination = pagination ? profilePaginationSchema.parse(pagination) : {};

			const { search, isActive, theme, language } = validatedFilters;
			const { page = 1, limit = 50, sortBy = 'name', sortDirection = 'asc' } = validatedPagination;

			// Construir where clause
			const where: any = {};
			if (search) {
				where.OR = [{ name: { contains: search } }, { description: { contains: search } }];
			}
			if (typeof isActive === 'boolean') where.isActive = isActive;
			if (theme) where.theme = theme;
			if (language) where.language = language;

			const profiles = await prisma.profile.findMany({
				where,
				orderBy: { [sortBy]: sortDirection },
				skip: (page - 1) * limit,
				take: limit,
			});

			return toEntities(profiles) || profiles;
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
			const validatedData = profileCreateInputSchema.parse(data);
			const profile = await prisma.profile.create({ data: validatedData });
			return toEntity(profile) || profile;
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
			const validatedData = profileUpdateInputSchema.parse(data);
			const profile = await prisma.profile.update({
				where: { id },
				data: validatedData,
			});
			return toEntity(profile) || profile;
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
	 */
	async getActiveProfile(): Promise<ProfileExtended | null> {
		try {
			const profile = await prisma.profile.findFirst({
				where: { isActive: true },
			});
			return profile ? toEntity(profile) || profile : null;
		} catch (error) {
			throw toServiceError(error, {
				serviceName: SERVICE_NAME,
				message: 'Error al obtener perfil activo',
			});
		}
	}

	/**
	 * Obtiene un perfil por ID
	 */
	async getById(id: string): Promise<ProfileExtended | null> {
		try {
			const profile = await prisma.profile.findUnique({
				where: { id },
			});
			return profile ? toEntity(profile) || profile : null;
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
