/**
 * @file Utilidades para la entidad Wildcard
 * @module utils/wildcard
 * @description Funciones de utilidad para manipular y procesar Wildcards
 * @updated 2025-06-20
 */

import { type WildcardComplete, type WildcardFilters, WildcardSortCriteria } from '@/types/entities/wildcard';

/**
 * 🔄 Ordena una lista de Wildcards según el criterio especificado
 * @param wildcards Lista de Wildcards a ordenar
 * @param sortBy Criterio de ordenación
 * @returns Lista ordenada de Wildcards
 */
export function sortWildcards(wildcards: WildcardComplete[], sortBy: WildcardSortCriteria): WildcardComplete[] {
	const sorted = [...wildcards];

	switch (sortBy) {
		case WildcardSortCriteria.NAME_ASC:
			return sorted.sort((a, b) => a.name.localeCompare(b.name));
		case WildcardSortCriteria.NAME_DESC:
			return sorted.sort((a, b) => b.name.localeCompare(a.name));
		case WildcardSortCriteria.USAGE_ASC:
			return sorted.sort((a, b) => (a._count?.childWildcards || 0) - (b._count?.childWildcards || 0));
		case WildcardSortCriteria.USAGE_DESC:
			return sorted.sort((a, b) => (b._count?.childWildcards || 0) - (a._count?.childWildcards || 0));
		case WildcardSortCriteria.CREATED_ASC:
			return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
		case WildcardSortCriteria.CREATED_DESC:
			return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
		case WildcardSortCriteria.UPDATED_ASC:
			return sorted.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
		case WildcardSortCriteria.UPDATED_DESC:
			return sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
		default:
			return sorted;
	}
}

/**
 * 🏷️ Agrupa Wildcards por una propiedad específica
 * @param wildcards Lista de Wildcards
 * @param groupBy Propiedad por la cual agrupar
 * @returns Objeto con Wildcards agrupados
 */
export function groupWildcards(
	wildcards: WildcardComplete[],
	groupBy: 'category' | 'parentId' | 'usage'
): Record<string, WildcardComplete[]> {
	return wildcards.reduce(
		(groups, wildcard) => {
			let key: string;

			switch (groupBy) {
				case 'category':
					key = wildcard.category || 'Sin categoría';
					break;
				case 'parentId':
					key = wildcard.parentId || 'Raíz';
					break;
				case 'usage': {
					const usage = wildcard._count?.childWildcards || 0;
					if (usage === 0) key = 'Sin uso';
					else if (usage < 10) key = 'Poco usado';
					else if (usage < 50) key = 'Uso moderado';
					else key = 'Muy usado';
					break;
				}
				default:
					key = 'Otros';
			}

			if (!groups[key]) {
				groups[key] = [];
			}
			groups[key].push(wildcard);
			return groups;
		},
		{} as Record<string, WildcardComplete[]>
	);
}

/**
 * 🔍 Filtra Wildcards por texto de búsqueda
 * @param wildcards Lista de Wildcards
 * @param searchQuery Texto de búsqueda
 * @returns Lista filtrada de Wildcards
 */
export function filterWildcardsBySearch(wildcards: WildcardComplete[], searchQuery: string): WildcardComplete[] {
	if (!searchQuery.trim()) return wildcards;

	const query = searchQuery.toLowerCase();
	return wildcards.filter(
		(wildcard) =>
			wildcard.name.toLowerCase().includes(query) ||
			wildcard.description?.toLowerCase().includes(query) ||
			wildcard.category?.toLowerCase().includes(query) ||
			wildcard.shortcut?.toLowerCase().includes(query)
	);
}

/**
 * 📊 Obtiene estadísticas de una lista de Wildcards
 * @param wildcards Lista de Wildcards
 * @returns Objeto con estadísticas
 */
export function getWildcardStats(wildcards: WildcardComplete[]) {
	const total = wildcards.length;
	const byCategory = groupWildcards(wildcards, 'category');
	const byUsage = groupWildcards(wildcards, 'usage');
	const favorites = wildcards.filter((wildcard) => wildcard.isFavorite).length;
	const totalUsage = wildcards.reduce((sum, wildcard) => sum + (wildcard._count?.childWildcards || 0), 0);
	const avgUsage = total > 0 ? totalUsage / total : 0;

	// Jerarquía
	const rootWildcards = wildcards.filter((w) => !w.parentId).length;
	const childWildcards = wildcards.filter((w) => w.parentId).length;
	const maxDepth = calculateMaxDepth(wildcards);

	return {
		total,
		byCategory: Object.fromEntries(Object.entries(byCategory).map(([key, items]) => [key, items.length])),
		byUsage: Object.fromEntries(Object.entries(byUsage).map(([key, items]) => [key, items.length])),
		favorites,
		totalUsage,
		avgUsage: Math.round(avgUsage * 100) / 100,
		hierarchy: {
			rootWildcards,
			childWildcards,
			maxDepth,
		},
		withImages: wildcards.filter((wildcard) => wildcard.featuredImage).length,
	};
}

/**
 * 🌳 Calcula la profundidad máxima de la jerarquía de wildcards
 * @param wildcards Lista de Wildcards
 * @returns Profundidad máxima
 */
export function calculateMaxDepth(wildcards: WildcardComplete[]): number {
	const wildcardMap = new Map(wildcards.map((w) => [w.id, w]));

	const getDepth = (wildcard: WildcardComplete, visited = new Set<string>()): number => {
		if (visited.has(wildcard.id)) return 0; // Evitar ciclos
		visited.add(wildcard.id);

		if (!wildcard.parentId) return 1;

		const parent = wildcardMap.get(wildcard.parentId);
		if (!parent) return 1;

		return 1 + getDepth(parent, visited);
	};

	return Math.max(...wildcards.map((w) => getDepth(w)));
}

