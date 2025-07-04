/**
 * @file Validadores para Settings - Validación con Zod
 * @module transformers/settings/validators
 * ✅ MIGRADO A DRIZZLE - Julio 2025
 */

import { z } from 'zod';
import { serverLogger } from '@/lib/logger/server-logger';
import { settingsSchema, updateSettingsSchema, type UpdateSettings } from './schema';
import type { Settings } from '@/types/settings';

const logger = serverLogger.withContext('SettingsValidators');

/**
 * Valida un objeto Settings completo
 */
export function validateSettings(data: unknown): Settings {
	logger.debug('🔍 Validando datos de configuración', { data });

	try {
		const result = settingsSchema.parse(data);
		logger.debug('✅ Configuración válida', { result });
		return result;
	} catch (error) {
		logger.error('❌ Error validando configuración:', error);
		throw new Error(`Datos de configuración inválidos: ${error instanceof z.ZodError ? error.errors.map(e => e.message).join(', ') : String(error)}`);
	}
}

/**
 * Valida datos para actualizar configuración (parcial)
 */
export function validateSettingsUpdate(data: unknown): UpdateSettings {
	logger.debug('🔍 Validando datos de actualización de configuración', { data });

	try {
		const result = updateSettingsSchema.parse(data);
		logger.debug('✅ Actualización de configuración válida', { result });
		return result;
	} catch (error) {
		logger.error('❌ Error validando actualización de configuración:', error);
		throw new Error(`Datos de actualización de configuración inválidos: ${error instanceof z.ZodError ? error.errors.map(e => e.message).join(', ') : String(error)}`);
	}
}

/**
 * Valida solo la sección de apariencia
 */
export function validateAppearanceSettings(data: unknown): Settings['appearance'] {
	logger.debug('🔍 Validando configuración de apariencia', { data });

	const appearanceSchema = z.object({
		theme: z.enum(['light', 'dark', 'system']),
		fontSize: z.number().min(12).max(24),
		language: z.enum(['es', 'en']),
		reducedAnimations: z.boolean(),
		highContrast: z.boolean(),
	});

	try {
		const result = appearanceSchema.parse(data);
		logger.debug('✅ Configuración de apariencia válida', { result });
		return result;
	} catch (error) {
		logger.error('❌ Error validando configuración de apariencia:', error);
		throw new Error(`Configuración de apariencia inválida: ${error instanceof z.ZodError ? error.errors.map(e => e.message).join(', ') : String(error)}`);
	}
}

/**
 * Valida solo la sección de notificaciones
 */
export function validateNotificationsSettings(data: unknown): Settings['notifications'] {
	logger.debug('🔍 Validando configuración de notificaciones', { data });

	const notificationsSchema = z.object({
		enabled: z.boolean(),
		email: z.boolean(),
		desktop: z.boolean(),
		frequency: z.enum(['daily', 'weekly', 'monthly']),
	});

	try {
		const result = notificationsSchema.parse(data);
		logger.debug('✅ Configuración de notificaciones válida', { result });
		return result;
	} catch (error) {
		logger.error('❌ Error validando configuración de notificaciones:', error);
		throw new Error(`Configuración de notificaciones inválida: ${error instanceof z.ZodError ? error.errors.map(e => e.message).join(', ') : String(error)}`);
	}
}

/**
 * Valida solo la sección de privacidad
 */
export function validatePrivacySettings(data: unknown): Settings['privacy'] {
	logger.debug('🔍 Validando configuración de privacidad', { data });

	const privacySchema = z.object({
		shareUsageData: z.boolean(),
		storeCookies: z.boolean(),
		storeHistory: z.boolean(),
	});

	try {
		const result = privacySchema.parse(data);
		logger.debug('✅ Configuración de privacidad válida', { result });
		return result;
	} catch (error) {
		logger.error('❌ Error validando configuración de privacidad:', error);
		throw new Error(`Configuración de privacidad inválida: ${error instanceof z.ZodError ? error.errors.map(e => e.message).join(', ') : String(error)}`);
	}
}

/**
 * Valida solo la sección avanzada
 */
export function validateAdvancedSettings(data: unknown): Settings['advanced'] {
	logger.debug('🔍 Validando configuración avanzada', { data });

	const advancedSchema = z.object({
		apiKey: z.string().nullable(),
		devMode: z.boolean(),
		experimentalFeatures: z.boolean(),
	});

	try {
		const result = advancedSchema.parse(data);
		logger.debug('✅ Configuración avanzada válida', { result });
		return result;
	} catch (error) {
		logger.error('❌ Error validando configuración avanzada:', error);
		throw new Error(`Configuración avanzada inválida: ${error instanceof z.ZodError ? error.errors.map(e => e.message).join(', ') : String(error)}`);
	}
}

/**
 * Validación segura que devuelve un resultado sin lanzar errores
 */
export function safeValidateSettings(data: unknown): { success: true; data: Settings } | { success: false; error: string } {
	logger.debug('🔍 Validación segura de configuración', { data });

	try {
		const result = validateSettings(data);
		return { success: true, data: result };
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		logger.warn('⚠️ Validación segura falló:', { error: errorMessage });
		return { success: false, error: errorMessage };
	}
}

/**
 * Validación segura para actualizaciones que devuelve un resultado sin lanzar errores
 */
export function safeValidateSettingsUpdate(data: unknown): { success: true; data: UpdateSettings } | { success: false; error: string } {
	logger.debug('🔍 Validación segura de actualización de configuración', { data });

	try {
		const result = validateSettingsUpdate(data);
		return { success: true, data: result };
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		logger.warn('⚠️ Validación segura de actualización falló:', { error: errorMessage });
		return { success: false, error: errorMessage };
	}
}
