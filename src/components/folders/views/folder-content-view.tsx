'use client';

import { getFolderImages, reindexFolder } from '@/app/actions/folders';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import type { FolderContentProps } from '@/components/views/base';
import { BaseContentView, ContentViewProvider } from '@/components/views/base';
import { serverLogger } from '@/lib/logger/server-logger';
import { useFileManager } from '@/store/file-manager.store';
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

	const { setCurrentView } = useNavigationStore();
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
	}, [currentFolderId, setItems, currentFolder, setIsLoading]);

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
				const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
				viewLogger.error('❌ Error reindexando carpeta:', error);
				setError(errorMessage);
			} finally {
				setIsLoading(false);
			}
		},
		[setItems, setIsLoading]
	);

	const contentProps: FolderContentProps = {
		items,
		isLoading,
		error,
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
			}. Puedes reindexar la carpeta para buscar nuevas imágenes.`,
		},
	};

	return (
		<ContentViewProvider {...contentProps}>
			<BaseContentView />
		</ContentViewProvider>
	);
}
