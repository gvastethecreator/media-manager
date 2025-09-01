import { ChevronDown, ChevronRight, Edit2, RefreshCw, Trash2 } from 'lucide-react';
import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SimpleTooltip } from './common/simple-tooltip';
import type { ExtendedFolder, ExtendedProcessStatus } from './folder-types';

interface NormalModeControlsProps {
	folder: ExtendedFolder;
	selectedFolder: string | null;
	isGloballyProcessing: boolean;
	isReindexing: boolean;
	processStatus: ExtendedProcessStatus;
	onEdit: () => void;
	onToggleExpanded?: (folderId: string) => void;
	onReindex: (folderId: string) => void;
	onFolderClick: (folderId: string) => void;
	hasChildren: boolean;
	isExpanded?: boolean;
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
	return (
		<>
			{/* Botón de edición */}
			<SimpleTooltip content="Editar carpeta">
				<Button
					className="h-6 w-6 hover:bg-accent hover:text-accent-foreground"
					disabled={isGloballyProcessing}
					onClick={onEdit}
					size="icon"
					variant="ghost"
				>
					<Edit2 className="h-3.5 w-3.5" />
				</Button>
			</SimpleTooltip>

			{/* Botón de expansión */}
			{hasChildren && onToggleExpanded && (
				<SimpleTooltip content={isExpanded ? 'Contraer subcarpetas' : 'Expandir subcarpetas'}>
					<Button
						className="h-6 w-6 cursor-pointer"
						onClick={() => onToggleExpanded(folder.id || '')}
						size="icon"
						variant="ghost"
					>
						{isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
					</Button>
				</SimpleTooltip>
			)}

			{/* Botón de reindexar */}
			<SimpleTooltip content={isReindexing ? 'Reindexando...' : 'Reindexar carpeta'}>
				<Button
					className="h-6 w-6 cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground"
					disabled={isGloballyProcessing || isReindexing || !folder.id}
					onClick={() => {
						if (!folder.id) {
							console.error('[FolderCard] ❌ Error: folder.id is undefined', { folder });
							return;
						}
						onReindex(folder.id);
					}}
					size="icon"
					variant="ghost"
				>
					<RefreshCw
						className={cn(
							'h-3.5 w-3.5 transition-transform',
							isReindexing && processStatus.folderId === folder.id && 'animate-spin'
						)}
					/>
				</Button>
			</SimpleTooltip>

			{/* Botón eliminar */}
			<SimpleTooltip content={selectedFolder === folder.id ? 'Confirmar eliminación' : 'Eliminar carpeta'}>
				<Button
					className={cn(
						'h-6 w-6 cursor-pointer transition-colors',
						selectedFolder === folder.id
							? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
							: 'hover:bg-destructive/10 hover:text-destructive'
					)}
					disabled={isGloballyProcessing || !folder.id}
					onClick={() => {
						if (!folder.id) {
							console.error('[FolderCard] ❌ Error: folder.id is undefined for delete', { folder });
							return;
						}
						onFolderClick(folder.id);
					}}
					size="icon"
					variant="ghost"
				>
					<Trash2
						className={cn(
							'h-3.5 w-3.5 transition-colors',
							selectedFolder === folder.id ? 'text-background' : 'text-muted-foreground'
						)}
					/>
				</Button>
			</SimpleTooltip>
		</>
	);
});
