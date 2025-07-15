/**
 * @file Exportaciones principales de tipos para la entidad UploadedImage
 * @module types/entities/uploaded-image
 */

export type {
	UploadedImageBase,
	UploadedImageCreateInput,
	UploadedImageDimensions,
	UploadedImageExtended,
	UploadedImageUpdateInput,
	UploadedImageWithStats,
} from './types';

export {
	UploadedFileType,
	// Alias para retrocompatibilidad
	UploadedFileType as UploadedImageType,
	UploadedImageSchema,
} from './types';
