/**
 * @file Validadores para datos de videos
 * @module utils/video/validators
 */

import { z } from 'zod';
import { VideoFormat, VideoPrivacyLevel, VideoType } from '../../types/entities/video';

/**
 * Determina si un formato de video es válido
 * @param format Formato a validar
 * @returns true si el formato es válido, false en caso contrario
 */
export function isValidVideoFormat(format: string): boolean {
	return Object.values(VideoFormat).includes(format as VideoFormat);
}

/**
 * Determina si un tipo de video es válido
 * @param type Tipo a validar
 * @returns true si el tipo es válido, false en caso contrario
 */
export function isValidVideoType(type: string): boolean {
	return Object.values(VideoType).includes(type as VideoType);
}

/**
 * Determina si un nivel de privacidad de video es válido
 * @param privacyLevel Nivel de privacidad a validar
 * @returns true si el nivel es válido, false en caso contrario
 */
export function isValidPrivacyLevel(privacyLevel: string): boolean {
	return Object.values(VideoPrivacyLevel).includes(privacyLevel as VideoPrivacyLevel);
}

/**
 * Schema Zod para metadatos de video
 */
export const videoMetadataSchema = z.object({
	duration: z.number().positive(),
	width: z.number().int().positive(),
	height: z.number().int().positive(),
	format: z.nativeEnum(VideoFormat),
	size: z.number().int().positive(),
	codec: z.string().optional(),
	bitrate: z.number().positive().optional(),
	frameRate: z.number().positive().optional(),
	aspectRatio: z.string().optional(),
	audioCodec: z.string().optional(),
	audioChannels: z.number().int().min(0).optional(),
	audioSampleRate: z.number().positive().optional(),
	rotation: z.number().optional(),
	hasAudio: z.boolean().optional(),
	subtitleLanguages: z.array(z.string()).optional(),
	audioLanguages: z.array(z.string()).optional(),
	creationDate: z.string().or(z.date()).optional(),
	location: z
		.object({
			latitude: z.number(),
			longitude: z.number(),
			name: z.string().optional(),
		})
		.optional(),
	camera: z
		.object({
			make: z.string().optional(),
			model: z.string().optional(),
			software: z.string().optional(),
		})
		.optional(),
});

/**
 * Schema Zod para capítulos de video
 */
export const videoChapterSchema = z
	.object({
		id: z.string(),
		title: z.string(),
		startTime: z.number().min(0),
		endTime: z.number().min(0),
		thumbnailPath: z.string().optional(),
	})
	.refine((chapter) => chapter.endTime > chapter.startTime, {
		message: 'El tiempo final debe ser mayor que el tiempo de inicio',
		path: ['endTime'],
	});

/**
 * Schema Zod para datos de creación de video
 */
export const createVideoSchema = z.object({
	title: z.string().min(1, 'El título es requerido'),
	description: z.string().optional(),
	path: z.string(),
	ownerId: z.string(),
	type: z.nativeEnum(VideoType).optional(),
	privacyLevel: z.nativeEnum(VideoPrivacyLevel).optional(),
	tags: z.array(z.string()).optional(),
	albumIds: z.array(z.string()).optional(),
});

/**
 * Schema Zod para datos de actualización de video
 */
export const updateVideoSchema = z.object({
	title: z.string().optional(),
	description: z.string().optional(),
	thumbnailPath: z.string().optional(),
	type: z.nativeEnum(VideoType).optional(),
	privacyLevel: z.nativeEnum(VideoPrivacyLevel).optional(),
	isArchived: z.boolean().optional(),
	isFavorite: z.boolean().optional(),
});

/**
 * Valida un objeto de metadatos de video
 * @param metadata Objeto a validar
 * @returns true si los metadatos son válidos, false en caso contrario
 */
export function validateVideoMetadata(metadata: unknown): boolean {
	const result = videoMetadataSchema.safeParse(metadata);
	return result.success;
}

/**
 * Valida los datos para la creación de un video
 * @param data Datos de creación a validar
 * @returns Los datos validados o un error si no son válidos
 */
