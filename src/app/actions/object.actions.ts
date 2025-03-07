'use server';

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';
import { type ServerImage, convertServerImageToFileItem } from '@/services/image-converter.service';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats.service';
import type { FileItem } from '@/types/file-item';
import type { Image, Object as PrismaObject } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const objectLogger = logger.withContext('ObjectActions');

const REVALIDATE_PATHS = ['/settings', '/objects', '/objects/[id]'] as const;

const revalidateAllPaths = () => {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
	objectLogger.info('🔄 Rutas revalidadas');
};

class ObjectError extends Error {
	constructor(
		message: string,
		public cause?: unknown
	) {
		super(message);
		this.name = 'ObjectError';
	}
}

export interface ObjectWithStats extends Omit<PrismaObject, 'featuredImage'> {
	_count: {
		images: number;
	};
	totalSize: number;
	lastUpdated: Date;
	distribution?: Array<{
		name: string;
		count: number;
	}>;
	featuredImage: string | null;
	recentImages: string[];
}

export interface ObjectCreate {
	name: string;
	emoji: string;
	color: string;
	description?: string | null;
	category: string;
	properties: string;
	featuredImage?: string | null;
}

export interface ObjectUpdate extends Partial<ObjectCreate> {
	id: string;
}

export interface ObjectWithImages extends PrismaObject {
	images: FileItem[];
}

export interface ExtendedObject extends PrismaObject {
	images: Image[];
}

export async function getObjects() {
	try {
		objectLogger.info('📚 Obteniendo lista de objetos');
		const objects = await prisma.object.findMany({
			include: {
				_count: {
					select: {
						images: true,
					},
				},
				images: {
					take: 1,
					select: {
						id: true,
						name: true,
					},
				},
			},
		});

		objectLogger.info(`✅ ${objects.length} objetos obtenidos`);
		return objects;
	} catch (error) {
		objectLogger.error('❌ Error al obtener objetos:', error);
		throw new ObjectError('No se pudieron obtener los objetos', error);
	}
}

export async function getObjectById(id: string) {
	try {
		objectLogger.info('🔍 Buscando objeto:', id);
		const object = await prisma.object.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						images: true,
					},
				},
				images: {
					take: 5,
					select: {
						id: true,
						name: true,
					},
				},
			},
		});

		if (!object) {
			throw new ObjectError('Objeto no encontrado');
		}

		objectLogger.info('✅ Objeto encontrado:', object.name);
		return object;
	} catch (error) {
		objectLogger.error('❌ Error al obtener objeto:', error);
		throw new ObjectError('No se pudo obtener el objeto', error);
	}
}

export async function createObject(data: ObjectCreate) {
	try {
		objectLogger.info('📝 Creando objeto:', data.name);
		const object = await prisma.object.create({
			data: {
				...data,
				properties: data.properties || '{}',
				featuredImage: data.featuredImage || null,
			},
		});

		// Emitir eventos usando el nuevo sistema del servidor
		await emit({
			type: 'objects:modified',
			data: { action: 'create', object },
		});
		statsEventEmitter.emit(STATS_EVENTS.STATS_UPDATED);

		objectLogger.info('✅ Objeto creado:', object.name);
		revalidateAllPaths();
		return object;
	} catch (error) {
		objectLogger.error('❌ Error al crear objeto:', error);
		throw new ObjectError('No se pudo crear el objeto', error);
	}
}

export async function updateObject(id: string, data: ObjectUpdate) {
	try {
		objectLogger.info('📝 Actualizando objeto:', id);
		const object = await prisma.object.update({
			where: { id },
			data,
		});

		// Emitir eventos usando el nuevo sistema del servidor
		await emit({
			type: 'objects:modified',
			id,
			data: { action: 'update', object },
		});
		statsEventEmitter.emit(STATS_EVENTS.STATS_UPDATED);

		objectLogger.info('✅ Objeto actualizado:', object.name);
		revalidateAllPaths();
		return object;
	} catch (error) {
		objectLogger.error('❌ Error al actualizar objeto:', error);
		throw new ObjectError('No se pudo actualizar el objeto', error);
	}
}

export async function deleteObject(id: string) {
	try {
		objectLogger.info('🗑️ Eliminando objeto:', id);
		await prisma.object.delete({
			where: { id },
		});

		// Emitir eventos usando el nuevo sistema del servidor
		await emit({
			type: 'objects:modified',
			id,
			data: { action: 'delete' },
		});
		statsEventEmitter.emit(STATS_EVENTS.STATS_UPDATED);

		objectLogger.info('✅ Objeto eliminado');
		revalidateAllPaths();
	} catch (error) {
		objectLogger.error('❌ Error al eliminar objeto:', error);
		throw new ObjectError('No se pudo eliminar el objeto', error);
	}
}

export async function getObjectImages(id: string) {
	try {
		objectLogger.info('🖼️ Obteniendo imágenes del objeto:', id);
		const object = (await prisma.object.findUnique({
			where: { id },
			include: {
				images: {
					include: {
						tags: true,
						stats: true,
					},
				},
			},
		})) as ExtendedObject | null;

		if (!object) {
			throw new ObjectError('Objeto no encontrado');
		}

		const images = object.images.map((img) => convertServerImageToFileItem(img as ServerImage));

		objectLogger.info(`✅ ${images.length} imágenes obtenidas`);
		return images;
	} catch (error) {
		objectLogger.error('❌ Error al obtener imágenes del objeto:', error);
		throw new ObjectError('No se pudieron obtener las imágenes del objeto', error);
	}
}

export async function addImageToObject(objectId: string, imageId: string) {
	try {
		objectLogger.info('➕ Agregando imagen a objeto:', { objectId, imageId });
		await prisma.image.update({
			where: { id: imageId },
			data: {
				objects: {
					connect: { id: objectId },
				},
			},
		});

		// Emitir eventos usando el nuevo sistema del servidor
		await emit({
			type: 'objects:modified',
			id: objectId,
			imageId,
			data: { action: 'addImage' },
		});
		statsEventEmitter.emit(STATS_EVENTS.STATS_UPDATED);
		statsEventEmitter.emit(STATS_EVENTS.FILES_CHANGE);

		objectLogger.info('✅ Imagen agregada al objeto');
		revalidateAllPaths();
	} catch (error) {
		objectLogger.error('❌ Error al agregar imagen al objeto:', error);
		throw new ObjectError('No se pudo agregar la imagen al objeto', error);
	}
}

export async function removeImageFromObject(objectId: string, imageId: string) {
	try {
		objectLogger.info('➖ Removiendo imagen de objeto:', { objectId, imageId });
		await prisma.image.update({
			where: { id: imageId },
			data: {
				objects: {
					disconnect: { id: objectId },
				},
			},
		});

		// Emitir eventos usando el nuevo sistema del servidor
		await emit({
			type: 'objects:modified',
			id: objectId,
			imageId,
			data: { action: 'removeImage' },
		});
		statsEventEmitter.emit(STATS_EVENTS.STATS_UPDATED);
		statsEventEmitter.emit(STATS_EVENTS.FILES_CHANGE);

		objectLogger.info('✅ Imagen removida del objeto');
		revalidateAllPaths();
	} catch (error) {
		objectLogger.error('❌ Error al remover imagen del objeto:', error);
		throw new ObjectError('No se pudo remover la imagen del objeto', error);
	}
}
