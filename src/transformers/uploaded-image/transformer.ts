/**
 * @file Transformer específico para UploadedImage
 * @module transformers/uploaded-image/transformer
 * @description Transformadores para convertir entre diferentes representaciones de UploadedImage
 */

import {
	type UploadedImageBase,
	type UploadedImageDimensions,
	type UploadedImageExtended,
	type UploadedImageType,
} from '@/types/entities/uploaded-image/types';
import type { MediaMetadata } from '@/types/metadata.types';
import type { JSONString } from '@/utils/types/utility-types';

/**
 * Tipo para el registro de base de datos de una imagen subida
 */
export type UploadedImageDBRecord = {
	id: string;
	name: string;
	path: string;
	type: string;
	category: string;
	hash: string;
	imageId: string;
	size: number;
	width: number;
	height: number;
	metadata: string | null;
	uploadedAt: Date;
	createdAt: Date;
	updatedAt: Date;
};

/**
 * Tipo para la respuesta API de una imagen subida
 */
export type UploadedImageResult = UploadedImageExtended;

/**
 * Transforma un registro de base de datos en una entidad base
 * @param record Registro de base de datos
 * @returns Entidad base de UploadedImage
 */
export function fromDBToBase(record: UploadedImageDBRecord): UploadedImageBase {
	return {
		id: record.id,
		name: record.name,
		path: record.path,
		type: record.type as UploadedImageType,
		category: record.category,
		hash: record.hash,
		imageId: record.imageId,
		size: record.size,
		width: record.width,
		height: record.height,
		metadata: record.metadata,
		uploadedAt: record.uploadedAt,
		createdAt: record.createdAt,
		updatedAt: record.updatedAt,
	};
}

/**
 * Transforma una entidad base en una entidad extendida para cliente
 * @param entity Entidad base
 * @returns Entidad extendida con datos adicionales
 */
export function toExtended(entity: UploadedImageBase): UploadedImageExtended {
	// Calcular dimensiones con aspect ratio
	const dimensions: UploadedImageDimensions = {
		width: entity.width,
		height: entity.height,
		aspectRatio: entity.width / entity.height,
	};

	// Generar URLs
	const url = `/api/images/${encodeURIComponent(entity.path)}`;
	const thumbnailUrl = `/api/images/thumbnails/${encodeURIComponent(entity.path)}`;

	// Parsear metadata si está disponible
	const _parsedMetadata = entity.metadata ? (JSON.parse(entity.metadata) as MediaMetadata) : null;

	return {
		...entity,
		dimensions,
		url,
		thumbnailUrl,
		metadata: entity.metadata as JSONString<MediaMetadata>,
	};
}

/**
 * Transforma una entrada de cliente a un registro de base de datos para creación
 * @param input Datos de entrada
 * @returns Datos parciales para base de datos
 */
export function toDBRecord(input: Partial<UploadedImageBase>): Partial<UploadedImageDBRecord> {
	const { metadata, ...rest } = input;

	return {
		...rest,
		metadata: metadata ? (typeof metadata === 'string' ? metadata : JSON.stringify(metadata)) : null,
	};
}

/**
 * Función de transformación completa de DB a cliente
 * @param record Registro de base de datos
 * @returns Entidad extendida
 */
export function transformUploadedImage(record: UploadedImageDBRecord): UploadedImageExtended {
	const base = fromDBToBase(record);
	return toExtended(base);
}

/**
 * Función de transformación para múltiples registros
 * @param records Registros de base de datos
 * @returns Array de entidades extendidas
 */
export function transformUploadedImages(records: UploadedImageDBRecord[]): UploadedImageExtended[] {
	return records.map(transformUploadedImage);
}