/**
 * 🎨 Genera un color basado en la categoría del Wildcard
 * @param category Categoría del Wildcard
 * @returns Código de color hexadecimal
 */
export function generateWildcardColor(category?: string): string {
	const categoryColors: Record<string, string> = {
		character: '#3B82F6', // Azul
		style: '#8B5CF6', // Púrpura
		pose: '#10B981', // Verde
		lighting: '#F59E0B', // Amarillo
		background: '#6B7280', // Gris
		object: '#EF4444', // Rojo
		effect: '#EC4899', // Rosa
		mood: '#F97316', // Naranja
		technical: '#06B6D4', // Cian
		prompt: '#84CC16', // Lima
	};

	return categoryColors[category?.toLowerCase() || 'other'] || '#9CA3AF';
}

/**
 * 🎭 Genera un emoji basado en la categoría del Wildcard
 * @param category Categoría del Wildcard
 * @returns Emoji representativo
 */
export function generateWildcardEmoji(category?: string): string {
	const categoryEmojis: Record<string, string> = {
		character: '👤',
		style: '🎨',
		pose: '🤸',
		lighting: '💡',
		background: '🌅',
		object: '📦',
		effect: '✨',
		mood: '😊',
		technical: '⚙️',
		prompt: '📝',
	};

	return categoryEmojis[category?.toLowerCase() || 'other'] || '🔖';
}

/**
 * 🔍 Aplica filtros avanzados a una lista de Wildcards
 * @param wildcards Lista de Wildcards
 * @param filters Filtros a aplicar
 * @returns Lista filtrada de Wildcards
 */
export function applyWildcardFilters(wildcards: WildcardComplete[], filters: WildcardFilters): WildcardComplete[] {
	return wildcards.filter((wildcard) => {
		// Filtro por búsqueda
		if (filters.searchQuery) {
			const matchesSearch = filterWildcardsBySearch([wildcard], filters.searchQuery).length > 0;
			if (!matchesSearch) return false;
		}

		// Filtro por categorías
		if (
			filters.categories &&
			filters.categories.length > 0 &&
			!(wildcard.category && filters.categories.includes(wildcard.category))
		) {
			return false;
		}

		// Filtro por favoritos
		if (filters.onlyFavorites && !wildcard.isFavorite) {
			return false;
		}

		// Filtro por parentId
		if (filters.parentId !== undefined && wildcard.parentId !== filters.parentId) {
			return false;
		}

		// Filtro por si tiene hijos
		if (filters.hasChildren !== undefined) {
			const hasChildren = (wildcard._count?.childWildcards || 0) > 0;
			if (hasChildren !== filters.hasChildren) {
				return false;
			}
		}

		return true;
	});
}

/**
 * 🌳 Construye un árbol jerárquico de Wildcards
 * @param wildcards Lista de Wildcards
 * @returns Árbol de nodos de Wildcards
 */
export function buildWildcardTree(wildcards: WildcardComplete[]): WildcardTreeNode[] {
	const wildcardMap = new Map(wildcards.map((w) => [w.id, w]));

	const buildNode = (wildcard: WildcardComplete): WildcardTreeNode => {
		const children = wildcards.filter((w) => w.parentId === wildcard.id).map(buildNode);

		return {
			wildcard,
			children,
			depth: calculateDepthFromRoot(wildcard, wildcardMap),
		};
	};

	// Encontrar wildcards raíz (sin padre)
	const rootWildcards = wildcards.filter((w) => !w.parentId);
	return rootWildcards.map(buildNode);
}

/**
 * 🔍 Calcula la profundidad desde la raíz
 * @param wildcard Wildcard para calcular profundidad
 * @param wildcardMap Mapa de wildcards por ID
 * @returns Profundidad desde la raíz
 */
function calculateDepthFromRoot(wildcard: WildcardComplete, wildcardMap: Map<string, WildcardComplete>): number {
	let depth = 0;
	let current = wildcard;

	while (current.parentId) {
		const parent = wildcardMap.get(current.parentId);
		if (!parent) break;
		current = parent;
		depth++;
	}

	return depth;
}

/**
 * Interfaz para nodo del árbol de Wildcards
 */
export interface WildcardTreeNode {
	wildcard: WildcardComplete;
	children: WildcardTreeNode[];
	depth: number;
}

/**
 * 🔍 Encuentra todos los descendientes de un Wildcard
 * @param wildcardId ID del Wildcard padre
 * @param wildcards Lista completa de Wildcards
 * @returns Array de IDs de descendientes
 */
export function findWildcardDescendants(wildcardId: string, wildcards: WildcardComplete[]): string[] {
	const descendants: string[] = [];

	const findChildren = (parentId: string) => {
		const children = wildcards.filter((w) => w.parentId === parentId);
		for (const child of children) {
			descendants.push(child.id);
			findChildren(child.id); // Recursión para encontrar nietos
		}
	};

	findChildren(wildcardId);
	return descendants;
}

/**
 * 🔍 Encuentra la ruta completa de un Wildcard hasta la raíz
 * @param wildcardId ID del Wildcard
 * @param wildcards Lista completa de Wildcards
 * @returns Array de IDs desde la raíz hasta el Wildcard
 */
export function findWildcardPath(wildcardId: string, wildcards: WildcardComplete[]): string[] {
	const wildcardMap = new Map(wildcards.map((w) => [w.id, w]));
	const path: string[] = [];

	let current = wildcardMap.get(wildcardId);

	while (current) {
		path.unshift(current.id);
		current = current.parentId ? wildcardMap.get(current.parentId) : undefined;
	}

	return path;
}
