'use server';

import { db } from '@/lib/db';
import { validateName } from '@/lib/validations';
import { Group } from '@prisma/client';
import { revalidatePath } from 'next/cache';

/**
 * Obtiene todos los grupos con sus estadísticas
 */
export async function getGroups() {
	try {
		return await db.group.findMany({
			include: {
				_count: {
					select: {
						images: true,
						videos: true,
						albums: true,
						collections: true,
						tags: true,
						characters: true,
						places: true,
						worldItems: true,
						concepts: true,
						prompts: true,
						notes: true,
						wildcards: true,
						properties: true,
					},
				},
			},
			orderBy: {
				createdAt: 'desc',
			},
		});
	} catch (error) {
		console.error('Error al obtener grupos:', error);
		throw new Error('No se pudieron obtener los grupos');
	}
}

/**
 * Crea un nuevo grupo
 */
export async function createGroup(data: Partial<Group>) {
	try {
		// Validar nombre único
		await validateName('group', data.name);

		const group = await db.group.create({
			data: {
				name: data.name!,
				emoji: data.emoji || '📂',
				color: data.color || '#3b82f6',
				description: data.description,
				shortcut: data.shortcut,
				category: data.category || 'general',
				sortBy: data.sortBy || 'name',
				filters: data.filters || 'empty_array',
				featuredImage: data.featuredImage,
				isFavorite: data.isFavorite || false,
			},
		});

		revalidatePath('/settings');
		return group;
	} catch (error) {
		console.error('Error al crear grupo:', error);
		throw error;
	}
}

/**
 * Actualiza un grupo existente
 */
export async function updateGroup(id: string, data: Partial<Group>) {
	try {
		// Si el nombre cambió, validar que sea único
		const current = await db.group.findUnique({ where: { id } });
		if (current && data.name && current.name !== data.name) {
			await validateName('group', data.name);
		}

		const group = await db.group.update({
			where: { id },
			data: {
				name: data.name,
				emoji: data.emoji,
				color: data.color,
				description: data.description,
				shortcut: data.shortcut,
				category: data.category,
				sortBy: data.sortBy,
				filters: data.filters,
				featuredImage: data.featuredImage,
				isFavorite: data.isFavorite,
			},
		});

		revalidatePath('/settings');
		return group;
	} catch (error) {
		console.error('Error al actualizar grupo:', error);
		throw error;
	}
}

/**
 * Elimina un grupo
 */
export async function deleteGroup(id: string) {
	try {
		await db.group.delete({
			where: { id },
		});

		revalidatePath('/settings');
		return true;
	} catch (error) {
		console.error('Error al eliminar grupo:', error);
		throw new Error('No se pudo eliminar el grupo');
	}
}

/**
 * Actualiza el estado de favorito de un grupo
 */
export async function toggleGroupFavorite(id: string) {
	try {
		const group = await db.group.findUnique({ where: { id } });
		if (!group) throw new Error('Grupo no encontrado');

		const updated = await db.group.update({
			where: { id },
			data: {
				isFavorite: !group.isFavorite,
			},
		});

		revalidatePath('/settings');
		return updated;
	} catch (error) {
		console.error('Error al actualizar favorito:', error);
		throw error;
	}
}