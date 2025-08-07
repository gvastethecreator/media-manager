import { ChevronDown, ChevronRight, Edit2, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
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

export function NormalModeControls({
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
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							className="h-6 w-6 hover:bg-accent hover:text-accent-foreground"
							disabled={isGloballyProcessing}
							onClick={onEdit}
							size="icon"
							variant="ghost"
						>
							<Edit2 className="h-3.5 w-3.5" />
						</Button>
					</TooltipTrigger>
					<TooltipContent className="text-xs">Editar carpeta</TooltipContent>
				</Tooltip>
			</TooltipProvider>

			{/* Botón de expansión */}
			{hasChildren && onToggleExpanded && (
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								className="h-6 w-6 cursor-pointer"
								onClick={() => onToggleExpanded(folder.id || '')}
								size="icon"
								variant="ghost"
							>
								{isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
							</Button>
						</TooltipTrigger>
						<TooltipContent className="text-xs">
							{isExpanded ? 'Contraer subcarpetas' : 'Expandir subcarpetas'}
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			)}

			{/* Botón de reindexar */}
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
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
					</TooltipTrigger>
					<TooltipContent className="text-xs">{isReindexing ? 'Reindexando...' : 'Reindexar carpeta'}</TooltipContent>
				</Tooltip>
			</TooltipProvider>

			{/* Botón eliminar */}
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
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
					</TooltipTrigger>
					<TooltipContent className="text-xs">
						{selectedFolder === folder.id ? 'Confirmar eliminación' : 'Eliminar carpeta'}
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		</>
	);
}
