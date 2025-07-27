// Serializers para Audio

import type { AudioCreateInput, AudioUpdateInput, AudioWithStats } from '@/types/entities/audio';
import { audioSchema } from '@/types/entities/audio/audio.schema';

type DrizzleAudio = {
	id: string;
	name: string;
	filePath: string;
	duration?: number | null;
	format?: string | null;
	size: number;
	bitrate?: number | null;
	sampleRate?: number | null;
	channels?: number | null;
	metadata?: string | null; // JSON
	thumbnail?: string | null;

	isFavorite: boolean;
	folderId: string;
	createdAt: Date;
	updatedAt: Date;
};

/**
 * Valida un objeto Audio usando el schema
 * ✅ MIGRADO A DRIZZLE
 */
export function validateAudio(input: unknown) {
	return audioSchema.parse(input);
}

/**
 * Serializa datos de audio para operaciones de creación/actualización
 * ✅ MIGRADO A DRIZZLE
 */
export function serializeAudio(data: AudioCreateInput | AudioUpdateInput): AudioCreateInput | AudioUpdateInput {
	return data;
}

/**
 * Deserializa un objeto Audio de Drizzle al tipo de la aplicación
 * ✅ MIGRADO A DRIZZLE
 */
export function deserializeAudio(drizzleAudio: DrizzleAudio): AudioWithStats {
	const { duration, format, bitrate, sampleRate, channels, ...baseAudio } = drizzleAudio;
	return {
		...baseAudio,
		duration: duration ?? null,
		format: format ?? null,
		bitrate: bitrate ?? null,
		sampleRate: sampleRate ?? null,
		channels: channels ?? null,
		entityType: 'audio' as const,
		statistics: {
			duration: duration ?? 0,
			format: format ?? 'mp3',
			bitrate: bitrate ?? 128,
			volumePeaks: [],
			sampleRate: sampleRate ?? 44100,
		},
		path: drizzleAudio.filePath,
		description: null,
		hash: '',
		mimeType: drizzleAudio.format || 'audio/mpeg',
		extension: drizzleAudio.format || 'mp3',
		isArchived: false,
		codec: null,
		title: null,
		artist: null,
		album: null,
		year: null,
		genre: null,
		track: null,
		disc: null,
		albumArtist: null,
		composer: null,
		comment: null,
		lyrics: null,
		bpm: null,
		key: null,
		mood: null,
	};
}
