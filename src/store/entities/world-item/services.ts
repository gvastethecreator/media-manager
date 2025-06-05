/**
 * @file Servicios de API para la entidad WorldItem
 * @module store/entities/world-item/services
 */

import type { CreateWorldItemData, UpdateWorldItemData, WorldItem } from '../../../types/entities/world-item';
import { worldItemApi } from './index';
import type {
	WorldItemApiOptions,
	WorldItemBatchOptions,
	WorldItemExportOptions,
	WorldItemSearchResult,
} from './types';

/**
 * Clase de servicio para interactuar con la API de WorldItem
 */
export class WorldItemService {
	private baseUrl: string;
	private fetchOptions: RequestInit;
	private transform: (data: any) => WorldItem[];
	private errorHandler: (error: any) => string;
	private cacheTime: number;

	/**
	 * Constructor
	 * @param options Opciones de configuración
	 */
	constructor(options: WorldItemApiOptions = {}) {
		this.baseUrl = options.baseUrl || '/api/world-items';
		this.fetchOptions = options.fetchOptions || {};
		this.transform = options.transform || this.defaultTransform;
		this.errorHandler = options.errorHandler || this.defaultErrorHandler;
		this.cacheTime = options.cacheTime || 60000; // 1 minuto por defecto
	}

	/**
	 * Obtiene todos los objetos del mundo
	 */
	async fetchAll(): Promise<WorldItem[]> {
		try {
			const response = await fetch(`${this.baseUrl}`, this.fetchOptions);

			if (!response.ok) {
				throw new Error(`Error al obtener objetos del mundo: ${response.status}`);
			}

			const data = await response.json();
			const items = this.transform(data);

			// Actualizar el store
			worldItemApi.setWorldItems(items);

			return items;
		} catch (error) {
			const errorMessage = this.errorHandler(error);
			worldItemApi.setError(errorMessage);
			throw error;
		}
	}

	/**
	 * Obtiene un objeto del mundo por ID
	 * @param id ID del objeto
	 */
	async fetchById(id: string): Promise<WorldItem> {
		try {
			const response = await fetch(`${this.baseUrl}/${id}`, this.fetchOptions);

			if (!response.ok) {
				throw new Error(`Error al obtener el objeto del mundo: ${response.status}`);
			}

			const data = await response.json();
			return this.transform([data])[0];
		} catch (error) {
			const errorMessage = this.errorHandler(error);
			worldItemApi.setError(errorMessage);
			throw error;
		}
	}

