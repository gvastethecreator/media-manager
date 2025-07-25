/**
 * @file Esquemas de validación para configuración
 * @module transformers/settings/schema
 */

import { z } from 'zod';

// Esquemas para temas y lenguajes
export const themeModeSchema = z.enum(['light', 'dark', 'system']);
export const languageSchema = z.enum(['es', 'en']);

// Esquema para la sección de apariencia
export const appearanceSchema = z.object({
	theme: themeModeSchema,
	fontSize: z.number().min(12).max(24),
	language: languageSchema,
	reducedAnimations: z.boolean(),
	highContrast: z.boolean(),
});

// Esquema para la sección de notificaciones
export const notificationsSchema = z.object({
	enabled: z.boolean(),
	email: z.boolean(),
	desktop: z.boolean(),
	frequency: z.enum(['daily', 'weekly', 'monthly']),
});

// Esquema para la sección de privacidad
export const privacySchema = z.object({
	shareUsageData: z.boolean(),
	storeCookies: z.boolean(),
	storeHistory: z.boolean(),
});

// Esquema para la sección avanzada
export const advancedSchema = z.object({
	apiKey: z.string().nullable(),
	devMode: z.boolean(),
	experimentalFeatures: z.boolean(),
});

// Esquema completo de configuración
export const settingsSchema = z.object({
	appearance: appearanceSchema,
	notifications: notificationsSchema,
	privacy: privacySchema,
	advanced: advancedSchema,
	version: z.string().default('1.0.0'),
	lastUpdate: z.date().default(() => new Date()),
	system: z
		.object({
			platform: z.string().default('web'),
			version: z.string().default('1.0.0'),
		})
		.default({}),
});

// Esquema para actualizaciones parciales
export const updateSettingsSchema = z
	.object({
		appearance: appearanceSchema.partial().optional(),
		notifications: notificationsSchema.partial().optional(),
		privacy: privacySchema.partial().optional(),
		advanced: advancedSchema.partial().optional(),
	})
	.partial();

// Tipos inferidos
export type ThemeMode = z.infer<typeof themeModeSchema>;
export type Language = z.infer<typeof languageSchema>;
export type AppearanceSettings = z.infer<typeof appearanceSchema>;
export type NotificationsSettings = z.infer<typeof notificationsSchema>;
export type PrivacySettings = z.infer<typeof privacySchema>;
export type AdvancedSettings = z.infer<typeof advancedSchema>;
export type Settings = z.infer<typeof settingsSchema>;
export type UpdateSettings = z.infer<typeof updateSettingsSchema>;
