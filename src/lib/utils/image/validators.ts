/**
 * @file Validadores para datos de imágenes
 * @module utils/image/validators
 */

import { z } from 'zod';
import { ImageFormat } from '@/types/entities/image/enums';

/**
 * Determina si un formato de imagen es válido
 * @param format Formato a validar
 * @returns true si el formato es válido, false en caso contrario
 */
export function isValidImageFormat(format: string): boolean {
	return Object.values(ImageFormat).includes(format as ImageFormat);
}

/**
 * Schema Zod para metadatos AI de imágenes
 */
export const imageAIMetadataSchema = z.object({
	model: z.string().optional(),
	prompt: z.string().optional(),
	negativePrompt: z.string().optional(),
	seed: z.number().int().optional(),
	samplingSteps: z.number().int().positive().optional(),
	cfgScale: z.number().positive().optional(),
	samplingMethod: z.string().optional(),
	extraParameters: z.record(z.unknown()).optional(),
});

/**
 * Schema Zod para metadatos EXIF de imágenes
 */
export const exifMetadataSchema = z
	.object({
		make: z.string().optional(),
		model: z.string().optional(),
		exposureTime: z.string().or(z.number()).optional(),
		fNumber: z.number().optional(),
		iso: z.number().int().optional(),
		focalLength: z.string().or(z.number()).optional(),
		lensModel: z.string().optional(),
		dateTimeOriginal: z.string().optional(),
		gpsLatitude: z.number().optional(),
		gpsLongitude: z.number().optional(),
		orientation: z.number().int().min(1).max(8).optional(),
	})
	.catchall(z.unknown());

/**
 * Schema Zod para metadatos completos de imágenes
 */
export const imageMetadataSchema = z.object({
	format: z.string().optional(),
	exif: exifMetadataSchema.optional(),
	iptc: z.record(z.unknown()).optional(),
	xmp: z.record(z.unknown()).optional(),
	icc: z.record(z.unknown()).optional(),
	ai: imageAIMetadataSchema.optional(),
});

/**
 * Schema Zod para datos de creación de imágenes
 */
export const createImageSchema = z.object({
	name: z.string().min(1, 'El nombre es requerido'),
	path: z.string().min(1, 'La ruta es requerida'),
	folderId: z.string().min(1, 'El ID de la carpeta es requerido'),
	hash: z.string().min(1, 'El hash es requerido'),
	size: z.number().int().positive('El tamaño debe ser un número positivo'),
	width: z.number().int().positive('El ancho debe ser un número positivo'),
	height: z.number().int().positive('El alto debe ser un número positivo'),
	description: z.string().optional(),
	metadata: z.string().or(imageMetadataSchema).optional(),
	presetId: z.string().nullable().optional(),
});

/**
 * Schema Zod para datos de actualización de imágenes
 */
export const updateImageSchema = z.object({
	name: z.string().optional(),
	description: z.string().optional(),
	presetId: z.string().nullable().optional(),
	isFavorite: z.boolean().optional(),
});

/**
 * Valida un objeto de metadatos de imagen
 * @param metadata Objeto a validar
 * @returns true si los metadatos son válidos, false en caso contrario
 */
export function validateImageMetadata(metadata: unknown): boolean {
	const result = imageMetadataSchema.safeParse(metadata);
	return result.success;
}

/**
 * Valida los datos para la creación de una imagen
 * @param data Datos de creación a validar
 * @returns Los datos validados o un error si no son válidos
 */
export function validateCreateImageData(data: unknown) {
	return createImageSchema.parse(data);
}

/**
 * Valida los datos para la actualización de una imagen
 * @param data Datos de actualización a validar
 * @returns Los datos validados o un error si no son válidos
 */
export function validateUpdateImageData(data: unknown) {
	return updateImageSchema.parse(data);
}

/**
 * Determina si una URL es una imagen válida
 * @param url URL a validar
 * @returns true si la URL es una imagen válida, false en caso contrario
 */
export function isImageUrl(url: string): boolean {
	const imageExtensions = Object.values(ImageFormat);
	const extension = url.split('.').pop()?.toLowerCase();

	return !!extension && imageExtensions.includes(extension as ImageFormat);
}

/**
 * Valida las dimensiones de una imagen
 * @param width Ancho en píxeles
 * @param height Alto en píxeles
 * @param maxWidth Ancho máximo permitido
 * @param maxHeight Alto máximo permitido
 * @returns true si las dimensiones son válidas, false en caso contrario
 */
export function validateImageDimensions(width: number, height: number, maxWidth = 10_000, maxHeight = 10_000): boolean {
	return width > 0 && height > 0 && width <= maxWidth && height <= maxHeight;
}
