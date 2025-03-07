'use server';

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';
import { type ServerImage, convertServerImageToFileItem } from '@/services/image-converter.service';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats.service';
import type { Attribute as AttributeType } from '@/types/entities';
import type { FileItem } from '@/types/file-item';
import type { Attribute, Character, Image } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const attributeLogger = logger.withContext('AttributeActions');

const REVALIDATE_PATHS = ['/settings', '/attributes', '/attributes/[id]'] as const;

const revalidateAllPaths = () => {
	for (const path of REVALIDATE_PATHS) {
		revalidatePath(path);
	}
	attributeLogger.info('🔄 Rutas revalidadas');
};

class AttributeError extends Error {
	constructor(
		message: string,
		public cause?: unknown
	) {
		super(message);
		this.name = 'AttributeError';
	}
}

export interface AttributeWithStats extends Omit<AttributeType, 'featuredImage'> {
	stats: {
		total: number;
		active: number;
		favorite: number;
		archived: number;
	};
}

export interface AttributeCreate {
	name: string;
	type: string;
	value: string;
	category: string;
	description?: string;
	metadata?: string;
	featuredImage?: string;
	isFavorite?: boolean;
}

export interface AttributeUpdate extends Partial<AttributeCreate> {
	id: string;
}

export interface RelatedImage {
	id: string;
	name: string;
	path: string;
}

export interface RelatedEntity {
	id: string;
	name: string;
	images: RelatedImage[];
}

export interface AttributeWithImages extends AttributeType {
	characters: RelatedEntity[];
	places: RelatedEntity[];
	objects: RelatedEntity[];
}

export interface ExtendedAttribute extends AttributeWithImages {
	stats: {
		total: number;
		active: number;
		favorite: number;
		archived: number;
	};
}

export async function getAttributes() {
	try {
		attributeLogger.info('📚 Obteniendo lista de atributos');
		const attributes = await prisma.attribute.findMany({
			orderBy: {
				createdAt: 'desc',
			},
		});

		attributeLogger.info(`✅ ${attributes.length} atributos obtenidos`);
		return attributes;
	} catch (error) {
		attributeLogger.error('❌ Error al obtener atributos:', error);
		throw new AttributeError('No se pudieron obtener los atributos', error);
	}
}

export async function getAttributeById(id: string) {
	try {
		attributeLogger.info('🔍 Buscando atributo:', id);
		const attribute = await prisma.attribute.findUnique({
			where: { id },
			include: {
				characters: {
					select: {
						id: true,
						name: true,
					},
				},
				places: {
					select: {
						id: true,
						name: true,
					},
				},
				objects: {
					select: {
						id: true,
						name: true,
					},
				},
				concepts: {
					select: {
						id: true,
						name: true,
					},
				},
				prompts: {
					select: {
						id: true,
						name: true,
					},
				},
				notes: {
					select: {
						id: true,
						title: true,
					},
				},
			},
		});

		if (!attribute) {
			throw new AttributeError('Atributo no encontrado');
		}

		attributeLogger.info('✅ Atributo encontrado:', attribute.name);
		return attribute;
	} catch (error) {
		attributeLogger.error('❌ Error al obtener atributo:', error);
		throw new AttributeError('No se pudo obtener el atributo', error);
	}
}

export async function createAttribute(data: AttributeCreate) {
	try {
		attributeLogger.info('📝 Creando atributo:', data.name);
		const attribute = await prisma.attribute.create({
			data: {
				...data,
				isFavorite: data.isFavorite || false,
				metadata: data.metadata || '{}',
				description: data.description || '',
				value: data.value || '',
			},
		});

		// Emitir eventos con el nuevo sistema
		await emit({
			type: 'attributes:modified',
			data: { action: 'create', entity: attribute },
		});
		statsEventEmitter.emit(STATS_EVENTS.STATS_UPDATED);

		attributeLogger.info('✅ Atributo creado:', attribute.name);
		revalidateAllPaths();
		return attribute;
	} catch (error) {
		attributeLogger.error('❌ Error al crear atributo:', error);
		throw new AttributeError('No se pudo crear el atributo', error);
	}
}

export async function updateAttribute(id: string, data: AttributeUpdate) {
	try {
		attributeLogger.info('📝 Actualizando atributo:', id);
		const attribute = await prisma.attribute.update({
			where: { id },
			data,
		});

		// Emitir eventos con el nuevo sistema
		await emit({
			type: 'attributes:modified',
			id,
			data: { action: 'update', entity: attribute },
		});
		statsEventEmitter.emit(STATS_EVENTS.STATS_UPDATED);

		attributeLogger.info('✅ Atributo actualizado:', attribute.name);
		revalidateAllPaths();
		return attribute;
	} catch (error) {
		attributeLogger.error('❌ Error al actualizar atributo:', error);
		throw new AttributeError('No se pudo actualizar el atributo', error);
	}
}

export async function deleteAttribute(id: string) {
	try {
		attributeLogger.info('🗑️ Eliminando atributo:', id);
		await prisma.attribute.delete({
			where: { id },
		});

		// Emitir eventos con el nuevo sistema
		await emit({
			type: 'attributes:modified',
			id,
			data: { action: 'delete' },
		});
		statsEventEmitter.emit(STATS_EVENTS.STATS_UPDATED);

		attributeLogger.info('✅ Atributo eliminado');
		revalidateAllPaths();
	} catch (error) {
		attributeLogger.error('❌ Error al eliminar atributo:', error);
		throw new AttributeError('No se pudo eliminar el atributo', error);
	}
}

export async function getAttributeImages(id: string) {
	try {
		attributeLogger.info('🖼️ Obteniendo imágenes del atributo:', id);
		const attribute = (await prisma.attribute.findUnique({
			where: { id },
			include: {
				characters: {
					include: {
						images: {
							select: {
								id: true,
								name: true,
								path: true,
							},
						},
					},
				},
				places: {
					include: {
						images: {
							select: {
								id: true,
								name: true,
								path: true,
							},
						},
					},
				},
				objects: {
					include: {
						images: {
							select: {
								id: true,
								name: true,
								path: true,
							},
						},
					},
				},
			},
		})) as ExtendedAttribute | null;

		if (!attribute) {
			throw new AttributeError('Atributo no encontrado');
		}

		const images = [
			...attribute.characters.flatMap((char) => char.images),
			...attribute.places.flatMap((place) => place.images),
			...attribute.objects.flatMap((obj) => obj.images),
		];

		attributeLogger.info(`✅ ${images.length} imágenes obtenidas`);
		return images;
	} catch (error) {
		attributeLogger.error('❌ Error al obtener imágenes del atributo:', error);
		throw new AttributeError('No se pudieron obtener las imágenes del atributo', error);
	}
}
