import { motion } from 'motion/react';
import { FolderCard } from './folder-card';
import type { IndexStatus } from './folder-index-status-badge';
import type { ExtendedFolder, ExtendedProcessStatus } from './folder-types';
import { SubfolderCard } from './subfolder-card';

interface FolderGroupProps {
	parentFolder: ExtendedFolder;
	subfolders: ExtendedFolder[];
	allFolders: ExtendedFolder[];
	selectedFolder: string | null;
	isProcessing: boolean;
	processStatus: ExtendedProcessStatus;
	isGloballyProcessing: boolean;
	onReindex: (folderId: string) => void;
	onToggleAutoReindex: (folderId: string, value: boolean) => void;
	onFolderClick: (folderId: string) => void;
	getFolderIndexStatus: (folder: ExtendedFolder) => IndexStatus;
}

export function FolderGroup({
	parentFolder,
	subfolders,
	allFolders,
	selectedFolder,
	isProcessing,
	processStatus,
	isGloballyProcessing,
	onReindex,
	onToggleAutoReindex,
	onFolderClick,
	getFolderIndexStatus,
}: FolderGroupProps) {
	// Ordenar subcarpetas por nombre
	const sortedSubfolders = [...subfolders].sort((a, b) => a.name.localeCompare(b.name));

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3 }}
			className="space-y-2"
		>
			{/* Carpeta padre */}
			<FolderCard
				folder={parentFolder}
				allFolders={allFolders}
				selectedFolder={selectedFolder}
				isProcessing={isProcessing}
				processStatus={processStatus}
				isGloballyProcessing={isGloballyProcessing}
				onReindex={onReindex}
				onToggleAutoReindex={onToggleAutoReindex}
				onFolderClick={onFolderClick}
				getFolderIndexStatus={getFolderIndexStatus}
			/>

			{/* Subcarpetas anidadas */}
			{sortedSubfolders.length > 0 && (
				<motion.div
					initial={{ opacity: 0, height: 0 }}
					animate={{ opacity: 1, height: 'auto' }}
					transition={{ duration: 0.2, delay: 0.1 }}
					className="space-y-1 overflow-hidden"
				>
					{sortedSubfolders.map((subfolder, index) => (
						<motion.div
							key={subfolder.id}
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.2, delay: 0.1 + index * 0.05 }}
						>
							<SubfolderCard
								folder={subfolder}
								selectedFolder={selectedFolder}
								isProcessing={isProcessing}
								processStatus={processStatus}
								isGloballyProcessing={isGloballyProcessing}
								onReindex={onReindex}
								onToggleAutoReindex={onToggleAutoReindex}
								onFolderClick={onFolderClick}
								getFolderIndexStatus={getFolderIndexStatus}
							/>
						</motion.div>
					))}
				</motion.div>
			)}
		</motion.div>
	);
}
