'use server';

import { prisma } from '@/lib/prisma';
import {
    fromPrismaWorldItem,
    mapCreateWorldItemDataToPrisma,
    mapUpdateWorldItemDataToPrisma,
    mapWorldItemSearchOptionsToPrisma,
    worldItemPayload,
} from '@/transformers/world-item';
import type {
    WorldItemComplete,
    WorldItemCreateInput,
    WorldItemSearchOptions,
    WorldItemUpdateInput,
} from '@/types/entities/world-item';
import { handleTransformerError } from '@/utils/transformers/errors';
import { revalidatePath } from 'next/cache';

const REVALIDATE_PATHS = ['/settings/world-items', '/library/world-items'];

async function revalidateWorldItemPaths(id?: string) {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path, 'page');
	}
	if (id) {
		revalidatePath(`/library/world-items/${id}`, 'page');
	}
}

export async function getWorldItems(options: WorldItemSearchOptions): Promise<WorldItemComplete[]> {
	try {
		const findOptions = mapWorldItemSearchOptionsToPrisma(options);
		const worldItems = await prisma.worldItem.findMany({
			...findOptions,
			...worldItemPayload,
		});
		return worldItems.map(item => fromPrismaWorldItem(item)).filter(Boolean) as WorldItemComplete[];
	} catch (error) {
		return handleTransformerError(error, 'obtener los objetos del mundo');
	}
}

export async function getWorldItemById(id: string): Promise<WorldItemComplete | null> {
	try {
		const worldItem = await prisma.worldItem.findUnique({
			where: { id },
			...worldItemPayload,
		});
		return fromPrismaWorldItem(worldItem);
	} catch (error) {
		return handleTransformerError(error, `obtener el objeto del mundo con ID ${id}`);
	}
}

export async function createWorldItem(input: WorldItemCreateInput): Promise<WorldItemComplete | null> {
	try {
		const data = mapCreateWorldItemDataToPrisma(input);
		const newWorldItem = await prisma.worldItem.create({
			data,
			...worldItemPayload,
		});
		await revalidateWorldItemPaths();
		return fromPrismaWorldItem(newWorldItem);
	} catch (error) {
		return handleTransformerError(error, 'crear el objeto del mundo');
	}
}

export async function updateWorldItem(id: string, input: WorldItemUpdateInput): Promise<WorldItemComplete | null> {
	try {
		const data = mapUpdateWorldItemDataToPrisma(input);
		const updatedWorldItem = await prisma.worldItem.update({
			where: { id },
			data,
			...worldItemPayload,
		});
		await revalidateWorldItemPaths(id);
		return fromPrismaWorldItem(updatedWorldItem);
	} catch (error) {
		return handleTransformerError(error, `actualizar el objeto del mundo con ID ${id}`);
	}
}

export async function deleteWorldItem(id: string): Promise<boolean> {
	try {
		await prisma.worldItem.delete({ where: { id } });
		await revalidateWorldItemPaths();
		return true;
	} catch (error) {
		handleTransformerError(error, `eliminar el objeto del mundo con ID ${id}`);
		return false;
	}
}
