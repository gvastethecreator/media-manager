import { Folder } from 'lucide-react';
import { memo, useMemo } from 'react';
import { FolderStageIndicator } from './folder-stage-indicator';
import type { ExtendedFolder, ExtendedProcessStatus } from './folder-types';

interface FolderProcessingDetailsProps {
	isReindexing: boolean;
	lastProgress: number;
	processStatus?: ExtendedProcessStatus;
	subfolders: ExtendedFolder[];
}

export const FolderProcessingDetails = memo(function FolderProcessingDetails({
	isReindexing,
	lastProgress,
	processStatus,
	subfolders,
}: FolderProcessingDetailsProps) {
	// Memoizar subcarpetas a mostrar para evitar slice repetitivo
	const displaySubfolders = useMemo(() => {
		return subfolders.slice(0, 3);
	}, [subfolders]);

	const remainingSubfoldersCount = useMemo(() => {
		return Math.max(0, subfolders.length - 3);
	}, [subfolders.length]);

	return (
		<div className="mt-1 space-y-2">
			{/* Indicador de etapas */}
			<FolderStageIndicator
				filesProcessed={processStatus?.filesProcessed}
				isProcessing={isReindexing}
				message={processStatus?.message}
				phase={processStatus?.phase || 'starting'}
				progress={lastProgress}
				totalFiles={processStatus?.totalFiles}
			/>

			{/* Subcarpetas encontradas durante el indexado */}
			{subfolders.length > 0 && (
				<div className="mt-2 p-2">
					<div className="mb-2 flex items-center gap-1.5">
						<Folder className="h-3 w-3 text-muted-foreground" />
						<span className="font-medium text-muted-foreground text-xs">Subcarpetas ({subfolders.length})</span>
					</div>
					<div className="grid grid-cols-1 gap-1">
						{displaySubfolders.map((subfolder) => (
							<div className="flex items-center justify-between rounded px-2 py-1 text-xs" key={subfolder.id}>
								<div className="flex min-w-0 flex-1 items-center gap-1.5">
									<span className="text-xs">{subfolder.emoji || '📁'}</span>
									<span className="truncate text-muted-foreground">{subfolder.name}</span>
								</div>
								<div className="flex items-center gap-1 text-muted-foreground">
									{/* Indicador de si tiene archivos */}
									{(subfolder.totalFiles || 0) > 0 && <span className="text-[10px]">{subfolder.totalFiles} files</span>}
								</div>
							</div>
						))}
						{remainingSubfoldersCount > 0 && (
							<div className="pt-1 text-center">
								<span className="text-[10px] text-muted-foreground">+{remainingSubfoldersCount} más</span>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
});
