import { ChevronDown, ChevronRight, Folder } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFolderTree } from '@/lib/api/folders';
import { cn } from '@/lib/utils';
import { useHierarchicalNavigation } from '@/lib/utils/folder/hierarchical-navigation';
import type { FolderWithStats } from '@/types/entities/folder';

interface FolderTreeViewProps {
	className?: string;
	isCollapsed?: boolean;
	onItemClick?: (id: string) => void;
	parentId?: string | null;
	selectedFolderId?: string | null;
}

interface FolderWithChildren extends FolderWithStats {
	children?: FolderWithChildren[];
	hasChildren?: boolean;
}

function getFolderFileCount(folder: FolderWithChildren): number {
	const counts = folder._count;
	const summedCount =
		(counts?.images ?? 0) +
		(counts?.videos ?? 0) +
		(counts?.audios ?? 0) +
		(counts?.documents ?? 0) +
		(counts?.jsonFiles ?? 0) +
		(counts?.file3Ds ?? 0);

	if (typeof counts?.totalFiles === 'number') {
		return counts.totalFiles;
	}

	if (summedCount > 0) {
		return summedCount;
	}

	return folder.totalFiles ?? 0;
}

/**
 * Construye recursivamente el árbol de carpetas desde datos planos
 */
function buildFolderTree(folders: FolderWithStats[], parentId: string | null = null): FolderWithChildren[] {
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

function collectAncestorIds(folders: FolderWithStats[], folderId: string | null | undefined): string[] {
	if (!folderId) {
		return [];
	}

	const foldersById = new Map(folders.map((folder) => [folder.id, folder]));
	const ancestors: string[] = [];
	let currentFolder = foldersById.get(folderId) ?? null;

	while (currentFolder?.parentId) {
		ancestors.unshift(currentFolder.parentId);
		currentFolder = foldersById.get(currentFolder.parentId) ?? null;
	}

	return ancestors;
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
	const fileCount = getFolderFileCount(folder);

	const handleClick = useCallback(() => {
		if (hasChildren && !isExpanded) {
			onToggleExpanded(folder.id);
		}
		onItemClick(folder.id);
	}, [folder.id, hasChildren, isExpanded, onItemClick, onToggleExpanded]);

	const handleToggleClick = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			onToggleExpanded(folder.id);
		},
		[folder.id, onToggleExpanded]
	);

	return (
		<div className={cn('flex w-full min-w-0 flex-col', className)}>
			<div
				className={cn(
					'flex min-w-0 w-full cursor-pointer items-center justify-between rounded px-2 py-0.5 text-xs hover:bg-secondary/30',
					isSelected && 'bg-secondary/50'
				)}
				style={{ paddingLeft: `${0.5 + level * 0.75}rem` }}
			>
				<div className="flex w-0 min-w-0 flex-1 items-center gap-1">
					{hasChildren && (
						<button
							aria-label={isExpanded ? 'Contraer carpeta' : 'Expandir carpeta'}
							className="flex h-4 w-4 shrink-0 items-center justify-center rounded-sm hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							onClick={handleToggleClick}
							type="button"
						>
							{isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
						</button>
					)}
					{!hasChildren && <div className="h-4 w-4" />}

					<button
						aria-label={`Abrir carpeta ${folder.name}`}
						className="flex w-0 min-w-0 flex-1 items-center gap-1 overflow-hidden text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
						onClick={handleClick}
						onKeyDown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								handleClick();
							}
						}}
						tabIndex={0}
						title={folder.name}
						type="button"
					>
						<Folder className="h-3 w-3 shrink-0 text-(--entity-folder)" />
						<span className="min-w-0 flex-1 truncate">{folder.name}</span>
					</button>
				</div>
				<span className="ml-2 min-w-3 text-right text-[9px] text-muted-foreground tabular-nums">{fileCount}</span>
			</div>

			{hasChildren && isExpanded && (
				<div className="flex flex-col">
					{folder.children?.map((child) => (
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
	const { data: folders = [], isLoading: isLoadingFolders } = useFolderTree();

	const navigate = useNavigate();
	const { buildHierarchicalPath } = useHierarchicalNavigation();
	const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

	// Construir datos del árbol
	const treeData = useMemo(() => {
		return buildFolderTree(folders, parentId);
	}, [folders, parentId]);

	useEffect(() => {
		if (!selectedFolderId) {
			return;
		}

		const expandedIds = [...collectAncestorIds(folders, selectedFolderId), selectedFolderId];
		if (expandedIds.length === 0) {
			return;
		}

		setExpandedFolders((prev) => {
			const next = new Set(prev);
			for (const expandedId of expandedIds) {
				next.add(expandedId);
			}
			return next;
		});
	}, [folders, selectedFolderId]);

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
				// Usar navegación jerárquica
				const hierarchicalPath = buildHierarchicalPath(folderId);

				// Navegar usando path jerárquico
				if (hierarchicalPath) {
					navigate(`/folders/${hierarchicalPath}`);
				} else {
					// Fallback para carpeta raíz o error
					navigate('/folders');
				}
			}
		},
		[onItemClick, navigate, buildHierarchicalPath]
	);

	if (isLoadingFolders && folders.length === 0) {
		return <div className="px-2 py-1 text-[10px] text-muted-foreground italic">Cargando carpetas...</div>;
	}

	if (treeData.length === 0 && !isLoadingFolders) {
		return <div className="px-2 py-1 text-[10px] text-muted-foreground italic">No hay carpetas</div>;
	}

	if (isCollapsed) {
		return null;
	}

	return (
		<div className={cn('flex w-full min-w-0 flex-col gap-0', className)}>
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
