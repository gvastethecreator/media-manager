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
	fileName: string;
	fileSize: number;
	mimeType: string;
	type: UploadedFileType;
	category: string;
	hash: string;
	imageId: string;
	isProcessed: boolean;
	processingError: string | null;
	size: number;
	width: number;
	height: number;
	metadata?: string | null;
	uploadedAt: Date;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Interfaz extendida para cliente
 */
export interface UploadedImageExtended extends UploadedImageBase {
	dimensions: UploadedImageDimensions;
	url: string;
	thumbnailUrl?: string;
}

export interface UploadedImageWithStats extends UploadedImageExtended {}

/**
 * Interfaz para dimensiones y aspect ratio
 */
export interface UploadedImageDimensions {
	width: number;
	height: number;
	aspectRatio: number;
}

/**
 * Interfaz extendida para cliente
 */
export interface UploadedImageExtended extends UploadedImageBase {
	dimensions: UploadedImageDimensions;
	url: string;
	thumbnailUrl?: string;
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
