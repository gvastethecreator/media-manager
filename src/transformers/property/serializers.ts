/**
 * @file Funciones para serializar y deserializar datos de propiedades
 * @module transformers/property/serializers
 */

import { createLogger } from '@/lib/logger';
import { PropertySchema } from '@/types/entities/property/schema';
import type { PropertyBase, PropertyComplete, PropertyDeserialized } from '@/types/entities/property/types';

// Logger específico para este módulo
const logger = createLogger('PropertyTransformer:Serializers');

// Constantes para valores por defecto
export const DEFAULT_PROPERTY_EMOJI = '🔍';
export const DEFAULT_PROPERTY_COLOR = '#3b82f6';

/**
 * Opciones para transformación de propiedades
 */
export interface PropertyTransformOptions {
	validateFields?: boolean;
	deserializeFields?: boolean;
	includeRelations?: boolean;
	includeUI?: boolean;
	includeStats?: boolean;
}

/**
 * Valida un objeto Property contra su esquema
 * @param property - Objeto Property a validar
 * @returns El objeto validado o lanza un error
 */
export function validateProperty(property: Partial<PropertyBase>): PropertyBase {
	try {
		const result = PropertySchema.parse(property);
		return property as PropertyBase;
	} catch (error) {
		logger.error('Error validando Property:', error);
		throw new Error(`Datos de Property inválidos: ${error instanceof Error ? error.message : String(error)}`);
	}
}

/**
 * Genera un emoji para la propiedad basado en su nombre y categoría
 * @param name Nombre de la propiedad
 * @param category Categoría de la propiedad
 * @returns Emoji adecuado para la propiedad
 */
export function generatePropertyEmoji(name: string, category?: string): string {
	// Normalizar nombre y categoría para búsqueda
	const normalizedName = name.toLowerCase();
	const normalizedCategory = category?.toLowerCase() || '';

	// Mapeo de categorías comunes a emojis
	if (normalizedName.includes('color') || normalizedName.includes('colour')) {
		return '🎨';
	}

	if (normalizedName.includes('size') || normalizedName.includes('dimension')) {
		return '📏';
	}

	if (normalizedName.includes('weight') || normalizedName.includes('mass')) {
		return '⚖️';
	}

	if (normalizedName.includes('time') || normalizedName.includes('date')) {
		return '⏱️';
	}

	if (normalizedName.includes('location') || normalizedName.includes('place')) {
		return '📍';
	}

	if (normalizedName.includes('material') || normalizedName.includes('substance')) {
		return '💎';
	}

	if (normalizedName.includes('quality') || normalizedName.includes('rating')) {
		return '⭐';
	}

	if (normalizedName.includes('price') || normalizedName.includes('cost')) {
		return '💰';
	}

	if (normalizedName.includes('author') || normalizedName.includes('creator')) {
		return '👤';
	}

	// Categorías específicas
	if (normalizedCategory === 'physical') {
		return '📦';
	}

	if (normalizedCategory === 'metadata') {
		return '📝';
	}

	if (normalizedCategory === 'technical') {
		return '⚙️';
	}

	// Valor predeterminado
	return DEFAULT_PROPERTY_EMOJI;
}

/**
 * Genera un color para la propiedad basado en su nombre
 * @param name Nombre de la propiedad
 * @returns Color en formato hexadecimal
 */
export function generatePropertyColor(name: string): string {
	// Lista de colores predefinidos
	const colors = [
		'#3b82f6', // blue
		'#ef4444', // red
		'#10b981', // green
		'#f59e0b', // amber
		'#8b5cf6', // violet
		'#ec4899', // pink
		'#06b6d4', // cyan
		'#84cc16', // lime
		'#6366f1', // indigo
		'#14b8a6', // teal
		'#f97316', // orange
		'#d946ef', // fuchsia
	];

	// Calcular un valor hash simple basado en el nombre
	const hashValue = name.split('').reduce((acc, char) => {
		return acc + char.charCodeAt(0);
	}, 0);

	// Seleccionar un color basado en el hash
	return colors[hashValue % colors.length];
}

/**
 * Serializa una propiedad para Prisma
 * @param property Propiedad con campos JSON deserializados
 * @param options Opciones de transformación
 * @returns Propiedad con campos serializados para Prisma
 */
