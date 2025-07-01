import { Logger } from '@/lib/logger';
import { RELATION_TYPES } from './constants';
import { RelationError } from './errors';

const logger = new Logger({ context: 'TransformerRelations' });

/**
 * 🔄 Tipo para definición de relaciones
 */
export interface RelationDefinition {
	type: (typeof RELATION_TYPES)[keyof typeof RELATION_TYPES];
	target: string;
	inverse?: string;
	required?: boolean;
}

/**
 * 🔗 Mapa de relaciones por entidad
 */
export const ENTITY_RELATIONS: Record<string, Record<string, RelationDefinition>> = {
	Group: {
		images: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Image' },
		videos: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Video' },
		albums: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Album' },
		collections: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Collection' },
		tags: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Tag' },
		characters: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Character' },
		places: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Place' },
		worldItems: { type: RELATION_TYPES.MANY_TO_MANY, target: 'WorldItem' },
		concepts: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Concept' },
		prompts: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Prompt' },
		notes: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Note' },
		wildcards: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Wildcard' },
		properties: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Property' },
	},
	Image: {
		folder: { type: RELATION_TYPES.MANY_TO_ONE, target: 'Folder', required: true },
		stats: { type: RELATION_TYPES.ONE_TO_ONE, target: 'ImageStats' },
		activities: { type: RELATION_TYPES.ONE_TO_MANY, target: 'Activity' },
		uploadedImages: { type: RELATION_TYPES.ONE_TO_MANY, target: 'UploadedImage' },
		profiles: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Profile' },
		albums: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Album' },
		collections: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Collection' },
		tags: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Tag' },
		characters: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Character' },
		places: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Place' },
		worldItems: { type: RELATION_TYPES.MANY_TO_MANY, target: 'WorldItem' },
		concepts: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Concept' },
		prompts: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Prompt' },
		notes: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Note' },
		wildcards: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Wildcard' },
		properties: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Property' },
		groups: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Group' },
	},
	Character: {
		images: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Image' },
		videos: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Video' },
		relatedCharacters: {
			type: RELATION_TYPES.MANY_TO_MANY,
			target: 'Character',
			inverse: 'relatedTo',
		},
		relatedTo: {
			type: RELATION_TYPES.MANY_TO_MANY,
			target: 'Character',
			inverse: 'relatedCharacters',
		},
		albums: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Album' },
		collections: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Collection' },
		tags: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Tag' },
		places: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Place' },
		worldItems: { type: RELATION_TYPES.MANY_TO_MANY, target: 'WorldItem' },
		concepts: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Concept' },
		prompts: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Prompt' },
		notes: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Note' },
		wildcards: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Wildcard' },
		properties: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Property' },
		groups: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Group' },
	},
	Collection: {
		images: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Image' },
		videos: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Video' },
		albums: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Album' },
		tags: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Tag' },
		characters: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Character' },
		places: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Place' },
		worldItems: { type: RELATION_TYPES.MANY_TO_MANY, target: 'WorldItem' },
		concepts: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Concept' },
		prompts: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Prompt' },
		notes: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Note' },
		wildcards: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Wildcard' },
		properties: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Property' },
		groups: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Group' },
	},
	Album: {
		// Relaciones con contenido
		images: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Image' },
		videos: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Video' },

		// Relaciones con entidades principales
		collections: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Collection' },
		tags: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Tag' },
		characters: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Character' },
		places: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Place' },
		worldItems: { type: RELATION_TYPES.MANY_TO_MANY, target: 'WorldItem' },
		concepts: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Concept' },
		prompts: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Prompt' },
		notes: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Note' },
		wildcards: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Wildcard' },
		properties: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Property' },
		groups: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Group' },
	},
	WorldItem: {
		// Relaciones con contenido
		images: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Image' },
		videos: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Video' },

		// Relaciones con entidades principales
		albums: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Album' },
		collections: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Collection' },
		tags: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Tag' },
		characters: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Character' },
		places: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Place' },
		concepts: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Concept' },
		prompts: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Prompt' },
		notes: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Note' },
		wildcards: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Wildcard' },
		properties: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Property' },
		groups: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Group' },
	},
	Video: {
		folder: { type: RELATION_TYPES.MANY_TO_ONE, target: 'Folder', required: true },

		// Relaciones con entidades principales
		albums: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Album' },
		collections: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Collection' },
		tags: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Tag' },
		characters: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Character' },
		places: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Place' },
		worldItems: { type: RELATION_TYPES.MANY_TO_MANY, target: 'WorldItem' },
		concepts: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Concept' },
		prompts: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Prompt' },
		notes: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Note' },
		wildcards: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Wildcard' },
		properties: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Property' },
		groups: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Group' },
	},
	Note: {
		// Relaciones con contenido
		images: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Image' },
		videos: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Video' },

		// Relaciones con entidades principales
		albums: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Album' },
		collections: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Collection' },
		tags: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Tag' },
		characters: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Character' },
		places: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Place' },
		worldItems: { type: RELATION_TYPES.MANY_TO_MANY, target: 'WorldItem' },
		concepts: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Concept' },
		prompts: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Prompt' },
		wildcards: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Wildcard' },
		properties: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Property' },
		groups: { type: RELATION_TYPES.MANY_TO_MANY, target: 'Group' },
	},
};

