'use client';

import { getFolderImages, reindexFolder } from '@/app/actions/folders';
import { BaseContentView, ContentViewProvider } from '@/components/views/base';
import type { FolderContentProps } from '@/components/views/base';
import { logger } from '@/lib/logger/logger';
import { useFileManager } from '@/store/file-manager.store';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { Folder } from 'lucide-react';
import { useCallback, useEffect } from 'react';

const viewLogger = logger.withContext('FolderContentView');

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

	const { setCurrentView } = useNavigationStore();

	// Establecer la vista actual al montar el componente
	useEffect(() => {
		setCurrentView('folder-content');
	}, [setCurrentView]);

	// Cargar la información completa de la carpeta
	useEffect(() => {
		const loadFolderInfo = async () => {
			if (!currentFolderId) {
				viewLogger.error('❌ No se encontró una carpeta actual');
				return;
			}

			try {
				viewLogger.info('🔄 Cargando información de la carpeta:', currentFolderId);
				const images = await getFolderImages(currentFolderId);

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

				setItems(images);
				viewLogger.info('✅ Información de la carpeta cargada');
			} catch (error) {
				viewLogger.error('❌ Error cargando información de la carpeta:', error);
			}
		};

		loadFolderInfo();
	}, [currentFolderId, setItems, currentFolder]);

	const handleReindexFolder = useCallback(
		async (id: string) => {
			try {
				viewLogger.info('🔄 Reindexando carpeta:', id);
				setIsLoading(true);
				await reindexFolder(id);

				// Recargar las imágenes después de reindexar
				if (id) {
					const images = await getFolderImages(id);
					setItems(images);
				}
				viewLogger.info('✅ Carpeta reindexada:', id);
			} catch (error) {
				viewLogger.error('❌ Error reindexando carpeta:', error);
			} finally {
				setIsLoading(false);
			}
		},
		[setItems, setIsLoading]
	);

	const contentProps: FolderContentProps = {
		items,
		isLoading,
		toggleItemSelection,
		currentContainerId: currentFolderId ?? null,
		containerName: currentFolder?.name ?? null,
		setCurrentContainer: setCurrentFolder,
		reindexFolder: handleReindexFolder,
		emptyState: {
			icon: Folder,
			title: 'Carpeta vacía',
			description: `No se encontraron imágenes en ${
				currentFolder?.name || 'esta carpeta'
			}. Puedes agregar imágenes arrastrándolas aquí.`,
		},
	};

	return (
		<ContentViewProvider {...contentProps}>
			<BaseContentView />
		</ContentViewProvider>
	);
}
