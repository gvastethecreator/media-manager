/**
 * @file Tipos canónicos para la entidad Activity
 * @module types/entities/activity/types
 * @warning ⚠️ No importar tipos de Prisma ni de archivos legacy. Usar solo estos tipos en transformers, server actions y validaciones.
 * @description Estructura unificada y validada para Activity.
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
 * Input para creación
 */
export interface ActivityCreateInput {
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

// 🟢 Documentación y advertencia:
// - Usar solo estos tipos en transformers, server actions y validaciones.
// - No importar tipos de Prisma ni de archivos legacy.
// - Validar siempre con ActivitySchema antes de persistir.
