/**
 * @file Transformadores para la entidad Character
 * @module transformers/character/transformer
 *
 * ⚠️ Este archivo sigue el plan de robustecimiento y buenas prácticas:
 * - Tipado estricto en todas las funciones
 * - Validación y conversión segura de tipos
 * - Comentarios clave y emojis para mantenibilidad
 * - Documentación de uso y advertencias
 *
 * Ejemplo de uso:
 * ```ts
 * import { transformCharacter } from '@/transformers/character/transformer';
 * const prismaCharacter = { id: '1', name: 'John', ... };
 * const character = transformCharacter(prismaCharacter);
 * ```
 *
 * Diagrama de flujo:
 * ```mermaid
 * flowchart TD
 *   A[Entrada: Objeto Character] --> B{¿Es nulo o indefinido?}
 *   B -- Sí --> Z[Error: objeto nulo]
 *   B -- No --> C{¿Tiene id y name?}
 *   C -- Sí --> D[Llama fromPrismaCharacter]
 *   C -- No --> E{¿Validar con Zod?}
 *   E -- Sí --> F[Validar con CharacterSchema]
 *   F -- Error --> Z
 *   F -- Ok --> G[Llama fromPrismaCharacter]
 *   E -- No --> G
 *   D & G --> H[Retorna CharacterComplete]
 * ```
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { CharacterSchema } from '@/types/entities/character-export';
import { TransformerError } from '@/utils/transformers/errors';
import type { Character } from '@prisma/client';
import { fromPrismaCharacter } from './server';
import type { CharacterComplete, CharacterExtended, CharacterWithStats, TransformCharacterOptions } from './types';

/**
 * 🔄 Transforma un objeto a Character
 * @param input Objeto a transformar a Character
 * @param options Opciones de transformación
 * @returns Character transformado
 * @throws TransformerError si hay errores en la validación o transformación
 */
