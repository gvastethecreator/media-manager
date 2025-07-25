import { Album } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { BaseContentProps } from '@/components/views/base';
import { BaseContentView, ContentViewProvider } from '@/components/views/base';
import { useAlbumImages } from '@/lib/api/albums';
import { clientEvents } from '@/lib/client/events.client';
import { clientLogger } from '@/lib/logger/client-logger';
import { useAlbumStore } from '@/store/entities/album';
import type { EntityWithStats } from '@/types/entities/entity.types';

const viewLogger = clientLogger.withContext('AlbumContentView');

export function AlbumContentView() {
	const currentAlbumId = useAlbumStore((state) => state.currentAlbumId);
	const album = useAlbumStore((state) => (currentAlbumId ? state.albums[currentAlbumId] : null));

	const [items, setItems] = useState<EntityWithStats[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// React Query hook must be at top level
	const { data: albumImages, isLoading: isLoadingImages, error: albumError } = useAlbumImages(currentAlbumId || '');

	// Usar el hook de eventos optimistas del cliente
	const [optimisticItems, _addEvent] = clientEvents.useEvents<EntityWithStats[]>(items);

	const loadAlbumImages = useCallback(async () => {
		if (!currentAlbumId) {
			return;
		}

		try {
			setError(null);
			setIsLoading(true);
			viewLogger.info('🔄 Cargando imágenes del álbum...');
			if (albumImages) {
				setItems(albumImages as EntityWithStats[]);
			}
			viewLogger.info('✅ Imágenes cargadas');
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
			setError(errorMessage);
			viewLogger.error('❌ Error cargando imágenes del álbum:', errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, [currentAlbumId, albumImages]);

	useEffect(() => {
		// Cargar imágenes inicialmente
		loadAlbumImages();
	}, [loadAlbumImages]);

	const handleItemSelection = useCallback((item: EntityWithStats) => {
		viewLogger.info('🖱️ Item seleccionado:', item.name);
	}, []);

	const contentProps: BaseContentProps = {
		items: optimisticItems,
		isLoading,
		error,
		toggleItemSelection: handleItemSelection,
		currentContainerId: currentAlbumId ?? null,
		containerName: album?.name ?? null,
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
		onRefresh: loadAlbumImages,
	};

	if (isLoading || isLoadingImages) {
		return <div className="flex items-center justify-center p-8">Cargando imágenes...</div>;
	}

	if (error || albumError) {
		return (
			<div className="flex items-center justify-center p-8 text-red-500">Error: {error || albumError?.message}</div>
		);
	}

	if (!optimisticItems || optimisticItems.length === 0) {
		return <div className="flex items-center justify-center p-8">No se encontraron imágenes</div>;
	}

	return (
		<ContentViewProvider {...contentProps}>
			<BaseContentView>
				<div className="p-4">
					<h2 className="text-lg font-semibold mb-4">{album?.name || 'Álbum'}</h2>
					{/* Contenido del álbum */}
				</div>
			</BaseContentView>
		</ContentViewProvider>
	);
}
