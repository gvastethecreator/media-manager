'use server';

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';
import { type ServerImage, imageConverterService } from '@/services/image-converter.service';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats.service';
import type { FileItem } from '@/types/file-item';
import type { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { cache } from 'react';

// Definir un tipo para los modelos de Prisma
type PrismaModel = {
	findMany: <T>(args: unknown) => Promise<T[]>;
	findUnique: <T>(args: unknown) => Promise<T | null>;
	create: <T>(args: unknown) => Promise<T>;
	update: <T>(args: unknown) => Promise<T>;
	delete: <T>(args: unknown) => Promise<T>;
	count: (args: unknown) => Promise<number>;
};

// Tipo para los modelos de Prisma que tienen operaciones CRUD
type PrismaModelName = keyof {
	[K in keyof PrismaClient as PrismaClient[K] extends {
		findMany: (...args: unknown[]) => unknown;
		findUnique: (...args: unknown[]) => unknown;
		create: (...args: unknown[]) => unknown;
		update: (...args: unknown[]) => unknown;
		delete: (...args: unknown[]) => unknown;
	}
		? K
		: never]: true;
};

export interface BaseStats {
	_count: {
		images: number;
	};
	totalSize: number;
}

export interface BaseEntity {
	id: string;
	name: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	shortcut?: string | null;
	sortBy?: string;
	filters?: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface BaseEntityCreate {
	name: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	shortcut?: string | null;
	sortBy?: string;
	filters?: string;
}

export interface BaseEntityUpdate extends Partial<BaseEntityCreate> {
	id: string;
}

export abstract class BaseActions<
	T extends BaseEntity,
	CreateDTO extends BaseEntityCreate,
	UpdateDTO extends BaseEntityUpdate,
> {
	protected abstract modelName: PrismaModelName;
	protected abstract revalidatePaths: string[];
	protected logger!: ReturnType<typeof logger.withContext>;
	protected cacheTimeout = 5 * 60 * 1000; // 5 minutos por defecto

	protected constructor() {
		this.getAll = cache(this.getAll.bind(this));
		this.getById = cache(this.getById.bind(this));
		this.getImages = cache(this.getImages.bind(this));
	}

	protected initLogger() {
		this.logger = logger.withContext(`${this.modelName}Actions`);
	}

	protected revalidateAllPaths() {
		for (const path of this.revalidatePaths) {
			revalidatePath(path);
		}
		this.logger.info('🔄 Rutas revalidadas');
	}

	protected async getAll(): Promise<(T & BaseStats)[]> {
		try {
			this.logger.info(`📚 Obteniendo lista de ${this.modelName}`);
			const model = prisma[this.modelName] as PrismaModel;
			const items = await model.findMany({
				include: {
					_count: {
						select: {
							images: true,
						},
					},
				},
			});

			const itemsWithStats = await Promise.all(
				items.map(async (item: T) => {
					const totalSize = await this.calculateTotalSize(item.id);
					return {
						...item,
						totalSize,
					};
				})
			);

			this.logger.info(`✅ ${items.length} ${this.modelName} obtenidos`);
			return itemsWithStats;
		} catch (error) {
			this.logger.error(`❌ Error al obtener ${this.modelName}:`, error);
			throw this.createError(`No se pudieron obtener los ${this.modelName}`, error);
		}
	}

	protected async getById(id: string): Promise<T & BaseStats> {
		try {
			this.logger.info(`🔍 Obteniendo ${this.modelName} por ID: ${id}`);
			const model = prisma[this.modelName] as PrismaModel;
			const item = await model.findUnique({
				where: { id },
				include: {
					_count: {
						select: {
							images: true,
						},
					},
				},
			});

			if (!item) {
				throw this.createError(`${this.modelName} no encontrado`);
			}

			const totalSize = await this.calculateTotalSize(id);
			const result = {
				...item,
				totalSize,
			};

			this.logger.info(`✅ ${this.modelName} obtenido:`, item.name);
			return result;
		} catch (error) {
			this.logger.error(`❌ Error al obtener ${this.modelName}:`, error);
			throw this.createError(`No se pudo obtener el ${this.modelName}`, error);
		}
	}

	protected async create(data: CreateDTO): Promise<T> {
		try {
			this.logger.info(`✨ Creando nuevo ${this.modelName}`);
			const model = prisma[this.modelName] as PrismaModel;
			const item = await model.create({
				data: {
					...data,
					filters: data.filters || '[]',
				},
			});
			this.logger.info(`✅ ${this.modelName} creado:`, item.name);

			// Emitir evento con el nuevo sistema
			await emit({
				type: 'create',
				data: { entity: item, entityType: this.modelName },
			});

			this.revalidateAllPaths();
			return item;
		} catch (error) {
			this.logger.error(`❌ Error al crear ${this.modelName}:`, error);
			throw this.createError(`No se pudo crear el ${this.modelName}`, error);
		}
	}

	protected async update(id: string, data: UpdateDTO): Promise<T> {
		try {
			this.logger.info(`📝 Actualizando ${this.modelName} con ID: ${id}`);
			const model = prisma[this.modelName] as PrismaModel;
			const item = await model.update({
				where: { id },
				data: {
					...data,
					filters: data.filters ? JSON.stringify(data.filters) : undefined,
				},
			});
			this.logger.info(`✅ ${this.modelName} actualizado:`, item.name);

			// Emitir evento con el nuevo sistema
			await emit({
				type: 'update',
				id,
				data: { entity: item, entityType: this.modelName },
			});

			this.revalidateAllPaths();
			return item;
		} catch (error) {
			this.logger.error(`❌ Error al actualizar ${this.modelName}:`, error);
			throw this.createError(`No se pudo actualizar el ${this.modelName}`, error);
		}
	}

	protected async delete(id: string): Promise<void> {
		try {
			this.logger.info(`🗑️ Eliminando ${this.modelName} con ID: ${id}`);
			const model = prisma[this.modelName] as PrismaModel;
			await model.delete({
				where: { id },
			});
			this.logger.info(`✅ ${this.modelName} eliminado`);

			// Emitir evento con el nuevo sistema
			await emit({
				type: 'delete',
				id,
				data: { entityType: this.modelName },
			});

			this.revalidateAllPaths();
		} catch (error) {
			this.logger.error(`❌ Error al eliminar ${this.modelName}:`, error);
			throw this.createError(`No se pudo eliminar el ${this.modelName}`, error);
		}
	}

	protected async getImages(id: string): Promise<FileItem[]> {
		try {
			this.logger.info(`🖼️ Obteniendo imágenes para ${this.modelName} con ID: ${id}`);
			const images = await prisma.image.findMany({
				where: {
					[this.modelName.toLowerCase()]: {
						some: { id },
					},
				},
				include: {
					collections: {
						select: {
							id: true,
							name: true,
							emoji: true,
							color: true,
						},
					},
					tags: {
						select: {
							id: true,
							name: true,
							color: true,
						},
					},
					albums: {
						select: {
							id: true,
							name: true,
							emoji: true,
							color: true,
						},
					},
					characters: {
						select: {
							id: true,
							name: true,
							emoji: true,
							color: true,
						},
					},
					places: {
						select: {
							id: true,
							name: true,
							emoji: true,
							color: true,
						},
					},
					objects: {
						select: {
							id: true,
							name: true,
							emoji: true,
							color: true,
						},
					},
				},
			});

			this.logger.info(`✅ ${images.length} imágenes obtenidas`);
			return images.map((image) => imageConverterService.convertServerImageToFileItem(image as ServerImage));
		} catch (error) {
			this.logger.error(`❌ Error al obtener imágenes de ${this.modelName}:`, error);
			throw this.createError(`No se pudieron obtener las imágenes de ${this.modelName}`, error);
		}
	}

	protected async addImage(entityId: string, imageId: string): Promise<void> {
		try {
			this.logger.info(`🔗 Añadiendo imagen ${imageId} a ${this.modelName} ${entityId}`);
			await prisma.image.update({
				where: { id: imageId },
				data: {
					[this.modelName.toLowerCase()]: {
						connect: { id: entityId },
					},
				},
			});
			this.logger.info(`✅ Imagen añadida al ${this.modelName}`);

			// Emitir evento con el nuevo sistema
			await emit({
				type: 'addImage',
				id: entityId,
				imageId,
				data: { entityType: this.modelName },
			});

			statsEventEmitter.emit(STATS_EVENTS.COLLECTION_CHANGE);
			this.revalidateAllPaths();
		} catch (error) {
			this.logger.error(`❌ Error al añadir imagen a ${this.modelName}:`, error);
			throw this.createError(`No se pudo añadir la imagen al ${this.modelName}`, error);
		}
	}

	protected async removeImage(entityId: string, imageId: string): Promise<void> {
		try {
			this.logger.info(`🔗 Eliminando imagen ${imageId} de ${this.modelName} ${entityId}`);
			await prisma.image.update({
				where: { id: imageId },
				data: {
					[this.modelName.toLowerCase()]: {
						disconnect: { id: entityId },
					},
				},
			});
			this.logger.info(`✅ Imagen eliminada del ${this.modelName}`);

			// Emitir evento con el nuevo sistema
			await emit({
				type: 'removeImage',
				id: entityId,
				imageId,
				data: { entityType: this.modelName },
			});

			statsEventEmitter.emit(STATS_EVENTS.COLLECTION_CHANGE);
			this.revalidateAllPaths();
		} catch (error) {
			this.logger.error(`❌ Error al eliminar imagen de ${this.modelName}:`, error);
			throw this.createError(`No se pudo eliminar la imagen del ${this.modelName}`, error);
		}
	}

	private async calculateTotalSize(id: string): Promise<number> {
		const totalSize = await prisma.image.aggregate({
			where: {
				[this.modelName.toLowerCase()]: {
					some: {
						id,
					},
				},
			},
			_sum: {
				size: true,
			},
		});
		return totalSize._sum.size || 0;
	}

	protected createError(message: string, cause?: unknown): Error {
		return new Error(message, { cause });
	}
}
