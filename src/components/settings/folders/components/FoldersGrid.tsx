import { memo, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { FolderCard } from '../folder-card';
import { getFolderIndexStatus } from '../folder-utils';
import { EmptyFoldersState } from './EmptyFoldersState';

interface FoldersGridProps {
	orderedFolders: any[];
	folders: any[];
	progressByFolder: Record<string, any>;
	isGloballyProcessing: boolean;
	globalCurrentFolderId: string | null | undefined;
	processStatus: any;
	onFolderClick: (id: string) => void;
	onReindex: (id: string) => void;
	selectedFolder: string | null;
	isProcessing: boolean;
}

export const FoldersGrid = memo(function FoldersGrid({
	orderedFolders,
	folders,
	progressByFolder,
	isGloballyProcessing,
	globalCurrentFolderId,
	processStatus,
	onFolderClick,
	onReindex,
	selectedFolder,
	isProcessing,
}: FoldersGridProps) {
	// Memoizar la función getFolderIndexStatus para evitar re-renders
	const memoizedGetFolderIndexStatus = useCallback(getFolderIndexStatus, []);

	// OPTIMIZACIÓN: Durante reindexado global, mostrar solo la carpeta actual
	const displayFolders = useMemo(() => {
		if (isGloballyProcessing && globalCurrentFolderId) {
			// Solo mostrar la carpeta que se está reindexando actualmente
			const currentFolder = orderedFolders.find((folder) => folder.id === globalCurrentFolderId);
			return currentFolder ? [currentFolder] : [];
		}
		// En modo normal, mostrar todas las carpetas
		return orderedFolders;
	}, [isGloballyProcessing, globalCurrentFolderId, orderedFolders]);

	// OPTIMIZACIÓN: Grid adaptativo según el modo (layout en filas para desktop)
	const gridClassName = useMemo(() => {
		if (isGloballyProcessing && globalCurrentFolderId) {
			// Modo reindexado: una sola carpeta más grande y centrada
			return cn('grid place-items-center content-center', 'mx-auto max-w-2xl grid-cols-1', 'auto-rows-fr gap-6');
		}
		// Modo normal: filas optimizadas para desktop
		return cn(
			'mx-auto w-full max-w-[1600px]',
			'grid content-start items-stretch',
			// 1 columna en móviles, 2 en md, 3 en xl y 4 en 2xl
			'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4',
			'auto-rows-fr gap-1'
		);
	}, [isGloballyProcessing, globalCurrentFolderId]);

	return (
		<div className={gridClassName} data-density={isGloballyProcessing ? 'focused' : 'compact'}>
			{displayFolders.map((folder) => (
				<FolderCard
					allFolders={folders}
					folder={folder}
					getFolderIndexStatus={memoizedGetFolderIndexStatus}
					globalCurrentFolderId={globalCurrentFolderId}
					isGloballyProcessing={isGloballyProcessing}
					isProcessing={
						isGloballyProcessing
							? globalCurrentFolderId === folder.id || Boolean(progressByFolder[folder.id]?.isProcessing)
							: isProcessing || Boolean(progressByFolder[folder.id]?.isProcessing)
					}
					key={folder.id}
					onFolderClick={onFolderClick}
					onReindex={onReindex}
					processStatus={progressByFolder[folder.id] || processStatus}
					selectedFolder={selectedFolder}
				/>
			))}
			{folders.length === 0 && <EmptyFoldersState />}
		</div>
	);
});
