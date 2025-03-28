/**
 * @file Funciones auxiliares para la entidad Tag
 * @module utils/tag/helpers
 */

import { generateTagColor, generateTagEmoji } from '../../transformers/tag';
import { type Tag, TagCategory, TagRarity, TagSortCriteria } from '../../types/entities/tag';

/**
 * Busca etiquetas que coincidan con un término de búsqueda
 * @param tags Lista de etiquetas
 * @param searchTerm Término de búsqueda
 * @returns Lista de etiquetas filtradas
 */
export function searchTags(tags: Tag[], searchTerm: string): Tag[] {
	if (!searchTerm) return tags;
	const term = searchTerm.toLowerCase();

	return tags.filter(
		(tag) => tag.name.toLowerCase().includes(term) || (tag.description && tag.description.toLowerCase().includes(term))
	);
}

/**
 * Ordena etiquetas según un criterio de ordenación
 * @param tags Lista de etiquetas
 * @param sortBy Criterio de ordenación
 * @returns Lista de etiquetas ordenadas
 */
export function sortTags(tags: Tag[], sortBy: TagSortCriteria): Tag[] {
	const tagsCopy = [...tags];

	switch (sortBy) {
		case TagSortCriteria.NAME_ASC:
			return tagsCopy.sort((a, b) => a.name.localeCompare(b.name));

		case TagSortCriteria.NAME_DESC:
			return tagsCopy.sort((a, b) => b.name.localeCompare(a.name));

		case TagSortCriteria.COUNT_ASC:
			return tagsCopy.sort((a, b) => (a._count?.images || 0) - (b._count?.images || 0));

		case TagSortCriteria.COUNT_DESC:
			return tagsCopy.sort((a, b) => (b._count?.images || 0) - (a._count?.images || 0));

		case TagSortCriteria.CREATED_ASC:
			return tagsCopy.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

		case TagSortCriteria.CREATED_DESC:
			return tagsCopy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

		case TagSortCriteria.UPDATED_ASC:
			return tagsCopy.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());

		case TagSortCriteria.UPDATED_DESC:
			return tagsCopy.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

		default:
			return tagsCopy;
	}
}

/**
 * Agrupa etiquetas por categoría
 * @param tags Lista de etiquetas
 * @returns Mapa de etiquetas agrupadas por categoría
 */
export function groupTagsByCategory(tags: Tag[]): Record<string, Tag[]> {
	const groups: Record<string, Tag[]> = {};

	// Inicializar grupos para todas las categorías
	Object.values(TagCategory).forEach((category) => {
		groups[category] = [];
	});

	// Asignar etiquetas a sus grupos
	tags.forEach((tag) => {
		const category = tag.category || TagCategory.OTHER;
		if (!groups[category]) {
			groups[category] = [];
		}
		groups[category].push(tag);
	});

	return groups;
}

/**
 * Obtiene las etiquetas más usadas
 * @param tags Lista de etiquetas
 * @param limit Límite de etiquetas a devolver
 * @returns Lista de etiquetas más usadas
 */
export function getMostUsedTags(tags: Tag[], limit = 10): Tag[] {
	return [...tags].sort((a, b) => (b._count?.images || 0) - (a._count?.images || 0)).slice(0, limit);
}

/**
 * Verifica si una etiqueta es válida para ser creada
 * @param name Nombre de la etiqueta
 * @param existingTags Etiquetas existentes
 * @returns Verdadero si la etiqueta es válida
 */
export function isValidTagName(name: string, existingTags: Tag[] = []): boolean {
	if (!name || name.trim().length < 2) return false;

	// Verificar que no exista una etiqueta con el mismo nombre
	return !existingTags.some((tag) => tag.name.toLowerCase() === name.toLowerCase());
}

/**
 * Crea una etiqueta temporal con valores predeterminados
 * @param name Nombre de la etiqueta
 * @param category Categoría opcional
 * @returns Nueva etiqueta temporal
 */
export function createTemporaryTag(name: string, category?: string): Tag {
	return {
		id: `temp-${Date.now()}`,
		name,
		emoji: generateTagEmoji(name, category),
		color: generateTagColor(name),
		description: null,
		shortcut: null,
		featuredImage: null,
		isFavorite: false,
		createdAt: new Date(),
		updatedAt: new Date(),
		category: category || null,
		rarity: TagRarity.COMMON,
		texture: null,
		isSelected: false,
		isExpanded: false,
		isEditing: true,
		isHighlighted: true,
	};
}

/**
 * Analiza nombres de etiquetas de un texto
 * @param text Texto con etiquetas
 * @returns Array de nombres de etiquetas
 */
export function parseTagNamesFromText(text: string): string[] {
	if (!text) return [];

	// Buscar hashtags (ej: #tag1 #tag2)
	const hashtagRegex = /#(\w+)/g;
	const hashtagMatches = [...text.matchAll(hashtagRegex)].map((match) => match[1]);

	// Buscar etiquetas entre corchetes (ej: [tag1] [tag2])
	const bracketRegex = /\[([^\]]+)\]/g;
	const bracketMatches = [...text.matchAll(bracketRegex)].map((match) => match[1]);

	// Unir y eliminar duplicados
	return Array.from(new Set([...hashtagMatches, ...bracketMatches]));
}
