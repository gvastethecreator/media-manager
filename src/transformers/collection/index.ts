/**
 * @file Punto de entrada para los transformadores de la entidad Collection.
 * @module transformers/collection
 * @description Exporta de forma controlada las funciones de mapeo y transformación para la entidad Collection.
 */

// De mappers.ts
export {
	toCollectionWithStats,
} from './mappers';

// De transformer.ts
export { fromDrizzleCollection, fromDrizzleCollections } from './transformer';
