'use server';

import { getPrismaClient } from '@/lib/db';
import { handlePrismaError } from '@/lib/errors';
import { fromPrismaAudio, fromPrismaAudios } from '@/transformers/audio/transformer';
import type { AudioFormData } from '@/types/entities/audio/types';
import { revalidatePath } from 'next/cache';

// GET
export async function getAudios() {
	try {
		const prisma = await getPrismaClient();
		const audios = await prisma.audio.findMany({
			orderBy: { createdAt: 'desc' },
		});
		return fromPrismaAudios(audios);
	} catch (error) {
		throw handlePrismaError(error);
	}
}

export async function getAudioById(id: string) {
	try {
		const prisma = await getPrismaClient();
		const audio = await prisma.audio.findUnique({
			where: { id },
		});
		if (!audio) {
			throw new Error('Audio no encontrado');
		}
		return fromPrismaAudio(audio);
	} catch (error) {
		throw handlePrismaError(error);
	}
}

// CREATE
export async function createAudio(data: AudioFormData) {
	const { filePath, ...audioData } = data;

	try {
		const prisma = await getPrismaClient();
		const newAudio = await prisma.audio.create({
			data: {
				...audioData,
				filePath: filePath || '',
			},
		});
		revalidatePath('/audio');
		return fromPrismaAudio(newAudio);
	} catch (error) {
		throw handlePrismaError(error);
	}
}

// UPDATE
export async function updateAudio(id: string, data: AudioFormData) {
	const { filePath, ...audioData } = data;

	try {
		const prisma = await getPrismaClient();
		const updatedAudio = await prisma.audio.update({
			where: { id },
			data: {
				...audioData,
				filePath: filePath !== undefined ? filePath : undefined,
			},
		});
		revalidatePath('/audio');
		revalidatePath(`/audio/${id}`);
		return fromPrismaAudio(updatedAudio);
	} catch (error) {
		throw handlePrismaError(error);
	}
}

// DELETE
export async function deleteAudio(id: string) {
	try {
		const prisma = await getPrismaClient();
		await prisma.audio.delete({
			where: { id },
		});
		revalidatePath('/audio');
		return { success: true };
	} catch (error) {
		throw handlePrismaError(error);
	}
}
