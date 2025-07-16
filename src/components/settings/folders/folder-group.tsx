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
	onUpdateFolder?: (folderId: string, updates: { emoji?: string; description?: string; isFavorite?: boolean }) => void;
	onToggleExpanded?: (folderId: string) => void;
	expandedFolders?: Set<string>;
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
	onUpdateFolder,
	onToggleExpanded,
	expandedFolders,
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
				onUpdateFolder={onUpdateFolder}
				onToggleExpanded={onToggleExpanded}
				isExpanded={expandedFolders?.has(parentFolder.id || '') || false}
			/>

			{/* Subcarpetas anidadas - Solo mostrar si está expandida */}
			{sortedSubfolders.length > 0 && expandedFolders?.has(parentFolder.id || '') && (
				<motion.div
					initial={{ opacity: 0, height: 0 }}
					animate={{ opacity: 1, height: 'auto' }}
					exit={{ opacity: 0, height: 0 }}
					transition={{ duration: 0.2, delay: 0.1 }}
					className="space-y-1 overflow-hidden ml-4 border-l-2 border-muted pl-3"
				>
					{sortedSubfolders.map((subfolder, index) => (
						<motion.div
							key={subfolder.id}
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
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
