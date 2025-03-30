/**
 * @file Serializadores para convertir entre formatos para la entidad Image
 * @module transformers/image/serializers
 */

import { Logger } from '@/lib/logger';
import { Prisma } from '@prisma/client';
import {
	ImageBase,
	ImageComplete,
	ImageCreateInput,
	ImageUpdateInput,
	ImageSchema,
} from '@/types/entities/image/types';
import {
	serializeJsonField,
	deserializeJsonField,
	validateRequiredFields,
	validateFieldType,
} from '@/utils/transformers/common';
import {
	validateBaseEntity,
	validateUIFields,
	validateMetadataFields,
} from '@/utils/transformers/validation';
import {
	validateEntityRelations,
	preparePrismaRelations,
	getRelationCounts,
} from '@/utils/transformers/relations';
import {
	SerializationError,
	ValidationError,
	handleTransformerError,
} from '@/utils/transformers/errors';

const logger = new Logger('ImageSerializer');

/**
 * 🔄 Serializa una Image para Prisma
 */
export function toPrismaImage(data: ImageCreateInput | ImageUpdateInput): Prisma.ImageCreateInput | Prisma.ImageUpdateInput {
	try {
		// Validar campos requeridos para creación
		if (!('id' in data)) {
			validateRequiredFields(data, ['name', 'path', 'hash', 'size', 'width', 'height', 'folder']);
		}

		// Validar tipos de datos
		validateFieldType(data.name, 'string', 'name');
		validateFieldType(data.path, 'string', 'path');
		validateFieldType(data.hash, 'string', 'hash');
		validateFieldType(data.size, 'number', 'size');
		validateFieldType(data.width, 'number', 'width');
		validateFieldType(data.height, 'number', 'height');

		// Serializar campos JSON
		const metadata = serializeJsonField(data.metadata, '{}');

		// Preparar relaciones para Prisma
		const relations = preparePrismaRelations('Image', data);

		return {
			...data,
			metadata,
			...relations,
		};
	} catch (error) {
		throw handleTransformerError(error);
	}
}

/**
 * 🔄 Deserializa una Image desde Prisma
 */
