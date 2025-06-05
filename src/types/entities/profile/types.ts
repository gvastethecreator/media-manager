/**
 * @file Tipos base para perfiles de usuario
 * @module types/entities/profile
 */

import type { Profile } from '@prisma/client';
import type {
	CreateProfileSchemaType,
	ProfileFiltersSchemaType,
	ProfilePaginationSchemaType,
	ProfilePreferencesSchemaType,
	UpdateProfilePreferencesSchemaType,
	UpdateProfileSchemaType,
} from './schema';

// Enums para temas
export enum ThemeMode {
	SYSTEM = 'system',
	LIGHT = 'light',
	DARK = 'dark',
}

// Enums para idiomas
export enum Language {
	SPANISH = 'es',
	ENGLISH = 'en',
	PORTUGUESE = 'pt',
	FRENCH = 'fr',
}

// Re-exportar tipos inferidos de Zod
export type ProfilePreferences = ProfilePreferencesSchemaType;
export type CreateProfileInput = CreateProfileSchemaType;
export type UpdateProfileInput = UpdateProfileSchemaType;
export type UpdateProfilePreferencesInput = UpdateProfilePreferencesSchemaType;
export type ProfileFilters = ProfileFiltersSchemaType;
export type ProfilePaginationOptions = ProfilePaginationSchemaType;

/**
 * Interfaz extendida para Profile con campos adicionales para UI
 * @extends Profile - Modelo base de Prisma
 */
export interface ProfileExtended extends Profile {
	/** Preferencias parseadas del perfil */
	parsedPreferences?: ProfilePreferences;
	/** Fecha de creación formateada */
	formattedCreatedAt?: string;
	/** Fecha de actualización formateada */
	formattedUpdatedAt?: string;
	/** Indica si es el perfil actual del usuario */
	isCurrentProfile?: boolean;
}

/**
 * Tipo para resultados paginados de perfiles
 */
export interface PaginatedProfiles {
	/** Lista de perfiles */
	items: ProfileExtended[];
	/** Total de perfiles */
	total: number;
	/** Página actual */
	page: number;
	/** Límite de items por página */
	limit: number;
	/** Total de páginas */
	totalPages: number;
}
