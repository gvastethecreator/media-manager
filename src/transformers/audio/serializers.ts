// Serializers para Audio

import type { Audio, AudioCreateInput, AudioUpdateInput } from '@/types/entities/audio';
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
export function validateAudio(input: unknown): Audio {
	return audioSchema.parse(input) as Audio;
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
export function deserializeAudio(drizzleAudio: DrizzleAudio): Audio {
	return audioSchema.parse(drizzleAudio) as Audio;
}
