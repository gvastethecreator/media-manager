/**
 * @file Exportaciones principales de transformers para la entidad Group
 * @module transformers/group
 */

// Exportar mappers
export {
	mapCreateGroupDataToPrisma, mapGroupFiltersToPrisma,
	mapGroupToRelatedGroup, mapUpdateGroupDataToPrisma
} from './mappers';

// Exportar serializadores
export {
	DEFAULT_GROUP_COLOR, DEFAULT_GROUP_EMOJI, extendGroup,
	extendGroups,
	fromGroupComplete, generateGroupColor, generateGroupEmoji, parseGroupFilters,
	serializeGroupFilters,
	toGroupComplete
} from './serializers';

