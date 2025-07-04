/**
 * @file Validadores para Tag - Validación con Zod
 * @module transformers/tag/validators
 * ✅ MIGRADO A DRIZZLE - Julio 2025
 */

import { z } from 'zod';
import { serverLogger } from '@/lib/logger/server-logger';
import type { TagBase } from '@/types/entities/tag';

const logger = serverLogger.withContext('TagValidators');

/**
 * Esquema de validación para TagBase completo
 */
export const tagSchema = z.object({
	id: z.string().uuid('ID debe ser un UUID válido'),
	name: z.string().min(1, 'Nombre es requerido').max(100, 'Nombre no puede exceder 100 caracteres'),
	description: z.string().max(500, 'Descripción no puede exceder 500 caracteres').nullable(),
	emoji: z.string().max(10, 'Emoji no puede exceder 10 caracteres').nullable(),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/, 'Color debe ser un código hexadecimal válido')
		.nullable(),
	category: z.string().max(50, 'Categoría no puede exceder 50 caracteres').nullable(),
	shortcut: z.string().max(10, 'Shortcut no puede exceder 10 caracteres').nullable(),
	featuredImage: z.string().url('Featured image debe ser una URL válida').nullable(),
	isFavorite: z.boolean(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

/**
 * Esquema de validación para crear un Tag
 */
export const tagCreateSchema = z.object({
	name: z.string().min(1, 'Nombre es requerido').max(100, 'Nombre no puede exceder 100 caracteres'),
	description: z.string().max(500, 'Descripción no puede exceder 500 caracteres').optional(),
	emoji: z.string().max(10, 'Emoji no puede exceder 10 caracteres').optional(),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/, 'Color debe ser un código hexadecimal válido')
		.default('#6B7280'),
	category: z.string().max(50, 'Categoría no puede exceder 50 caracteres').optional(),
	shortcut: z.string().max(10, 'Shortcut no puede exceder 10 caracteres').optional(),
	featuredImage: z.string().url('Featured image debe ser una URL válida').optional(),
	isFavorite: z.boolean().default(false),
});

/**
 * Esquema de validación para actualizar un Tag
 */
export const tagUpdateSchema = z.object({
	name: z.string().min(1, 'Nombre es requerido').max(100, 'Nombre no puede exceder 100 caracteres').optional(),
	description: z.string().max(500, 'Descripción no puede exceder 500 caracteres').nullable().optional(),
	emoji: z.string().max(10, 'Emoji no puede exceder 10 caracteres').nullable().optional(),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/, 'Color debe ser un código hexadecimal válido')
		.nullable()
		.optional(),
	category: z.string().max(50, 'Categoría no puede exceder 50 caracteres').nullable().optional(),
	shortcut: z.string().max(10, 'Shortcut no puede exceder 10 caracteres').nullable().optional(),
	featuredImage: z.string().url('Featured image debe ser una URL válida').nullable().optional(),
	isFavorite: z.boolean().optional(),
});

// Tipos inferidos
export type TagCreateInput = z.infer<typeof tagCreateSchema>;
export type TagUpdateInput = z.infer<typeof tagUpdateSchema>;

/**
 * Valida un objeto TagBase completo
 */
export function validateTag(data: unknown): TagBase {
	logger.debug('🔍 Validando datos de Tag', { data });

	try {
		const result = tagSchema.parse(data);
		logger.debug('✅ Tag válido', { result });
		return result;
	} catch (error) {
		logger.error('❌ Error validando Tag:', error);
		throw new Error(
			`Datos de Tag inválidos: ${error instanceof z.ZodError ? error.errors.map((e) => e.message).join(', ') : String(error)}`
		);
	}
}

/**
 * Valida datos para crear un Tag
 */
export function validateTagCreate(data: unknown): TagCreateInput {
	logger.debug('🔍 Validando datos de creación de Tag', { data });

	try {
		const result = tagCreateSchema.parse(data);
		logger.debug('✅ Datos de creación de Tag válidos', { result });
		return result;
	} catch (error) {
		logger.error('❌ Error validando datos de creación de Tag:', error);
		throw new Error(
			`Datos de creación de Tag inválidos: ${error instanceof z.ZodError ? error.errors.map((e) => e.message).join(', ') : String(error)}`
		);
	}
}

/**
 * Valida datos para actualizar un Tag
 */
export function validateTagUpdate(data: unknown): TagUpdateInput {
	logger.debug('🔍 Validando datos de actualización de Tag', { data });

	try {
		const result = tagUpdateSchema.parse(data);
		logger.debug('✅ Datos de actualización de Tag válidos', { result });
		return result;
	} catch (error) {
		logger.error('❌ Error validando datos de actualización de Tag:', error);
		throw new Error(
			`Datos de actualización de Tag inválidos: ${error instanceof z.ZodError ? error.errors.map((e) => e.message).join(', ') : String(error)}`
		);
	}
}

/**
 * Validación segura que devuelve un resultado sin lanzar errores
 */
export function safeValidateTag(data: unknown): { success: true; data: TagBase } | { success: false; error: string } {
	logger.debug('🔍 Validación segura de Tag', { data });

	try {
		const result = validateTag(data);
		return { success: true, data: result };
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		logger.warn('⚠️ Validación segura de Tag falló:', { error: errorMessage });
		return { success: false, error: errorMessage };
	}
}

/**
 * Validación segura para datos de creación
 */
export function safeValidateTagCreate(
	data: unknown
): { success: true; data: TagCreateInput } | { success: false; error: string } {
	logger.debug('🔍 Validación segura de creación de Tag', { data });

	try {
		const result = validateTagCreate(data);
		return { success: true, data: result };
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		logger.warn('⚠️ Validación segura de creación de Tag falló:', { error: errorMessage });
		return { success: false, error: errorMessage };
	}
}

/**
 * Validación segura para datos de actualización
 */
export function safeValidateTagUpdate(
	data: unknown
): { success: true; data: TagUpdateInput } | { success: false; error: string } {
	logger.debug('🔍 Validación segura de actualización de Tag', { data });

	try {
		const result = validateTagUpdate(data);
		return { success: true, data: result };
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		logger.warn('⚠️ Validación segura de actualización de Tag falló:', { error: errorMessage });
		return { success: false, error: errorMessage };
	}
}
