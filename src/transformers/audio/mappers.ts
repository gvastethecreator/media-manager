// Mappers para Audio
import type { Audio } from '@/types/entities/audio';

export function fromPrismaAudio(prisma: any): Audio {
	return {
		id: prisma.id,
		name: prisma.name,
		filePath: prisma.filePath,
		format: prisma.format,
		duration: prisma.duration ?? undefined,
		size: prisma.size,
		createdAt: prisma.createdAt,
		updatedAt: prisma.updatedAt,
	};
}

export function toPrismaAudio(audio: Audio): any {
	return {
		id: audio.id,
		name: audio.name,
		filePath: audio.filePath,
		format: audio.format,
		duration: audio.duration,
		size: audio.size,
		createdAt: audio.createdAt,
		updatedAt: audio.updatedAt,
	};
}
