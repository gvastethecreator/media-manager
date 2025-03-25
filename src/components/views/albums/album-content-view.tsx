'use client';

import { getAlbumImages } from '@/app/actions/albums/album.actions';
import type { BaseContentProps } from '@/components/views/base';
import { BaseContentView, ContentViewProvider } from '@/components/views/base';
import { clientEvents } from '@/lib/client/events.client';
import { serverLogger } from '@/lib/logger/server-logger';
import { useFileManager } from '@/store/files/file-manager.store';
import type { FileItem } from '@/types/file-item';
import { Album } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const viewLogger = serverLogger.withContext('AlbumContentView');

export function AlbumContentView() {
	const { currentAlbumId } = useFileManager();
	const [items, setItems] = useState<FileItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Usar el hook de eventos optimistas del cliente
	const [optimisticItems, _addEvent] = clientEvents.useEvents<FileItem[]>(items);

	const loadAlbumImages = useCallback(async () => {
		if (!currentAlbumId) {
			return;
		}

		try {
			setIsLoading(true);
			viewLogger.info('🔄 Cargando imágenes del álbum...');
			const data = await getAlbumImages(currentAlbumId);
			setItems(data as unknown as FileItem[]);
			viewLogger.info('✅ Imágenes cargadas');
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
			viewLogger.error('❌ Error cargando imágenes:', errorMessage);
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, [currentAlbumId]);

	useEffect(() => {
		// Cargar imágenes inicialmente
		loadAlbumImages();
	}, [loadAlbumImages]);

	const handleItemSelection = useCallback((item: FileItem) => {
		viewLogger.info('🖱️ Item seleccionado:', item.name);
	}, []);

	const contentProps: BaseContentProps = {
		items: optimisticItems,
		isLoading,
		error,
		toggleItemSelection: handleItemSelection,
		currentContainerId: currentAlbumId ?? null,
		emptyState: !currentAlbumId
			? {
				icon: Album,
				title: 'No hay álbum seleccionado',
				description: 'Selecciona un álbum para ver su contenido.',
			}
			: {
				icon: Album,
				title: 'Álbum sin imágenes',
				description: 'Este álbum no tiene imágenes asociadas.',
			},
	};

	return (
		<ContentViewProvider {...contentProps}>
			<BaseContentView />
		</ContentViewProvider>
	);
}
