/**
 * @file Punto de entrada para transformadores de JsonFile
 * @module transformers/json-file
 
 */

// Exportar adaptador principal
export {
	adaptJsonFilesWithStats,
	adaptJsonFileWithStats,
	defaultJsonFileStats,
} from './adapter';

// Exportar mappers, serializers, validators y schemas
export * from './mappers';
export * from './schema';
export * from './serializers';
// Exportar desde transformer
export {
	fromDrizzleJsonFile,
	fromDrizzleJsonFiles,
} from './transformer';
export * from './validators';
