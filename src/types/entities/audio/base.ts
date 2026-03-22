/**
 * @file Tipos base para la entidad Audio.
 * @module types/entities/audio/base
 * @description Define los tipos canónicos para la entidad Audio, siguiendo el nuevo patrón de `...WithStats`.
 */

import type { EntityStats } from '../entity.types';

/**
 * 🎵 Tipo base de Audio directamente desde el schema de Drizzle.
 */
export interface AudioBase {
	album: string | null;
	albumArtist: string | null;
	artist: string | null;
	bitrate: number | null;
	bpm: number | null;
	channels: number | null;
	codec: string | null;
	comment: string | null;
	composer: string | null;
	createdAt: Date;
	description: string | null;
	disc: number | null;
	duration: number | null;
	extension: string;
	folderId: string;
	format: string | null;
	genre: string | null;
	hash: string;
	id: string;
	isArchived: boolean;
	isFavorite: boolean;
	key: string | null;
	lyrics: string | null;
	mimeType: string;
	mood: string | null;
	name: string;
	path: string;
	sampleRate: number | null;
	size: number;
	title: string | null;
	track: number | null;
	updatedAt: Date;
	year: number | null;
}

/**
 * 📊 Métricas y estadísticas calculadas para un archivo de Audio.
 * Extiende EntityStats con propiedades específicas de audio.
 */
export interface AudioStatistics extends EntityStats {
	/** Tasa de bits en kbps, una medida de la calidad */
	bitrate: number;
	/** Número de canales de audio */
	channels: number;
	/** Duración del audio en segundos */
	duration: number;
	/** Formato del archivo (por ejemplo, 'mp3', 'wav') */
	format: string;

	// Funciones del sistema de archivos
	/** Whether this is a directory */
	isDirectory: boolean;
	/** Whether this is a file */
	isFile: boolean;
	/** Tasa de muestreo en Hz */
	sampleRate: number;
	/** Un array de los picos de volumen para visualización */
	volumePeaks: number[];
}

/**
 * ✨ Tipo enriquecido de Audio que incluye estadísticas.
 * Este es el tipo canónico para usar en la aplicación.
 */
export interface AudioWithStats extends AudioBase {
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
	entityType: 'audio';
	/** Alias para compatibilidad - apunta a stats */
	statistics?: AudioStatistics;
	stats: AudioStatistics;
	/** URL del thumbnail (waveform) */
	thumbnailUrl?: string;
}

// --- TIPOS PARA MUTACIONES ---

/**
 * 🆕 Tipo para crear un nuevo Audio
 * Omite campos autogenerados (id, timestamps)
 */
export type AudioCreateInput = Omit<AudioBase, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * ✏️ Tipo para actualizar un Audio existente
 * Todos los campos son opcionales excepto id
 */
export type AudioUpdateInput = Partial<AudioCreateInput>;
