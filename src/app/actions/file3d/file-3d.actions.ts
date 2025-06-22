'use server';

import { db } from '@/lib/db';
import { fromPrismaFile3D, fromPrismaFile3Ds } from '@/transformers/file3d/transformer';
import type { File3DWithStats } from '@/types/entities/file3d';
import type { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

/**
 * Crea un nuevo archivo 3D en la base de datos.
 * @param data - Datos para crear el archivo 3D.
 * @returns El archivo 3D creado con sus estadísticas.
 */
export async function createFile3D(data: Prisma.File3DCreateInput): Promise<File3DWithStats> {
	const newFile3D = await db.file3D.create({ data });
	revalidatePath('/file3ds');
	return fromPrismaFile3D(newFile3D);
}

/**
 * Obtiene todos los archivos 3D de la base de datos.
 * @returns Una lista de todos los archivos 3D con sus estadísticas.
 */
export async function getFile3Ds(): Promise<File3DWithStats[]> {
	const file3Ds = await db.file3D.findMany();
	return fromPrismaFile3Ds(file3Ds);
}

/**
 * Obtiene un archivo 3D por su ID.
 * @param id - El ID del archivo 3D a obtener.
 * @returns El archivo 3D encontrado o null si no existe.
 */
export async function getFile3DById(id: string): Promise<File3DWithStats | null> {
	const file3D = await db.file3D.findUnique({ where: { id } });
	if (!file3D) return null;
	return fromPrismaFile3D(file3D);
}

/**
 * Actualiza un archivo 3D existente.
 * @param id - El ID del archivo 3D a actualizar.
 * @param data - Los datos a actualizar.
 * @returns El archivo 3D actualizado con sus estadísticas.
 */
export async function updateFile3D(id: string, data: Prisma.File3DUpdateInput): Promise<File3DWithStats> {
	const updatedFile3D = await db.file3D.update({ where: { id }, data });
	revalidatePath('/file3ds');
	revalidatePath(`/file3ds/${id}`);
	return fromPrismaFile3D(updatedFile3D);
}

/**
 * Elimina un archivo 3D de la base de datos.
 * @param id - El ID del archivo 3D a eliminar.
 */
export async function deleteFile3D(id: string): Promise<void> {
	await db.file3D.delete({ where: { id } });
	revalidatePath('/file3ds');
}
