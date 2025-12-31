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
			logger.info('Sin path jerárquico, mostrando vista raíz');
			return null;
		}

		if (folders.length === 0) {
			logger.debug(`Esperando carpetas para resolver: "${hierarchicalPath}"`);
			return null;
		}

		logger.info(`Resolviendo path jerárquico: "${hierarchicalPath}"`);
		logger.debug(`Carpetas disponibles: ${folders.length}`, {
			folderNames: folders.map((f) => `${f.name} (${f.id}, parent: ${f.parentId})`).slice(0, 5),
		});

		if (!isValidPath(hierarchicalPath)) {
			logger.warn(`Path jerárquico inválido: ${hierarchicalPath}`);
			return null;
		}

		const resolvedId = getFolderIdFromPath(hierarchicalPath);
		if (!resolvedId) {
			logger.warn(`No se pudo resolver folder ID para path: ${hierarchicalPath}`);
			return null;
		}

		logger.info(`Path jerárquico resuelto: ${hierarchicalPath} → ${resolvedId}`);
		return resolvedId;
	}, [hierarchicalPath, folders, getFolderIdFromPath, isValidPath]);

	if (foldersError) {
		logger.error('Error cargando carpetas:', foldersError);
		return (
			<div className="flex h-full items-center justify-center">
				<div className="text-center">
					<p className="text-destructive">Error cargando carpetas</p>
					<p className="text-muted-foreground text-sm">
						{foldersError instanceof Error ? foldersError.message : 'Error desconocido'}
					</p>
				</div>
			</div>
		);
	}

	const isResolving = isFoldersLoading || folders.length === 0;

	if (isResolving) {
		logger.info('Resolviendo estructura de carpetas… renderizando vista base para mantener UI disponible');
		return (
			<div className="relative h-full" data-testid="hierarchical-wrapper-resolving">
				<FolderContentView folderId={undefined} />
				<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
					<LoadingScreen interactive={false} message="Cargando estructura de carpetas..." />
				</div>
			</div>
		);
	}

	if (!hierarchicalPath) {
		logger.info('Renderizando vista raíz de carpetas');
		return <FolderContentView folderId={undefined} />;
	}

	if (!folderId) {
		logger.warn('Carpeta no resuelta; renderizando vista base para debug/performance');
		return <FolderContentView folderId={undefined} />;
	}

	logger.info(`Renderizando contenido de carpeta: ${folderId}`);
	return <FolderContentView folderId={folderId ?? undefined} />;
});
