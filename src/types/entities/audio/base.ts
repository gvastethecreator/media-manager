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
	id: string;
	name: string;
	description: string | null;
	path: string;
	size: number;
	hash: string;
	mimeType: string;
	extension: string;
	folderId: string;
	isFavorite: boolean;
	isArchived: boolean;
	duration: number | null;
	bitrate: number | null;
	sampleRate: number | null;
	channels: number | null;
	format: string | null;
	codec: string | null;
	title: string | null;
	artist: string | null;
	album: string | null;
	year: number | null;
	genre: string | null;
	track: number | null;
	disc: number | null;
	albumArtist: string | null;
	composer: string | null;
	comment: string | null;
	lyrics: string | null;
	bpm: number | null;
	key: string | null;
	mood: string | null;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * 📊 Métricas y estadísticas calculadas para un archivo de Audio.
 * Extiende EntityStats con propiedades específicas de audio.
 */
export interface AudioStatistics extends EntityStats {
	/** Duración del audio en segundos */
	duration: number;
	/** Formato del archivo (por ejemplo, 'mp3', 'wav') */
	format: string;
	/** Tasa de bits en kbps, una medida de la calidad */
	bitrate: number;
	/** Un array de los picos de volumen para visualización */
	volumePeaks: number[];
	/** Tasa de muestreo en Hz */
	sampleRate: number;
	/** Número de canales de audio */
	channels: number;

	// Funciones del sistema de archivos
	/** Whether this is a directory */
	isDirectory: boolean;
	/** Whether this is a file */
	isFile: boolean;
}

/**
 * ✨ Tipo enriquecido de Audio que incluye estadísticas.
 * Este es el tipo canónico para usar en la aplicación.
 */
export interface AudioWithStats extends AudioBase {
	entityType: 'audio';
	stats: AudioStatistics;
	/** Alias para compatibilidad - apunta a stats */
	statistics?: AudioStatistics;
	/** URL del thumbnail (waveform) */
	thumbnailUrl?: string;
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
