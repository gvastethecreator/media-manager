/**
 * 🧭 Utilidades para navegación jerárquica de carpetas
 *
 * Maneja la conversión entre IDs de carpetas y paths jerárquicos
 * para implementar URLs amigables como /folders/parent/child/grandchild
 */

import { useFolderTree } from '@/lib/api/folders';
import type { FolderWithStats } from '@/types/entities/folder';

/**
 * Interface para breadcrumb items
 */
export interface BreadcrumbItem {
	emoji?: string;
	id: string;
	isActive: boolean;
	name: string;
	path: string;
}

/**
 * Cache en memoria para paths jerárquicos (optimización de performance)
 */
const pathCache = new Map<string, string>();
const ancestorsCache = new Map<string, FolderWithStats[]>();

/**
 * Limpia el cache de paths (llamar cuando se actualicen carpetas)
 */
export function clearPathCache(): void {
	pathCache.clear();
	ancestorsCache.clear();
}

/**
 * Obtiene todas las carpetas disponibles (helper para funciones de resolución)
 * Como las funciones helper no pueden usar hooks, necesitamos recibir los datos como parámetro
 */
function getAllFolders(folders?: FolderWithStats[]): FolderWithStats[] {
	return folders || [];
}

/**
 * Convierte un nombre de carpeta a un slug URL-friendly.
 * Reglas simples: minúsculas, espacios/guiones bajos → '-', elimina caracteres no alfanum/guion.
 */
function toSlug(name: string): string {
	return name
		.toLowerCase()
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '')
		.replace(/\s+/g, '-')
		.replace(/_/g, '-')
		.replace(/[^a-z0-9-]/g, '')
		.replace(/--+/g, '-')
		.replace(/^-+|-+$/g, '');
}

/**
 * Busca una carpeta por su ID
 */
export function findFolderById(folderId: string, folders?: FolderWithStats[]): FolderWithStats | null {
	const allFolders = getAllFolders(folders);
	return allFolders.find((f) => f.id === folderId) || null;
}

/**
 * Construye un path jerárquico desde un folder ID
 * Ejemplo: buildHierarchicalPath("folder-3") → "documents/projects/web"
 */
export function buildHierarchicalPath(folderId: string, folders?: FolderWithStats[]): string {
	// Verificar cache primero
	if (pathCache.has(folderId)) {
		const cachedPath = pathCache.get(folderId);
		return cachedPath ?? '';
	}

	const allFolders = getAllFolders(folders);
	const ancestors = getFolderAncestors(folderId, allFolders);

	// Construir path desde la raíz hasta la carpeta actual usando slugs estables
	const pathSegments = ancestors.map((folder) => toSlug(folder.name));
	const hierarchicalPath = pathSegments.join('/');

	// Guardar en cache
	pathCache.set(folderId, hierarchicalPath);

	return hierarchicalPath;
}

/**
 * Parsea un path jerárquico a array de folder IDs
 * Ejemplo: parseHierarchicalPath("documents/projects/web") → ["folder-1", "folder-2", "folder-3"]
 */
export function parseHierarchicalPath(path: string, folders?: FolderWithStats[]): string[] {
	if (!path || path === '/') {
		return [];
	}

	const allFolders = getAllFolders(folders);
	const pathSegments = path.split('/').filter(Boolean).map(decodeURIComponent);
	const folderIds: string[] = [];

	let currentParentId: string | null = null;

	for (const segment of pathSegments) {
		// Buscar carpeta por múltiples estrategias:
		// 1) nombre exacto (case-insensitive)
		// 2) slug del nombre (guiones)
		// 3) id directo
		const segLower = segment.toLowerCase();
		const folder = allFolders.find((f) => {
			const parent = (f.parentId ?? null) as string | null;
			if (parent !== currentParentId) return false;
			return f.name.toLowerCase() === segLower || toSlug(f.name) === segLower || f.id.toLowerCase() === segLower;
		});

		if (!folder) {
			// Si no encontramos la carpeta, el path es inválido
			// Solo log debug, no warning para evitar spam en consola
			if (process.env.NODE_ENV === 'development') {
				console.debug(`[HierarchicalNav] Carpeta no encontrada en path: ${segment} (padre: ${currentParentId})`);
			}
			break;
		}

		folderIds.push(folder.id);
		currentParentId = folder.id;
	}

	return folderIds;
}

