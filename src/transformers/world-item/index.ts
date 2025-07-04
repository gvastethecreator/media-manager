/**
 * @file Índice de transformadores para la entidad WorldItem
 * @module transformers/world-item
 */

// --- Exportaciones Controladas --- //

// De mappers.ts
export {
	toWorldItemWithStats,
} from './mappers';
// De serializers.ts
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
// De transformer.ts (funciones principales de transformación)
export {
	fromDrizzleWorldItem,
	fromDrizzleWorldItems
} from './transformer';

// --- Fin Exportaciones Controladas --- //
