import { Folder } from 'lucide-react';
import { memo, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { type TreeNode, TreeView } from '@/components/tree-view';
import { cn } from '@/lib/utils';
import { useCategoryStats } from '../hooks/use-category-stats';
import type { CategoryChild } from '../types';

interface FolderTreeViewProps {
	className?: string;
	parentId?: string | null;
	selectedFolderId?: string | null;
}

/**
 * Convierte una carpeta a TreeNode para el TreeView
 */
function folderToTreeNode(folder: CategoryChild, children: TreeNode[] = []): TreeNode {
	return {
		id: folder.id,
		label: `${folder.name} ${folder.itemCount ? `(${folder.itemCount})` : ''}`,
		icon: <Folder className="h-3 w-3" />,
		children: children.length > 0 ? children : undefined,
		data: folder,
	};
}

/**
 * Construye recursivamente el árbol de carpetas desde datos planos
 */
function buildFolderTree(folders: CategoryChild[], parentId: string | null = null): TreeNode[] {
	console.log(`🔧 buildFolderTree - Buscando carpetas con parentId: ${parentId}`);
	console.log(
		'🔧 buildFolderTree - Todas las carpetas:',
		folders.map((f) => ({ id: f.id, name: f.name, parentId: f.parentId }))
	);

	// Filtrar carpetas que pertenecen al nivel actual
	const currentLevelFolders = folders.filter((folder) => folder.parentId === parentId);
	console.log(
		`🔧 buildFolderTree - Carpetas del nivel actual (parentId=${parentId}):`,
		currentLevelFolders.map((f) => ({ id: f.id, name: f.name }))
	);

	// Construir nodos con sus hijos recursivamente
	return currentLevelFolders.map((folder) => {
		// Obtener carpetas hijas recursivamente
		const children = buildFolderTree(folders, folder.id);
		return folderToTreeNode(folder, children);
	});
}

export const FolderTreeView = memo(function FolderTreeView({
	className,
	parentId = null,
	selectedFolderId,
}: FolderTreeViewProps) {
	const { getCategoryItems, isLoading } = useCategoryStats();
	const navigate = useNavigate();

	// Obtener carpetas desde la API de navegación
	const folders = useMemo(() => {
		const folderData = getCategoryItems('folders');
		console.log('🔍 FolderTreeView - Datos de carpetas detallados:', JSON.stringify(folderData.slice(0, 5), null, 2));
		return folderData;
	}, [getCategoryItems]);

	// Construir datos del árbol
	const treeData = useMemo(() => {
		const tree = buildFolderTree(folders, parentId);
		console.log('🌳 FolderTreeView - Árbol construido:', tree);
		return tree;
	}, [folders, parentId]);

	// Manejar clic en nodo
	const handleNodeClick = useCallback(
		(node: TreeNode) => {
			const folder = node.data as CategoryChild;

			// Navegar a la carpeta usando React Router
			navigate(`/folders/${folder.id}`);
		},
		[navigate]
	);

	// Manejar expansión de nodos
	const handleNodeExpand = useCallback((nodeId: string, expanded: boolean) => {
		// Aquí podrías implementar lógica adicional si necesitas
		// por ejemplo, cargar datos lazy o actualizar estado
		console.log(`Folder ${nodeId} ${expanded ? 'expanded' : 'collapsed'}`);
	}, []);

	if (isLoading) {
		return <div className="px-2 py-1 text-[10px] text-muted-foreground italic">Cargando carpetas...</div>;
	}

	if (treeData.length === 0) {
		return <div className="px-2 py-1 text-[10px] text-muted-foreground italic">No hay carpetas</div>;
	}

	return (
		<TreeView
			data={treeData}
			className={cn('text-xs', className)}
			onNodeClick={handleNodeClick}
			onNodeExpand={handleNodeExpand}
			selectedIds={selectedFolderId ? [selectedFolderId] : []}
			showLines={false}
			showIcons={true}
			selectable={true}
			multiSelect={false}
			indent={12}
			animateExpand={true}
		/>
	);
});

export default FolderTreeView;