export function transformCharacter<T extends Partial<CharacterComplete> | Character | unknown>(
	input: T,
	options: TransformCharacterOptions = {}
): CharacterComplete {
	try {
		// Validar que input no sea nulo o indefinido
		if (input === null || input === undefined) {
			throw new TransformerError('El objeto a transformar es nulo o indefinido');
		}

		// Si el input es un objeto Prisma, usamos el serializador existente
		// ⚠️ Conversión forzada a Character solo si es necesario, documentado aquí:
		if (typeof input === 'object' && 'id' in input && 'name' in input) {
			const raw = fromPrismaCharacter(input as unknown as Character, {
				validateFields: options.validateFields ?? true,
				deserializeFields: options.deserializeFields ?? true,
				includeRelations: options.includeRelations ?? false,
				includeUI: options.includeUI ?? true,
				includeStats: options.includeStats ?? false,
			});
			return normalizeCharacterComplete(raw);
		}

		// Validar con Zod si es necesario
		if (options.validateFields) {
			const parsed = CharacterSchema.safeParse(input);
			if (!parsed.success) {
				throw new TransformerError(`Validación fallida: ${parsed.error.message}`);
			}
		}

		// Convertir a CharacterComplete
		// ⚠️ Conversión forzada a Character para asegurar compatibilidad con el transformer
		const raw = fromPrismaCharacter(input as unknown as Character, {
			validateFields: options.validateFields ?? true,
			deserializeFields: options.deserializeFields ?? true,
			includeRelations: options.includeRelations ?? false,
			includeUI: options.includeUI ?? true,
			includeStats: options.includeStats ?? false,
		});
		return normalizeCharacterComplete(raw);
	} catch (error) {
		serverLogger.error(`Error transformando character: ${error}`);
		if (error instanceof TransformerError) {
			throw error;
		}
		throw new TransformerError(`Error transformando character: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Transforma una array de objetos a Characters
 * @param inputs Array de objetos a transformar
 * @param options Opciones de transformación
 * @returns Array de Characters transformados
 * @throws TransformerError si hay errores en la validación o transformación
 */
export function transformCharacters<T extends Partial<CharacterComplete> | Character | unknown>(
	inputs: T[],
	options: TransformCharacterOptions = {}
): CharacterComplete[] {
	try {
		// Validar que sea un array
		if (!Array.isArray(inputs)) {
			throw new TransformerError('El valor proporcionado no es un array');
		}

		// Transformar cada elemento
		return inputs.map((input) => transformCharacter(input, options));
	} catch (error) {
		serverLogger.error(`Error transformando array de characters: ${error}`);
		if (error instanceof TransformerError) {
			throw error;
		}
		throw new TransformerError(`Error transformando array de characters: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Transforma un Character a su versión extendida para UI
 * @param character Character a transformar
 * @returns CharacterExtended con propiedades adicionales para UI
 * @throws TransformerError si hay errores en la transformación
 */
export function transformCharacterToExtended<T extends Partial<CharacterComplete> | Character | unknown>(
	character: T
): CharacterExtended {
	try {
		// Primero transformamos a CharacterComplete
		const characterComplete = transformCharacter(character);

		// Calculamos propiedades extendidas
		return {
			...characterComplete,
			isSelected: false,
			isHighlighted: false,
			previewContent: characterComplete.description?.substring(0, 100) ?? '',
			lastUpdated: characterComplete.updatedAt,
			importance: calculateImportance(characterComplete),
		};
	} catch (error) {
		serverLogger.error(`Error transformando character a extendido: ${error}`);
		if (error instanceof TransformerError) {
			throw error;
		}
		throw new TransformerError(`Error transformando character a extendido: ${(error as Error).message}`);
	}
}

/**
 * 🔄 Transforma un Character a su versión con estadísticas
 * @param character Character a transformar
 * @returns CharacterWithStats con estadísticas calculadas
 * @throws TransformerError si hay errores en la transformación
 */
export function transformCharacterToWithStats<T extends Partial<CharacterComplete> | Character | unknown>(
	character: T
): CharacterWithStats {
	try {
		// Primero transformamos a CharacterComplete
		const characterComplete = transformCharacter(character, { includeRelations: true });

		// Calculamos estadísticas
		return {
			...characterComplete,
			stats: {
				imageCount: characterComplete._count?.images ?? 0,
				videoCount: characterComplete._count?.videos ?? 0,
				albumCount: characterComplete._count?.albums ?? 0,
				tagCount: characterComplete._count?.tags ?? 0,
				noteCount: characterComplete._count?.notes ?? 0,
				placeCount: characterComplete._count?.places ?? 0,
				worldItemCount: characterComplete._count?.worldItems ?? 0,
				conceptCount: characterComplete._count?.concepts ?? 0,
				promptCount: characterComplete._count?.prompts ?? 0,
				wildcardCount: characterComplete._count?.wildcards ?? 0,
				propertyCount: characterComplete._count?.properties ?? 0,
				groupCount: characterComplete._count?.groups ?? 0,
				relatedCharacterCount: characterComplete._count?.relatedCharacters ?? 0,
				totalContentItems: calculateTotalContent(characterComplete),
				lastUpdated: characterComplete.updatedAt,
				lastUsed: new Date(), // Placeholder, debería obtenerse de algún sistema de seguimiento
			},
		};
	} catch (error) {
		serverLogger.error(`Error transformando character con estadísticas: ${error}`);
		if (error instanceof TransformerError) {
			throw error;
		}
		throw new TransformerError(`Error transformando character con estadísticas: ${(error as Error).message}`);
	}
}

/**
 * Normaliza un CharacterComplete para asegurar que todas las propiedades requeridas existen y tienen el tipo correcto
 * ⚠️ Esto previene errores de tipado cuando el input es parcial, stringificado o proviene de mocks/test
 */
function normalizeStringOrArrayField(value: string | any[] | undefined): string {
	if (Array.isArray(value)) return JSON.stringify(value);
	if (typeof value === 'string') {
		try {
			const parsed = JSON.parse(value);
			return Array.isArray(parsed) ? value : '[]';
		} catch {
			return '[]';
		}
	}
	return '[]';
}
function normalizeStringOrObjectField(value: string | object | undefined): string {
	if (typeof value === 'object' && value !== null) return JSON.stringify(value);
	if (typeof value === 'string') {
		try {
			const parsed = JSON.parse(value);
			return typeof parsed === 'object' && parsed !== null ? value : '{}';
		} catch {
			return '{}';
		}
	}
	return '{}';
}
function normalizeCharacterComplete(input: Partial<CharacterComplete>): CharacterComplete {
	return {
		id: input.id ?? '',
		name: input.name ?? '',
		emoji: input.emoji ?? '🧑',
		color: input.color ?? '#3b82f6',
		description: input.description ?? '',
		shortcut: input.shortcut ?? '',
		category: input.category ?? 'general',
		level: input.level ?? 1,
		class: input.class ?? '',
		race: input.race ?? '',
		alignment: input.alignment ?? '',
		sortBy: (input as any).sortBy ?? '',
		type: (input as any).type ?? '',
		backstory: (input as any).backstory ?? '',
		featuredImage: (input as any).featuredImage ?? '',
		isFavorite: (input as any).isFavorite ?? false,
		createdAt: input.createdAt ?? new Date(),
		updatedAt: input.updatedAt ?? new Date(),
		images: Array.isArray(input.images) ? input.images : [],
		videos: Array.isArray(input.videos) ? input.videos : [],
		albums: Array.isArray(input.albums) ? input.albums : [],
		collections: Array.isArray(input.collections) ? input.collections : [],
		tags: Array.isArray(input.tags) ? input.tags : [],
		notes: Array.isArray(input.notes) ? input.notes : [],
		places: Array.isArray(input.places) ? input.places : [],
		worldItems: Array.isArray(input.worldItems) ? input.worldItems : [],
		concepts: Array.isArray(input.concepts) ? input.concepts : [],
		prompts: Array.isArray(input.prompts) ? input.prompts : [],
		wildcards: Array.isArray(input.wildcards) ? input.wildcards : [],
		properties: Array.isArray(input.properties) ? input.properties : [],
		groups: Array.isArray(input.groups) ? input.groups : [],
		relatedCharacters: Array.isArray(input.relatedCharacters) ? input.relatedCharacters : [],
		relatedTo: Array.isArray(input.relatedTo) ? input.relatedTo : [],
		_count: input._count ?? {
			images: 0,
			videos: 0,
			albums: 0,
			collections: 0,
			tags: 0,
			notes: 0,
			places: 0,
			worldItems: 0,
			concepts: 0,
			prompts: 0,
			wildcards: 0,
			properties: 0,
			groups: 0,
			relatedCharacters: 0,
			relatedTo: 0,
		},
		// Campos extendidos y normalizados (como string JSON)
		stats: normalizeStringOrObjectField(input.stats),
		psychologicalProfile: input.psychologicalProfile ?? '',
		socialProfile: input.socialProfile ?? '',
		relationships: normalizeStringOrArrayField(input.relationships),
		goals: normalizeStringOrArrayField(input.goals),
		fears: normalizeStringOrArrayField(input.fears),
		beliefs: normalizeStringOrArrayField(input.beliefs),
		personality: normalizeStringOrArrayField(input.personality),
		skills: normalizeStringOrArrayField(input.skills),
		abilities: normalizeStringOrArrayField(input.abilities),
		filters: normalizeStringOrObjectField(input.filters),
	};
}

/**
 * 🧮 Calcula la importancia relativa de un personaje basado en sus relaciones
 * @param character Personaje para calcular importancia
 * @returns Valor numérico de importancia
 */
function calculateImportance(character: CharacterComplete): number {
	// Base: nivel del personaje
	let importance = character.level || 1;

	// Añadir puntos por relaciones
	if (character._count) {
		// Contenido relacionado
		importance += character._count.images * 0.2;
		importance += character._count.videos * 0.3;
		importance += character._count.notes * 0.5;

		// Entidades relacionadas
		importance += character._count.relatedCharacters * 1;
		importance += character._count.places * 0.8;
		importance += character._count.worldItems * 0.5;
		importance += character._count.concepts * 0.7;

		// Más puntos si es favorito
		if (character.isFavorite) {
			importance += 10;
		}
	}

	return Math.round(importance * 10) / 10; // Redondear a 1 decimal
}

/**
 * 🧮 Calcula el número total de elementos de contenido relacionados con el personaje
 * @param character Personaje para calcular el contenido total
 * @returns Número total de elementos de contenido
 */
function calculateTotalContent(character: CharacterComplete): number {
	if (!character._count) return 0;

	return (
		character._count.images +
		character._count.videos +
		character._count.albums +
		character._count.notes +
		character._count.concepts +
		character._count.prompts +
		character._count.wildcards
	);
}

// 📝 NOTA: Mantener este archivo alineado con los tipos globales y actualizar la documentación si cambian los contratos de datos.
