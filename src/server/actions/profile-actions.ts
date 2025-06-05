import { prisma } from '@/lib/prisma';
import { validateProfilePreferences } from '@/lib/utils/profile/profile-utils';
import { transformProfile, transformProfiles } from '@/transformers/profile/profile-transformers';
import {
	type CreateProfileInput,
	Language,
	type ProfileFilters,
	type ProfilePaginationOptions,
	ThemeMode,
	type UpdateProfileInput,
} from '@/types/entities/profile/types';

/**
 * Obtiene todos los perfiles con paginación y filtros
 */
export async function getProfiles(
	filters: ProfileFilters = {},
	pagination: ProfilePaginationOptions = { page: 1, limit: 10 }
) {
	try {
		// Construir query con filtros
		const where: Record<string, unknown> = {};

		if (filters.search) {
			where.OR = [
				{ name: { contains: filters.search, mode: 'insensitive' } },
				{ description: { contains: filters.search, mode: 'insensitive' } },
			];
		}

		if (filters.isActive !== undefined) {
			where.isActive = filters.isActive;
		}

		if (filters.theme) {
			where.theme = filters.theme;
		}

		if (filters.language) {
			where.language = filters.language;
		}

		// Preparar paginación
		const { page = 1, limit = 10, sortBy = 'name', sortDirection = 'asc' } = pagination;
		const skip = (page - 1) * limit;

		// Construir ordenación
		const orderBy: Record<string, string> = {};
		orderBy[sortBy] = sortDirection;

		// Ejecutar consultas
		const [profiles, total] = await Promise.all([
			prisma.profile.findMany({
				where,
				orderBy,
				skip,
				take: limit,
			}),
			prisma.profile.count({ where }),
		]);

		return {
			items: transformProfiles(profiles),
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		};
	} catch (error) {
		console.error('Error obteniendo perfiles:', error);
		throw new Error('Error obteniendo perfiles');
	}
}

/**
 * Obtener perfil por ID
 */
export async function getProfileById(id: string) {
	try {
		const profile = await prisma.profile.findUnique({
			where: { id },
		});

		if (!profile) {
			return null;
		}

		return transformProfile(profile);
	} catch (error) {
		console.error(`Error obteniendo perfil ${id}:`, error);
		throw new Error('Error obteniendo perfil');
	}
}

/**
 * Obtener perfil activo
 */
export async function getActiveProfile() {
	try {
		const profile = await prisma.profile.findFirst({
			where: { isActive: true },
		});

		if (!profile) {
			// Si no hay perfil activo, intentar activar el primero
			const firstProfile = await prisma.profile.findFirst({
				orderBy: { createdAt: 'asc' },
			});

			if (firstProfile) {
				await prisma.profile.update({
					where: { id: firstProfile.id },
					data: { isActive: true },
				});

				return transformProfile(firstProfile);
			}

			return null;
		}

		return transformProfile(profile);
	} catch (error) {
		console.error('Error obteniendo perfil activo:', error);
		throw new Error('Error obteniendo perfil activo');
	}
}

/**
 * Crear un nuevo perfil
 */
export async function createProfile(data: CreateProfileInput) {
	try {
		// Validaciones básicas
		if (!data.name || data.name.trim() === '') {
			throw new Error('El nombre es requerido');
		}

		// Preparar datos con valores por defecto
		const profileData = {
			name: data.name.trim(),
			description: data.description?.trim() || '',
			emoji: data.emoji || '👤',
			color: data.color || '#3b82f6',
			theme: data.theme || ThemeMode.SYSTEM,
			language: data.language || Language.SPANISH,
			isActive: data.isActive === true,
		};

		// Si es el primer perfil, activarlo automáticamente
		const profileCount = await prisma.profile.count();
		if (profileCount === 0) {
			profileData.isActive = true;
		} else if (profileData.isActive) {
			// Si se quiere activar, desactivar los demás
			await prisma.profile.updateMany({
				where: { isActive: true },
				data: { isActive: false },
			});
		}

		// Crear perfil
		const profile = await prisma.profile.create({
			data: profileData,
		});

		return transformProfile(profile);
	} catch (error) {
		console.error('Error creando perfil:', error);
		throw error;
	}
}

/**
 * Actualizar un perfil existente
 */
