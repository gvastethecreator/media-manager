/**
 * @file Índice de transformadores para la entidad WorldItem
 * @module transformers/world-item
 */

// --- Exportaciones Controladas --- //

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

// De mappers.ts (Funciones actuales)
export {
	generateColor as generateWorldItemColor, // Renombrar para claridad
	generateEmoji as generateWorldItemEmoji, // Renombrar para claridad
	toCreateData as mapCreateWorldItemDataToPrisma, // Renombrar para consistencia
	toUpdateData as mapUpdateWorldItemDataToPrisma, // Renombrar para consistencia
	createFilter as mapWorldItemFiltersToPrisma, // Renombrar para consistencia
	createOrderBy as mapWorldItemOrderByToPrisma, // Renombrar para consistencia
	toSearchOptions as mapWorldItemSearchOptionsToPrisma,
} from './mappers';

// De transformer.ts
export {
	transformWorldItem,
	transformWorldItemToExtended,
	transformWorldItemToWithStats,
	transformWorldItems,
} from './transformer';

// --- Fin Exportaciones Controladas --- //
