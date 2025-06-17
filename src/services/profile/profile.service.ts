/**
 * @file Servicio para operaciones con perfiles
 * @module services/profile
 */

import type { Profile } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { transformProfile, transformProfiles } from '@/transformers/profile/profile-transformers';
import {
	type CreateProfileInput,
	createProfileSchema,
	type ProfileExtended,
	type ProfileFilters,
	type ProfilePaginationOptions,
	profileFiltersSchema,
	profilePaginationSchema,
	type UpdateProfileInput,
	updateProfileSchema,
} from '@/types/entities/profile';
import { toServiceError } from '@/utils/errors/service-errors';
import { BaseService } from '../base.service';

const SERVICE_NAME = 'ProfileService';

/**
 * Servicio para gestionar perfiles de usuario
 * Extiende BaseService para operaciones CRUD básicas
 */
class ProfileServiceImpl extends BaseService<Profile, ProfileExtended, ProfileExtended> {
	private static instance: ProfileServiceImpl;

	private constructor() {
		super(prisma.profile, 'Profile', {
			toEntity: transformProfile,
			toEntities: transformProfiles,
			toResult: (entity) => entity,
			toResults: (entities) => entities,
		});
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
				where.OR = [
					{ name: { contains: search, mode: 'insensitive' } },
					{ description: { contains: search, mode: 'insensitive' } },
				];
			}
			if (typeof isActive === 'boolean') where.isActive = isActive;
			if (theme) where.theme = theme;
			if (language) where.language = language;

			const profiles = await this.model.findMany({
				where,
				orderBy: { [sortBy]: sortDirection },
				skip: (page - 1) * limit,
				take: limit,
			});

			return this.transformer?.toEntities(profiles) || profiles;
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
	async createProfile(data: CreateProfileInput): Promise<ProfileExtended> {
		try {
			const validatedData = createProfileSchema.parse(data);
			const profile = await this.model.create({ data: validatedData });
			return this.transformer?.toEntity(profile) || profile;
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
	async updateProfile(id: string, data: UpdateProfileInput): Promise<ProfileExtended> {
		try {
			const validatedData = updateProfileSchema.parse(data);
			const profile = await this.model.update({
				where: { id },
				data: validatedData,
			});
			return this.transformer?.toEntity(profile) || profile;
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
			await this.model.updateMany({
				where: { isActive: true },
				data: { isActive: false },
			});

			// Activar el perfil seleccionado
			await this.model.update({
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
			const profile = await this.model.findFirst({
				where: { isActive: true },
			});
			return profile ? this.transformer?.toEntity(profile) || profile : null;
		} catch (error) {
			throw toServiceError(error, {
				serviceName: SERVICE_NAME,
				message: 'Error al obtener perfil activo',
			});
		}
	}
}

// Exportar instancia única del servicio
export const profileService = ProfileServiceImpl.getInstance();

// Exportar tipos útiles para los consumidores del servicio
export type { CreateProfileInput, ProfileExtended, ProfileFilters, ProfilePaginationOptions, UpdateProfileInput };