/**
 * 🔍 Obtiene las relaciones de una entidad
 */
export function getEntityRelations(entityName: string): Record<string, RelationDefinition> {
	const relations = ENTITY_RELATIONS[entityName];
	if (!relations) {
		throw new RelationError(`No se encontraron relaciones para la entidad ${entityName}`);
	}
	return relations;
}

/**
 * 🔄 Valida las relaciones de una entidad
 */
export function validateEntityRelations(entityName: string, relations: Record<string, unknown>): void {
	const entityRelations = getEntityRelations(entityName);

	// Validar relaciones requeridas
	const requiredRelations = Object.entries(entityRelations)
		.filter(([_, def]) => def.required)
		.map(([name]) => name);

	for (const relation of requiredRelations) {
		if (!relations[relation]) {
			throw new RelationError(`La relación ${relation} es requerida para ${entityName}`);
		}
	}

	// Validar relaciones proporcionadas
	for (const relation of Object.keys(relations)) {
		if (!entityRelations[relation]) {
			throw new RelationError(`La relación ${relation} no está definida para ${entityName}`);
		}
	}
}

/**
 * 🔗 Prepara las relaciones para Prisma
 */
export function preparePrismaRelations(
	entityName: string,
	relations: Record<string, unknown>
): Record<string, unknown> {
	const entityRelations = getEntityRelations(entityName);
	const prismaRelations: Record<string, unknown> = {};

	for (const [name, value] of Object.entries(relations)) {
		const definition = entityRelations[name];
		if (!definition) continue;

		switch (definition.type) {
			case RELATION_TYPES.ONE_TO_ONE:
			case RELATION_TYPES.MANY_TO_ONE:
				prismaRelations[name] = { connect: { id: value } };
				break;
			case RELATION_TYPES.ONE_TO_MANY:
			case RELATION_TYPES.MANY_TO_MANY:
				if (Array.isArray(value)) {
					prismaRelations[name] = {
						connect: value.map((id) => ({ id })),
					};
				}
				break;
		}
	}

	return prismaRelations;
}

/**
 * 🔄 Procesa las relaciones inversas
 */
export function processInverseRelations(entityName: string, relations: Record<string, unknown>): void {
	const entityRelations = getEntityRelations(entityName);

	for (const [name, definition] of Object.entries(entityRelations)) {
		if (definition.inverse && relations[name]) {
			// Procesar relación inversa
			logger.info(`Procesando relación inversa ${definition.inverse} para ${name}`);
		}
	}
}

/**
 * 📊 Obtiene el conteo de relaciones
 */
export function getRelationCounts(entityName: string, data: Record<string, unknown>): Record<string, number> {
	const counts: Record<string, number> = {};
	const entityRelations = getEntityRelations(entityName);

	for (const [name, value] of Object.entries(data)) {
		if (entityRelations[name]) {
			if (Array.isArray(value)) {
				counts[name] = value.length;
			} else if (value !== null && value !== undefined) {
				counts[name] = 1;
			}
		}
	}

	return counts;
}
