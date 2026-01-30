/**
 * @file Esquemas de validación Zod para Profile
 * @module types/entities/profile/schema
 */

import { z } from 'zod';
import { Language, ThemeMode } from './types';

// Esquema para preferencias de perfil
export const profilePreferencesSchema = z.object({
	theme: z.nativeEnum(ThemeMode).default(ThemeMode.SYSTEM),
	color: z
		.string()
		.refine(
			(val) => /^#[0-9A-Fa-f]{6}$/.test(val) || val.startsWith('var(--'),
			'Color debe ser un valor hexadecimal o una variable CSS válida'
		)
		.default('var(--entity-profile)'),
	emoji: z.string().emoji('Debe ser un emoji válido').default('👤'),
	language: z.nativeEnum(Language).default(Language.SPANISH),
	enableAnimations: z.boolean().default(true),
	enableSounds: z.boolean().default(false),
	enableHaptics: z.boolean().default(false),
	enableNotifications: z.boolean().default(true),
	defaultView: z.enum(['grid', 'list', 'gallery', 'compact']).default('grid'),
	defaultSort: z.enum(['name', 'date', 'size', 'type']).default('name'),
	itemsPerPage: z.number().int().min(10).max(100).default(50),
	showHiddenFiles: z.boolean().default(false),
	highContrast: z.boolean().default(false),
	reducedMotion: z.boolean().default(false),
	fontSize: z.enum(['small', 'medium', 'large']).default('medium'),
	outlineElements: z.boolean().default(false),
});

// Esquema para crear un perfil
export const createProfileSchema = z.object({
	name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres').max(50, 'Nombre no puede exceder 50 caracteres'),
	emoji: z.string().emoji('Debe ser un emoji válido').optional(),
	color: z
		.string()
		.refine(
			(val) => /^#[0-9A-Fa-f]{6}$/.test(val) || val.startsWith('var(--'),
			'Color debe ser un valor hexadecimal o una variable CSS válida'
		)
		.optional(),
	theme: z.nativeEnum(ThemeMode).optional(),
	language: z.nativeEnum(Language).optional(),
	description: z.string().max(500, 'Descripción no puede exceder 500 caracteres').nullable().optional(),
	isActive: z.boolean().optional(),
});

// Esquema para actualizar un perfil
export const updateProfileSchema = createProfileSchema.partial();

// Esquema para actualizar preferencias
export const updateProfilePreferencesSchema = profilePreferencesSchema.partial();

// Esquema para filtros de búsqueda
export const profileFiltersSchema = z.object({
	search: z.string().optional(),
	isActive: z.boolean().optional(),
	theme: z.nativeEnum(ThemeMode).optional(),
	language: z.nativeEnum(Language).optional(),
});

// Esquema para opciones de paginación
export const profilePaginationSchema = z.object({
	page: z.number().int().min(1).optional(),
	limit: z.number().int().min(1).max(100).optional(),
	sortBy: z.enum(['name', 'isActive', 'createdAt', 'updatedAt']).optional(),
	sortDirection: z.enum(['asc', 'desc']).optional(),
});

// Inferencia de tipos desde los esquemas
export type ProfilePreferencesSchemaType = z.infer<typeof profilePreferencesSchema>;
export type CreateProfileSchemaType = z.infer<typeof createProfileSchema>;
export type UpdateProfileSchemaType = z.infer<typeof updateProfileSchema>;
export type UpdateProfilePreferencesSchemaType = z.infer<typeof updateProfilePreferencesSchema>;
export type ProfileFiltersSchemaType = z.infer<typeof profileFiltersSchema>;
export type ProfilePaginationSchemaType = z.infer<typeof profilePaginationSchema>;
