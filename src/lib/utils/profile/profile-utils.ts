import { db } from '@/lib/drizzle';
import { profiles } from '@/lib/drizzle/schema';
import { eq, count, asc, desc, or, like } from 'drizzle-orm';
import { transformProfiles } from '@/transformers/profile/profile-transformers';
import {
	Language,
	type PaginatedProfiles,
	type ProfileFilters,
	type ProfilePaginationOptions,
	type ProfilePreferences,
	ThemeMode,
} from '@/types/entities/profile/types';

// Tipo local para Profile de Drizzle
type DrizzleProfile = {
	id: string;
	name: string;
	description: string | null;
	emoji: string | null;
	color: string | null;
	theme: string;
	language: string;
	isActive: boolean;
	preferences: string | null;
	createdAt: Date;
	updatedAt: Date;
};

/**
 * Construye condiciones de filtro para consultas Drizzle
 * ✅ MIGRADO A DRIZZLE
 */
export function buildProfileFilters(filters: ProfileFilters = {}) {
	const conditions = [];

	// Filtro por búsqueda de texto
	if (filters.search) {
		conditions.push(
			or(
				like(profiles.name, `%${filters.search}%`),
				like(profiles.description, `%${filters.search}%`)
			)
		);
	}

	// Filtro por estado activo
	if (filters.isActive !== undefined) {
		conditions.push(eq(profiles.isActive, filters.isActive));
	}

	// Filtro por tema
	if (filters.theme) {
		conditions.push(eq(profiles.theme, filters.theme));
	}

	// Filtro por idioma
	if (filters.language) {
		conditions.push(eq(profiles.language, filters.language));
	}

	return conditions;
}

/**
 * Recupera perfiles paginados con filtros
 * ✅ MIGRADO A DRIZZLE
 */
export async function getPaginatedProfiles(
	filters: ProfileFilters = {},
	pagination: ProfilePaginationOptions = {}
): Promise<PaginatedProfiles> {
	const { page = 1, limit = 10, sortBy = 'name', sortDirection = 'asc' } = pagination;

	const filterConditions = buildProfileFilters(filters);

	// Consultar total de registros
	const [totalResult] = await db
		.select({ count: count() })
		.from(profiles)
		.where(filterConditions.length > 0 ? filterConditions[0] : undefined);

	const total = totalResult.count;

	// Calcular total de páginas
	const totalPages = Math.ceil(total / limit);

	// Calcular offset
	const skip = (page - 1) * limit;

	// Construir ordenación
	const orderBy = sortDirection === 'asc'
		? asc(profiles[sortBy as keyof typeof profiles])
		: desc(profiles[sortBy as keyof typeof profiles]);

	// Consultar registros
	const profilesData = await db
		.select()
		.from(profiles)
		.where(filterConditions.length > 0 ? filterConditions[0] : undefined)
		.orderBy(orderBy)
		.offset(skip)
		.limit(limit);

	// Transformar resultados
	const transformedProfiles = transformProfiles(profilesData);

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
 * ✅ MIGRADO A DRIZZLE
 */
export async function getActiveProfile(): Promise<DrizzleProfile | null> {
	const [profile] = await db
		.select()
		.from(profiles)
		.where(eq(profiles.isActive, true))
		.limit(1);

	return profile || null;
}

/**
 * Establece un perfil como activo y los demás como inactivos
 * ✅ MIGRADO A DRIZZLE
 */
export async function setActiveProfile(id: string): Promise<boolean> {
	try {
		// Verificar que el perfil existe
		const [profile] = await db
			.select()
			.from(profiles)
			.where(eq(profiles.id, id))
			.limit(1);

		if (!profile) {
			return false;
		}

		// Transacción: desactivar todos los perfiles y activar solo el solicitado
		await db.transaction(async (tx) => {
			await tx
				.update(profiles)
				.set({ isActive: false })
				.where(eq(profiles.isActive, true));

			await tx
				.update(profiles)
				.set({ isActive: true })
				.where(eq(profiles.id, id));
		});

		return true;
	} catch (error) {
		console.error('Error estableciendo perfil activo:', error);
		return false;
	}
}

/**
 * Crea un perfil por defecto si no existe ninguno
 * ✅ MIGRADO A DRIZZLE
 */
export async function ensureDefaultProfile(): Promise<DrizzleProfile> {
	// Buscar si ya existe algún perfil
	const [existingProfilesResult] = await db
		.select({ count: count() })
		.from(profiles);

	const existingProfiles = existingProfilesResult.count;

	if (existingProfiles > 0) {
		// Si no hay perfil activo pero hay perfiles, activamos el primero
		const [activeProfile] = await db
			.select()
			.from(profiles)
			.where(eq(profiles.isActive, true))
			.limit(1);

		if (!activeProfile) {
			const [firstProfile] = await db
				.select()
				.from(profiles)
				.orderBy(asc(profiles.createdAt))
				.limit(1);

			if (firstProfile) {
				const [updatedProfile] = await db
					.update(profiles)
					.set({ isActive: true })
					.where(eq(profiles.id, firstProfile.id))
					.returning();

				return updatedProfile;
			}
		} else {
			return activeProfile;
		}
	}

	// Si no hay perfiles, crear uno por defecto
	const [newProfile] = await db
		.insert(profiles)
		.values({
			name: 'Perfil por defecto',
			emoji: '👤',
			color: '#3b82f6',
			theme: ThemeMode.SYSTEM,
			language: Language.SPANISH,
			isActive: true,
			description: null,
			preferences: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		})
		.returning();

	return newProfile;
}

/**
 * Valida y limpia las preferencias del usuario
 * ✅ MIGRADO A DRIZZLE
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
		'showThumbnails',
		'autoSave',
		'enableNotifications',
	];

	for (const field of booleanFields) {
		if (typeof preferences[field] === 'boolean') {
			(validatedPreferences as any)[field] = preferences[field];
		}
	}

	return validatedPreferences;
}
