import { ChevronDown, ChevronRight, Edit2, RefreshCw, Trash2 } from 'lucide-react';
import { memo, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { clientLogger } from '@/lib/logger/client-logger';
import { cn } from '@/lib/utils';
import { SimpleTooltip } from './common/simple-tooltip';
import type { ExtendedFolder, ExtendedProcessStatus } from './folder-types';

interface NormalModeControlsProps {
	folder: ExtendedFolder;
	hasChildren: boolean;
	isExpanded?: boolean;
	isGloballyProcessing: boolean;
	isReindexing: boolean;
	onEdit: () => void;
	onFolderClick: (folderId: string) => void;
	onReindex: (folderId: string) => void;
	onToggleExpanded?: (folderId: string) => void;
	processStatus: ExtendedProcessStatus;
	selectedFolder: string | null;
}

export const NormalModeControls = memo(function NormalModeControls({
	folder,
	selectedFolder,
	isGloballyProcessing,
	isReindexing,
	processStatus,
	onEdit,
	onToggleExpanded,
	onReindex,
	onFolderClick,
	hasChildren,
	isExpanded = false,
}: NormalModeControlsProps) {
	// OPTIMIZACIÓN: Memoizar handlers para evitar prop changes
	const handleEdit = useCallback(() => {
		onEdit();
	}, [onEdit]);

	const handleToggleExpanded = useCallback(() => {
		if (onToggleExpanded && folder.id) {
			onToggleExpanded(folder.id);
		}
	}, [onToggleExpanded, folder.id]);

	const handleReindex = useCallback(() => {
		if (!folder.id) {
			clientLogger.error('[FolderCard] ❌ Error: folder.id is undefined', { folder });
			return;
		}
		onReindex(folder.id);
	}, [folder, onReindex]);

	const handleFolderClick = useCallback(() => {
		if (!folder.id) {
			clientLogger.error('[FolderCard] ❌ Error: folder.id is undefined for delete', { folder });
			return;
		}
		onFolderClick(folder.id);
	}, [folder, onFolderClick]);

	// OPTIMIZACIÓN: Memoizar estilos y clases
	const isSelected = selectedFolder === folder.id;
	const deleteButtonClassName = useMemo(
		() =>
			cn(
				'h-6 w-6 cursor-pointer transition-colors',
				isSelected
					? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
					: 'hover:bg-destructive/10 hover:text-destructive'
			),
		[isSelected]
	);

	const trashIconClassName = useMemo(
		() => cn('h-3.5 w-3.5 transition-colors', isSelected ? 'text-background' : 'text-muted-foreground'),
		[isSelected]
	);

	return (
		<>
			{/* Botón de edición con hover suave */}
			<SimpleTooltip content="Edit folder">
				<Button
					aria-label="Edit folder"
					className={cn(
						'h-6 w-6 transition-all duration-200 ease-out',
						'hover:scale-110 hover:bg-accent hover:text-accent-foreground',
						'focus:outline-none focus:ring-2 focus:ring-primary/20'
					)}
					disabled={isGloballyProcessing}
					onClick={handleEdit}
					size="icon"
					variant="ghost"
				>
					<Edit2 className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-12" />
				</Button>
			</SimpleTooltip>

			{/* Botón de expansión con rotación animada */}
			{hasChildren && onToggleExpanded && (
				<SimpleTooltip content={isExpanded ? 'Collapse subfolders' : 'Expand subfolders'}>
					<Button
						aria-label={isExpanded ? 'Collapse subfolders' : 'Expand subfolders'}
						className={cn(
							'h-6 w-6 transition-all duration-200 ease-out',
							'hover:scale-110 hover:bg-accent hover:text-accent-foreground',
							'focus:outline-none focus:ring-2 focus:ring-primary/20'
						)}
						onClick={() => onToggleExpanded(folder.id || '')}
						size="icon"
						variant="ghost"
					>
						<div className="transition-transform duration-300 ease-out">
							{isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
						</div>
					</Button>
				</SimpleTooltip>
			)}

			{/* Botón de reindexar con spin animation */}
			<SimpleTooltip content={isReindexing ? 'Reindexing...' : 'Reindex folder'}>
				<Button
					aria-label={isReindexing ? 'Reindexing folder' : 'Reindex folder'}
					className={cn(
						'h-6 w-6 transition-all duration-200 ease-out',
						'hover:scale-110 hover:bg-accent hover:text-accent-foreground',
						'focus:outline-none focus:ring-2 focus:ring-primary/20',
						'disabled:cursor-not-allowed disabled:opacity-50'
					)}
					disabled={isGloballyProcessing || isReindexing || !folder.id}
					onClick={() => {
						if (!folder.id) {
							clientLogger.error('[FolderCard] ❌ Error: folder.id is undefined', { folder });
							return;
						}
						onReindex(folder.id);
					}}
					size="icon"
					variant="ghost"
				>
					<RefreshCw className={cn('h-3.5 w-3.5 transition-transform duration-500', isReindexing && 'animate-spin')} />
				</Button>
			</SimpleTooltip>

			{/* Botón eliminar con estados visuales mejorados */}
			<SimpleTooltip content={selectedFolder === folder.id ? 'Confirm deletion' : 'Delete folder'}>
				<Button
					aria-label={selectedFolder === folder.id ? 'Confirm folder deletion' : 'Delete folder'}
					className={cn(
						'h-6 w-6 transition-all duration-200 ease-out',
						'focus:outline-none focus:ring-2',
						selectedFolder === folder.id
							? 'scale-105 bg-destructive text-destructive-foreground ring-2 ring-destructive/20 hover:bg-destructive/90'
							: 'hover:scale-110 hover:bg-destructive/10 hover:text-destructive focus:ring-destructive/20'
					)}
					disabled={isGloballyProcessing || !folder.id}
					onClick={() => {
						if (!folder.id) {
							clientLogger.error('[FolderCard] ❌ Error: folder.id is undefined for delete', { folder });
							return;
						}
						onFolderClick(folder.id);
					}}
					size="icon"
					variant="ghost"
				>
					<Trash2
						className={cn(
							'h-3.5 w-3.5 transition-all duration-200',
							selectedFolder === folder.id
								? 'animate-pulse text-background'
								: 'text-muted-foreground group-hover:text-destructive'
						)}
					/>
				</Button>
			</SimpleTooltip>
		</>
	);
});
