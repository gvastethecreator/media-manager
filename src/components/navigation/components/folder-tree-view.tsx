import { ChevronDown, ChevronRight, Folder } from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCategoryStats } from '../hooks/use-category-stats';
import type { CategoryChild } from '../types';

interface FolderTreeViewProps {
	className?: string;
	parentId?: string | null;
	selectedFolderId?: string | null;
	isCollapsed?: boolean;
	onItemClick?: (id: string) => void;
}

interface FolderWithChildren extends CategoryChild {
	children?: FolderWithChildren[];
	hasChildren?: boolean;
}

/**
 * Construye recursivamente el árbol de carpetas desde datos planos
 */
function buildFolderTree(folders: CategoryChild[], parentId: string | null = null): FolderWithChildren[] {
	// Filtrar carpetas que pertenecen al nivel actual
	const currentLevelFolders = folders.filter((folder) => folder.parentId === parentId);

	// Construir nodos con sus hijos recursivamente
	return currentLevelFolders.map((folder) => {
		// Obtener carpetas hijas recursivamente
		const children = buildFolderTree(folders, folder.id);
		return {
			...folder,
			children,
			hasChildren: children.length > 0,
		};
	});
}

/**
 * Componente recursivo para renderizar un item de carpeta
 */
const FolderTreeItem = memo(function FolderTreeItemImpl({
	folder,
	level = 0,
	selectedFolderId,
	expandedFolders,
	onToggleExpanded,
	onItemClick,
	className,
}: {
	folder: FolderWithChildren;
	level?: number;
	selectedFolderId?: string | null;
	expandedFolders: Set<string>;
	onToggleExpanded: (folderId: string) => void;
	onItemClick: (folderId: string) => void;
	className?: string;
}) {
	const isExpanded = expandedFolders.has(folder.id);
	const isSelected = selectedFolderId === folder.id;
	const hasChildren = folder.hasChildren && folder.children && folder.children.length > 0;

	const handleClick = useCallback(() => {
		onItemClick(folder.id);
	}, [folder.id, onItemClick]);

	const handleToggleClick = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			onToggleExpanded(folder.id);
		},
		[folder.id, onToggleExpanded]
	);

	return (
		<div className={cn('flex flex-col', className)}>
			<Button
				className={cn(
					'flex w-full items-center justify-between rounded px-2 py-0.5 text-xs hover:bg-secondary/30',
					isSelected && 'bg-secondary/50'
				)}
				onClick={handleClick}
				style={{ paddingLeft: `${0.5 + level * 0.75}rem` }}
				variant="ghost"
			>
				<div className="flex items-center gap-1">
					{hasChildren && (
						<button
							className="flex h-4 w-4 items-center justify-center rounded-sm hover:bg-secondary/70"
							onClick={handleToggleClick}
							type="button"
						>
							{isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
						</button>
					)}
					{!hasChildren && <div className="h-4 w-4" />}
					<Folder className="h-3 w-3 text-green-500" />
					<span className="truncate">{folder.name}</span>
				</div>
				{(folder.itemCount || folder._count?.images) && (
					<span className="ml-2 min-w-[12px] text-right text-[9px] text-muted-foreground tabular-nums">
						{folder.itemCount || folder._count?.images || 0}
					</span>
				)}
			</Button>

			{hasChildren && isExpanded && (
				<div className="flex flex-col">
					{folder.children!.map((child) => (
						<FolderTreeItem
							className={className}
							expandedFolders={expandedFolders}
							folder={child}
							key={child.id}
							level={level + 1}
							onItemClick={onItemClick}
							onToggleExpanded={onToggleExpanded}
							selectedFolderId={selectedFolderId}
						/>
					))}
				</div>
			)}
		</div>
	);
});

const FolderTreeViewComponent = memo(function FolderTreeViewImpl({
	className,
	parentId = null,
	selectedFolderId,
	isCollapsed = false,
	onItemClick,
}: FolderTreeViewProps) {
	const { getCategoryItems, isLoading } = useCategoryStats();
	const navigate = useNavigate();
	const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

	// Obtener carpetas desde la API de navegación
	const folders = useMemo(() => {
		const folderData = getCategoryItems('folders');
		return folderData;
	}, [getCategoryItems]);

	// Construir datos del árbol
	const treeData = useMemo(() => {
		return buildFolderTree(folders, parentId);
	}, [folders, parentId]);

	// Manejar toggle de expansión
	const handleToggleExpanded = useCallback((folderId: string) => {
		setExpandedFolders((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(folderId)) {
				newSet.delete(folderId);
			} else {
				newSet.add(folderId);
			}
			return newSet;
		});
	}, []);

	// Manejar clic en item
	const handleItemClick = useCallback(
		(folderId: string) => {
			if (onItemClick) {
				onItemClick(folderId);
			} else {
				navigate(`/folders/${folderId}`);
			}
		},
		[onItemClick, navigate]
	);

	if (isLoading) {
		return <div className="px-2 py-1 text-[10px] text-muted-foreground italic">Cargando carpetas...</div>;
	}

	if (treeData.length === 0) {
		return <div className="px-2 py-1 text-[10px] text-muted-foreground italic">No hay carpetas</div>;
	}

	if (isCollapsed) {
		return null;
	}

	return (
		<div className={cn('flex flex-col gap-0', className)}>
			{treeData.map((folder) => (
				<FolderTreeItem
					className={className}
					expandedFolders={expandedFolders}
					folder={folder}
					key={folder.id}
					onItemClick={handleItemClick}
					onToggleExpanded={handleToggleExpanded}
					selectedFolderId={selectedFolderId}
				/>
			))}
		</div>
	);
});

export const FolderTreeView = FolderTreeViewComponent;

export default FolderTreeViewComponent;
