'use server';

import type { Prisma } from '@prisma/client';
import { revalidatePath } from '@/lib/server/revalidate';
import * as JsonFileService from '@/services/json-file';
import type { JsonFileWithStats } from '@/types/entities/json-file';

/**
 * 🗂️ Server Actions para la entidad JsonFile
 * @description Controladores delgados que delegan toda la lógica al servicio
 */

/**
 * Obtiene todos los archivos JSON
 */
export async function getJsonFiles(): Promise<JsonFileWithStats[]> {
	return await JsonFileService.getJsonFiles();
}

/**
 * Obtiene un archivo JSON por su ID
 */
export async function getJsonFileById(id: string): Promise<JsonFileWithStats | null> {
	return await JsonFileService.getJsonFileById(id);
}

/**
 * Crea un nuevo archivo JSON
 */
export async function createJsonFile(data: Prisma.JsonFileCreateInput): Promise<JsonFileWithStats> {
	const result = await JsonFileService.createJsonFile(data);
	revalidatePath('/json-files');
	return result;
}

/**
 * Actualiza un archivo JSON existente
 */
export async function updateJsonFile(id: string, data: Prisma.JsonFileUpdateInput): Promise<JsonFileWithStats> {
	const result = await JsonFileService.updateJsonFile(id, data);
	revalidatePath('/json-files');
	revalidatePath(`/json-files/${id}`);
	return result;
}

/**
 * Elimina un archivo JSON
 */
export async function deleteJsonFile(id: string): Promise<void> {
	await JsonFileService.deleteJsonFile(id);
	revalidatePath('/json-files');
}
