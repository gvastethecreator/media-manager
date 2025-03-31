/**
 * @file Transformador de entidad Character
 * @module transformers/character
 * @deprecated Importar directamente desde src/transformers/character/v2
 */

import {
    CharacterTransformOptions,
    CharacterTransformer,
    DEFAULT_CHARACTER_COLOR,
    DEFAULT_CHARACTER_EMOJI,
    extendCharacter,
    extendCharacters,
    fromPrismaCharacter,
    toCharacterRelated,
    toCreateCharacterData,
    toPrismaCharacter,
    toSearchOptions,
    toUpdateCharacterData,
    validateCharacter
} from './character/v2';

import { getSuggestedAppearance } from './character/mappers';
// Importar funciones específicas requeridas por otros módulos
import { serializeObject } from './character/serializers';

// Re-exportar todo para compatibilidad
export {
    CharacterTransformOptions,
    DEFAULT_CHARACTER_COLOR,
    DEFAULT_CHARACTER_EMOJI,
    extendCharacter,
    extendCharacters,
    fromPrismaCharacter, getSuggestedAppearance,
    // Exportar funciones adicionales
    serializeObject, toPrismaCharacter,
    validateCharacter
};

// Re-exportar funciones de mapeo con nombres compatibles
    export { toCreateCharacterData, toCharacterRelated as toRelatedCharacter, toSearchOptions, toUpdateCharacterData };

// Alias para compatibilidad con código existente
export const mapCreateCharacterDataToPrisma = toCreateCharacterData;
export const mapUpdateCharacterDataToPrisma = toUpdateCharacterData;
export const mapCharacterToRelated = toCharacterRelated;

export default CharacterTransformer;