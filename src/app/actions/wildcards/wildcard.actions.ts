'use server';

/**
 * @file Server Actions para la entidad Wildcard
 * @module app/actions/wildcards/wildcard.actions
 * @description Acciones CRUD y de gestión de relaciones para los Wildcards.
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { fromPrismaWildcard, fromPrismaWildcards, mapCreateWildcardDataToPrisma, mapUpdateWildcardDataToPrisma } from '@/transformers/wildcard';
import type { WildcardBase, WildcardComplete, WildcardCreateInput, WildcardUpdateInput } from '@/types/entities/wildcard';
import { revalidatePath } from 'next/cache';

const logger = serverLogger.withContext('WildcardActions');

const WILDCARD_INCLUDE = {
	parent: true,
	childWildcards: {
		orderBy: { name: 'asc' },
	},
	_count: {
		select: {
			childWildcards: true,
		},
	},
};

/**
 * Revalida las rutas de caché relacionadas con los wildcards.
 */
async function revalidateWildcardPaths() {
	revalidatePath('/wildcards');
	revalidatePath('/settings/wildcards');
}

/**
 * Obtiene todos los wildcards.
 */
export async function getWildcards(): Promise<WildcardComplete[]> {
	logger.info('🃏 Obteniendo todos los wildcards');
	const wildcards = await prisma.wildcard.findMany({
		include: WILDCARD_INCLUDE,
		orderBy: { name: 'asc' },
	});
	return fromPrismaWildcards(wildcards);
}

/**
 * Obtiene un único wildcard por su ID.
 */
export async function getWildcard(id: string): Promise<WildcardComplete | null> {
	logger.info(`🔍 Obteniendo wildcard por ID: ${id}`);
	const wildcard = await prisma.wildcard.findUnique({
		where: { id },
		include: WILDCARD_INCLUDE,
	});
	if (!wildcard) {
		logger.warn(`Wildcard no encontrado: ${id}`);
		return null;
	}
	return fromPrismaWildcard(wildcard);
}

/**
 * Crea un nuevo wildcard.
 */
export async function createWildcard(data: WildcardCreateInput): Promise<WildcardBase> {
	logger.info('➕ Creando nuevo wildcard:', { name: data.name });
	const prismaData = mapCreateWildcardDataToPrisma(data);
	const newWildcard = await prisma.wildcard.create({ data: prismaData });
	await revalidateWildcardPaths();
	return newWildcard;
}

/**
 * Actualiza un wildcard existente.
 */
export async function updateWildcard(id: string, data: WildcardUpdateInput): Promise<WildcardBase> {
	logger.info(`🔄 Actualizando wildcard: ${id}`);

	if (data.parentId) {
		const isCircular = await checkCircularReference(id, data.parentId);
		if (isCircular) {
			throw new Error('Referencia circular detectada: un wildcard no puede ser su propio descendiente.');
		}
	}

	const prismaData = mapUpdateWildcardDataToPrisma(data);
	const updatedWildcard = await prisma.wildcard.update({
		where: { id },
		data: prismaData,
	});
	await revalidateWildcardPaths();
	revalidatePath(`/wildcards/${id}`);
	return updatedWildcard;
}

/**
 * Elimina un wildcard.
 * Asegura que los hijos (si los hay) se reasignan al abuelo o se convierten en raíz.
 */
export async function deleteWildcard(id: string): Promise<void> {
	logger.warn(`🗑️ Eliminando wildcard: ${id}`);

    const wildcard = await prisma.wildcard.findUnique({
        where: { id },
        include: { childWildcards: { select: { id: true } } },
    });

    if (!wildcard) {
        logger.warn(`Wildcard a eliminar no encontrado: ${id}`);
        return;
    }

    // Reasignar hijos al padre del wildcard eliminado (o a null si no tiene padre)
    if (wildcard.childWildcards.length > 0) {
        await prisma.wildcard.updateMany({
            where: { parentId: id },
            data: { parentId: wildcard.parentId },
        });
    }

	await prisma.wildcard.delete({ where: { id } });
	await revalidateWildcardPaths();
}


/**
 * Verifica si asignar un padre a un wildcard crearía una referencia circular.
 * @param wildcardId El ID del wildcard que se está moviendo.
 * @param newParentId El ID del nuevo padre propuesto.
 * @returns `true` si se detecta una referencia circular, `false` en caso contrario.
 */
async function checkCircularReference(wildcardId: string, newParentId: string): Promise<boolean> {
	let currentId: string | null = newParentId;
	while (currentId) {
		if (currentId === wildcardId) {
			return true; // Se encontró el ID original en la cadena de ancestros.
		}
		const parent = await prisma.wildcard.findUnique({
			where: { id: currentId },
			select: { parentId: true },
		});
		currentId = parent?.parentId ?? null;
	}
	return false;
}
