'use server';

/**
 * @file Server Actions para la entidad Wildcard
 * @module app/actions/wildcards/wildcard.actions
 * @description Acciones CRUD y de gestión de relaciones para los Wildcards, utilizando el patrón EntityWithStats.
 */

import { getPrismaClient } from '@/lib/db';
import { serverLogger } from '@/lib/logger/server-logger';
import {
	mapCreateWildcardDataToPrisma,
	mapUpdateWildcardDataToPrisma,
	toWildcardWithStats,
} from '@/transformers/wildcard';
import type {
	WildcardWithStats,
	WildcardCreateInput,
	WildcardUpdateInput,
} from '@/types/entities/wildcard';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';

const logger = serverLogger.withContext('WildcardActions');

// Payload para incluir los conteos necesarios para las estadísticas
const wildcardIncludeWithCounts = {
	tags: true, // Incluimos tags para verlos en la UI si es necesario
	_count: {
		select: {
			tags: true,
			images: true,
			characters: true,
			places: true,
			notes: true,
		},
	},
} satisfies Prisma.WildcardInclude;

type PrismaWildcardWithData = Prisma.WildcardGetPayload<{
	include: typeof wildcardIncludeWithCounts;
}>;

/**
 * Revalida las rutas de caché relacionadas con los wildcards.
 */
async function revalidateWildcardPaths() {
	revalidatePath('/wildcards');
	revalidatePath('/settings/wildcards');
}

/**
 * Obtiene todos los wildcards del sistema.
 */
export async function getWildcards(): Promise<WildcardWithStats[]> {
	logger.info('🔍 Obteniendo todos los wildcards');
	const prisma = await getPrismaClient();
	const wildcards = await prisma.wildcard.findMany({
		include: wildcardIncludeWithCounts,
		orderBy: { name: 'asc' },
	});
	return wildcards.map(w => toWildcardWithStats(w as PrismaWildcardWithData));
}

/**
 * Obtiene un único wildcard por su ID.
 */
export async function getWildcard(id: string): Promise<WildcardWithStats | null> {
	logger.info(`🔍 Obteniendo wildcard por ID: ${id}`);
	const prisma = await getPrismaClient();
	const wildcard = await prisma.wildcard.findUnique({
		where: { id },
		include: wildcardIncludeWithCounts,
	});
	if (!wildcard) {
		logger.warn(`Wildcard no encontrado: ${id}`);
		return null;
	}
	return toWildcardWithStats(wildcard as PrismaWildcardWithData);
}

/**
 * Crea un nuevo wildcard.
 */
export async function createWildcard(data: WildcardCreateInput): Promise<WildcardWithStats> {
	logger.info('➕ Creando nuevo wildcard:', { name: data.name });
	const prismaData = mapCreateWildcardDataToPrisma(data);
	const prisma = await getPrismaClient();
	const newWildcard = await prisma.wildcard.create({
		data: prismaData,
	});

	await revalidateWildcardPaths();

	const createdWildcardWithStats = await getWildcard(newWildcard.id);
	if (!createdWildcardWithStats) {
		throw new Error('No se pudo recuperar el wildcard recién creado con sus estadísticas.');
	}
	return createdWildcardWithStats;
}

/**
 * Actualiza un wildcard existente.
 */
export async function updateWildcard(id: string, data: WildcardUpdateInput): Promise<WildcardWithStats> {
	logger.info('📝 Actualizando wildcard:', { id, changes: Object.keys(data) });
	const prismaData = mapUpdateWildcardDataToPrisma(data);
	const prisma = await getPrismaClient();
	await prisma.wildcard.update({
		where: { id },
		data: prismaData,
	});

	await revalidateWildcardPaths();

	const updatedWildcardWithStats = await getWildcard(id);
	if (!updatedWildcardWithStats) {
		throw new Error('No se pudo recuperar el wildcard actualizado con sus estadísticas.');
	}
	return updatedWildcardWithStats;
}

/**
 * Elimina un wildcard.
 * Asegura que los hijos (si los hay) se reasignan al abuelo o se convierten en raíz.
 */
export async function deleteWildcard(id: string): Promise<void> {
	logger.warn(`🗑️ Eliminando wildcard: ${id}`);
	const prisma = await getPrismaClient();

	// Usar una transacción para asegurar la atomicidad de la operación
	await prisma.$transaction(async (tx) => {
		const wildcard = await tx.wildcard.findUnique({
			where: { id },
			select: { parentId: true, childWildcards: { select: { id: true } } },
		});

		if (!wildcard) {
			logger.warn(`Wildcard a eliminar no encontrado: ${id}`);
			return;
		}

		// Reasignar hijos al padre del wildcard eliminado
		if (wildcard.childWildcards.length > 0) {
			await tx.wildcard.updateMany({
				where: { parentId: id },
				data: { parentId: wildcard.parentId },
			});
		}

		await tx.wildcard.delete({ where: { id } });
	});

	await revalidateWildcardPaths();
}

/**
 * Obtiene los wildcards raíz (sin padre).
 */
export async function getRootWildcards(): Promise<WildcardWithStats[]> {
	logger.info('🌳 Obteniendo wildcards raíz');
	const prisma = await getPrismaClient();
	const rootWildcards = await prisma.wildcard.findMany({
		where: { parentId: null },
		include: wildcardIncludeWithCounts,
		orderBy: { name: 'asc' },
	});
	return rootWildcards.map(w => toWildcardWithStats(w as PrismaWildcardWithData));
}

/**
 * Mueve un wildcard a un nuevo padre.
 */
export async function moveWildcard(id: string, newParentId: string | null): Promise<WildcardWithStats> {
	logger.info(`🔄 Moviendo wildcard ${id} a nuevo padre: ${newParentId || 'raíz'}`);
	const prisma = await getPrismaClient();

	// Validar que no se cree un ciclo
	if (newParentId) {
		const newParent: any = await prisma.wildcard.findUnique({
			where: { id: newParentId },
			select: { id: true, parentId: true },
		});

		if (!newParent) {
			throw new Error('El padre especificado no existe');
		}

		// Verificar que el nuevo padre no sea descendiente del wildcard a mover
		let currentParent = newParent;
		while (currentParent?.parentId) {
			if (currentParent.parentId === id) {
				throw new Error('No se puede mover un wildcard a uno de sus descendientes');
			}
			currentParent = await prisma.wildcard.findUnique({
				where: { id: currentParent.parentId },
				select: { id: true, parentId: true },
			});
		}
	}

	await prisma.wildcard.update({
		where: { id },
		data: { parentId: newParentId },
	});

	await revalidateWildcardPaths();
	const movedWildcardWithStats = await getWildcard(id);
	if (!movedWildcardWithStats) {
		throw new Error('No se pudo transformar el wildcard movido.');
	}
	return movedWildcardWithStats;
}
