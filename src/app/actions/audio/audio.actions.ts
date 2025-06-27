'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import {
    createAudio as createAudioService,
    deleteAudio as deleteAudioService,
    getAudioById as getAudioByIdService,
    getAudios as getAudiosService,
    updateAudio as updateAudioService,
} from '@/services/audio';
import type { AudioWithStats } from '@/types/entities/audio';
import type { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const audioLogger = serverLogger.withContext('AudioActions');

const REVALIDATE_PATHS = ['/audios'] as const;

const revalidateAllPaths = async (id?: string) => {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
	if (id) {
		revalidatePath(`/audios/${id}`);
	}
	audioLogger.info('🔄 Rutas revalidadas');
};

/**
 * Crea un nuevo archivo de audio en la base de datos.
 * @param data - Datos para crear el archivo de audio.
 * @returns El archivo de audio creado con sus estadísticas.
 */
export async function createAudio(data: Prisma.AudioCreateInput): Promise<AudioWithStats> {
	const newAudio = await createAudioService(data);
	await revalidateAllPaths();
	return newAudio;
}

/**
 * Obtiene todos los archivos de audio de la base de datos.
 * @returns Una lista de todos los archivos de audio con sus estadísticas.
 */
export async function getAudios(): Promise<AudioWithStats[]> {
	const audios = await getAudiosService();
	return audios;
}

/**
 * Obtiene un archivo de audio por su ID.
 * @param id - El ID del archivo de audio a obtener.
 * @returns El archivo de audio encontrado o null si no existe.
 */
export async function getAudioById(id: string): Promise<AudioWithStats | null> {
	const audio = await getAudioByIdService(id);
	return audio;
}

/**
 * Actualiza un archivo de audio existente.
 * @param id - El ID del archivo de audio a actualizar.
 * @param data - Los datos a actualizar.
 * @returns El archivo de audio actualizado con sus estadísticas.
 */
export async function updateAudio(id: string, data: Prisma.AudioUpdateInput): Promise<AudioWithStats> {
	const updatedAudio = await updateAudioService(id, data);
	await revalidateAllPaths(id);
	return updatedAudio;
}

/**
 * Elimina un archivo de audio de la base de datos.
 * @param id - El ID del archivo de audio a eliminar.
 */
export async function deleteAudio(id: string): Promise<void> {
	await deleteAudioService(id);
	await revalidateAllPaths();
}
