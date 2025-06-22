'use server';

import { db } from '@/lib/db';
import { fromPrismaJsonFile, fromPrismaJsonFiles } from '@/transformers/json-file/transformer';
import type { JsonFileWithStats } from '@/types/entities/json-file';
import type { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

/**
 * Crea un nuevo archivo JSON en la base de datos.
 * @param data - Datos para crear el archivo JSON.
 * @returns El archivo JSON creado con sus estadísticas.
 */
export async function createJsonFile(data: Prisma.JsonFileCreateInput): Promise<JsonFileWithStats> {
	const newJsonFile = await db.jsonFile.create({ data });
	revalidatePath('/json-files'); // Asumiendo que hay una página que lista los archivos
	return fromPrismaJsonFile(newJsonFile);
}

/**
 * Obtiene todos los archivos JSON de la base de datos.
 * @returns Una lista de todos los archivos JSON con sus estadísticas.
 */
export async function getJsonFiles(): Promise<JsonFileWithStats[]> {
	const jsonFiles = await db.jsonFile.findMany();
	return fromPrismaJsonFiles(jsonFiles);
}

/**
 * Obtiene un archivo JSON por su ID.
 * @param id - El ID del archivo JSON a obtener.
 * @returns El archivo JSON encontrado o null si no existe.
 */
export async function getJsonFileById(id: string): Promise<JsonFileWithStats | null> {
	const jsonFile = await db.jsonFile.findUnique({ where: { id } });
	if (!jsonFile) return null;
	return fromPrismaJsonFile(jsonFile);
}

/**
 * Actualiza un archivo JSON existente.
 * @param id - El ID del archivo JSON a actualizar.
 * @param data - Los datos a actualizar.
 * @returns El archivo JSON actualizado con sus estadísticas.
 */
export async function updateJsonFile(
	id: string,
	data: Prisma.JsonFileUpdateInput
): Promise<JsonFileWithStats> {
	const updatedJsonFile = await db.jsonFile.update({ where: { id }, data });
	revalidatePath('/json-files');
	revalidatePath(`/json-files/${id}`); // Asumiendo que hay una página de detalle
	return fromPrismaJsonFile(updatedJsonFile);
}

/**
 * Elimina un archivo JSON de la base de datos.
 * @param id - El ID del archivo JSON a eliminar.
 */
export async function deleteJsonFile(id: string): Promise<void> {
	await db.jsonFile.delete({ where: { id } });
	revalidatePath('/json-files');
}
