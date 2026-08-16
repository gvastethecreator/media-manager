/**
 * @file Exportaciones principales de tipos para la entidad UploadedImage
 * @module types/entities/uploaded-image
 */

export {
	UploadedFileType,
	// Alias para retrocompatibilidad
	UploadedFileType as UploadedImageType,
} from './enums';
export type {
	UploadedImageBase,
	UploadedImageCreateInput,
	UploadedImageDimensions,
	UploadedImageExtended,
	UploadedImageStatistics,
	UploadedImageUpdateInput,
	UploadedImageWithStats,
} from './types';
