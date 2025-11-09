/**
 * Función pura para crear la ordenación jerárquica con niveles visuales (optimizada fuera del componente)
 *
 * @param folderList - Lista de carpetas a ordenar jerárquicamente
 * @returns Lista ordenada con información de nivel de jerarquía
 */
export const createHierarchicalOrderPure = (folderList: any[]) => {
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
};