/**
 * Obtiene el folder ID de la carpeta actual desde un path jerárquico
 */
export function getFolderIdFromPath(path: string, folders?: FolderWithStats[]): string | null {
	const folderIds = parseHierarchicalPath(path, folders);
	return folderIds.length > 0 ? (folderIds.at(-1) ?? null) : null;
}

/**
 * Obtiene todos los ancestros de una carpeta (incluyendo la carpeta misma)
 */
export function getFolderAncestors(folderId: string, folders?: FolderWithStats[]): FolderWithStats[] {
	// Verificar cache primero
	if (ancestorsCache.has(folderId)) {
		const cachedAncestors = ancestorsCache.get(folderId);
		return cachedAncestors ?? [];
	}

	const allFolders = getAllFolders(folders);
	const ancestors: FolderWithStats[] = [];

	let currentFolder = findFolderById(folderId, allFolders);

	// Recorrer hacia arriba hasta llegar a la raíz
	while (currentFolder) {
		ancestors.unshift(currentFolder); // Agregar al inicio para orden correcto

		if (!currentFolder.parentId) {
			break; // Llegamos a la raíz
		}

		currentFolder = findFolderById(currentFolder.parentId, allFolders);
	}

	// Guardar en cache
	ancestorsCache.set(folderId, ancestors);

	return ancestors;
}

/**
 * Construye breadcrumbs completos para una carpeta
 */
export function buildFullBreadcrumbs(folderId: string | null, folders?: FolderWithStats[]): BreadcrumbItem[] {
	const breadcrumbs: BreadcrumbItem[] = [
		{
			id: 'root',
			name: 'Carpetas',
			path: '/folders',
			isActive: !folderId,
		},
	];

	if (!folderId) {
		return breadcrumbs;
	}

	const ancestors = getFolderAncestors(folderId, folders);

	for (let i = 0; i < ancestors.length; i++) {
		const folder = ancestors[i];
		const isLast = i === ancestors.length - 1;

		// Construir path hasta esta carpeta
		const pathToFolder = ancestors
			.slice(0, i + 1)
			.map((f) => encodeURIComponent(f.name.toLowerCase()))
			.join('/');

		breadcrumbs.push({
			id: folder.id,
			name: folder.name,
			path: `/folders/${pathToFolder}`,
			emoji: folder.emoji ?? undefined,
			isActive: isLast,
		});
	}

	return breadcrumbs;
}

/**
 * Obtiene el path del padre de una carpeta
 */
export function getParentPath(currentPath: string): string {
	if (!currentPath || currentPath === '/') {
		return '/folders';
	}

	const segments = currentPath.split('/').filter(Boolean);
	segments.pop(); // Remover último segmento

	return segments.length > 0 ? `/folders/${segments.join('/')}` : '/folders';
}

/**
 * Valida si un path jerárquico es válido
 */
export function isValidHierarchicalPath(path: string, folders?: FolderWithStats[]): boolean {
	try {
		const folderIds = parseHierarchicalPath(path, folders);
		return folderIds.length > 0 || path === '' || path === '/';
	} catch {
		return false;
	}
}

/**
 * Hook personalizado para usar las funciones con datos reactivos
 */
export function useHierarchicalNavigation() {
	const { data: folders = [] } = useFolderTree();

	return {
		buildHierarchicalPath: (folderId: string) => buildHierarchicalPath(folderId, folders),
		parseHierarchicalPath: (path: string) => parseHierarchicalPath(path, folders),
		getFolderIdFromPath: (path: string) => getFolderIdFromPath(path, folders),
		getFolderAncestors: (folderId: string) => getFolderAncestors(folderId, folders),
		buildFullBreadcrumbs: (folderId: string | null) => buildFullBreadcrumbs(folderId, folders),
		isValidPath: (path: string) => isValidHierarchicalPath(path, folders),
		clearCache: clearPathCache,
	};
}
