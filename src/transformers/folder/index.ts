/**
 * @file Punto de entrada para todos los transformadores de Folder
 * @module transformers/folder
 */

// Importar explícitamente para evitar conflictos y controlar exportaciones
import { mapFolderToFolder, toPrismaFolder } from './converters';
import { mapCreateFolderDataToPrisma, mapFolderFiltersToPrisma, mapUpdateFolderDataToPrisma } from './mappers';
import {
    extendFolder,
    fromFolderComplete,
    fromPrismaFolder,
    generateFolderColor,
    generateFolderEmoji,
    normalizeFolderPath,
    normalizeFolderType,
    parseFolderFilters,
    toRelatedFolder,
    validateFolder,
    withFolderStats,
} from './serializers';
import { transformFolderBase, transformFolderToExtended } from './transformer';

// --- Re-exportaciones controladas --- //

// De converters.ts (excluimos toFolderComplete original)
export { mapFolderToFolder, toPrismaFolder };

// De serializers.ts
    export {
        extendFolder,
        fromFolderComplete,
        fromPrismaFolder,
        generateFolderColor,
        generateFolderEmoji,
        normalizeFolderPath,
        normalizeFolderType,
        parseFolderFilters,
        toRelatedFolder,
        validateFolder,
        withFolderStats
    };

// De mappers.ts
    export { mapCreateFolderDataToPrisma, mapFolderFiltersToPrisma, mapUpdateFolderDataToPrisma };

// De transformer.ts (exportamos transformFolderBase como transformFolder)
    export { transformFolderBase as transformFolder, transformFolderToExtended };

