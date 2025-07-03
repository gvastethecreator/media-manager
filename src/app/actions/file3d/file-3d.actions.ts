'use server';

import type { Prisma } from '@prisma/client';
import { revalidatePath } from '@/lib/server/revalidate';
import * as File3DService from '@/services/file3d';
import type { File3DWithStats } from '@/types/entities/file3d';

/**
 * 🧊 Server Actions para la entidad File3D
 * @description Controladores delgados que delegan toda la lógica al servicio
 */

/**
 * Crea un nuevo archivo 3D
 * @param data - Datos para crear el archivo 3D
 * @returns El archivo 3D creado con sus estadísticas
 */
export async function createFile3D(data: Prisma.File3DCreateInput): Promise<File3DWithStats> {
	const result = await File3DService.createFile3D(data);
	revalidatePath('/file3ds');
	return result;
}

/**
 * Obtiene todos los archivos 3D
 * @returns Lista de archivos 3D con sus estadísticas
 */
export async function getFile3Ds(): Promise<File3DWithStats[]> {
	return await File3DService.getFile3Ds();
}

/**
 * Obtiene un archivo 3D por su ID
 * @param id - ID del archivo 3D
 * @returns El archivo 3D encontrado o null si no existe
 */
export async function getFile3DById(id: string): Promise<File3DWithStats | null> {
	return await File3DService.getFile3DById(id);
}

/**
 * Actualiza un archivo 3D existente
 * @param id - ID del archivo 3D a actualizar
 * @param data - Datos a actualizar
 * @returns El archivo 3D actualizado
 */
export async function updateFile3D(id: string, data: Prisma.File3DUpdateInput): Promise<File3DWithStats> {
	const result = await File3DService.updateFile3D(id, data);
	revalidatePath('/file3ds');
	revalidatePath(`/file3ds/${id}`);
	return result;
}

/**
 * Elimina un archivo 3D
 * @param id - ID del archivo 3D a eliminar
 */
export async function deleteFile3D(id: string): Promise<void> {
	await File3DService.deleteFile3D(id);
	revalidatePath('/file3ds');
}
