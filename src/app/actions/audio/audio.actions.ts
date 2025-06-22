'use server';

import { db } from '@/lib/db';
import { fromPrismaAudio, fromPrismaAudios } from '@/transformers/audio/transformer';
import type { AudioWithStats } from '@/types/entities/audio';
import type { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

/**
 * Crea un nuevo archivo de audio en la base de datos.
 * @param data - Datos para crear el archivo de audio.
 * @returns El archivo de audio creado con sus estadísticas.
 */
export async function createAudio(data: Prisma.AudioCreateInput): Promise<AudioWithStats> {
	const newAudio = await db.audio.create({ data });
	revalidatePath('/audios');
	return fromPrismaAudio(newAudio);
}

/**
 * Obtiene todos los archivos de audio de la base de datos.
 * @returns Una lista de todos los archivos de audio con sus estadísticas.
 */
export async function getAudios(): Promise<AudioWithStats[]> {
	const audios = await db.audio.findMany();
	return fromPrismaAudios(audios);
}

/**
 * Obtiene un archivo de audio por su ID.
 * @param id - El ID del archivo de audio a obtener.
 * @returns El archivo de audio encontrado o null si no existe.
 */
export async function getAudioById(id: string): Promise<AudioWithStats | null> {
	const audio = await db.audio.findUnique({ where: { id } });
	if (!audio) return null;
	return fromPrismaAudio(audio);
}

/**
 * Actualiza un archivo de audio existente.
 * @param id - El ID del archivo de audio a actualizar.
 * @param data - Los datos a actualizar.
 * @returns El archivo de audio actualizado con sus estadísticas.
 */
export async function updateAudio(id: string, data: Prisma.AudioUpdateInput): Promise<AudioWithStats> {
	const updatedAudio = await db.audio.update({ where: { id }, data });
	revalidatePath('/audios');
	revalidatePath(`/audios/${id}`);
	return fromPrismaAudio(updatedAudio);
}

/**
 * Elimina un archivo de audio de la base de datos.
 * @param id - El ID del archivo de audio a eliminar.
 */
export async function deleteAudio(id: string): Promise<void> {
	await db.audio.delete({ where: { id } });
	revalidatePath('/audios');
}
