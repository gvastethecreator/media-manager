import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import type { FileItem } from '@/types/file-item';
import type { PrismaClient } from '@prisma/client';
import { type ServerImage, imageConverterService } from './image-converter.service';

const baseLogger = logger.withContext('BaseService');

export interface BaseStats {
	_count: {
		images: number;
	};
	totalSize: number;
}

// Tipo para modelos de Prisma
type PrismaModel = ReturnType<PrismaClient[keyof PrismaClient]>;

// Tipo para cláusulas where y orderBy de Prisma
type PrismaFilter = Record<string, unknown>;

export class BaseService {
	protected logger = baseLogger;
	protected model: PrismaModel;
	protected modelName: string;

	constructor(model: PrismaModel, modelName: string) {
		this.model = model;
		this.modelName = modelName;
		this.logger = logger.withContext(`${modelName}Service`);
	}

	protected async getItemsWithStats<T>(
		where: PrismaFilter = {},
		orderBy: PrismaFilter = { createdAt: 'desc' }
	): Promise<(T & BaseStats)[]> {
		try {
			this.logger.info(`🔍 Obteniendo lista de ${this.modelName}...`);

			// 1. Obtener items con conteo de imágenes
			const items = await this.model.findMany({
				where,
				include: {
					_count: {
						select: { images: true },
					},
				},
				orderBy,
			});

			// 2. Obtener tamaños en una sola consulta
			const itemIds = items.map((item: T & { id: string }) => item.id);
			const sizesByItem = await prisma.image.groupBy({
				by: ['id'],
				where: {
					[this.modelName.toLowerCase()]: {
						some: {
							id: {
								in: itemIds,
							},
						},
					},
				},
				_sum: {
					size: true,
				},
			});

			// 3. Mapear resultados
			const itemsWithStats = items.map((item: T & { id: string }) => {
				const stats = sizesByItem.find((s) => s.id === item.id);
				return {
					...item,
					totalSize: stats?._sum?.size || 0,
				};
			});

			this.logger.info(`✅ ${items.length} ${this.modelName} obtenidos`);
			return itemsWithStats;
		} catch (error) {
			this.logger.error(`❌ Error al obtener ${this.modelName}:`, error);
			throw error;
		}
	}

	protected async getItemWithStats<T>(id: string, include: PrismaFilter = {}): Promise<(T & BaseStats) | null> {
		try {
			this.logger.info(`🔍 Obteniendo ${this.modelName}:`, id);

			const item = await this.model.findUnique({
				where: { id },
				include: {
					_count: {
						select: { images: true },
					},
					...include,
				},
			});

			if (!item) {
				return null;
			}

			const totalSize = await prisma.image.aggregate({
				where: {
					[this.modelName.toLowerCase()]: {
						some: { id },
					},
				},
				_sum: {
					size: true,
				},
			});

			return {
				...item,
				totalSize: totalSize._sum?.size || 0,
			};
		} catch (error) {
			this.logger.error(`❌ Error al obtener ${this.modelName}:`, error);
			throw error;
		}
	}

	protected async getItemImages(id: string): Promise<FileItem[]> {
		try {
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

			return images.map((image) => imageConverterService.convertServerImageToFileItem(image as ServerImage));
		} catch (error) {
			this.logger.error(`❌ Error al obtener imágenes de ${this.modelName}:`, error);
			throw error;
		}
	}
}
