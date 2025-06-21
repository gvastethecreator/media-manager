import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import type { BaseTransformer } from '@/types/common/transformer';
import type { FileItem } from '@/types/files';
import { createEntityNotFoundError, toServiceError } from '@/utils/errors/service-errors';
import { imageConverterService, type ServerImage } from './image-converter.service';

const SERVICE_NAME = 'BaseService';
const baseLogger = serverLogger.withContext(SERVICE_NAME);

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

/**
 * Clase base para servicios que proporciona operaciones CRUD básicas
 * Utiliza transformers para convertir entre registros de BD, entidades de dominio y resultados de API
 *
 * @template DBRecord - Tipo de registro de base de datos
 * @template Entity - Tipo de entidad de dominio
 * @template Result - Tipo de resultado para API
 */
export class BaseService<DBRecord, Entity, Result> {
	protected logger = baseLogger;
	protected model: PrismaModelOperations;
	protected modelName: string;
	protected serviceName: string;
	protected transformer?: BaseTransformer<Entity, DBRecord, Result>;

	constructor(model: PrismaModelOperations, modelName: string, transformer?: BaseTransformer<Entity, DBRecord, Result>) {
		this.model = model;
		this.modelName = modelName;
		this.serviceName = `${modelName}Service`;
		this.logger = serverLogger.withContext(this.serviceName);
		this.transformer = transformer;
	}

	/**
	 * Obtiene una lista de elementos con estadísticas asociadas
	 */
	protected async getItemsWithStats<T extends { id: string }>(
		where: PrismaFilter = {},
		orderBy: PrismaFilter = { createdAt: 'desc' }
	): Promise<(T & BaseStats)[]> {
		try {
			this.logger.info(`Obteniendo lista de ${this.modelName}...`);

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

			this.logger.info(`${items.length} ${this.modelName} obtenidos`);
			return itemsWithStats;
		} catch (error) {
			throw toServiceError(error, {
				serviceName: this.serviceName,
				message: `Error al obtener lista de ${this.modelName}`,
				context: { where, orderBy },
			});
		}
	}

	/**
	 * Obtiene un elemento por su ID con estadísticas asociadas
	 */
	protected async getItemWithStats<T extends { id: string }>(
		id: string,
		include: PrismaFilter = {}
	): Promise<(T & BaseStats) | null> {
		try {
			this.logger.info(`Obteniendo ${this.modelName}:`, id);

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
			throw toServiceError(error, {
				serviceName: this.serviceName,
				message: `Error al obtener ${this.modelName}`,
				context: { id },
			});
		}
	}

	/**
	 * Obtiene las imágenes asociadas a un elemento por su ID
	 */
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
			throw toServiceError(error, {
				serviceName: this.serviceName,
				message: `Error al obtener imágenes de ${this.modelName}`,
				context: { id },
			});
		}
	}

	/**
	 * Transforma un registro de base de datos a una entidad de dominio
	 */
	protected fromDB(record: DBRecord): Entity {
		if (this.transformer) {
			return this.transformer.fromPrisma(record);
		}
		// Si no hay transformer, devolver registro como entidad (caso básico)
		return record as unknown as Entity;
	}

	/**
	 * Transforma una entidad de dominio a un resultado para API
	 */
	protected async toClient(entity: Entity, options?: Record<string, unknown>): Promise<Result> {
		if (this.transformer) {
			return await this.transformer.extend(entity, options) as unknown as Result;
		}
		// Si no hay transformer, devolver entidad como resultado (caso básico)
		return entity as unknown as Result;
	}

	/**
	 * Transforma datos del cliente a formato de base de datos para creación/actualización
	 */
	protected toDB(input: Partial<Entity>): Partial<DBRecord> {
		if (this.transformer) {
			return this.transformer.toPrisma(input) as unknown as Partial<DBRecord>;
		}
		// Si no hay transformer, devolver input como registro parcial (caso básico)
		return input as unknown as Partial<DBRecord>;
	}

	/**
	 * Obtiene un elemento por su ID utilizando el transformer
	 */
	protected async getItemById(
		id: string,
		select?: Record<string, unknown>,
		include?: Record<string, unknown>
	): Promise<Result | null> {
		try {
			const item = (await this.model.findUnique({
				where: { id },
				...(select && { select }),
				...(include && { include }),
			})) as DBRecord | null;

			if (!item) {
				return null;
			}

			const entity = this.fromDB(item);
			return await this.toClient(entity);
		} catch (error) {
			throw toServiceError(error, {
				serviceName: this.serviceName,
				message: `Error al obtener ${this.modelName}`,
				context: { id, select, include },
			});
		}
	}

	/**
	 * Obtiene y verifica la existencia de un elemento, lanzando error si no existe
	 */
	protected async getItemByIdOrThrow(
		id: string,
		select?: Record<string, unknown>,
		include?: Record<string, unknown>
	): Promise<Result> {
		const item = await this.getItemById(id, select, include);

		if (!item) {
			throw createEntityNotFoundError(this.modelName, id, this.serviceName);
		}

		return item;
	}
}
