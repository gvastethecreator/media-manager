/**
 * @file Transformadores para la entidad Character
 * @module transformers/character/transformer
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { CharacterSchema } from '@/types/entities/character-export';
import { TransformerError } from '@/utils/transformers/errors';
import type { Character } from '@prisma/client';
import { fromPrismaCharacter } from './serializers';
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
		if (typeof input === 'object' && 'id' in input && 'name' in input) {
			return fromPrismaCharacter(input as Character, {
				validateFields: options.validateFields ?? true,
				deserializeFields: options.deserializeFields ?? true,
				includeRelations: options.includeRelations ?? false,
				includeUI: options.includeUI ?? true,
				includeStats: options.includeStats ?? false,
			});
		}

		// Validar con Zod si es necesario
		if (options.validateFields) {
			const parsed = CharacterSchema.safeParse(input);
			if (!parsed.success) {
				throw new TransformerError(`Validación fallida: ${parsed.error.message}`);
			}
		}

		// Convertir a CharacterComplete
		return fromPrismaCharacter(input as Character, {
			validateFields: options.validateFields ?? true,
			deserializeFields: options.deserializeFields ?? true,
			includeRelations: options.includeRelations ?? false,
			includeUI: options.includeUI ?? true,
			includeStats: options.includeStats ?? false,
		});
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
