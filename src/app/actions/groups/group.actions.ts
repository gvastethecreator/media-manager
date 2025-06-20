'use server';

import { getPrismaClient } from '@/lib/db';
import { validateName } from '@/lib/validations';
import {
	fromPrismaGroup,
	toPrismaGroupCreate,
	toPrismaGroupUpdate,
	validateGroup,
} from '@/transformers/group/serializers';
import type { CreateGroupData, GroupWithStats, UpdateGroupData } from '@/types/entities/group/types';
import { revalidatePath } from 'next/cache';

/**
 * Obtiene todos los grupos con sus estadísticas
 */
export async function getGroups(): Promise<GroupWithStats[]> {
	try {
		const prisma = await getPrismaClient();
		const groups = await prisma.group.findMany({
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

		return groups.map((group) => fromPrismaGroup(group));
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
		const prisma = await getPrismaClient();
		const group = await prisma.group.findUnique({
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
		if (!group) throw new Error('Grupo no encontrado');
		return fromPrismaGroup(group);
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
		const prisma = await getPrismaClient();
		// Validar nombre único
		await validateName('group', data.name);

		validateGroup(data);
		const prismaData = toPrismaGroupCreate(data);
		const group = await prisma.group.create({
			data: prismaData,
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
		return fromPrismaGroup(group);
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
		const prisma = await getPrismaClient();
		// Si el nombre cambió, validar que sea único
		const current = await prisma.group.findUnique({ where: { id } });
		if (current && data.name && current.name !== data.name) {
			await validateName('group', data.name);
		}

		validateGroup(data);
		const prismaData = toPrismaGroupUpdate(data);
		const group = await prisma.group.update({
			where: { id },
			data: prismaData,
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
		return fromPrismaGroup(group);
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
		const prisma = await getPrismaClient();
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
		const prisma = await getPrismaClient();
		const current = await prisma.group.findUnique({ where: { id } });
		if (!current) throw new Error('Grupo no encontrado');

		const updatedGroup = await prisma.group.update({
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
		return fromPrismaGroup(updatedGroup);
	} catch (error) {
		console.error('Error al cambiar favorito:', error);
		throw new Error('No se pudo actualizar el estado de favorito');
	}
}
