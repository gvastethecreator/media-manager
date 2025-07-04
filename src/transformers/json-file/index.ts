/**
 * @file Punto de entrada para transformadores de JsonFile
 * @module transformers/json-file
 */

// Exportar desde serializers
export * from './serializers';

// Exportar desde transformer
export {
	fromDrizzleJsonFile,
	fromDrizzleJsonFiles,
} from './transformer';
