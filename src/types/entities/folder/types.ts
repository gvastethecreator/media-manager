/**
 * @file Tipos canónicos para la entidad Folder
 * @module types/entities/folder/types
 * @warning ⚠️ No importar tipos de Prisma ni de archivos legacy. Usar solo estos tipos en transformers, server actions y validaciones.
 * @description Estructura unificada y validada para Folder.
 * Última migración: 2025-06-18
 */

import { z } from 'zod';

/**
 * Tipo base canónico para Folder
 */
export interface FolderBase {
	id: string;
	name: string;
	description?: string | null;
	path: string;
	emoji?: string | null;
	color?: string | null;
	featuredImage?: string | null;
	isFavorite: boolean;
	autoReindex: boolean;
	totalFiles: number;
	totalSize: number;
	lastIndexed?: Date | null;
	parentId?: string | null;
	presetId?: string | null;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Input para creación
 */
export interface FolderCreateInput {
	name: string;
	description?: string | null;
	path: string;
	emoji?: string | null;
	color?: string | null;
	featuredImage?: string | null;
	isFavorite?: boolean;
	autoReindex?: boolean;
	parentId?: string | null;
	presetId?: string | null;
}

/**
 * Input para actualización
 */
export type FolderUpdateInput = Partial<Omit<FolderBase, 'id' | 'createdAt' | 'updatedAt'>>;

/**
 * Esquema Zod para validación de Folder
 */
export const FolderSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().nullable().optional(),
	path: z.string(),
	emoji: z.string().nullable().optional(),
	color: z.string().nullable().optional(),
	featuredImage: z.string().nullable().optional(),
	isFavorite: z.boolean(),
	autoReindex: z.boolean(),
	totalFiles: z.number(),
	totalSize: z.number(),
	lastIndexed: z.date().nullable().optional(),
	parentId: z.string().nullable().optional(),
	presetId: z.string().nullable().optional(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

// 🟢 Documentación y advertencia:
// - Usar solo estos tipos en transformers, server actions y validaciones.
// - No importar tipos de Prisma ni de archivos legacy.
// - Validar siempre con FolderSchema antes de persistir.