export function validateCreateVideoData(data: unknown) {
	return createVideoSchema.parse(data);
}

/**
 * Valida los datos para la actualización de un video
 * @param data Datos de actualización a validar
 * @returns Los datos validados o un error si no son válidos
 */
export function validateUpdateVideoData(data: unknown) {
	return updateVideoSchema.parse(data);
}

/**
 * Valida una colección de capítulos de video
 * @param chapters Capítulos a validar
 * @returns true si los capítulos son válidos, false en caso contrario
 */
export function validateVideoChapters(chapters: unknown[]): boolean {
	// Validar cada capítulo individualmente
	for (const chapter of chapters) {
		const result = videoChapterSchema.safeParse(chapter);
		if (!result.success) return false;
	}

	// Validar que no haya solapamiento entre capítulos
	const sortedChapters = [...chapters].sort((a: any, b: any) => a.startTime - b.startTime);

	for (let i = 0; i < sortedChapters.length - 1; i++) {
		const current = sortedChapters[i] as { startTime: number; endTime: number };
		const next = sortedChapters[i + 1] as { startTime: number; endTime: number };

		if (current.endTime > next.startTime) {
			return false; // Hay solapamiento
		}
	}

	return true;
}

/**
 * Valida si un nombre de archivo de video es válido
 * @param filename Nombre del archivo
 * @returns true si el nombre es válido
 */
export function isValidVideoFilename(filename: string): boolean {
	// Verificar extensión
	const validExtensions = Object.values(VideoFormat).map((ext) => `.${ext.toLowerCase()}`);
	const hasValidExtension = validExtensions.some((ext) => filename.toLowerCase().endsWith(ext));

	// Verificar caracteres no permitidos
	const invalidCharsRegex = /[<>:"\/\\|?*\u0000-\u001F]/g;
	const hasInvalidChars = invalidCharsRegex.test(filename);

	// Verificar longitud
	const isValidLength = filename.length > 0 && filename.length <= 255;

	return hasValidExtension && !hasInvalidChars && isValidLength;
}

/**
 * Esquema Zod para validación de configuración visual de video
 */
export const videoVisualConfigSchema = z.object({
	id: z.string().optional(),
	videoId: z.string().optional(),
	enable3DEffect: z.boolean().default(true),
	designSystem: z.string().optional().default('default_design_system'),
	enableHolographicEffect: z.boolean().default(true),
	enableGlowEffect: z.boolean().default(true),
	enableAnimatedBorder: z.boolean().default(true),
	enableLightHalo: z.boolean().default(true),
	layerSystem: z.string().optional(),
	effects: z.string().optional(),
	performance: z.string().optional(),
	states: z.string().optional(),
	presetId: z.string().optional(),
});

/**
 * Valida datos de configuración visual de video
 * @param data Datos a validar
 * @returns true si los datos son válidos
 */
export function validateVideoVisualConfig(data: unknown): boolean {
	try {
		videoVisualConfigSchema.parse(data);
		return true;
	} catch (error) {
		console.error('Error validando configuración visual de video:', error);
		return false;
	}
}

/**
 * Valida y transforma datos de configuración visual de video
 * @param data Datos a validar
 * @returns Datos validados y transformados o null si son inválidos
 */
export function parseVideoVisualConfig(data: unknown) {
	try {
		return videoVisualConfigSchema.parse(data);
	} catch (error) {
		console.error('Error parseando configuración visual de video:', error);
		return null;
	}
}

/**
 * Esquema Zod para validación de actualización de configuración visual
 */
export const updateVideoVisualConfigSchema = videoVisualConfigSchema.partial();

/**
 * Valida datos de actualización de configuración visual
 * @param data Datos a validar
 * @returns Datos validados y transformados o null si son inválidos
 */
export function validateUpdateVideoVisualConfig(data: unknown) {
	try {
		return updateVideoVisualConfigSchema.parse(data);
	} catch (error) {
		console.error('Error validando actualización de configuración visual:', error);
		return null;
	}
}
