/**
 * @file Tipos de datos para la entidad Video
 * @module types/entities/video/types
 */

import type { VideoFormat, VideoPrivacyLevel, VideoType } from './enums';

/**
 * Interfaz base para video
 */
export interface VideoBase {
	id: string;
	title: string;
	description?: string;
	path: string;
	thumbnailPath?: string;
	createdAt: Date | string;
	updatedAt: Date | string;
	ownerId: string;
	isArchived: boolean;
	type: VideoType;
}

/**
 * Capítulo de video
 */
export interface VideoChapter {
	id: string;
	title: string;
	startTime: number; // Tiempo en segundos
	endTime: number; // Tiempo en segundos
	thumbnailPath?: string;
}

/**
 * Estado de reproducción de video
 */
export interface VideoPlayState {
	position: number; // Posición actual en segundos
	lastPlayed: Date | string;
	completed: boolean;
	favorite: boolean;
	watchCount: number;
}

/**
 * Metadatos del video
 */
export interface VideoMetadata {
	duration: number; // Duración en segundos
	width: number; // Ancho en píxeles
	height: number; // Alto en píxeles
	format: VideoFormat;
	size: number; // Tamaño en bytes
	codec?: string;
	bitrate?: number; // Bits por segundo
	frameRate?: number; // Frames por segundo
	aspectRatio?: string; // Ejemplo: "16:9"
	audioCodec?: string;
	audioChannels?: number;
	audioSampleRate?: number;
	rotation?: number; // Rotación en grados
	hasAudio?: boolean;
	subtitleLanguages?: string[]; // Códigos de idioma ISO
	audioLanguages?: string[]; // Códigos de idioma ISO
	creationDate?: Date | string;
	location?: {
		latitude: number;
		longitude: number;
		name?: string;
	};
	camera?: {
		make?: string;
		model?: string;
		software?: string;
	};
}

/**
 * Interfaz extendida para video con todas las propiedades
 */
export interface Video extends VideoBase {
	metadata?: VideoMetadata;
	thumbnailUrl?: string;
	playState?: VideoPlayState;
	chapters?: VideoChapter[];
	tags: string[];
	albums?: Array<{ id: string; name: string }>;
	privacyLevel: VideoPrivacyLevel;
	sharedWith?: string[];
	isSelected?: boolean;
	isFavorite: boolean;
}

/**
 * Datos para la creación de un nuevo video
 */
export interface CreateVideoData {
	name: string;
	description?: string;
	path: string;
	folderId: string;
	metadata?: VideoMetadata | string;
	presetId?: string;
}

/**
 * Configuración visual para videos
 */
export interface VideoVisualConfig {
	id: string;
	videoId?: string;
	enable3DEffect: boolean;
	designSystem?: string;
	enableHolographicEffect: boolean;
	enableGlowEffect: boolean;
	enableAnimatedBorder: boolean;
	enableLightHalo: boolean;
	layerSystem?: string;
	effects?: string;
	performance?: string;
	states?: string;
	createdAt: Date | string;
	updatedAt: Date | string;
	presetId?: string;
}
