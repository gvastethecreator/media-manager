import { asc, count, desc, eq, like, or } from 'drizzle-orm';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { db } from '@/lib/drizzle';
import { profiles } from '@/lib/drizzle/schema/index';
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
interface DrizzleProfile {
	color: string;
	createdAt: Date;
	description: string | null;
	emoji: string;
	id: string;
	imageId: string | null;
	isActive: boolean;
	name: string;
	settingsId: string | null;
	updatedAt: Date | null;
}

/**
 * Construye condiciones de filtro para consultas Drizzle
 * ✅ MIGRADO A DRIZZLE
 */
export function buildProfileFilters(filters: ProfileFilters = {}) {
	const conditions = [];

	// Filtro por búsqueda de texto
	if (filters.search) {
		conditions.push(or(like(profiles.name, `%${filters.search}%`), like(profiles.description, `%${filters.search}%`)));
	}

	// Filtro por estado activo
	if (filters.isActive !== undefined) {
		conditions.push(eq(profiles.isActive, filters.isActive));
	}

	// Nota: Los filtros por tema e idioma requieren join con la tabla settings
	// TODO: Implementar filtros por tema e idioma con join a settings

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
	const validSortFields = ['name', 'createdAt', 'updatedAt'] as const;
	const validSortBy = validSortFields.includes(sortBy as any) ? (sortBy as keyof typeof profiles) : 'name';

	const orderBy = sortDirection === 'asc' ? asc(profiles[validSortBy] as any) : desc(profiles[validSortBy] as any);

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
	try {
		const result = await db.select().from(profiles).where(eq(profiles.isActive, true)).limit(1);
		return result && result.length > 0 ? result[0] : null;
	} catch (error) {
		console.error('Error obteniendo perfil activo:', error);
		return null;
	}
}

/**
 * Establece un perfil como activo y los demás como inactivos
 * ✅ MIGRADO A DRIZZLE
 */
export async function setActiveProfile(id: string): Promise<boolean> {
	try {
		// Verificar que el perfil existe
		const profileResult = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1);

		if (!profileResult || profileResult.length === 0) {
			return false;
		}

		// Transacción: desactivar todos los perfiles y activar solo el solicitado
		await db.transaction(async (tx: LibSQLDatabase) => {
			await tx.update(profiles).set({ isActive: false }).where(eq(profiles.isActive, true));

			await tx.update(profiles).set({ isActive: true }).where(eq(profiles.id, id));
		});

		return true;
	} catch (error) {
		console.error('Could not set active profile:', error);
		return false;
	}
}

/**
 * Crea un perfil por defecto si no existe ninguno
 * ✅ MIGRADO A DRIZZLE
 */
export async function ensureDefaultProfile(): Promise<DrizzleProfile> {
	try {
		// Buscar si ya existe algún perfil
		const existingProfilesResult = await db.select({ count: count() }).from(profiles);

		if (!existingProfilesResult || existingProfilesResult.length === 0) {
			// Si no hay resultados, crear perfil por defecto
			const insertResult = await db
				.insert(profiles)
				.values({
					id: `profile-${Date.now()}`,
					name: 'Perfil por defecto',
					emoji: '👤',
					color: 'var(--dt-primary-500)',
					isActive: true,
					description: null,
					settingsId: null,
					imageId: null,
				})
				.returning();

			return (
				insertResult?.[0] ||
				({
					id: `profile-${Date.now()}`,
					name: 'Perfil por defecto',
					emoji: '👤',
					color: 'var(--dt-primary-500)',
					isActive: true,
					description: null,
					settingsId: null,
					imageId: null,
					createdAt: new Date(),
					updatedAt: null,
				} as DrizzleProfile)
			);
		}

		const existingProfiles = existingProfilesResult[0]?.count || 0;

		if (existingProfiles > 0) {
			// Si no hay perfil activo pero hay perfiles, activamos el primero
			const activeProfileResult = await db.select().from(profiles).where(eq(profiles.isActive, true)).limit(1);

			if (activeProfileResult && activeProfileResult.length > 0) {
				return activeProfileResult[0];
			}

			const firstProfileResult = await db.select().from(profiles).orderBy(asc(profiles.createdAt)).limit(1);

			if (firstProfileResult && firstProfileResult.length > 0) {
				const updateResult = await db
					.update(profiles)
					.set({ isActive: true })
					.where(eq(profiles.id, firstProfileResult[0].id))
					.returning();

				return updateResult?.[0] || firstProfileResult[0];
			}
		}

		// Si no hay perfiles, crear uno por defecto
		const insertResult = await db
			.insert(profiles)
			.values({
				id: `profile-${Date.now()}`,
				name: 'Perfil por defecto',
				emoji: '👤',
				color: 'var(--dt-primary-500)',
				isActive: true,
				description: null,
				settingsId: null,
				imageId: null,
			})
			.returning();

		return (
			insertResult?.[0] ||
			({
				id: `profile-${Date.now()}`,
				name: 'Perfil por defecto',
				emoji: '👤',
				color: 'var(--dt-primary-500)',
				isActive: true,
				description: null,
				settingsId: null,
				imageId: null,
				createdAt: new Date(),
				updatedAt: null,
			} as DrizzleProfile)
		);
	} catch (error) {
		console.error('Error en ensureDefaultProfile:', error);
		// Retornar perfil por defecto como fallback
		return {
			id: `profile-${Date.now()}`,
			name: 'Perfil por defecto',
			emoji: '👤',
			color: 'var(--dt-primary-500)',
			isActive: true,
			description: null,
			settingsId: null,
			imageId: null,
			createdAt: new Date(),
			updatedAt: null,
		} as DrizzleProfile;
	}
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
	const booleanFields = ['enableAnimations', 'showThumbnails', 'autoSave', 'enableNotifications'];

	for (const field of booleanFields) {
		if (typeof preferences[field] === 'boolean') {
			(validatedPreferences as any)[field] = preferences[field];
		}
	}

	return validatedPreferences;
}