export async function updateProfile(id: string, data: UpdateProfileInput) {
	try {
		// Verificar que el perfil existe
		const profile = await prisma.profile.findUnique({
			where: { id },
		});

		if (!profile) {
			throw new Error('Perfil no encontrado');
		}

		// Preparar datos para actualizar
		const updateData: Record<string, unknown> = {};

		if (data.name !== undefined) updateData.name = data.name.trim();
		if (data.description !== undefined) updateData.description = data.description.trim();
		if (data.emoji !== undefined) updateData.emoji = data.emoji;
		if (data.color !== undefined) updateData.color = data.color;
		if (data.theme !== undefined) updateData.theme = data.theme;
		if (data.language !== undefined) updateData.language = data.language;

		// Si se está activando, desactivar los demás
		if (data.isActive === true && !profile.isActive) {
			await prisma.profile.updateMany({
				where: { isActive: true },
				data: { isActive: false },
			});
			updateData.isActive = true;
		}

		// Actualizar perfil
		const updatedProfile = await prisma.profile.update({
			where: { id },
			data: updateData,
		});

		return transformProfile(updatedProfile);
	} catch (error) {
		console.error(`Error actualizando perfil ${id}:`, error);
		throw error;
	}
}

/**
 * Actualizar preferencias de un perfil
 */
export async function updateProfilePreferences(id: string, preferences: Record<string, unknown>) {
	try {
		// Verificar que el perfil existe
		const profile = await prisma.profile.findUnique({
			where: { id },
		});

		if (!profile) {
			throw new Error('Perfil no encontrado');
		}

		// Validar preferencias
		const validatedPreferences = validateProfilePreferences(preferences);

		// Actualizar solo las preferencias validadas
		const updatedProfile = await prisma.profile.update({
			where: { id },
			data: validatedPreferences,
		});

		return transformProfile(updatedProfile);
	} catch (error) {
		console.error(`Error actualizando preferencias del perfil ${id}:`, error);
		throw error;
	}
}

/**
 * Establecer un perfil como activo
 */
export async function setActiveProfile(id: string) {
	try {
		// Verificar que el perfil existe
		const profile = await prisma.profile.findUnique({
			where: { id },
		});

		if (!profile) {
			throw new Error('Perfil no encontrado');
		}

		// Desactivar todos los perfiles
		await prisma.profile.updateMany({
			where: { isActive: true },
			data: { isActive: false },
		});

		// Activar el perfil seleccionado
		const updatedProfile = await prisma.profile.update({
			where: { id },
			data: { isActive: true },
		});

		return transformProfile(updatedProfile);
	} catch (error) {
		console.error(`Error estableciendo perfil activo ${id}:`, error);
		throw error;
	}
}

/**
 * Eliminar un perfil
 */
export async function deleteProfile(id: string) {
	try {
		// Verificar que el perfil existe
		const profile = await prisma.profile.findUnique({
			where: { id },
		});

		if (!profile) {
			throw new Error('Perfil no encontrado');
		}

		// Verificar si es el único perfil restante
		const profileCount = await prisma.profile.count();
		if (profileCount <= 1) {
			throw new Error('No se puede eliminar el único perfil existente');
		}

		// Si el perfil a eliminar es el activo, debemos activar otro
		let activateAnother = false;
		if (profile.isActive) {
			activateAnother = true;
		}

		// Eliminar el perfil
		await prisma.profile.delete({
			where: { id },
		});

		// Si era el perfil activo, activar el primer perfil disponible
		if (activateAnother) {
			const firstProfile = await prisma.profile.findFirst({
				orderBy: { createdAt: 'asc' },
			});

			if (firstProfile) {
				await prisma.profile.update({
					where: { id: firstProfile.id },
					data: { isActive: true },
				});
			}
		}

		return true;
	} catch (error) {
		console.error(`Error eliminando perfil ${id}:`, error);
		throw error;
	}
}

/**
 * Crear un perfil por defecto si no existe ninguno
 */
export async function ensureDefaultProfile() {
	try {
		const profileCount = await prisma.profile.count();

		if (profileCount === 0) {
			// Crear perfil por defecto
			await prisma.profile.create({
				data: {
					name: 'Perfil por defecto',
					emoji: '👤',
					color: '#3b82f6',
					theme: ThemeMode.SYSTEM,
					language: Language.SPANISH,
					isActive: true,
				},
			});
		}

		// Asegurarse de que haya un perfil activo
		const activeProfile = await prisma.profile.findFirst({
			where: { isActive: true },
		});

		if (!activeProfile) {
			// Activar el primer perfil
			const firstProfile = await prisma.profile.findFirst({
				orderBy: { createdAt: 'asc' },
			});

			if (firstProfile) {
				await prisma.profile.update({
					where: { id: firstProfile.id },
					data: { isActive: true },
				});
			}
		}

		return true;
	} catch (error) {
		console.error('Error asegurando perfil por defecto:', error);
		throw error;
	}
}
