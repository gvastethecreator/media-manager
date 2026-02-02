import { AlertCircle, AudioLines, FileText, FolderIcon, Image, Star, Video } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { FolderIndexStatusBadge, type IndexStatus } from '../folder-card-index-status-badge';
import { getFolderIndexStatus } from '../folder-utils';
import { computeIsReindexing } from '../utils/is-reindexing';
import { getStatusMessage } from '../utils/status-message';
import { MicroCell } from './micro-cell';
import { EmptyFoldersState } from './ui-primitives';

interface FoldersGridProps {
	orderedFolders: any[];
	selectedFolder: string | null;
	progressByFolder: Record<string, any>;
	processStatus: any;
	isProcessing: boolean;
	isGloballyProcessing: boolean;
	globalCurrentFolderId: string | null | undefined;
	onFolderClick: (id: string) => void;
	onReindex?: (id: string) => void;
} /**
 * Vista de grid para carpetas con diseño adaptativo
 */
export function FoldersGrid({
	orderedFolders,
	selectedFolder,
	progressByFolder,
	processStatus,
	isProcessing,
	isGloballyProcessing,
	globalCurrentFolderId,
	onFolderClick,
}: FoldersGridProps) {
	if (orderedFolders.length === 0) {
		return (
			<div className="py-20">
				<EmptyFoldersState />
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{orderedFolders.map((folder: any) => {
				const status = getFolderIndexStatus(folder);
				const isSelected = selectedFolder === folder.id;
				const hasError = Boolean(folder.error);

				// Determinar si está actualmente reindexándose
				const isReindexing = computeIsReindexing({
					folderId: folder.id,
					processStatus,
					isGloballyProcessing,
					globalCurrentFolderId,
					isProcessingFlag: Boolean(progressByFolder[folder.id]?.isProcessing) || isProcessing,
				});

				const statusMsg = getStatusMessage(isReindexing, false, isProcessing);

				return (
					<button
						className={cn(
							'group relative overflow-hidden border border-border/50 transition-all hover:border-primary/50 hover:shadow-dt-1',
							isSelected && 'border border-primary bg-primary/5',
							hasError && 'border border-destructive bg-destructive/5',
							isReindexing && 'pointer-events-none opacity-60'
						)}
						key={folder.id}
						onClick={() => onFolderClick(folder.id)}
						type="button"
					>
						{/* Encabezado con icono y emoji */}
						<div className="bg-muted/20 p-3">
							<div className="flex items-start justify-between">
								<div className="relative">
									{folder.emoji ? (
										<div className="flex h-10 w-10 items-center justify-center bg-primary/5 text-lg">
											{folder.emoji}
										</div>
									) : (
										<div className="flex h-10 w-10 items-center justify-center bg-primary/5">
											<FolderIcon className="h-5 w-5 text-primary" />
										</div>
									)}
									{hasError && <AlertCircle className="absolute -top-1 -right-1 h-3.5 w-3.5 text-destructive" />}
								</div>
								<div className="flex items-center gap-1">
									{folder.isFavorite && <Star className="h-3.5 w-3.5 fill-warning text-warning" />}
									{folder._isOrphan && (
										<Badge className="text-[10px]" variant="destructive">
											Huérfana
										</Badge>
									)}
								</div>
							</div>
						</div>

						{/* Contenido */}
						<div className="space-y-2 p-3">
							{/* Nombre */}
							<div className="min-h-[40px]">
								<h3
									className={cn(
										'text-left font-medium text-[13px] leading-tight',
										folder._hierarchyLevel > 0 && 'text-[12px] text-muted-foreground'
									)}
								>
									{folder.name}
								</h3>
							</div>

							{/* Estado */}
							<MicroCell tone={getStatusTone(status as IndexStatus)}>
								<div className="flex items-center justify-between gap-2">
									<FolderIndexStatusBadge lastIndexed={folder.lastIndexed} status={status as IndexStatus} />
									{statusMsg && <span className="text-[10px] text-muted-foreground">{statusMsg}</span>}
								</div>
							</MicroCell>

							{/* Estadísticas de archivos */}
							<div className="grid grid-cols-2 gap-1.5 text-[11px]">
								<MicroCell className="flex items-center justify-between gap-1.5">
									<Image className="h-3 w-3 text-muted-foreground" />
									<span className="font-medium">{folder.totalImages ?? folder.imageCount ?? 0}</span>
								</MicroCell>
								<MicroCell className="flex items-center justify-between gap-1.5">
									<Video className="h-3 w-3 text-muted-foreground" />
									<span className="font-medium">{folder.totalVideos ?? folder.videoCount ?? 0}</span>
								</MicroCell>
								<MicroCell className="flex items-center justify-between gap-1.5">
									<AudioLines className="h-3 w-3 text-muted-foreground" />
									<span className="font-medium">{folder.totalAudio ?? folder.audioCount ?? 0}</span>
								</MicroCell>
								<MicroCell className="flex items-center justify-between gap-1.5">
									<FileText className="h-3 w-3 text-muted-foreground" />
									<span className="font-medium">{folder.totalDocuments ?? folder.documentCount ?? 0}</span>
								</MicroCell>
							</div>
						</div>
					</button>
				);
			})}
		</div>
	);
}

/**
 * Mapea estado a tono visual para MicroCell
 */
function getStatusTone(status: IndexStatus): 'default' | 'info' | 'success' | 'warning' | 'danger' {
	switch (status) {
		case 'indexed':
			return 'success';
		case 'pending':
			return 'info';
		case 'outdated':
			return 'warning';
		case 'error':
		case 'not_found':
			return 'danger';
		default:
			return 'default';
	}
}
