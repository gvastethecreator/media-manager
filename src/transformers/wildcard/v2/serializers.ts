/**
 * @file Funciones para serializar y deserializar datos de wildcards (v2)
 * @module transformers/wildcard/v2/serializers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type { WildcardBase, WildcardChild, WildcardComplete, WildcardDeserialized } from '@/types/entities/wildcard';
import { WildcardSchema } from '@/types/entities/wildcard';
import { TransformerError } from '@/lib/utils/transformers/errors';

// Logger específico para este módulo
const logger = serverLogger.withContext({ module: 'WildcardTransformer:Serializers' });

// Constantes para valores por defecto
export const DEFAULT_WILDCARD_EMOJI = '🎭';
export const DEFAULT_WILDCARD_COLOR = '#3b82f6';

/**
 * Opciones para transformación de wildcards
 */
export interface WildcardTransformOptions {
	validateFields?: boolean;
	deserializeChildren?: boolean;
	includeRelations?: boolean;
	includeUI?: boolean;
	includeStats?: boolean;
}

/**
 * Interfaz para los datos UI de un wildcard
 */
export interface WildcardUIData {
	lastUpdated: Date;
	hasParent: boolean;
	hasChildren: boolean;
	parsedChildren: WildcardChild[];
	itemCount: number;
}

/**
 * Interfaz para un wildcard con datos UI
 */
export interface WildcardWithUI extends WildcardBase {
	_ui: WildcardUIData;
}

/**
 * Valida un objeto Wildcard contra su esquema
 * @param wildcard - Objeto Wildcard a validar
 * @returns El objeto validado o lanza un error
 */
export function validateWildcard(wildcard: Partial<WildcardBase>): WildcardBase {
	try {
		const _result = WildcardSchema.parse(wildcard);
		return wildcard as WildcardBase;
	} catch (error) {
		logger.error('Error validando Wildcard', { error });
		throw new TransformerError('Datos de Wildcard inválidos');
	}
}

/**
 * Serializa un wildcard para Prisma
 * @param wildcard Wildcard con campos JSON deserializados
 * @param options Opciones de transformación
 * @returns Wildcard con campos serializados para Prisma
 */
export function toPrismaWildcard(
	wildcard: Partial<WildcardComplete>,
	options: WildcardTransformOptions = {}
): Record<string, any> {
	try {
		const { validateFields = true } = options;

		// Validar datos si se solicita
		if (validateFields && Object.keys(wildcard).length > 1) {
			validateWildcard(wildcard as WildcardBase);
		}

		// Crear objeto con solo propiedades válidas para Prisma
		const result: Record<string, any> = {
			id: wildcard.id,
			name: wildcard.name,
			emoji: wildcard.emoji || DEFAULT_WILDCARD_EMOJI,
			color: wildcard.color || DEFAULT_WILDCARD_COLOR,
			description: wildcard.description,
			shortcut: wildcard.shortcut,
			category: wildcard.category || 'general',
			parentId: wildcard.parentId,
			featuredImage: wildcard.featuredImage,
		};

		// Manejar la conversión de isFavorite a favorite si está presente
		if ('isFavorite' in wildcard) {
			result.isFavorite = wildcard.isFavorite;
		} else if ('favorite' in wildcard) {
			result.isFavorite = (wildcard as any).isFavorite;
		}

		// Serializar el array children a string si existe
		if (wildcard.children !== undefined) {
			if (typeof wildcard.children === 'string') {
				result.children = wildcard.children;
			} else if ((wildcard as any).parsedChildren) {
				result.children = JSON.stringify((wildcard as any).parsedChildren);
			} else if (Array.isArray(wildcard.children)) {
				result.children = JSON.stringify(wildcard.children);
			} else {
				result.children = '[]';
			}
		} else if ((wildcard as any).parsedChildren) {
			result.children = JSON.stringify((wildcard as any).parsedChildren);
		}

		return result;
	} catch (error) {
		logger.error('Error serializando wildcard', { error });
		throw new TransformerError('Error serializando wildcard');
	}
}

/**
 * Deserializa un wildcard desde Prisma
 * @param wildcard Wildcard con campos serializados de Prisma
 * @param options Opciones de transformación
 * @returns Wildcard con campos deserializados
 */
