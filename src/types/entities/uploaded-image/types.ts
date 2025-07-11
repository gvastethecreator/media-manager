/**
 * @file Tipos canónicos para la entidad UploadedImage
 * @module types/entities/uploaded-image/types
 * @description Estructura unificada y validada para UploadedImage.
 * Última migración: 2025-06-18
 */

import { z } from 'zod';

/**
 * Enum para el tipo de archivo subido
 */
export enum UploadedFileType {
	IMAGE = 'image',
	VIDEO = 'video',
	AUDIO = 'audio',
	DOCUMENT = 'document',
	OTHER = 'other',
}

/**
 * Interfaz base canónica para UploadedImage
 */
export interface UploadedImageBase {
	id: string;
	name: string;
	path: string;
	size: number;
	hash: string;
	metadata: string | null;
	imageId: string;
	createdAt: Date;
}

/**
 * Input para creación
 */
export type UploadedImageCreateInput = Omit<UploadedImageBase, 'id' | 'createdAt' | 'updatedAt' | 'hash' | 'imageId'>;

/**
 * Input para actualización
 */
export type UploadedImageUpdateInput = Partial<
	Omit<UploadedImageBase, 'id' | 'createdAt' | 'updatedAt' | 'hash' | 'imageId'>
>;

/**
 * Esquema Zod para validación de UploadedImage
 */
export const UploadedImageSchema = z.object({
	id: z.string(),
	name: z.string(),
	path: z.string(),
	type: z.nativeEnum(UploadedFileType),
	category: z.string(),
	hash: z.string(),
	imageId: z.string(),
	size: z.number(),
	width: z.number(),
	height: z.number(),
	metadata: z.string().nullable().optional(),
	uploadedAt: z.date(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

// 🟢 Documentación:
// - Usar solo estos tipos en transformers, server actions y validaciones.
// - Validar siempre con UploadedImageSchema antes de persistir.
