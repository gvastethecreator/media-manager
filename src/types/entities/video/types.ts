/**
 * @file Tipos de datos para la entidad Video
 * @module types/entities/video/types
 */

import type { Album } from '../album/types';
import type { Character } from '../character/character-types';
import type { Collection } from '../collection/collection-types';
import type { Concept } from '../concept/concept-types';
import type { Folder } from '../folder/base';
import type { Group } from '../group/group-types';
import type { Note } from '../note/note-types';
import type { Place } from '../place/place-types';
import type { Prompt } from '../prompt/prompt-types';
import type { Property } from '../property/property-types';
import type { Tag } from '../tag/tag-types';
import type { Wildcard } from '../wildcard/wildcard-types';
import type { WorldItem } from '../world-item/world-item-types';
import type { VideoFormat, VideoPrivacyLevel } from './enums';

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
