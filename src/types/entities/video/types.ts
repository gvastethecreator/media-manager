/**
 * @file Tipos de datos para la entidad Video
 * @module types/entities/video/types
 */

import type { Album } from '../album/types';
import type { Character } from '../character/types';
import type { Collection } from '../collection/types';
import type { Concept } from '../concept/types';
import type { Folder } from '../folder/base';
import type { Group } from '../group/types';
import type { Note } from '../note/types';
import type { Place } from '../place/types';
import type { Prompt } from '../prompt/types';
import type { Property } from '../property/types';
import type { Tag } from '../tag/types';
import type { Wildcard } from '../wildcard/types';
import type { WorldItem } from '../world-item/types';
import { VideoFormat, VideoPrivacyLevel } from './enums';

/**
 * Interfaz base para video
 */
export interface VideoBase {
	id: string;
	name: string;
	description: string | null;
	path: string;
	hash: string;
	size: number;
	duration: number;
	width: number | null;
	height: number | null;
	metadata: string | null;
	thumbnail: Buffer | null;
	thumbnailSize: number | null;
	thumbnailWidth: number | null;
	thumbnailHeight: number | null;
	isPublic: boolean;
	isFavorite: boolean;
	folderId: string;
	createdAt: Date;
	updatedAt: Date;
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
	// Relaciones cargadas
	folder?: Folder;

	// Relaciones con entidades principales
	albums?: Album[];
	collections?: Collection[];
	tags?: Tag[];
	characters?: Character[];
	places?: Place[];
	worldItems?: WorldItem[];
	concepts?: Concept[];
	prompts?: Prompt[];
	notes?: Note[];
	wildcards?: Wildcard[];
	properties?: Property[];
	groups?: Group[];

	// UI y metadatos adicionales
	metadata?: VideoMetadata;
	thumbnailUrl?: string;
	playState?: VideoPlayState;
	chapters?: VideoChapter[];
	privacyLevel?: VideoPrivacyLevel;
	sharedWith?: string[];
	isSelected?: boolean;

	// Contadores
	_count?: {
		albums?: number;
		collections?: number;
		tags?: number;
		characters?: number;
		places?: number;
		worldItems?: number;
		concepts?: number;
		prompts?: number;
		notes?: number;
		wildcards?: number;
		properties?: number;
		groups?: number;
	};
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
	hash: string;
	size: number;
	duration: number;
	width?: number;
	height?: number;
}

/**
 * Interfaz para opciones del visor de videos
 */
export interface VideoViewerOptions {
	autoPlay: boolean;
	loop: boolean;
	muted: boolean;
	controls: boolean;
	volume: number;
	playbackRate: number;
}

/**
 * Interfaz para la configuración visual deserializada de un video
 */
export interface VideoVisualConfigComplete {
	id: string;
	videoId: string;
	enable3DEffect: boolean;
	designSystem: string;
	enableHolographicEffect: boolean;
	enableGlowEffect: boolean;
	enableAnimatedBorder: boolean;
	enableLightHalo: boolean;
	// Campos JSON serializados como string
	layerSystem: string;
	effects: string;
	performance: string;
	states: string;
	presetId: string | null;
	// Campos deserializados
	layersConfig?: any;
	effectsConfig?: any;
	performanceConfig?: any;
	statesConfig?: any;
}

/**
 * Interfaz para video con metadatos deserializados
 */
export interface VideoComplete extends VideoBase {
	// Campo metadata siempre deserializado
	metadata: VideoMetadata | null;
}

/**
 * Interfaz para video con relaciones y metadatos deserializados
 */
export interface VideoWithRelationsComplete extends VideoComplete {
	// Relaciones cargadas
	folder?: Folder;

	// Relaciones con entidades principales
	albums?: Album[];
	collections?: Collection[];
	tags?: Tag[];
	characters?: Character[];
	places?: Place[];
	worldItems?: WorldItem[];
	concepts?: Concept[];
	prompts?: Prompt[];
	notes?: Note[];
	wildcards?: Wildcard[];
	properties?: Property[];
	groups?: Group[];

	// Contadores
	_count?: {
		albums?: number;
		collections?: number;
		tags?: number;
		characters?: number;
		places?: number;
		worldItems?: number;
		concepts?: number;
		prompts?: number;
		notes?: number;
		wildcards?: number;
		properties?: number;
		groups?: number;
	};
}

/**
 * Interfaz para video con todas las propiedades extendidas y deserializadas
 */
export interface VideoExtendedComplete extends VideoWithRelationsComplete {
	// UI y metadatos adicionales
	thumbnailUrl?: string;
	playState?: VideoPlayState;
	chapters?: VideoChapter[];
	privacyLevel?: VideoPrivacyLevel;
	sharedWith?: string[];
	isSelected?: boolean;
}
