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
	id: string;
	type: string;
	description: string;
	imageId?: string | null;
	createdAt: Date;
}

/**
 * Metadatos adicionales para actividades
 */
export interface ActivityMetadata {
	[key: string]: any;
}

/**
 * Interfaz extendida para Activity (con info de imagen y UI)
 */
export interface Activity extends ActivityBase {
	image?: {
		id: string;
		name: string;
		path: string;
		thumbnail?: string | null;
	} | null;
	iconEmoji?: string;
	iconColor?: string;
	category?: string;
	isSelected?: boolean;
	isExpanded?: boolean;
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
	type: string;
	description: string;
	imageId?: string;
}

/**
 * Input para actualización
 */
export type ActivityUpdateInput = Partial<Omit<ActivityBase, 'id' | 'createdAt'>>;

/**
 * Filtros para búsqueda de actividades
 */
export interface ActivityFilters {
	types?: string[];
	startDate?: Date;
	endDate?: Date;
	imageId?: string;
	searchQuery?: string;
	limit?: number;
	offset?: number;
}

/**
 * Respuesta para listado de actividades
 */
export interface ActivityListResponse {
	activities: Activity[];
	totalCount: number;
	hasMore: boolean;
}

/**
 * Esquema Zod para validación de Activity
 */
export const ActivitySchema = z.object({
	id: z.string(),
	type: z.string(),
	description: z.string(),
	imageId: z.string().nullable().optional(),
	createdAt: z.date(),
});

// 🟢 Documentación:
// - Usar solo estos tipos en transformers, server actions y validaciones.
// - Validar siempre con ActivitySchema antes de persistir.
// - ActivityComplete es un alias de Activity para consistencia con otros stores.
