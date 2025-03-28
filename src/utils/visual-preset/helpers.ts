import { serverLogger } from '@/lib/logger/server-logger';
import { serializeTags } from '@/transformers/visual-preset';
import type { VisualPresetCategory, VisualPresetExtended } from '@/types/entities/visual-preset';
import { createVisualPresetSchema, updateVisualPresetSchema } from './validators';

const helpersLogger = serverLogger.withContext('VisualPreset:Helpers');

/**
 * Filtra presets visuales por categoría
 * @param presets Array de presets visuales extendidos
 * @param category Categoría para filtrar
 * @returns Array filtrado de presets visuales
 */
export function filterPresetsByCategory(
	presets: VisualPresetExtended[],
	category: string | VisualPresetCategory
): VisualPresetExtended[] {
	return presets.filter((preset) => preset.category === category);
}

/**
 * Filtra presets visuales por visibilidad pública
 * @param presets Array de presets visuales extendidos
 * @param isPublic Si se deben incluir solo presets públicos
 * @returns Array filtrado de presets visuales
 */
export function filterPresetsByVisibility(presets: VisualPresetExtended[], isPublic: boolean): VisualPresetExtended[] {
	return presets.filter((preset) => preset.isPublic === isPublic);
}

/**
 * Filtra presets visuales que son por defecto
 * @param presets Array de presets visuales extendidos
 * @returns Array filtrado de presets visuales
 */
export function filterDefaultPresets(presets: VisualPresetExtended[]): VisualPresetExtended[] {
	return presets.filter((preset) => preset.isDefault);
}

/**
 * Ordena presets visuales por nombre (A-Z)
 * @param presets Array de presets visuales extendidos
 * @returns Array ordenado de presets visuales
 */
export function sortPresetsByName(presets: VisualPresetExtended[]): VisualPresetExtended[] {
	return [...presets].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Ordena presets visuales por fecha de creación (más reciente primero)
 * @param presets Array de presets visuales extendidos
 * @returns Array ordenado de presets visuales
 */
export function sortPresetsByDate(presets: VisualPresetExtended[]): VisualPresetExtended[] {
	return [...presets].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Busca presets visuales por nombre o descripción
 * @param presets Array de presets visuales extendidos
 * @param searchTerm Término de búsqueda
 * @returns Array filtrado de presets visuales
 */
export function searchPresets(presets: VisualPresetExtended[], searchTerm: string): VisualPresetExtended[] {
	if (!searchTerm) return presets;

	const term = searchTerm.toLowerCase();
	return presets.filter(
		(preset) => preset.name.toLowerCase().includes(term) || preset.description?.toLowerCase().includes(term)
	);
}

/**
 * Filtra presets visuales por etiquetas
 * @param presets Array de presets visuales extendidos
 * @param tags Etiquetas para filtrar
 * @returns Array filtrado de presets visuales
 */
export function filterPresetsByTags(presets: VisualPresetExtended[], tags: string[]): VisualPresetExtended[] {
	if (!tags.length) return presets;

	return presets.filter((preset) => tags.some((tag) => preset.parsedTags.includes(tag)));
}

/**
 * Encuentra un preset visual por defecto para una categoría específica
 * @param presets Array de presets visuales extendidos
 * @param category Categoría para filtrar
 * @returns Preset visual por defecto o undefined
 */
export function findDefaultPresetForCategory(
	presets: VisualPresetExtended[],
	category: string | VisualPresetCategory
): VisualPresetExtended | undefined {
	return presets.find((preset) => preset.isDefault && preset.category === category);
}

/**
 * Valida los datos de creación de un preset visual
 * @param data Datos para crear un preset visual
 * @returns Objeto con resultado de validación
 */
export function validateCreatePresetData(data: any) {
	try {
		// Si tags es un array, lo serializamos
		if (Array.isArray(data.tags)) {
			data.tags = serializeTags(data.tags);
		}

		const result = createVisualPresetSchema.safeParse(data);

		if (!result.success) {
			helpersLogger.error('❌ Error validando datos de creación:', result.error);
			return {
				success: false,
				error: result.error.format(),
				data: null,
			};
		}

		return {
			success: true,
			error: null,
			data: result.data,
		};
	} catch (error) {
		helpersLogger.error('❌ Error en validación de datos de creación:', error);
		return {
			success: false,
			error,
			data: null,
		};
	}
}

/**
 * Valida los datos de actualización de un preset visual
 * @param data Datos para actualizar un preset visual
 * @returns Objeto con resultado de validación
 */
export function validateUpdatePresetData(data: any) {
	try {
		// Si tags es un array, lo serializamos
		if (Array.isArray(data.tags)) {
			data.tags = serializeTags(data.tags);
		}

		const result = updateVisualPresetSchema.safeParse(data);

		if (!result.success) {
			helpersLogger.error('❌ Error validando datos de actualización:', result.error);
			return {
				success: false,
				error: result.error.format(),
				data: null,
			};
		}

		return {
			success: true,
			error: null,
			data: result.data,
		};
	} catch (error) {
		helpersLogger.error('❌ Error en validación de datos de actualización:', error);
		return {
			success: false,
			error,
			data: null,
		};
	}
}
