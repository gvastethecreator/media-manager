'use client';

import { getFolderImages, reindexFolder } from '@/app/actions/folders';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import type { FolderContentProps } from '@/components/views/base';
import { BaseContentView, ContentViewProvider } from '@/components/views/base';
import { serverLogger } from '@/lib/logger/server-logger';
import { useFileManager } from '@/store/file-manager.store';
import { useImageResources } from '@/store/image-resources.store';
import { Folder } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const viewLogger = serverLogger.withContext('FolderContentView');

export function FolderContentView() {
	const {
		currentItems: items,
		toggleItemSelection,
		currentFolderId,
		setCurrentFolder,
		isLoading,
		currentFolder,
		setItems,
		setIsLoading,
	} = useFileManager();

	const { setCurrentView, currentItem } = useNavigationStore();
	const { preloadResources } = useImageResources();
	const [error, setError] = useState<string | null>(null);

	// Establecer la vista actual al montar el componente
	useEffect(() => {
		setCurrentView('folder-content');
	}, [setCurrentView]);

	// Cargar la información completa de la carpeta
	useEffect(() => {
		const loadFolderInfo = async () => {
			if (!currentFolderId) {
				viewLogger.error('❌ No se encontró una carpeta actual');
				setError('No se encontró una carpeta actual');
				return;
			}

			try {
				viewLogger.info('🔄 Cargando información de la carpeta:', currentFolderId);
				setIsLoading(true);
				const images = await getFolderImages(currentFolderId);

				// Validar respuesta
				if (!images || !Array.isArray(images)) {
					throw new Error('Respuesta de imágenes inválida');
				}

				viewLogger.info(`🖼️ Imágenes encontradas: ${images.length}`);

				// Actualizar la información de la carpeta en el store
				if (currentFolder) {
					useFileManager.setState({
						currentFolder: {
							...currentFolder,
							_count: { images: images.length },
							lastIndexed: new Date(),
						},
					});
				}

				// Precargar recursos de imágenes para thumbnails
				if (images.length > 0) {
					try {
						// Intentar precargar los recursos para las miniaturas
						const imageIds = images.map((img) => img.id);
						preloadResources(imageIds);
					} catch (preloadError) {
						viewLogger.warn('⚠️ Error al precargar recursos:', preloadError);
						// No interrumpimos el flujo principal si falla la precarga
					}
				}

				setItems(images);
				viewLogger.info(`✅ Información de la carpeta cargada: ${images.length} imágenes`);
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
				viewLogger.error('❌ Error cargando información de la carpeta:', error);
				setError(errorMessage);
			} finally {
				setIsLoading(false);
			}
		};

		loadFolderInfo();
	}, [currentFolderId, setItems, currentFolder, setIsLoading, preloadResources]);

	const handleReindexFolder = useCallback(
		async (id: string) => {
			try {
				viewLogger.info('🔄 Reindexando carpeta:', id);
				setIsLoading(true);
				await reindexFolder(id);

				// Recargar las imágenes después de reindexar
				if (id) {
					const images = await getFolderImages(id);

					// Validar respuesta
					if (!images || !Array.isArray(images)) {
						throw new Error('Respuesta de imágenes inválida después de reindexar');
					}

					setItems(images);

					// Actualizar contador en la carpeta
					if (currentFolder) {
						useFileManager.setState({
							currentFolder: {
								...currentFolder,
								_count: { images: images.length },
								lastIndexed: new Date(),
							},
						});
					}
				}
				viewLogger.info('✅ Carpeta reindexada:', id);
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
				viewLogger.error('❌ Error reindexando carpeta:', error);
				setError(errorMessage);
			} finally {
				setIsLoading(false);
			}
		},
		[setItems, setIsLoading, currentFolder]
	);

	// Manejar clic en item
	const handleItemClick = useCallback(
		(item) => {
			toggleItemSelection(item, false);
		},
		[toggleItemSelection]
	);

	// Manejar doble clic en item
	const handleItemDoubleClick = useCallback((item) => {
		// Aquí podríamos implementar una acción de vista previa completa o edición
		viewLogger.info('🖱️ Doble clic en item:', item.name);
	}, []);

	const contentProps: FolderContentProps = {
		items,
		isLoading,
		error,
		toggleItemSelection,
		currentContainerId: currentFolderId ?? null,
		containerName: currentFolder?.name ?? currentItem?.name ?? 'Carpeta sin nombre',
		setCurrentContainer: setCurrentFolder,
		reindexFolder: handleReindexFolder,
		onItemClick: handleItemClick,
		onItemDoubleClick: handleItemDoubleClick,
		emptyState: {
			icon: Folder,
			title: 'Carpeta vacía',
			description: `No se encontraron imágenes en ${
				currentFolder?.name || currentItem?.name || 'esta carpeta'
			}. Puedes reindexar la carpeta para buscar nuevas imágenes.`,
		},
	};

	return (
		<ContentViewProvider {...contentProps}>
			<BaseContentView />
		</ContentViewProvider>
	);
}
