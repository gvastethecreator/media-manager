/**
 * @file Exportaciones principales de transformers para la entidad Image
 * @module transformers/image
 */

import { mapImageToComplete, mapToImageSummaries, mapToImageSummary } from './mappers';
import { extendImage, fromPrismaImage, parseImageFilters, validateImage } from './serializers';
import { transformImage, transformImageToExtended } from './transformer';

// Exportar el transformador principal y utilidades canónicas
export {
	extendImage,
	fromPrismaImage,
	mapImageToComplete,
	mapToImageSummaries,
	mapToImageSummary,
	parseImageFilters,
	transformImage,
	transformImageToExtended,
	validateImage,
};