export function fromPrismaWildcard<T extends WildcardBase>(
	wildcard: T,
	options: WildcardTransformOptions = {}
): T & WildcardDeserialized {
	try {
		const { includeRelations = false, includeUI = false, includeStats = false, deserializeChildren = true } = options;

		// Crear resultado base con propiedades seleccionadas sin usar delete
		const filteredWildcard = { ...wildcard };
		const result = Object.keys(filteredWildcard).reduce((acc: any, key) => {
			// Copiar todas las propiedades excepto 'favorite'
			if (key !== 'favorite') {
				acc[key] = (filteredWildcard as any)[key];
			}
			return acc;
		}, {}) as T & WildcardDeserialized;

		// Convertir favorite a isFavorite para mantener compatibilidad
		if ('favorite' in wildcard) {
			result.isFavorite = (wildcard as any).isFavorite;
		}

		// Deserializar children si existe y se solicita
		if (deserializeChildren && wildcard.children) {
			try {
				if (wildcard.children === '[]') {
					(result as any).parsedChildren = [];
				} else {
					(result as any).parsedChildren = JSON.parse(wildcard.children);
				}
			} catch (e) {
				logger.warn('No se pudo deserializar los hijos del wildcard', {
					wildcardId: wildcard.id,
					error: e,
				});
				(result as any).parsedChildren = [];
			}
		}

		// Agregar relaciones si están presentes y se solicitan
		if (includeRelations && (wildcard as any)._relations) {
			result._relations = (wildcard as any)._relations;
		}

		// Agregar conteos si están presentes y se solicitan estadísticas
		if (includeStats && '_count' in wildcard) {
			result._count = wildcard._count;
		}

		// Agregar propiedades de UI si se solicitan
		if (includeUI) {
			(result as any)._ui = {
				lastUpdated: (wildcard as any).updatedAt || new Date(),
				hasParent: !!wildcard.parentId,
				hasChildren: Array.isArray((result as any).parsedChildren) ? (result as any).parsedChildren.length > 0 : false,
				parsedChildren: (result as any).parsedChildren || [],
				itemCount: calculateItemCount(wildcard as any),
			};
		}

		return result;
	} catch (error) {
		logger.error('Error deserializando wildcard', { error });
		throw new TransformerError('Error deserializando wildcard');
	}
}

/**
 * Calcula el número total de elementos vinculados a un wildcard
 * @param wildcard Wildcard con posibles conteos
 * @returns Número total de elementos
 */
function calculateItemCount(wildcard: WildcardBase & { _count?: Record<string, number> }): number {
	if (!wildcard._count) return 0;

	// Sumar todos los conteos excepto childWildcards para evitar duplicidades
	let total = 0;

	for (const [key, value] of Object.entries(wildcard._count)) {
		if (key !== 'childWildcards') {
			total += value as number;
		}
	}

	return total;
}

/**
 * Extiende un wildcard con datos de interfaz de usuario
 * @param wildcard Wildcard base
 * @returns Wildcard extendido con datos UI
 */
export function extendWildcard<T extends WildcardBase>(wildcard: T): T & WildcardWithUI {
	return fromPrismaWildcard(wildcard, { includeUI: true }) as T & WildcardWithUI;
}

/**
 * Extiende un array de wildcards con datos de interfaz de usuario
 * @param wildcards Array de wildcards
 * @returns Array de wildcards extendidos
 */
export function extendWildcards<T extends WildcardBase>(wildcards: T[]): Array<T & WildcardWithUI> {
	return wildcards.map((wildcard) => extendWildcard(wildcard));
}

/**
 * Convierte metadatos de children de string a array si es necesario
 * @param children children como string o ya como array
 * @returns children deserializados
 */
export function parseChildren(children: string | WildcardChild[] | null): WildcardChild[] {
	if (!children) return [];

	if (typeof children === 'string') {
		if (children === '[]') return [];

		try {
			return JSON.parse(children);
		} catch (error) {
			logger.error('Error parseando children de wildcard', { error });
			return [];
		}
	}

	return children;
}
