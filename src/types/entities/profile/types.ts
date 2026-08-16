/**
 * @file Tipos canónicos para la entidad Profile
 * @module types/entities/profile/types
 * @description Estructura unificada y validada para Profile.
 * Última migración: 2025-06-18
 */

import { z } from 'zod';

import { Language, ThemeMode } from './enums';

/**
 * Tipo base canónico para Profile
 */
export interface ProfileBase {
	avatar?: string | null;
	bio?: string | null;
	color: string;
	createdAt: Date;
	description: string | null;
	// Propiedades adicionales para compatibilidad
	email?: string;
	emoji: string;
	id: string;
	imageId: string | null;
	isActive: boolean;
	location?: string | null;
	name: string;
	preferences?: ProfilePreferences;
	settingsId: string | null;
	updatedAt: Date;
	website?: string | null;
}

/**
 * Input para creación
 */
export interface ProfileCreateInput {
	color?: string;
	description?: string;
	emoji?: string;
	isActive?: boolean;
	language?: Language;
	name: string;
	theme?: ThemeMode;
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

import { EntityStats } from '../entity.types';

/**
 * Estadísticas del perfil
 */
export interface ProfileStatistics extends EntityStats {
	activeDays: number;
	createdThisMonth: number;
	folderCount: number;
	isVerified?: boolean;
	// Propiedades adicionales para compatibilidad con serializers
	joinDate?: Date;
	lastAccessed: Date | null;
	totalStorageUsed: number;
}

/**
 * Perfil con estadísticas
 */
export interface ProfileWithStats extends ProfileBase {
	entityType: 'profile';
	stats: ProfileStatistics;
}

/**
 * Tipo extendido para UI con información adicional
 */
export interface ProfileExtended extends ProfileBase {
	albumCount?: number;
	avatarUrl?: string | null;
	// Estadísticas adicionales
	imageCount?: number;
	lastAccessed?: Date | null;
	// Preferencias del perfil
	preferences?: ProfilePreferences;
	// Propiedades adicionales para UI
	theme?: ThemeMode;
}

/**
 * Preferencias del perfil
 */
export interface ProfilePreferences {
	color: string;
	defaultSort: 'name' | 'date' | 'size' | 'type';
	defaultView: 'grid' | 'list' | 'gallery' | 'compact';
	emoji: string;
	enableAnimations: boolean;
	enableHaptics: boolean;
	enableNotifications: boolean;
	enableSounds: boolean;
	fontSize: 'small' | 'medium' | 'large';
	highContrast: boolean;
	itemsPerPage: number;
	language: Language;
	outlineElements: boolean;
	reducedMotion: boolean;
	showHiddenFiles: boolean;
	theme: ThemeMode;
}

/**
 * Filtros para búsqueda de perfiles
 */
export interface ProfileFilters {
	isActive?: boolean;
	language?: Language;
	search?: string;
	theme?: ThemeMode;
}

/**
 * Opciones de paginación para perfiles
 */
export interface ProfilePaginationOptions {
	limit?: number;
	page?: number;
	sortBy?: 'name' | 'isActive' | 'createdAt' | 'updatedAt';
	sortDirection?: 'asc' | 'desc';
}

/**
 * Respuesta paginada de perfiles
 */
export interface PaginatedProfiles {
	items: ProfileExtended[];
	limit: number;
	page: number;
	total: number;
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

// Re-export enums for convenience
export { Language, ThemeMode };
