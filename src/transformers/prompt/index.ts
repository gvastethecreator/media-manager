/**
 * @file Exportaciones para el transformer de Prompt
 * @module transformers/prompt
 */

// Importar funciones de mapeo
import {
	filterPrompts,
	mapCreatePromptDataToPrisma,
	mapPromptsToRelated,
	mapPromptToRelated,
	mapUpdatePromptDataToPrisma,
	paginatePrompts,
	processPrompts,
	sortPrompts,
	toPromptWithStats,
} from './mappers';

// Importar funciones de serialización
import { deserializeParameters, deserializeTags, serializeParameters, serializeTags } from './serializers';

// Importar funciones del transformer
import { fromPrismaPrompt, fromPrismaPrompts } from './transformer';

// Exportar funciones individuales
export {
	// Serializers
	deserializeParameters,
	deserializeTags,
	// Mappers
	filterPrompts,
	// Transformers
	fromPrismaPrompt,
	fromPrismaPrompts,
	mapCreatePromptDataToPrisma,
	mapPromptsToRelated,
	mapPromptToRelated,
	mapUpdatePromptDataToPrisma,
	paginatePrompts,
	processPrompts,
	serializeParameters,
	serializeTags,
	sortPrompts,
	toPromptWithStats,
	// Aliases para compatibilidad
	fromPrismaPrompt as transformPrompt,
	fromPrismaPrompts as transformPrompts,
};
