import { ChevronRight, Folder, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatBytes } from '@/lib/utils/format.utils';
import { FolderIndexStatusBadge, type IndexStatus } from './folder-index-status-badge';
import type { ExtendedFolder, ExtendedProcessStatus } from './folder-types';

interface SubfolderCardProps {
	folder: ExtendedFolder;
	selectedFolder: string | null;
	isProcessing: boolean;
	processStatus: ExtendedProcessStatus;
	isGloballyProcessing: boolean;
	onReindex: (folderId: string) => void;
	onToggleAutoReindex: (folderId: string, value: boolean) => void;
	onFolderClick: (folderId: string) => void;
	getFolderIndexStatus: (folder: ExtendedFolder) => IndexStatus;
}

export function SubfolderCard({
	folder,
	selectedFolder,
	isProcessing,
	processStatus,
	isGloballyProcessing,
	onReindex,
	onToggleAutoReindex,
	onFolderClick,
	getFolderIndexStatus,
}: SubfolderCardProps) {
	// Determinar si esta subcarpeta está siendo procesada
	const isReindexing = isProcessing && processStatus?.folderId === folder.id;
	const indexStatus = getFolderIndexStatus(folder);

	// Obtener mensaje de estado
	const getStatusMessage = useCallback(() => {
		if (!isReindexing) return null;

		return (
			<Badge
				variant="outline"
				className="ml-1 text-[8px] h-3 px-1 py-0 text-blue-500 border-blue-200 bg-blue-50 animate-pulse"
			>
				Procesando...
			</Badge>
		);
	}, [isReindexing]);

	return (
		<motion.div
			initial={{ opacity: 0, x: -10 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ duration: 0.2 }}
			className={cn(
				'ml-6 mt-1 p-2 rounded border border-border/50 bg-muted/30 transition-all hover:bg-muted/50',
				selectedFolder === folder.id && 'ring-1 ring-primary/50',
				isReindexing && 'ring-1 ring-primary/30'
			)}
		>
			{/* Indicador de procesamiento */}
			{isReindexing && (
				<div className="absolute inset-x-0 top-0 h-0.5 bg-primary/50 overflow-hidden">
					<div className="h-full bg-primary animate-pulse" style={{ width: `${processStatus?.progress || 0}%` }} />
				</div>
			)}

			<div className="flex items-center justify-between">
				{/* Información de la subcarpeta */}
				<div className="flex items-center gap-2 flex-1 min-w-0">
					{/* Conector visual */}
					<div className="flex items-center text-muted-foreground">
						<div className="w-3 h-px bg-border" />
						<ChevronRight className="h-3 w-3 mx-1" />
					</div>

					{/* Icono y nombre */}
					<div className="flex items-center gap-1.5 flex-1 min-w-0">
						<span className="text-sm">{folder.emoji}</span>
						<Folder className="h-3.5 w-3.5 text-blue-400" />
						<span className="font-medium text-sm truncate">{folder.name}</span>
						{getStatusMessage()}
					</div>
				</div>

				{/* Controles compactos */}
				<div className="flex items-center gap-1">
					{/* Estado del índice */}
					<FolderIndexStatusBadge status={indexStatus} lastIndexed={folder.lastIndexed} />

					{/* Estadísticas compactas */}
					{folder.totalFiles > 0 && (
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<Badge variant="secondary" className="text-[8px] h-4 px-1">
										{folder.totalFiles}
									</Badge>
								</TooltipTrigger>
								<TooltipContent className="text-xs">
									{folder.totalFiles} archivos • {formatBytes(folder.totalSize)}
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					)}

					{/* Auto-reindex switch */}
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<div className="cursor-pointer">
									<Switch
										checked={folder.autoReindex}
										onCheckedChange={(checked) => onToggleAutoReindex(folder.id, checked)}
										disabled={isGloballyProcessing}
										className="scale-[0.6] data-[state=checked]:bg-primary"
									/>
								</div>
							</TooltipTrigger>
							<TooltipContent className="text-xs">
								{folder.autoReindex ? 'Desactivar auto-reindex' : 'Activar auto-reindex'}
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>

					{/* Botón de reindexar */}
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => onReindex(folder.id)}
									disabled={isGloballyProcessing || isReindexing}
									className="h-6 w-6 p-0 cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
								>
									<RefreshCw className={cn('h-3 w-3 transition-transform', isReindexing && 'animate-spin')} />
								</Button>
							</TooltipTrigger>
							<TooltipContent className="text-xs">
								{isReindexing ? 'Reindexando...' : 'Reindexar subcarpeta'}
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
			</div>
		</motion.div>
	);
}
