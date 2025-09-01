import { motion } from '@/components/ui/motion-shim';
import { Folder } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { FolderStageIndicator } from './folder-stage-indicator';
import type { ExtendedFolder, ExtendedProcessStatus } from './folder-types';

interface FolderProcessingDetailsProps {
	isReindexing: boolean;
	lastProgress: number;
	processStatus?: ExtendedProcessStatus;
	subfolders: ExtendedFolder[];
}

export function FolderProcessingDetails({
	isReindexing,
	lastProgress,
	processStatus,
	subfolders,
}: FolderProcessingDetailsProps) {
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
				<motion.div
					animate={{ opacity: 1, height: 'auto' }}
					className="mt-2 p-2"
					exit={{ opacity: 0, height: 0 }}
					initial={{ opacity: 0, height: 0 }}
					transition={{ duration: 0.3 }}
				>
					<div className="mb-2 flex items-center gap-1.5">
						<Folder className="h-3 w-3 text-muted-foreground" />
						<span className="font-medium text-muted-foreground text-xs">Subcarpetas ({subfolders.length})</span>
					</div>
					<div className="grid grid-cols-1 gap-1">
						{subfolders.slice(0, 3).map((subfolder) => (
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
						{subfolders.length > 3 && (
							<div className="pt-1 text-center">
								<span className="text-[10px] text-muted-foreground">+{subfolders.length - 3} más</span>
							</div>
						)}
					</div>
				</motion.div>
			)}
		</div>
	);
}
