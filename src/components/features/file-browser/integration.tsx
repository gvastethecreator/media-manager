'use client';

/**
 * @file Componente de integración entre FileBrowser y ViewToolbar
 * @module components/features/file-browser/integration
 */

import { FileBrowser } from '@/components/features/file-browser/file-browser';
import { ViewToolbar } from '@/components/toolbar/main-toolbar';
import { clientLogger } from '@/lib/logger/client-logger';
import { toastService } from '@/services/toast.service';
import { useDetailsPanel } from '@/store/details-panel.store';
import { FileItem } from '@/types/file-item';
import { useState } from 'react';

// Logger específico para el componente de integración
const integrationLogger = clientLogger.withContext('FileBrowserIntegration');

/**
 * Componente que integra el FileBrowser con la barra de herramientas
 */
export const FileBrowserWithToolbar = ({
	items,
	isLoading,
	isReindexing,
	reindexProgress,
	loadMoreItems
}: {
	items: FileItem[];
	isLoading?: boolean;
	isReindexing?: boolean;
	reindexProgress?: number;
	loadMoreItems?: () => void;
}) => {
	// Estado para el panel derecho
	const [isRightPanelCollapsed, setRightPanelCollapsed] = useState(false);

	// Obtener store de detalles
	const { isVisible: isDetailsPanelVisible, toggleVisibility: toggleDetailsPanel } = useDetailsPanel();

	// Funciones de manejo para archivos
	const handleItemSelect = (item: FileItem) => {
		integrationLogger.debug('Item seleccionado:', item.name);
	};

	const handleItemDoubleClick = (item: FileItem) => {
		integrationLogger.debug('Doble clic en item:', item.name);

		// Si es un directorio, navegar a él
		if ('isDirectory' in item && item.isDirectory) {
			toastService.info(`Navegando a: ${item.name}`);
			// Aquí iría la navegación
		}
	};

	// Toggle para el panel de detalles
	const toggleRightPanelCollapse = () => {
		setRightPanelCollapsed(!isRightPanelCollapsed);
	};

	return (
		<div className="flex flex-col h-full">
			{/* Barra de herramientas */}
			<ViewToolbar
				isRightPanelCollapsed={isRightPanelCollapsed}
				toggleRightPanelCollapse={toggleRightPanelCollapse}
				isRightPanelVisible={isDetailsPanelVisible}
			/>

			{/* Contenido principal */}
			<div className="flex-1 overflow-hidden">
				<FileBrowser
					items={items}
					onItemSelect={handleItemSelect}
					onItemDoubleClick={handleItemDoubleClick}
					isLoading={isLoading}
					isReindexing={isReindexing}
					reindexProgress={reindexProgress}
					loadMoreItems={loadMoreItems}
				/>
			</div>
		</div>
	);
};