/**
 * @file Punto de entrada para todos los transformadores de Folder
 * @module transformers/folder
 */

// Exportar converters
export * from './converters';

// Exportar serializadores
export * from './serializers';

// Exportar mappers
export * from './mappers';

// Exportar servicio
export * from './service';

// Exportar transformador principal
export * from './transformer';

/**
 * Transforma un objeto Folder de Prisma a un objeto FolderExtended
 * @param folder Carpeta de Prisma
 * @returns Objeto transformado con propiedades adicionales
 */
export const transformFolder = toFolderExtended;

