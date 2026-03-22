/**
 * @file Tipos canónicos para la entidad Activity
 * @module types/entities/activity/types
 * @description Estructura unificada y validada para Activity. Utilizar estos tipos en toda la aplicación.
 * Última migración: 2025-06-18
 */

import { z } from 'zod';

/**
 * Interfaz base canónica para Activity
 */
export interface ActivityBase {
	action: string;
	createdAt: Date;
	description: string;
	entityId: string;
	entityType: string;
	id: string;
	ipAddress?: string | null;
	metadata?: Record<string, unknown> | null;
	sessionId?: string | null;
	type: string;
	userAgent?: string | null;
	userId: string;
}

/**
 * Metadatos adicionales para actividades
 */
export interface ActivityMetadata {
	[key: string]: unknown;
}

/**
 * Interfaz extendida para Activity (con info de imagen y UI)
 */
export interface Activity extends ActivityBase {
	category?: string;
	iconColor?: string;
	iconEmoji?: string;
	image?: {
		id: string;
		name: string;
		path: string;
		thumbnail?: string | null;
	} | null;
	isExpanded?: boolean;
	isSelected?: boolean;
}

/**
 * Tipo completo para Activity (usado en stores y transformers)
 * Incluye toda la información extendida y metadatos del UI
 */
export type ActivityComplete = Activity;

/**
 * Input para creación
 */
export interface CreateActivityData {
	action: string;
	description: string;
	entityId: string;
	entityType: string;
	ipAddress?: string;
	metadata?: Record<string, unknown>;
	sessionId?: string;
	type: string;
	userAgent?: string;
	userId: string;
}

/**
 * Input para actualización
 */
export type ActivityUpdateInput = Partial<Omit<ActivityBase, 'id' | 'createdAt'>>;

/**
 * Filtros para búsqueda de actividades
 */
export interface ActivityFilters {
	endDate?: Date;
	imageId?: string;
	limit?: number;
	offset?: number;
	searchQuery?: string;
	startDate?: Date;
	types?: string[];
}

/**
 * Respuesta para listado de actividades
 */
export interface ActivityListResponse {
	activities: Activity[];
	hasMore: boolean;
	totalCount: number;
}

/**
 * Esquema Zod para validación de Activity
 */
export const ActivitySchema = z.object({
	id: z.string(),
	type: z.string(),
	entityType: z.string(),
	entityId: z.string(),
	action: z.string(),
	userId: z.string(),
	description: z.string(),
	metadata: z.record(z.string(), z.unknown()).nullable().optional(),
	ipAddress: z.string().nullable().optional(),
	userAgent: z.string().nullable().optional(),
	sessionId: z.string().nullable().optional(),
	createdAt: z.date(),
});

// 🟢 Documentación:
// - Usar solo estos tipos en transformers, server actions y validaciones.
// - Validar siempre con ActivitySchema antes de persistir.
// - ActivityComplete es un alias de Activity para consistencia con otros stores.
