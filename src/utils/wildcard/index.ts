/**
 * @file Utilidades principales para Wildcard
 * @module utils/wildcard
 * @description Funciones de utilidad para manipular y procesar Wildcards
 * @updated 2025-06-20
 */

import type { WildcardComplete, WildcardFilters, WildcardSortCriteria } from '@/types/entities/wildcard';

/**
 * 🔄 Ordena una lista de Wildcards según el criterio especificado
 * @param wildcards Lista de Wildcards a ordenar
 * @param sortBy Criterio de ordenamiento
 * @returns Lista ordenada de Wildcards
 */
export function sortWildcards(wildcards: WildcardComplete[], sortBy: WildcardSortCriteria): WildcardComplete[] {
	const sorted = [...wildcards];

	switch (sortBy) {
		case 'name:asc':
			return sorted.sort((a, b) => a.name.localeCompare(b.name));
		case 'name:desc':
			return sorted.sort((a, b) => b.name.localeCompare(a.name));
		case 'usage:asc':
			return sorted.sort((a, b) => (a.usage || 0) - (b.usage || 0));
		case 'usage:desc':
			return sorted.sort((a, b) => (b.usage || 0) - (a.usage || 0));
		case 'created:asc':
			return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
		case 'created:desc':
			return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
		case 'updated:asc':
			return sorted.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
		case 'updated:desc':
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
	return wildcards.reduce((groups, wildcard) => {
		let key: string;

		switch (groupBy) {
			case 'category':
				key = wildcard.category || 'Sin categoría';
				break;
			case 'parentId':
				key = wildcard.parentId || 'Raíz';
				break;
			case 'usage':
				const usage = wildcard.usage || 0;
				if (usage === 0) key = 'Sin uso';
				else if (usage < 10) key = 'Poco usado';
				else if (usage < 50) key = 'Uso moderado';
				else key = 'Muy usado';
				break;
			default:
				key = 'Otros';
		}

		if (!groups[key]) {
			groups[key] = [];
		}
		groups[key].push(wildcard);
		return groups;
	}, {} as Record<string, WildcardComplete[]>);
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
	return wildcards.filter((wildcard) =>
		wildcard.name.toLowerCase().includes(query) ||
		wildcard.description?.toLowerCase().includes(query) ||
		wildcard.category?.toLowerCase().includes(query) ||
		wildcard.shortcut?.toLowerCase().includes(query) ||
		wildcard.replacement?.toLowerCase().includes(query)
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
	const favorites = wildcards.filter(wildcard => wildcard.isFavorite).length;
	const totalUsage = wildcards.reduce((sum, wildcard) => sum + (wildcard.usage || 0), 0);
	const avgUsage = total > 0 ? totalUsage / total : 0;

	// Jerarquía
	const rootWildcards = wildcards.filter(w => !w.parentId).length;
	const childWildcards = wildcards.filter(w => w.parentId).length;
	const maxDepth = calculateMaxDepth(wildcards);

	return {
		total,
		byCategory: Object.fromEntries(
			Object.entries(byCategory).map(([key, items]) => [key, items.length])
		),
		byUsage: Object.fromEntries(
			Object.entries(byUsage).map(([key, items]) => [key, items.length])
		),
		favorites,
		totalUsage,
		avgUsage: Math.round(avgUsage * 100) / 100,
		hierarchy: {
			rootWildcards,
			childWildcards,
			maxDepth,
		},
		withImages: wildcards.filter(wildcard => wildcard.featuredImage).length,
	};
}

/**
 * 🌳 Calcula la profundidad máxima de la jerarquía de wildcards
 * @param wildcards Lista de Wildcards
 * @returns Profundidad máxima
 */
export function calculateMaxDepth(wildcards: WildcardComplete[]): number {
	const wildcardMap = new Map(wildcards.map(w => [w.id, w]));

	const getDepth = (wildcard: WildcardComplete, visited = new Set<string>()): number => {
		if (visited.has(wildcard.id)) return 0; // Evitar ciclos
		visited.add(wildcard.id);

		if (!wildcard.parentId) return 1;

		const parent = wildcardMap.get(wildcard.parentId);
		if (!parent) return 1;

		return 1 + getDepth(parent, visited);
	};

	return Math.max(...wildcards.map(w => getDepth(w)));
}

/**
 * 🎨 Genera un color basado en la categoría del Wildcard
 * @param category Categoría del Wildcard
 * @returns Código de color hexadecimal
 */
export function generateWildcardColor(category?: string): string {
	const categoryColors: Record<string, string> = {
		character: '#3B82F6',    // Azul
		style: '#8B5CF6',        // Púrpura
		pose: '#10B981',         // Verde
		lighting: '#F59E0B',     // Amarillo
		background: '#6B7280',   // Gris
		object: '#EF4444',       // Rojo
		effect: '#EC4899',       // Rosa
		mood: '#F97316',         // Naranja
		technical: '#06B6D4',    // Cian
		prompt: '#84CC16',       // Lima
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

		// Filtro por categoría
		if (filters.filterByCategory && filters.filterByCategory !== wildcard.category) {
			return false;
		}

		// Filtro por favoritos
		if (filters.filterFavorites && !wildcard.isFavorite) {
			return false;
		}

		// Filtro por padre (jerarquía)
		if (filters.parentId !== undefined && filters.parentId !== wildcard.parentId) {
			return false;
		}

		// Filtro solo con hijos
		if (filters.onlyWithChildren) {
			const hasChildren = wildcards.some(w => w.parentId === wildcard.id);
			if (!hasChildren) return false;
		}

		// Filtro por rango de fechas
		if (filters.dateRange?.from || filters.dateRange?.to) {
			const wildcardDate = new Date(wildcard.createdAt);

			if (filters.dateRange.from && wildcardDate < filters.dateRange.from) {
				return false;
			}

			if (filters.dateRange.to && wildcardDate > filters.dateRange.to) {
				return false;
			}
		}

		return true;
	});
}

/**
 * 🌳 Construye un árbol jerárquico de wildcards
 * @param wildcards Lista de Wildcards
 * @returns Árbol jerárquico
 */
export function buildWildcardTree(wildcards: WildcardComplete[]): WildcardTreeNode[] {
	const wildcardMap = new Map(wildcards.map(w => [w.id, w]));
	const tree: WildcardTreeNode[] = [];

	const buildNode = (wildcard: WildcardComplete): WildcardTreeNode => {
		const children = wildcards
			.filter(w => w.parentId === wildcard.id)
			.map(child => buildNode(child));

		return {
			wildcard,
			children,
			depth: calculateDepthFromRoot(wildcard, wildcardMap),
		};
	};

	// Obtener wildcards raíz
	const rootWildcards = wildcards.filter(w => !w.parentId);

	for (const rootWildcard of rootWildcards) {
		tree.push(buildNode(rootWildcard));
	}

	return tree;
}

/**
 * 📏 Calcula la profundidad desde la raíz
 * @param wildcard Wildcard objetivo
 * @param wildcardMap Mapa de wildcards
 * @returns Profundidad desde la raíz
 */
function calculateDepthFromRoot(wildcard: WildcardComplete, wildcardMap: Map<string, WildcardComplete>): number {
	if (!wildcard.parentId) return 0;

	const parent = wildcardMap.get(wildcard.parentId);
	if (!parent) return 0;

	return 1 + calculateDepthFromRoot(parent, wildcardMap);
}

/**
 * Nodo del árbol jerárquico de wildcards
 */
export interface WildcardTreeNode {
	wildcard: WildcardComplete;
	children: WildcardTreeNode[];
	depth: number;
}

/**
 * 🔄 Encuentra todos los descendientes de un wildcard
 * @param wildcardId ID del wildcard padre
 * @param wildcards Lista de todos los wildcards
 * @returns Lista de IDs de descendientes
 */
export function findWildcardDescendants(wildcardId: string, wildcards: WildcardComplete[]): string[] {
	const descendants: string[] = [];

	const findChildren = (parentId: string) => {
		const children = wildcards.filter(w => w.parentId === parentId);
		for (const child of children) {
			descendants.push(child.id);
			findChildren(child.id); // Recursivo
		}
	};

	findChildren(wildcardId);
	return descendants;
}

/**
 * 🔍 Encuentra la ruta desde la raíz hasta un wildcard
 * @param wildcardId ID del wildcard objetivo
 * @param wildcards Lista de todos los wildcards
 * @returns Lista de IDs desde la raíz hasta el wildcard
 */
export function findWildcardPath(wildcardId: string, wildcards: WildcardComplete[]): string[] {
	const wildcardMap = new Map(wildcards.map(w => [w.id, w]));
	const path: string[] = [];

	let current = wildcardMap.get(wildcardId);
	while (current) {
		path.unshift(current.id);
		current = current.parentId ? wildcardMap.get(current.parentId) : undefined;
	}

	return path;
}