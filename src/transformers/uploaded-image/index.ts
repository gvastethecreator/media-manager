/**
 * @file Punto de entrada para los módulos de transformación de UploadedImage
 * @module transformers/uploaded-image
 * @description Exporta todos los componentes necesarios (mappers, serializers, transformers) para la entidad UploadedImage.
 */

export * from './mappers';
export * from './serializers';
export * from './transformer';
// Alias para compatibilidad con servicios
export {
	transformToUploadedImageFromDrizzle as fromDB,
	transformToUploadedImageFromDrizzle as transformUploadedImage,
} from './transformer';
