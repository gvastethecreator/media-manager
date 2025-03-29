import { prisma } from '@/lib/prisma';
import { transformProfiles } from '@/transformers/profile/profile-transformers';
import {
  Language,
  type PaginatedProfiles,
  type ProfileFilters,
  type ProfilePaginationOptions,
  type ProfilePreferences,
  ThemeMode,
} from '@/types/entities/profile/types';
import type { Profile } from '@prisma/client';

/**
 * Construye una consulta Prisma para Profile con filtros
 */
export function buildProfileQuery(filters: ProfileFilters = {}) {
	const query: Record<string, unknown> = {};

	// Filtro por búsqueda de texto
	if (filters.search) {
		query.OR = [
			{ name: { contains: filters.search, mode: 'insensitive' } },
			{ description: { contains: filters.search, mode: 'insensitive' } },
		];
	}

	// Filtro por estado activo
	if (filters.isActive !== undefined) {
		query.isActive = filters.isActive;
	}

	// Filtro por tema
	if (filters.theme) {
		query.theme = filters.theme;
	}

	// Filtro por idioma
	if (filters.language) {
		query.language = filters.language;
	}

	return query;
}

/**
 * Recupera perfiles paginados con filtros
 */
export async function getPaginatedProfiles(
	filters: ProfileFilters = {},
	pagination: ProfilePaginationOptions = {}
): Promise<PaginatedProfiles> {
	const { page = 1, limit = 10, sortBy = 'name', sortDirection = 'asc' } = pagination;

	const where = buildProfileQuery(filters);

	// Construir ordenación
	const orderBy: Record<string, string> = {};
	orderBy[sortBy] = sortDirection;

	// Consultar total de registros
	const total = await prisma.profile.count({ where });

	// Calcular total de páginas
	const totalPages = Math.ceil(total / limit);

	// Calcular offset
	const skip = (page - 1) * limit;

	// Consultar registros
	const profiles = await prisma.profile.findMany({
		where,
		orderBy,
		skip,
		take: limit,
	});

	// Transformar resultados
	const transformedProfiles = transformProfiles(profiles);

	return {
		items: transformedProfiles,
		total,
		page,
		limit,
		totalPages,
	};
}

/**
 * Obtiene el perfil activo
 */
export async function getActiveProfile(): Promise<Profile | null> {
	return prisma.profile.findFirst({
		where: { isActive: true },
	});
}

/**
 * Establece un perfil como activo y los demás como inactivos
 */
export async function setActiveProfile(id: string): Promise<boolean> {
	try {
		// Verificar que el perfil existe
		const profile = await prisma.profile.findUnique({
			where: { id },
		});

		if (!profile) {
			return false;
		}

		// Transacción: desactivar todos los perfiles y activar solo el solicitado
		await prisma.$transaction([
			prisma.profile.updateMany({
				where: { isActive: true },
				data: { isActive: false },
			}),
			prisma.profile.update({
				where: { id },
				data: { isActive: true },
			}),
		]);

		return true;
	} catch (error) {
		console.error('Error estableciendo perfil activo:', error);
		return false;
	}
}

/**
 * Crea un perfil por defecto si no existe ninguno
 */
export async function ensureDefaultProfile(): Promise<Profile> {
	// Buscar si ya existe algún perfil
	const existingProfiles = await prisma.profile.count();

	if (existingProfiles > 0) {
		// Si no hay perfil activo pero hay perfiles, activamos el primero
		const activeProfile = await prisma.profile.findFirst({
			where: { isActive: true },
		});

		if (!activeProfile) {
			const firstProfile = await prisma.profile.findFirst({
				orderBy: { createdAt: 'asc' },
			});

			if (firstProfile) {
				await prisma.profile.update({
					where: { id: firstProfile.id },
					data: { isActive: true },
				});

				return firstProfile;
			}
		} else {
			return activeProfile;
		}
	}

	// Si no hay perfiles, crear uno por defecto
	return prisma.profile.create({
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

/**
 * Valida y limpia las preferencias del usuario
 */
export function validateProfilePreferences(preferences: Record<string, unknown>): Partial<ProfilePreferences> {
	const validatedPreferences: Partial<ProfilePreferences> = {};

	// Tema
	if (preferences.theme && Object.values(ThemeMode).includes(preferences.theme as ThemeMode)) {
		validatedPreferences.theme = preferences.theme as ThemeMode;
	}

	// Color (validar formato de color hexadecimal)
	if (typeof preferences.color === 'string' && /^#[0-9A-F]{6}$/i.test(preferences.color)) {
		validatedPreferences.color = preferences.color;
	}

	// Emoji (validar que sea un solo emoji)
	if (typeof preferences.emoji === 'string' && preferences.emoji.length <= 2) {
		validatedPreferences.emoji = preferences.emoji;
	}

	// Idioma
	if (preferences.language && Object.values(Language).includes(preferences.language as Language)) {
		validatedPreferences.language = preferences.language as Language;
	}

	// Valores booleanos
	const booleanFields = [
		'enableAnimations',
		'enableSounds',
		'enableHaptics',
		'enableNotifications',
		'showHiddenFiles',
		'highContrast',
		'reducedMotion',
		'outlineElements',
	];

	booleanFields.forEach((field) => {
		if (typeof preferences[field] === 'boolean') {
			validatedPreferences[field as keyof ProfilePreferences] = preferences[field] as boolean;
		}
	});

	// Vista por defecto
	if (preferences.defaultView && ['grid', 'list', 'gallery', 'compact'].includes(preferences.defaultView as string)) {
		validatedPreferences.defaultView = preferences.defaultView as 'grid' | 'list' | 'gallery' | 'compact';
	}

	// Ordenación por defecto
	if (preferences.defaultSort && ['name', 'date', 'size', 'type'].includes(preferences.defaultSort as string)) {
		validatedPreferences.defaultSort = preferences.defaultSort as 'name' | 'date' | 'size' | 'type';
	}

	// Número entero para elementos por página
	if (
		typeof preferences.itemsPerPage === 'number' &&
		Number.isInteger(preferences.itemsPerPage) &&
		preferences.itemsPerPage > 0 &&
		preferences.itemsPerPage <= 100
	) {
		validatedPreferences.itemsPerPage = preferences.itemsPerPage;
	}

	// Tamaño de fuente
	if (preferences.fontSize && ['small', 'medium', 'large'].includes(preferences.fontSize as string)) {
		validatedPreferences.fontSize = preferences.fontSize as 'small' | 'medium' | 'large';
	}

	return validatedPreferences;
}
