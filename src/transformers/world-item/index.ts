/**
 * @file Exportaciones para transformadores de la entidad WorldItem
 * @module transformers/world-item
 */

export * from './mappers';
export * from './serializers';

// Reexportar funciones específicas para facilitar el acceso
export {
	deserializeWorldItemFilters,
	// Serializadores
	deserializeWorldItemProperties,
	deserializeWorldItemRequirements,
	deserializeWorldItemStats,
	parseJsonFields,
	parseVisualConfig,
	serializeWorldItemFilters,
	serializeWorldItemProperties,
	serializeWorldItemRequirements,
	serializeWorldItemStats,
} from './serializers';

export {
	// Mapeadores
	extendWorldItem,
	extendWorldItems,
	generateWorldItemColor,
	generateWorldItemEmoji,
	mapVisualConfig,
	prepareCreateWorldItemData,
	prepareUpdateWorldItemData,
	prepareVisualConfigUpdateData,
} from './mappers';