	/**
	 * Crea un nuevo objeto del mundo
	 * @param data Datos para crear el objeto
	 */
	async create(data: CreateWorldItemData): Promise<WorldItem> {
		try {
			const response = await fetch(`${this.baseUrl}`, {
				...this.fetchOptions,
				method: 'POST',
				headers: {
					...this.fetchOptions.headers,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				throw new Error(`Error al crear el objeto del mundo: ${response.status}`);
			}

			const responseData = await response.json();
			const newItem = this.transform([responseData])[0];

			// Actualizar el store
			worldItemApi.addWorldItem(newItem);

			return newItem;
		} catch (error) {
			const errorMessage = this.errorHandler(error);
			worldItemApi.setError(errorMessage);
			throw error;
		}
	}

	/**
	 * Actualiza un objeto del mundo existente
	 * @param id ID del objeto
	 * @param data Datos para actualizar
	 */
	async update(id: string, data: UpdateWorldItemData): Promise<WorldItem> {
		try {
			const response = await fetch(`${this.baseUrl}/${id}`, {
				...this.fetchOptions,
				method: 'PATCH',
				headers: {
					...this.fetchOptions.headers,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				throw new Error(`Error al actualizar el objeto del mundo: ${response.status}`);
			}

			const responseData = await response.json();
			const updatedItem = this.transform([responseData])[0];

			// Actualizar el store
			worldItemApi.updateWorldItem(id, updatedItem);

			return updatedItem;
		} catch (error) {
			const errorMessage = this.errorHandler(error);
			worldItemApi.setError(errorMessage);
			throw error;
		}
	}

	/**
	 * Elimina un objeto del mundo
	 * @param id ID del objeto
	 */
	async delete(id: string): Promise<void> {
		try {
			const response = await fetch(`${this.baseUrl}/${id}`, {
				...this.fetchOptions,
				method: 'DELETE',
			});

			if (!response.ok) {
				throw new Error(`Error al eliminar el objeto del mundo: ${response.status}`);
			}

			// Actualizar el store
			worldItemApi.removeWorldItem(id);
		} catch (error) {
			const errorMessage = this.errorHandler(error);
			worldItemApi.setError(errorMessage);
			throw error;
		}
	}

	/**
	 * Busca objetos del mundo con filtros
	 * @param query Texto de búsqueda
	 * @param filters Filtros adicionales
	 * @param page Página a obtener
	 * @param limit Límite de elementos por página
	 */
	async search(query: string, filters: Record<string, any> = {}, page = 1, limit = 20): Promise<WorldItemSearchResult> {
		try {
			const searchParams = new URLSearchParams({
				q: query,
				page: page.toString(),
				limit: limit.toString(),
				...filters,
			});

			const response = await fetch(`${this.baseUrl}/search?${searchParams}`, this.fetchOptions);

			if (!response.ok) {
				throw new Error(`Error en la búsqueda: ${response.status}`);
			}

			const data = await response.json();

			return {
				items: this.transform(data.items),
				totalCount: data.totalCount,
				hasMore: data.hasMore,
				nextCursor: data.nextCursor,
			};
		} catch (error) {
			const errorMessage = this.errorHandler(error);
			worldItemApi.setError(errorMessage);
			throw error;
		}
	}

	/**
	 * Exporta datos de objetos del mundo
	 * @param options Opciones de exportación
	 */
	async export(options: WorldItemExportOptions): Promise<Blob> {
		try {
			const searchParams = new URLSearchParams({
				format: options.format,
				...(options.ids && { ids: options.ids.join(',') }),
				...(options.includeRelations !== undefined && { includeRelations: options.includeRelations.toString() }),
				...(options.includeMetadata !== undefined && { includeMetadata: options.includeMetadata.toString() }),
			});

			const response = await fetch(`${this.baseUrl}/export?${searchParams}`, this.fetchOptions);

			if (!response.ok) {
				throw new Error(`Error al exportar datos: ${response.status}`);
			}

			return await response.blob();
		} catch (error) {
			const errorMessage = this.errorHandler(error);
			worldItemApi.setError(errorMessage);
			throw error;
		}
	}

	/**
	 * Realiza operaciones por lotes en múltiples objetos
	 * @param options Opciones para la operación por lotes
	 */
	async batchOperation(options: WorldItemBatchOptions): Promise<void> {
		try {
			const response = await fetch(`${this.baseUrl}/batch`, {
				...this.fetchOptions,
				method: 'POST',
				headers: {
					...this.fetchOptions.headers,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(options),
			});

			if (!response.ok) {
				throw new Error(`Error en operación por lotes: ${response.status}`);
			}

			// Actualizar el store según la operación
			switch (options.operation) {
				case 'delete':
					for (const id of options.ids) {
						worldItemApi.removeWorldItem(id);
					}
					break;
				case 'favorite':
					for (const id of options.ids) {
						worldItemApi.updateWorldItem(id, { isFavorite: true });
					}
					break;
				case 'unfavorite':
					for (const id of options.ids) {
						worldItemApi.updateWorldItem(id, { isFavorite: false });
					}
					break;
				case 'update':
				case 'changeType':
				case 'changeCategory':
					if (options.data) {
						for (const id of options.ids) {
							worldItemApi.updateWorldItem(id, options.data as Partial<WorldItem>);
						}
					}
					break;
			}
		} catch (error) {
			const errorMessage = this.errorHandler(error);
			worldItemApi.setError(errorMessage);
			throw error;
		}
	}

	/**
	 * Transformación por defecto para los datos
	 * @param data Datos de la API
	 */
	private defaultTransform(data: any): WorldItem[] {
		if (Array.isArray(data)) {
			return data;
		}
		return [data];
	}

	/**
	 * Manejador de errores por defecto
	 * @param error Error capturado
	 */
	private defaultErrorHandler(error: any): string {
		console.error('Error en el servicio WorldItem:', error);
		return error instanceof Error ? error.message : 'Error desconocido en el servicio WorldItem';
	}
}

// Crear una instancia por defecto
export const worldItemService = new WorldItemService();
