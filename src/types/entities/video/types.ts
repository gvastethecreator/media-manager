/**
 * @file Tipos de datos para la entidad Video
 * @module types/entities/video/types
 */

import { z } from 'zod';
import { VideoFormat, VideoPrivacyLevel } from './enums';
import { VideoSchema } from './schema';

// Importación de tipos para relaciones
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

/**
 * 🎥 Metadatos del video
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
 * 📺 Capítulo de video
 */
export interface VideoChapter {
	id: string;
	title: string;
	startTime: number; // Tiempo en segundos
	endTime: number; // Tiempo en segundos
	thumbnailPath?: string;
}

/**
 * ⏯️ Estado de reproducción de video
 */
export interface VideoPlayState {
	position: number; // Posición actual en segundos
	lastPlayed: Date | string;
	completed: boolean;
	favorite: boolean;
	watchCount: number;
}

/**
 * 🔄 Tipo base para Video
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
 * 🔗 Relaciones de Video
 */
export interface VideoRelations {
	folder?: Folder;
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
}

/**
 * 📊 Conteos de relaciones de Video
 */
export interface VideoCounts {
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
 * 🔄 UI y metadatos adicionales
 */
export interface VideoUI {
	thumbnailUrl?: string;
	playState?: VideoPlayState;
	chapters?: VideoChapter[];
	privacyLevel?: VideoPrivacyLevel;
	sharedWith?: string[];
	isSelected?: boolean;
}

/**
 * 🎯 Filtros específicos para Video
 */
export interface VideoFilters {
	search?: string;
	duration?: {
		min?: number;
		max?: number;
	};
	resolution?: {
		min?: number; // altura mínima en píxeles
		max?: number; // altura máxima en píxeles
	};
	formats?: VideoFormat[];
	hasAudio?: boolean;
	isPublic?: boolean;
	isFavorite?: boolean;
	folderId?: string;
	tags?: string[];
	albums?: string[];
	collections?: string[];
	dateRange?: {
		start?: Date;
		end?: Date;
	};
}

/**
 * 🔄 Video completo con todas las relaciones
 */
export interface VideoComplete extends VideoBase, VideoRelations, VideoCounts, VideoUI {}

/**
 * 📝 Datos para crear un Video
 */
export type VideoCreateInput = Omit<VideoBase, 'id' | 'createdAt' | 'updatedAt'> & {
	metadata?: VideoMetadata | string;
} & Partial<VideoRelations>;

/**
 * 📝 Datos para actualizar un Video
 */
export type VideoUpdateInput = Partial<Omit<VideoBase, 'id'>> & {
	metadata?: VideoMetadata | string;
} & Partial<VideoRelations> & Partial<VideoUI>;

/**
 * 🔍 Opciones de búsqueda para Video
 */
export interface VideoSearchOptions {
	skip?: number;
	take?: number;
	orderBy?: {
		[key in keyof VideoBase]?: 'asc' | 'desc';
	};
	where?: VideoFilters;
	include?: {
		folder?: boolean;
		albums?: boolean;
		collections?: boolean;
		tags?: boolean;
		characters?: boolean;
		places?: boolean;
		worldItems?: boolean;
		concepts?: boolean;
		prompts?: boolean;
		notes?: boolean;
		wildcards?: boolean;
		properties?: boolean;
		groups?: boolean;
		_count?: boolean;
	};
}

/**
 * 📊 Resultado de búsqueda de Videos
 */
export interface VideoSearchResult {
	items: VideoComplete[];
	total: number;
	hasMore: boolean;
}

/**
 * 🎯 Opciones para el transformer de Video
 */
export interface VideoTransformerOptions {
	includeRelations?: boolean;
	includeCount?: boolean;
	validateFields?: boolean;
	includeFolder?: boolean;
	includePlayState?: boolean;
	includeChapters?: boolean;
	deserializeMetadata?: boolean;
	customFields?: (keyof VideoComplete)[];
}

/**
 * 🔗 Interfaz para videos relacionados
 */
export interface RelatedVideo {
	id: string;
	name: string;
	thumbnailUrl?: string;
	duration: number;
	count: number;
	strength: number;
}

/**
 * 📊 Interfaz para la configuración visual de un video
 */
export interface VideoVisualConfig {
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
}

/**
 * 📊 Interfaz para la configuración visual deserializada de un video
 */
export interface VideoVisualConfigComplete extends VideoVisualConfig {
	// Campos deserializados
	layersConfig?: any;
	effectsConfig?: any;
	performanceConfig?: any;
	statesConfig?: any;
}

// Tipos inferidos de Zod
export type VideoValidated = z.infer<typeof VideoSchema>;
