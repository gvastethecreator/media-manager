/**
 * @file Tipos canónicos para la entidad Profile
 * @module types/entities/profile/types
 * @description Estructura unificada y validada para Profile.
 * Última migración: 2025-06-18
 */

import { z } from 'zod';

/**
 * Enum para el tema del perfil
 */
export enum ThemeMode {
	SYSTEM = 'system',
	LIGHT = 'light',
	DARK = 'dark',
}

/**
 * Enum para el idioma del perfil
 */
export enum Language {
	SPANISH = 'es',
	ENGLISH = 'en',
	PORTUGUESE = 'pt',
	FRENCH = 'fr',
}

/**
 * Tipo base canónico para Profile
 */
export interface ProfileBase {
	id: string;
	name: string;
	emoji: string;
	color: string;
	description: string | null;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
	settingsId: string | null;
	imageId: string | null;
}

/**
 * Input para creación
 */
export interface ProfileCreateInput {
	name: string;
	emoji?: string;
	color?: string;
	theme?: ThemeMode;
	language?: Language;
	description?: string;
	isActive?: boolean;
}

/**
 * Input para actualización
 */
export type ProfileUpdateInput = Partial<Omit<ProfileBase, 'id' | 'createdAt' | 'updatedAt'>>;

/**
 * Alias de compatibilidad para código legacy
 */
export type CreateProfileInput = ProfileCreateInput;
export type UpdateProfileInput = ProfileUpdateInput;

/**
 * Tipo extendido para UI con información adicional
 */
export interface ProfileExtended extends ProfileBase {
	// Estadísticas adicionales
	imageCount?: number;
	albumCount?: number;
	lastAccessed?: Date | null;
	// Preferencias del perfil
	preferences?: ProfilePreferences;
}

/**
 * Preferencias del perfil
 */
export interface ProfilePreferences {
	theme: ThemeMode;
	color: string;
	emoji: string;
	language: Language;
	enableAnimations: boolean;
	enableSounds: boolean;
	enableHaptics: boolean;
	enableNotifications: boolean;
	defaultView: 'grid' | 'list' | 'gallery' | 'compact';
	defaultSort: 'name' | 'date' | 'size' | 'type';
	itemsPerPage: number;
	showHiddenFiles: boolean;
	highContrast: boolean;
	reducedMotion: boolean;
	fontSize: 'small' | 'medium' | 'large';
	outlineElements: boolean;
}

/**
 * Filtros para búsqueda de perfiles
 */
export interface ProfileFilters {
	search?: string;
	isActive?: boolean;
	theme?: ThemeMode;
	language?: Language;
}

/**
 * Opciones de paginación para perfiles
 */
export interface ProfilePaginationOptions {
	page?: number;
	limit?: number;
	sortBy?: 'name' | 'createdAt' | 'updatedAt';
	sortDirection?: 'asc' | 'desc';
}

/**
 * Respuesta paginada de perfiles
 */
export interface PaginatedProfiles {
	items: ProfileExtended[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

/**
 * Esquema Zod para validación de Profile
 */
export const ProfileSchema = z.object({
	id: z.string(),
	name: z.string(),
	emoji: z.string().nullable(),
	color: z.string().nullable(),
	description: z.string().nullable(),
	isActive: z.boolean(),
	theme: z.nativeEnum(ThemeMode).nullable(),
	language: z.nativeEnum(Language).nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
	settingsId: z.string().nullable().optional(),
	imageId: z.string().nullable().optional(),
});

// 🟢 Documentación:
// - Usar solo estos tipos en transformers, server actions y validaciones.
// - Validar siempre con ProfileSchema antes de persistir.
