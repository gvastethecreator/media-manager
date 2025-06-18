/**
 * @file Tipos canónicos para la entidad Profile
 * @module types/entities/profile/types
 * @warning ⚠️ No importar tipos de Prisma ni de archivos legacy. Usar solo estos tipos en transformers, server actions y validaciones.
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
	description?: string | null;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
	settingsId?: string | null;
	imageId?: string | null;
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
 * Esquema Zod para validación de Profile
 */
export const ProfileSchema = z.object({
	id: z.string(),
	name: z.string(),
	emoji: z.string(),
	color: z.string(),
	description: z.string().nullable().optional(),
	isActive: z.boolean(),
	createdAt: z.date(),
	updatedAt: z.date(),
	settingsId: z.string().nullable().optional(),
	imageId: z.string().nullable().optional(),
});

// 🟢 Documentación y advertencia:
// - Usar solo estos tipos en transformers, server actions y validaciones.
// - No importar tipos de Prisma ni de archivos legacy.
// - Validar siempre con ProfileSchema antes de persistir.
