// Serializers para Audio
import { audioSchema } from '@/types/entities/audio/audio.schema';
import type { Audio } from '@/types/entities/audio';

export function validateAudio(input: unknown): Audio {
	return audioSchema.parse(input);
}