export function fromPrismaImage(
	prismaImage: Prisma.ImageGetPayload<{
		include: {
			folder: true;
			stats: true;
			activities: true;
			uploadedImages: true;
			profiles: true;
			albums: true;
			collections: true;
			tags: true;
			characters: true;
			places: true;
			worldItems: true;
			concepts: true;
			prompts: true;
			notes: true;
			wildcards: true;
			properties: true;
			groups: true;
			_count: true;
		};
	}>
): ImageComplete {
	try {
		// Deserializar campos JSON
		const metadata = deserializeJsonField(prismaImage.metadata, {});

		// Obtener conteos de relaciones
		const counts = getRelationCounts('Image', prismaImage);

		// Construir objeto base
		const baseImage: ImageBase = {
			id: prismaImage.id,
			name: prismaImage.name,
import { serverLogger } from '@/lib/logger/server-logger';
import type {
  ImageBase,
  ImageComplete,
  ImageExtended,
  ImageExtendedComplete,
  ImageMetadata,
  ImageVisualConfigBase,
  ImageVisualConfigComplete,
  ImageVisualConfigExtended,
} from '../../types/entities/image';

// Logger específico para serializadores de Image
const serializerLogger = serverLogger.withContext('ImageSerializers');

/**
 * Convierte un ImageBase en un ImageComplete deserializando campos JSON
 * @param image Imagen base desde Prisma
 * @returns Imagen con campos JSON parseados
 */
export function toImageComplete(image: ImageBase): ImageComplete {
	try {
		// Extraer el campo metadata para procesarlo
		const { metadata: rawMetadata, ...rest } = image;

		// Crear objeto base con el resto de propiedades
		const completeImage: ImageComplete = {
			...rest,
			// Por defecto metadata es undefined
			metadata: undefined
		};

		// Procesar metadatos si existen
		if (rawMetadata) {
			try {
				completeImage.metadata = JSON.parse(rawMetadata) as ImageMetadata;
			} catch (error) {
				serializerLogger.error('❌ Error al deserializar metadatos de imagen:', error);
				// En caso de error, dejamos metadata como undefined
			}
		}

		return completeImage;
	} catch (error) {
		serializerLogger.error('❌ Error al deserializar Image a ImageComplete:', error);
		// En caso de error, devolvemos una versión básica sin procesar metadata
		return {
			...image,
			metadata: undefined
		};
	}
}

/**
 * Convierte un ImageComplete a su formato para almacenar en base de datos
 * @param image Imagen con campos parseados
 * @returns Imagen con campos serializados para almacenar
 */
export function fromImageComplete(image: ImageComplete): ImageBase {
	try {
		// Extraer el campo metadata para procesarlo
		const { metadata, ...rest } = image;

		// Crear objeto base con el resto de propiedades
		const baseImage: ImageBase = {
			...rest,
			// Por defecto metadata es null
			metadata: null
		};

		// Serializar metadatos si existen
		if (metadata) {
			try {
				baseImage.metadata = JSON.stringify(metadata);
			} catch (error) {
				serializerLogger.error('❌ Error al serializar metadatos de imagen:', error);
				// En caso de error, dejamos metadata como null
			}
		}

		return baseImage;
	} catch (error) {
		serializerLogger.error('❌ Error al serializar ImageComplete a ImageBase:', error);
		// En caso de error, devolvemos una versión básica con metadata como null o lo que tenga
		return {
			...image,
			metadata: image.metadata ? JSON.stringify(image.metadata) : null
		} as ImageBase;
	}
}

/**
 * Convierte un ImageVisualConfigBase a ImageVisualConfigComplete deserializando campos JSON
 * @param config Configuración visual base desde Prisma
 * @returns Configuración visual con campos JSON parseados
 */
export function toImageVisualConfigComplete(config: ImageVisualConfigBase | null | undefined): ImageVisualConfigComplete | undefined {
	if (!config) return undefined;

	try {
		// Extraer el campo layerSystem para procesarlo
		const { layerSystem, ...rest } = config;

		// Crear objeto base con el resto de propiedades
		const completeConfig: ImageVisualConfigComplete = {
			...rest,
			// Por defecto layersConfig es undefined
			layersConfig: undefined
		};

		// Procesar sistema de capas si existe
		if (layerSystem) {
			try {
				completeConfig.layersConfig = JSON.parse(layerSystem);
			} catch (error) {
				serializerLogger.error('❌ Error al deserializar layerSystem:', error);
				// En caso de error, dejamos layersConfig como undefined
			}
		}

		return completeConfig;
	} catch (error) {
		serializerLogger.error('❌ Error al deserializar configuración visual:', error);
		// En caso de error, devolvemos una versión básica con solo las propiedades no-JSON
		return {
			...config,
			layersConfig: undefined
		} as ImageVisualConfigComplete;
	}
}

/**
 * Convierte un ImageVisualConfigComplete a su formato para almacenar en base de datos
 * @param config Configuración visual con campos parseados
 * @returns Configuración visual con campos serializados para almacenar
 */
export function fromImageVisualConfigComplete(config: ImageVisualConfigComplete | null | undefined): ImageVisualConfigBase | undefined {
	if (!config) return undefined;

	try {
		// Extraer el campo layersConfig para procesarlo
		const { layersConfig, ...rest } = config;

		// Crear objeto base con el resto de propiedades
		const baseConfig: Partial<ImageVisualConfigBase> = {
			...rest,
			// Por defecto layerSystem es null
			layerSystem: null
		};

		// Serializar sistema de capas si existe
		if (layersConfig) {
			try {
				baseConfig.layerSystem = JSON.stringify(layersConfig);
			} catch (error) {
				serializerLogger.error('❌ Error al serializar layersConfig:', error);
				// En caso de error, dejamos layerSystem como null
			}
		}

		return baseConfig as ImageVisualConfigBase;
	} catch (error) {
		serializerLogger.error('❌ Error al serializar configuración visual:', error);
		// En caso de error, devolvemos una versión básica con layerSystem como null
		return {
			...config,
			layerSystem: config.layersConfig ? JSON.stringify(config.layersConfig) : null
		} as ImageVisualConfigBase;
	}
}

/**
 * Serializa los metadatos de una imagen desde string a objeto
 * @param metadata String JSON con los metadatos
 * @returns Objeto tipado de metadatos o undefined si no es válido
 * @deprecated Use toImageComplete instead
 */
export function serializeImageMetadata(metadata: string | null | undefined): ImageMetadata | undefined {
	if (!metadata) return undefined;

	try {
		const parsed = JSON.parse(metadata);
		return parsed as ImageMetadata;
	} catch (error) {
		serializerLogger.error('Error al serializar metadatos de imagen:', error);
		return undefined;
	}
}

/**
 * Deserializa los metadatos de una imagen a formato string para almacenamiento
 * @param metadata Objeto de metadatos
 * @returns String JSON para almacenamiento en BD
 * @deprecated Use fromImageComplete instead
 */
export function deserializeImageMetadata(metadata: ImageMetadata | undefined | null): string | undefined {
	if (!metadata) return undefined;

	try {
		return JSON.stringify(metadata);
	} catch (error) {
		serializerLogger.error('Error al deserializar metadatos de imagen:', error);
		return undefined;
	}
}

/**
 * Serializa la configuración visual de una imagen desde string a objeto
 * @param config String JSON con la configuración
 * @returns Objeto tipado de configuración o undefined si no es válido
 * @deprecated Use toImageVisualConfigComplete instead
 */
export function serializeImageVisualConfig(
	visualConfig: ImageVisualConfigBase | null | undefined
): ImageVisualConfigExtended | undefined {
	if (!visualConfig) return undefined;

	// Transformar la config básica en extendida
	const extendedConfig: ImageVisualConfigExtended = {
		...visualConfig,
		effectsEnabled: true, // valor por defecto
	};

	// Procesar campos de tipo string JSON
	if (visualConfig.layerSystem) {
		try {
			extendedConfig.layersConfig = JSON.parse(visualConfig.layerSystem);
		} catch (error) {
			serializerLogger.error('Error al serializar layerSystem:', error);
		}
	}

	// Procesar campos adicionales si es necesario

	return extendedConfig;
}

/**
 * Convierte una imagen base a un formato extendido con propiedades adicionales
 * @param image Imagen base desde Prisma
 * @returns Imagen extendida con propiedades adicionales
 */
export function extendImage(image: ImageBase | ImageComplete): ImageExtended | ImageExtendedComplete {
	try {
		// Asegurar que tenemos una versión completa con metadata procesada
		const completeImage = 'metadata' in image && typeof image.metadata !== 'string'
			? image as ImageComplete
			: toImageComplete(image as ImageBase);

		// Base para la imagen extendida
		const extended: Partial<ImageExtendedComplete> = {
			...completeImage,
			hasMetadata: !!completeImage.metadata,
			hasThumbnail: !!image.thumbnail,
			hasError: !!image.thumbnailError,
			aspectRatio: image.width / image.height,
			isSelected: false,
			isHighlighted: false,
			isEditing: false,
			isExpanded: false
		};

		// Generar URLs para acceso a recursos
		extended.thumbnailUrl = `/api/images/${image.id}/thumbnail`;
		extended.fullUrl = `/api/images/${image.id}/full`;

		return extended as ImageExtendedComplete;
	} catch (error) {
		serializerLogger.error('❌ Error al extender imagen:', error);
		// En caso de error, intentamos devolver una versión básica extendida
		const image = image as ImageBase;
		return {
			...image,
			metadata: typeof image.metadata === 'string' ? serializeImageMetadata(image.metadata) : image.metadata,
			hasMetadata: !!image.metadata,
			hasThumbnail: !!image.thumbnail,
			hasError: !!image.thumbnailError,
			aspectRatio: image.width / image.height,
			thumbnailUrl: `/api/images/${image.id}/thumbnail`,
			fullUrl: `/api/images/${image.id}/full`,
			isSelected: false,
			isHighlighted: false,
			isEditing: false,
			isExpanded: false
		} as ImageExtendedComplete;
	}
}

/**
 * Convierte un array de imágenes base a formato extendido
 * @param images Array de imágenes base
 * @returns Array de imágenes extendidas
 */
export function extendImages(images: (ImageBase | ImageComplete)[]): (ImageExtended | ImageExtendedComplete)[] {
	return images.map(extendImage);
}
