/**
 * @file Punto de entrada para los transformadores de la entidad Character.
 * @module transformers/character
 * @description Exporta de forma controlada las funciones de mapeo y transformación para la entidad Character.
 */

// De mappers.ts
export {
	mapCreateCharacterDataToDrizzle,
	mapUpdateCharacterDataToDrizzle,
	mapCharacterSearchOptionsToDrizzle,
	// Alias de compatibilidad
	mapCreateCharacterDataToPrisma,
	mapUpdateCharacterDataToPrisma,
	mapCharacterSearchOptionsToPrisma,
} from './mappers';

// De transformer.ts
export { fromDrizzleCharacter, fromDrizzleCharacters } from './transformer';
