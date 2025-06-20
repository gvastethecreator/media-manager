'use server';

// Server Actions para Audio
import { validateAudio } from '@/transformers/audio/serializers';
import type { Audio } from '@/types/entities/audio';

export async function createAudio(input: unknown): Promise<Audio> {
	const audio = validateAudio(input);
	// TODO: Persistir en DB
	return audio;
}

export async function getAudioById(_id: string): Promise<Audio | null> {
	// TODO: Obtener de DB
	return null;
}

export async function updateAudio(_id: string, input: unknown): Promise<Audio> {
	const audio = validateAudio(input);
	// TODO: Actualizar en DB
	return audio;
}

export async function deleteAudio(_id: string): Promise<boolean> {
	// TODO: Eliminar de DB
	return true;
}
