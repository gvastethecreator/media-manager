/**
 * @file Transformer for image entity
 * @module types/entities/image/transformer
 */

import type { ImageBase } from './types';

/**
 * Type for database image record (ahora canónico)
 */
export type ImageDBRecord = ImageBase;

/**
 * Type for API response of image (puede ser igual a ImageBase o extendido según necesidades)
 */
export type ImageResult = ImageBase;

/**
 * Transformer para imágenes (solo ejemplo, ajustar según lógica real)
 */
export const imageTransformer = {
	/**
	 * Transform database record to domain entity
	 */
	fromDB: (record: ImageBase): ImageBase => {
		return {
			id: record.id,
			name: record.name,
			description: record.description,
			path: record.path,
			hash: record.hash,
			size: record.size,
			width: record.width,
			height: record.height,
			metadata: record.metadata,
			isFavorite: record.isFavorite,
			createdAt: record.createdAt,
			updatedAt: record.updatedAt,
			addedAt: record.addedAt,
			sortBy: record.sortBy,
			filters: record.filters,
		};
	},

	/**
	 * Transform domain entity to client result with additional data
	 */
	toClient: (entity: ImageBase, _options?: { includes?: { folder?: any } }): ImageResult => {
		// Parse metadata if available
		const metadata = entity.metadata ? JSON.parse(entity.metadata as string) : null;

		// Calculate thumbnail URL if available
		const hasThumbnail = false; // Lógica real debe ir aquí si aplica
		const _thumbnailUrl = hasThumbnail ? `/api/images/${entity.id}/thumbnail` : null;

		// Calculate full image URL
		const _fullUrl = `/api/images/${entity.id}`;

		// Calculate aspect ratio
		const _aspectRatio = entity.width && entity.height ? entity.width / entity.height : 1;

		return {
			...entity,
			metadata,
		};
	},

	/**
	 * Transform client input to database record for creation
	 */
	toDB: (input: Partial<ImageBase>): Partial<ImageDBRecord> => {
		const { metadata, ...rest } = input;

		return {
			...rest,
			metadata: metadata ? (typeof metadata === 'string' ? metadata : JSON.stringify(metadata)) : null,
		};
	},
};
