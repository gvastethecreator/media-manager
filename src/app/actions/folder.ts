'use server';

import { DrizzleRepository } from '@/drizzle';
import { revalidatePath } from 'next/cache';

/**
 * Obtener todas las carpetas
 */
export async function getAllFolders() {
	try {
		const folders = await DrizzleRepository.folders.getAll();
		return { success: true, data: folders };
	} catch (error) {
		console.error('Error al obtener carpetas:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Error desconocido',
		};
	}
}

/**
 * Obtener una carpeta por ID
 */
export async function getFolderById(id: string) {
	try {
		const folder = await DrizzleRepository.folders.getById(id);
		if (!folder) {
			return { success: false, error: 'Carpeta no encontrada' };
		}
		return { success: true, data: folder };
	} catch (error) {
		console.error(`Error al obtener carpeta con ID ${id}:`, error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Error desconocido',
		};
	}
}

/**
 * Crear una nueva carpeta
 */
export async function createFolder(data: {
	name: string;
	path: string;
	description?: string;
	parentId?: string;
	emoji?: string;
	color?: string;
}) {
	try {
		const folder = await DrizzleRepository.folders.create({
			name: data.name,
			path: data.path,
			description: data.description,
			parentId: data.parentId,
			emoji: data.emoji,
			color: data.color,
		});

		revalidatePath('/folders');
		return { success: true, data: folder };
	} catch (error) {
		console.error('Error al crear carpeta:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Error desconocido',
		};
	}
}

/**
 * Actualizar una carpeta existente
 */
export async function updateFolder(
	id: string,
	data: {
		name?: string;
		description?: string;
		emoji?: string;
		color?: string;
		isFavorite?: boolean;
	}
) {
	try {
		const folder = await DrizzleRepository.folders.update(id, data);

		revalidatePath('/folders');
		revalidatePath(`/folders/${id}`);
		return { success: true, data: folder };
	} catch (error) {
		console.error(`Error al actualizar carpeta con ID ${id}:`, error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Error desconocido',
		};
	}
}

/**
 * Eliminar una carpeta
 */
export async function deleteFolder(id: string) {
	try {
		await DrizzleRepository.folders.delete(id);

		revalidatePath('/folders');
		return { success: true };
	} catch (error) {
		console.error(`Error al eliminar carpeta con ID ${id}:`, error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Error desconocido',
		};
	}
}
