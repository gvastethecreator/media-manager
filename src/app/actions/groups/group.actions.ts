'use server';

import { prisma } from '@/lib/prisma';
import { validateName } from '@/lib/validations';
import { mapCreateGroupDataToPrisma, mapUpdateGroupDataToPrisma } from '@/transformers/group/mappers';
import type { CreateGroupData, GroupWithStats, UpdateGroupData } from '@/types/entities/group/types';
import { revalidatePath } from 'next/cache';

/**
 * Obtiene todos los grupos con sus estadísticas
 */
export async function getGroups(): Promise<GroupWithStats[]> {
	try {
		return await prisma.group.findMany({
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
 * Obtiene un grupo específico con sus estadísticas
 */
export async function getGroup(id: string): Promise<GroupWithStats | null> {
	try {
		return await prisma.group.findUnique({
			where: { id },
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
		});
	} catch (error) {
		console.error('Error al obtener grupo:', error);
		throw new Error('No se pudo obtener el grupo');
	}
}

/**
 * Crea un nuevo grupo
 */
export async function createGroup(data: CreateGroupData): Promise<GroupWithStats> {
	try {
		// Validar nombre único
		await validateName('group', data.name);

		const group = await prisma.group.create({
			data: mapCreateGroupDataToPrisma(data),
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
export async function updateGroup(id: string, data: UpdateGroupData): Promise<GroupWithStats> {
	try {
		// Si el nombre cambió, validar que sea único
		const current = await prisma.group.findUnique({ where: { id } });
		if (current && data.name && current.name !== data.name) {
			await validateName('group', data.name);
		}

		const group = await prisma.group.update({
			where: { id },
			data: mapUpdateGroupDataToPrisma(data),
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
export async function deleteGroup(id: string): Promise<boolean> {
	try {
		await prisma.group.delete({
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
export async function toggleGroupFavorite(id: string): Promise<GroupWithStats> {
	try {
		const current = await prisma.group.findUnique({ where: { id } });
		if (!current) throw new Error('Grupo no encontrado');

		const group = await prisma.group.update({
			where: { id },
			data: { isFavorite: !current.isFavorite },
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
		});

		revalidatePath('/settings');
		return group;
	} catch (error) {
		console.error('Error al actualizar favorito:', error);
		throw error;
	}
}