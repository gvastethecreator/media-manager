// Serializers para Audio

import type { Audio, AudioCreateInput, AudioUpdateInput } from '@/types/entities/audio';
import { audioSchema } from '@/types/entities/audio/audio.schema';

export function validateAudio(input: unknown): Audio {
	return audioSchema.parse(input);
}

export function serializeAudio(data: AudioCreateInput | AudioUpdateInput): AudioCreateInput | AudioUpdateInput {
	return data;
}

export function deserializeAudio(prismaAudio: any): Audio {
	return audioSchema.parse(prismaAudio);
}
