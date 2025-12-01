/**
 * 🧭 HierarchicalFolderWrapper - Wrapper para navegación jerárquica de carpetas
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
	// Obtener el path jerárquico desde la URL
	const { '*': hierarchicalPath } = useParams<{ '*': string }>();

	// Obtener árbol completo de carpetas (no paginado)
	const { data: folders = [], isLoading: isFoldersLoading, error: foldersError } = useFolderTree();

	// Usar las utilidades de navegación jerárquica
	const { getFolderIdFromPath, isValidPath } = useHierarchicalNavigation();

	// Resolver folder ID desde el path jerárquico
	const folderId = useMemo(() => {
		if (!hierarchicalPath) {
			// Sin path específico = vista raíz de carpetas
			logger.info('Sin path jerárquico, mostrando vista raíz');
			return null;
		}

		// ⚠️ CRITICAL: No intentar resolver si no hay carpetas cargadas
		if (folders.length === 0) {
			logger.debug(`Esperando carpetas para resolver: "${hierarchicalPath}"`);
			return null;
		}

		// Debug: log del path y carpetas disponibles
		logger.info(`Resolviendo path jerárquico: "${hierarchicalPath}"`);
		logger.debug(`Carpetas disponibles: ${folders.length}`, {
			folderNames: folders.map((f) => `${f.name} (${f.id}, parent: ${f.parentId})`).slice(0, 5),
		});

		// Validar que el path sea válido
		if (!isValidPath(hierarchicalPath)) {
			logger.warn(`Path jerárquico inválido: ${hierarchicalPath}`);
			return null;
		}

		// Resolver folder ID (puede devolver null si aún no están todas las carpetas)
		const resolvedId = getFolderIdFromPath(hierarchicalPath);
		if (!resolvedId) {
			logger.warn(`No se pudo resolver folder ID para path: ${hierarchicalPath}`);
			logger.debug('Segmentos de path que no se encontraron pueden estar en logs de debug');
			return null;
		}

		logger.info(`Path jerárquico resuelto: ${hierarchicalPath} → ${resolvedId}`);
		return resolvedId;
	}, [hierarchicalPath, folders, getFolderIdFromPath, isValidPath]);

	// Manejar estados de loading y error
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
	// No bloquear el render del FileBrowser: si está resolviendo, devolvemos la vista base
	// para que el toolbar/viewport estén disponibles y el panel de performance pueda aparecer.
	// Opcionalmente, mostramos un loading no-interferente.
	if (isResolving) {
		logger.info('Resolviendo estructura de carpetas… renderizando vista base para mantener UI disponible');
		return (
			<div className="relative h-full" data-testid="hierarchical-wrapper-resolving">
				<FolderContentView folderId={undefined} />
				{/* Overlay completamente no-interactivo para no bloquear clics en la UI subyacente */}
				<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
					<LoadingScreen interactive={false} message="Cargando estructura de carpetas..." />
				</div>
			</div>
		);
	}

	// Si no hay path jerárquico, mostrar vista raíz de carpetas
	if (!hierarchicalPath) {
		logger.info('Renderizando vista raíz de carpetas');
		return <FolderContentView folderId={undefined} />;
	}

	// Si el path es inválido o no se resolvió, renderizar vista base igualmente
	// para permitir que herramientas como el panel de performance aparezcan con ?debugPerf
	if (!folderId) {
		logger.warn('Carpeta no resuelta; renderizando vista base para debug/performance');
		return <FolderContentView folderId={undefined} />;
	}

	// Renderizar vista de contenido con el folder ID resuelto
	logger.info(`Renderizando contenido de carpeta: ${folderId}`);
	return <FolderContentView folderId={folderId ?? undefined} />;
});
