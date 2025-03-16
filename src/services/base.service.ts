import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import type { FileItem } from '@/types/file-item';
import { type ServerImage, imageConverterService } from './image-converter.service';

const baseLogger = serverLogger.withContext('BaseService');

export interface BaseStats {
	_count: {
		images: number;
	};
	totalSize: number;
}

// Tipo para cláusulas where y orderBy de Prisma
type PrismaFilter = Record<string, unknown>;

// Tipo genérico para representar modelos de Prisma con operaciones básicas
// Utilizamos unknown como tipo de retorno, pero será tipado correctamente en la implementación
interface PrismaModelOperations {
	findMany: (args: Record<string, unknown>) => Promise<unknown[]>;
	findUnique: (args: Record<string, unknown>) => Promise<unknown | null>;
	groupBy?: (args: Record<string, unknown>) => Promise<unknown[]>;
	aggregate?: (args: Record<string, unknown>) => Promise<unknown>;
}

export class BaseService {
	protected logger = baseLogger;
	protected model: PrismaModelOperations;
	protected modelName: string;

	constructor(model: PrismaModelOperations, modelName: string) {
		this.model = model;
		this.modelName = modelName;
		this.logger = serverLogger.withContext(`${modelName}Service`);
	}

	protected async getItemsWithStats<T extends { id: string }>(
		where: PrismaFilter = {},
		orderBy: PrismaFilter = { createdAt: 'desc' }
	): Promise<(T & BaseStats)[]> {
		try {
			this.serverLogger.info(`🔍 Obteniendo lista de ${this.modelName}...`);

			// 1. Obtener items con conteo de imágenes
			const items = (await this.model.findMany({
				where,
				include: {
					_count: {
						select: { images: true },
					},
				},
				orderBy,
			})) as (T & { _count: { images: number } })[];

			// 2. Obtener tamaños en una sola consulta
			const itemIds = items.map((item) => item.id);
			const sizesByItem = (await prisma.image.groupBy({
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
			})) as { id: string; _sum: { size: number | null } }[];

			// 3. Mapear resultados
			const itemsWithStats = items.map((item) => {
				const stats = sizesByItem.find((s) => s.id === item.id);
				return {
					...item,
					totalSize: stats?._sum?.size || 0,
				} as T & BaseStats;
			});

			this.serverLogger.info(`✅ ${items.length} ${this.modelName} obtenidos`);
			return itemsWithStats;
		} catch (error) {
			this.serverLogger.error(`❌ Error al obtener ${this.modelName}:`, error);
			throw error;
		}
	}

	protected async getItemWithStats<T extends { id: string }>(
		id: string,
		include: PrismaFilter = {}
	): Promise<(T & BaseStats) | null> {
		try {
			this.serverLogger.info(`🔍 Obteniendo ${this.modelName}:`, id);

			const item = (await this.model.findUnique({
				where: { id },
				include: {
					_count: {
						select: { images: true },
					},
					...include,
				},
			})) as (T & { _count: { images: number } }) | null;

			if (!item) {
				return null;
			}

			const totalSize = (await prisma.image.aggregate({
				where: {
					[this.modelName.toLowerCase()]: {
						some: { id },
					},
				},
				_sum: {
					size: true,
				},
			})) as { _sum: { size: number | null } };

			return {
				...item,
				totalSize: totalSize._sum?.size || 0,
			};
		} catch (error) {
			this.serverLogger.error(`❌ Error al obtener ${this.modelName}:`, error);
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
					worldItems: {
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
			this.serverLogger.error(`❌ Error al obtener imágenes de ${this.modelName}:`, error);
			throw error;
		}
	}
}
