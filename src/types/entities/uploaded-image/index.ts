/**
 * @file Exportaciones principales de tipos para la entidad UploadedImage
 * @module types/entities/uploaded-image
 */

export * from './transformers';
export * from './types';
export type {
	UploadedImageBase,
	UploadedImageCreateInput,
	UploadedImageDimensions,
	UploadedImageExtended,
	UploadedImageUpdateInput,
} from './types';

export {
	UploadedFileType,
	UploadedImageSchema,
	// Alias para retrocompatibilidad
	UploadedFileType as UploadedImageType,
} from './types';
