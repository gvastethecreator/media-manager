/**
 * @file Índice de transformadores para la entidad WorldItem
 * @module transformers/world-item
 */

// --- Exportaciones Controladas --- //

// De mappers.ts (Funciones actuales)
export {
	createFilter as mapWorldItemFiltersToPrisma, // Renombrar para consistencia
	createOrderBy as mapWorldItemOrderByToPrisma, // Renombrar para consistencia
	generateColor as generateWorldItemColor, // Renombrar para claridad
	generateEmoji as generateWorldItemEmoji, // Renombrar para claridad
	toCreateData as mapCreateWorldItemDataToPrisma, // Renombrar para consistencia
	toSearchOptions as mapWorldItemSearchOptionsToPrisma,
	toUpdateData as mapUpdateWorldItemDataToPrisma, // Renombrar para consistencia
} from './mappers';
// De serializers.ts (Funciones actuales)
export {
	deserializeAttributes,
	deserializeEffects,
	deserializeFilters,
	deserializeProperties,
	deserializeRequirements,
	deserializeStats,
	deserializeTags,
	extendWorldItem,
	extendWorldItems,
	serializeAttributes,
	serializeEffects,
	serializeFilters,
	serializeProperties,
	serializeRequirements,
	serializeStats,
	serializeTags,
} from './serializers';
// De server.ts (funciones principales de transformación y validación)
export { fromPrismaWorldItem, toPrismaWorldItem, validateWorldItem } from './server';

// De transformer.ts
export {
	transformWorldItem,
	transformWorldItems,
	transformWorldItemToExtended,
	transformWorldItemToWithStats,
} from './transformer';

// --- Fin Exportaciones Controladas --- //
