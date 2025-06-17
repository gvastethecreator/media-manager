'use client';

/**
 * @file Utilidades para integrar el FileBrowser con la barra de herramientas principal
 * @module components/features/file-browser/toolbar-integration
 */

import { deleteFile } from '@/app/actions/files/file.actions';
import { clientLogger } from '@/lib/logger/client-logger';
import { toastService } from '@/services/toast.service';
import { useSelectionStore } from '@/store/selection.store';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';
import { FileItem } from '@/types/file-item';

// Logger para la integración con la barra de herramientas
const toolbarLogger = clientLogger.withContext('ToolbarIntegration');

/**
 * Hook para proporcionar acciones de la barra de herramientas al FileBrowser
 */
export function useToolbarActions() {
        const selectedItems = useSelectionStore((state) => state.selectedItems);
        const clearSelection = useSelectionStore((state) => state.clearSelection);

        const viewMode = useViewOptionsStore((state) => state.viewMode);
        const setViewMode = useViewOptionsStore((state) => state.setViewMode);
        const sort = useViewOptionsStore((state) => state.sort);
        const setSort = useViewOptionsStore((state) => state.setSort);

	/**
	 * Maneja la eliminación de los archivos seleccionados
	 */
	const handleDeleteSelected = async () => {
		if (selectedItems.length === 0) {
			return;
		}

		if (window.confirm(`¿Estás seguro de que quieres eliminar ${selectedItems.length} archivo(s)?`)) {
			let successCount = 0;
			let errorCount = 0;

			for (const item of selectedItems) {
				try {
					await deleteFile(item.path);
					successCount++;
				} catch (error) {
					toolbarLogger.error(`Error al eliminar ${item.name}:`, error);
					errorCount++;
				}
			}

			// Mostrar notificación del resultado
			if (successCount > 0) {
				toastService.success(`${successCount} archivo(s) eliminados correctamente`);
			}
			if (errorCount > 0) {
				toastService.error(`No se pudieron eliminar ${errorCount} archivo(s)`);
			}

                        // Limpiar selección
                        clearSelection();
		}
	};

	/**
	 * Maneja la descarga de los archivos seleccionados
	 */
	const handleDownloadSelected = async () => {
		if (selectedItems.length === 0) {
			return;
		}

		// Descargar cada archivo
		for (const item of selectedItems) {
			try {
				// Crear un enlace temporal para descargar
				const filename = item.path.split('/').pop() || item.id;
				const downloadUrl = `/api/images/${item.id}/content`;

				// Usar fetch para obtener el archivo como blob
				const response = await fetch(downloadUrl);
				const blob = await response.blob();
				const secureUrl = URL.createObjectURL(blob);

				const a = document.createElement('a');
				a.href = secureUrl;
				a.download = filename;
				a.rel = 'noopener noreferrer';
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);

				// Liberar el objeto URL
				URL.revokeObjectURL(secureUrl);

				toastService.success(`Descargando: ${item.name}`);
			} catch (error) {
				toolbarLogger.error(`Error al descargar ${item.name}:`, error);
				toastService.error(`Error al descargar ${item.name}`);
			}
		}
	};

	/**
	 * Maneja la compresión de los archivos seleccionados (no implementado)
	 */
	const handleCompressFiles = () => {
		if (selectedItems.length === 0) {
			return;
		}
		toastService.info('La funcionalidad de compresión de archivos estará disponible en una próxima actualización.');
	};

	/**
	 * Maneja la copia al portapapeles del primer archivo seleccionado
	 */
	const handleCopySelected = async () => {
		if (selectedItems.length === 0) {
			return;
		}

		const item = selectedItems[0];
		try {
			// Para copiar una imagen al portapapeles, primero necesitamos cargarla
			const imageUrl = `/api/images/${item.id}/content`;

			// Creamos un elemento de imagen temporal
			const img = new Image();
			img.crossOrigin = 'anonymous';

			// Esperamos a que la imagen cargue
			await new Promise((resolve, reject) => {
				img.onload = resolve;
				img.onerror = reject;
				img.src = imageUrl;
			});

			// Creamos un canvas para dibujar la imagen
			const canvas = document.createElement('canvas');
			canvas.width = img.width;
			canvas.height = img.height;
			const ctx = canvas.getContext('2d');
			if (!ctx) throw new Error('No se pudo crear contexto 2D');

			// Dibujamos la imagen en el canvas
			ctx.drawImage(img, 0, 0);

			// Copiamos la imagen al portapapeles
			canvas.toBlob(async (blob) => {
				if (blob) {
					try {
						// Usar la API moderna del portapapeles
						await navigator.clipboard.write([
							new ClipboardItem({
								[blob.type]: blob,
							}),
						]);
						toastService.success('Imagen copiada al portapapeles');
					} catch (error) {
						toolbarLogger.error('Error al copiar imagen al portapapeles:', error);
						toastService.error('No se pudo copiar la imagen al portapapeles');
					}
				}
			});
		} catch (error) {
			toolbarLogger.error(`Error al copiar ${item.name}:`, error);
			toastService.error(`Error al copiar ${item.name}`);
		}
	};

	/**
	 * Maneja el cambio de modo de visualización
	 */
	const handleViewModeChange = (mode: 'grid' | 'details' | 'tree' | 'list') => {
		setViewMode(mode);
	};

	/**
	 * Maneja el cambio de orden
	 */
        const handleSortChange = (field: 'name' | 'createdAt' | 'modifiedAt') => {
                if (sort.field === field) {
                        setSort({ direction: sort.direction === 'asc' ? 'desc' : 'asc' });
                } else {
                        setSort({ field, direction: 'asc' });
                }
        };

	return {
		// Estado
		selectedItems,
		viewMode,
                sort,

		// Acciones
		handleDeleteSelected,
		handleDownloadSelected,
		handleCompressFiles,
		handleCopySelected,
		handleViewModeChange,
		handleSortChange,
	};
}