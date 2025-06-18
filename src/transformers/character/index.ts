/**
 * @file Punto de entrada para los transformadores de la entidad Character.
 * @module transformers/character
 * @description Exporta de forma controlada las funciones de mapeo y transformación para la entidad Character.
 */

// De mappers.ts
export {
    mapCharacterSearchOptionsToPrisma, mapCreateCharacterDataToPrisma,
    mapUpdateCharacterDataToPrisma
} from './mappers';

// De transformer.ts
export { fromPrismaCharacter, fromPrismaCharacters } from './transformer';

