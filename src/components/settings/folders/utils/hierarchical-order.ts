/**
 * Función pura para crear ordenación jerárquica con niveles visuales
 * Ordena carpetas por jerarquía (padres → hijos), priorizando favoritos
 */
export function createHierarchicalOrder(folderList: any[]): any[] {
	const result: any[] = [];

	// Comparador: favoritos primero, luego alfabético por nombre
	const byFavoriteThenName = (a: any, b: any) => {
		const favA = a.isFavorite ? 1 : 0;
		const favB = b.isFavorite ? 1 : 0;
		if (favA !== favB) return favB - favA; // favoritos primero
		return (a.name || '').localeCompare(b.name || '');
	};

	// Función recursiva para agregar carpetas con su nivel de anidación
	const addFolderWithChildren = (folder: any, level = 0) => {
		// Agregar carpeta con información de nivel
		result.push({ ...folder, _hierarchyLevel: level, _hasParent: level > 0 });

		// Encontrar y agregar subcarpetas ordenadas recursivamente
		const subfolders = folderList.filter((f) => f.parentId === folder.id).sort(byFavoriteThenName);

		for (const subfolder of subfolders) {
			addFolderWithChildren(subfolder, level + 1);
		}
	};

	// Obtener carpetas padre (sin parentId) y procesarlas recursivamente
	const parentFolders = folderList.filter((folder) => !folder.parentId).sort(byFavoriteThenName);

	for (const parent of parentFolders) {
		addFolderWithChildren(parent);
	}

	// Agregar carpetas huérfanas (que tienen parentId pero el padre no existe)
	const orphanFolders = folderList
		.filter((folder) => folder.parentId && !folderList.some((parent) => parent.id === folder.parentId))
		.sort(byFavoriteThenName);

	for (const orphan of orphanFolders) {
		result.push({ ...orphan, _hierarchyLevel: 0, _hasParent: false, _isOrphan: true });
	}

	return result;
}

/**
 * Aplica ordenación por índice de reindexado global cuando aplica
 * Prioriza carpetas en la cola de reindexado sobre el orden jerárquico
 */
export function applyReindexOrder(folders: any[], reindexOrder: string[]): any[] {
	if (!reindexOrder || reindexOrder.length === 0) {
		return folders;
	}

	const orderMap = new Map(reindexOrder.map((id, idx) => [id, idx] as const));

	return [...folders].sort((a, b) => {
		const ai = orderMap.has(a.id) ? (orderMap.get(a.id) as number) : Number.MAX_SAFE_INTEGER;
		const bi = orderMap.has(b.id) ? (orderMap.get(b.id) as number) : Number.MAX_SAFE_INTEGER;

		if (ai !== bi) {
			return ai - bi;
		}

		// Si no están en el orden, mantener alfabético por nombre
		return a.name.localeCompare(b.name);
	});
}