export function toPrismaProperty(property: Partial<PropertyComplete>, options: PropertyTransformOptions = {}): any {
	try {
		const { validateFields = true } = options;

		// Validar datos si se solicita
		if (validateFields && Object.keys(property).length > 1) {
			validateProperty(property as PropertyBase);
		}

		// Datos base
		const result: any = { ...property };

		// Eliminar campos que no van a la base de datos
		result._count = undefined;
		result._relations = undefined;
		result._ui = undefined;

		return result;
	} catch (error) {
		logger.error('Error serializando property:', error);
		throw new Error(`Error serializando property: ${error instanceof Error ? error.message : String(error)}`);
	}
}

/**
 * Deserializa una propiedad desde Prisma
 * @param property Propiedad con campos serializados de Prisma
 * @param options Opciones de transformación
 * @returns Propiedad con campos deserializados
 */
export function fromPrismaProperty<T extends PropertyBase>(
	property: T,
	options: PropertyTransformOptions = {}
): T & PropertyDeserialized & Partial<Record<'_relations' | '_count' | '_ui', any>> {
	try {
		const { includeRelations = false, includeUI = false, includeStats = false } = options;

		// Crear resultado base
		const result = {
			...property,
		} as T & PropertyDeserialized;

		// Agregar relaciones si están presentes y se solicitan
		if (includeRelations && (property as any)._relations) {
			result._relations = (property as any)._relations;
		}

		// Agregar conteos si están presentes y se solicitan
		if (includeStats && (property as any)._count) {
			result._count = (property as any)._count;
		}

		// Agregar campos UI si se solicitan
		if (includeUI) {
			result._ui = {
				lastUpdated: property.updatedAt instanceof Date ? property.updatedAt : new Date(property.updatedAt),
			};
		}

		return result;
	} catch (error) {
		logger.error('Error deserializando property:', error);
		throw new Error(`Error deserializando property: ${error instanceof Error ? error.message : String(error)}`);
	}
}

/**
 * Extiende una propiedad con campos UI adicionales
 * @param property Propiedad base de la base de datos
 * @returns Propiedad extendida con propiedades calculadas
 */
export function extendProperty<T extends PropertyBase>(
	property: T
): T & {
	_ui: {
		lastUpdated: Date;
		itemCount: number;
	};
} {
	if (!property) return null as any;

	try {
		return {
			...property,
			_ui: {
				// Asegurar que las fechas sean instancias de Date
				lastUpdated: property.updatedAt instanceof Date ? property.updatedAt : new Date(property.updatedAt),
				// Calcular contadores de elementos relacionados si están disponibles
				itemCount: (property as any)._count
					? ((property as any)._count.images || 0) +
						((property as any)._count.videos || 0) +
						((property as any)._count.albums || 0) +
						((property as any)._count.collections || 0) +
						((property as any)._count.tags || 0) +
						((property as any)._count.characters || 0) +
						((property as any)._count.places || 0) +
						((property as any)._count.worldItems || 0) +
						((property as any)._count.concepts || 0) +
						((property as any)._count.prompts || 0) +
						((property as any)._count.notes || 0) +
						((property as any)._count.wildcards || 0) +
						((property as any)._count.groups || 0)
					: 0,
			},
		};
	} catch (error) {
		logger.error('Error extendiendo property:', error);
		return {
			...property,
			_ui: {
				lastUpdated: new Date(),
				itemCount: 0,
			},
		};
	}
}

/**
 * Extiende un array de propiedades con propiedades calculadas
 * @param properties Array de propiedades de la base de datos
 * @returns Array de propiedades extendidas
 */
export function extendProperties(properties: PropertyBase[]): Array<ReturnType<typeof extendProperty>> {
	if (!properties || !Array.isArray(properties)) return [];
	return properties.map((property) => extendProperty(property));
}

/**
 * Convierte una propiedad completa a formato simple para relaciones
 * @param property Propiedad completa
 * @returns Propiedad simplificada para relaciones
 */
export function toRelatedProperty(property: PropertyBase & { _count?: any }): {
	id: string;
	name: string;
	emoji: string;
	color: string;
	itemCount: number;
} {
	return {
		id: property.id,
		name: property.name,
		emoji: property.emoji,
		color: property.color,
		itemCount: property._count
			? (property._count.images || 0) +
				(property._count.videos || 0) +
				(property._count.albums || 0) +
				(property._count.collections || 0) +
				(property._count.tags || 0) +
				(property._count.characters || 0) +
				(property._count.places || 0) +
				(property._count.worldItems || 0) +
				(property._count.concepts || 0) +
				(property._count.prompts || 0) +
				(property._count.notes || 0) +
				(property._count.wildcards || 0) +
				(property._count.groups || 0)
			: 0,
	};
}
