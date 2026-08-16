/**
 * @file HierarchicalFolderWrapper - Wrapper para navegación jerárquica de carpetas
 * @module file-browser-new/wrappers/hierarchical-folder-wrapper
 *
 * Maneja rutas jerárquicas como /folders/parent/child/grandchild
 * y las convierte al folderId apropiado para el componente FolderContentView
 */

import { memo, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { LoadingScreen } from '@/components/core/feedback/loading/loading-screen';
import { FolderContentView } from '@/components/views/folders/folder-content-view';
import { useFolderTree } from '@/lib/api/folders';
import { clientLogger } from '@/lib/logger/client-logger';
import { useHierarchicalNavigation } from '@/lib/utils/folder/hierarchical-navigation';

const logger = clientLogger.withContext('HierarchicalFolderWrapper');

interface HierarchicalFolderWrapperProps {
	className?: string;
}

export const HierarchicalFolderWrapper = memo(function HierarchicalFolderWrapperImpl({
	className,
}: HierarchicalFolderWrapperProps) {
	const { '*': hierarchicalPath } = useParams<{ '*': string }>();

	const { data: folders = [], isLoading: isFoldersLoading, error: foldersError } = useFolderTree();

	const { getFolderIdFromPath, isValidPath } = useHierarchicalNavigation();

	const folderId = useMemo(() => {
		if (!hierarchicalPath) {
			logger.info('No hierarchical path, showing root view');
			return null;
		}

		if (folders.length === 0) {
			logger.debug(`Waiting for folders to resolve: "${hierarchicalPath}"`);
			return null;
		}

		logger.info(`Resolving hierarchical path: "${hierarchicalPath}"`);
		logger.debug(`Available folders: ${folders.length}`, {
			folderNames: folders.map((f) => `${f.name} (${f.id}, parent: ${f.parentId})`).slice(0, 5),
		});

		if (!isValidPath(hierarchicalPath)) {
			logger.warn(`Invalid hierarchical path: ${hierarchicalPath}`);
			return null;
		}

		const resolvedId = getFolderIdFromPath(hierarchicalPath);
		if (!resolvedId) {
			logger.warn(`Could not resolve a folder ID for path: ${hierarchicalPath}`);
			return null;
		}

		logger.info(`Resolved hierarchical path: ${hierarchicalPath} → ${resolvedId}`);
		return resolvedId;
	}, [hierarchicalPath, folders, getFolderIdFromPath, isValidPath]);

	if (foldersError) {
		logger.error('Error loading folders:', foldersError);
		return (
			<div className="flex h-full items-center justify-center">
				<div className="text-center">
					<p className="text-destructive">Could not load folders</p>
					<p className="text-muted-foreground text-sm">
						{foldersError instanceof Error ? foldersError.message : 'Unknown error'}
					</p>
				</div>
			</div>
		);
	}

	const isResolving = isFoldersLoading || folders.length === 0;

	if (isResolving) {
		logger.info('Resolving folder structure and holding the loading state until the previous folder is cleared');
		return (
			<div className="flex h-full items-center justify-center" data-testid="hierarchical-wrapper-resolving">
				<LoadingScreen interactive={false} message="Loading folder structure..." />
			</div>
		);
	}

	if (!hierarchicalPath) {
		logger.info('Rendering the root folder view');
		return <FolderContentView folderId={undefined} />;
	}

	if (!folderId) {
		logger.warn('Folder not found for the requested path:', hierarchicalPath);
		return (
			<div className="flex h-full flex-col items-center justify-center p-8 text-center">
				<div className="mb-4 rounded-full bg-dt-danger-100 p-4 dark:bg-dt-danger-900/30">
					<svg
						className="h-10 w-10 text-destructive dark:text-dt-danger-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
						/>
					</svg>
				</div>
				<h3 className="mb-2 font-semibold text-xl">Folder not found</h3>
				<p className="mb-6 max-w-md text-muted-foreground">
					No folder was found at: <span className="font-mono text-sm">{hierarchicalPath}</span>
				</p>
				<button
					className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90"
					onClick={() => {
						window.location.href = '/folders';
					}}
					type="button"
				>
					Back to Folders
				</button>
			</div>
		);
	}

	logger.info(`Rendering folder content: ${folderId}`);
	return <FolderContentView folderId={folderId ?? undefined} />;
});
