import { Album } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { EmptyState } from '@/components/core/data-display/empty-state/empty-state';
import { LoadingScreen } from '@/components/core/feedback';
import { type BrowserItem, FileBrowser, toBrowserItem } from '@/components/features/file-browser-new';
import { BaseContentView } from '@/components/views/base';
import { useAlbumImages } from '@/lib/api/albums';
import { clientLogger } from '@/lib/logger/client-logger';
import { useDetailsPanel } from '@/store/details-panel.store';
import { useAlbumStore } from '@/store/entities/album';
import type { AnyEntityWithStats } from '@/types/entities';

const viewLogger = clientLogger.withContext('AlbumContentView');

export function AlbumContentView() {
	const currentAlbumId = useAlbumStore((state) => state.currentAlbumId);
	const album = useAlbumStore((state) => (currentAlbumId ? state.albums[currentAlbumId] : null));
	const { setVisible: setDetailsPanelVisible, setSelectedItems } = useDetailsPanel();

	const { data: images = [], isLoading, error } = useAlbumImages(currentAlbumId || '');
	const browserItems = useMemo(
		() => images.map((img) => toBrowserItem(img as unknown as Record<string, unknown>)),
		[images]
	);

	const handleItemSelect = useCallback(
		(item: BrowserItem) => {
			const entity = item.raw as unknown as AnyEntityWithStats | undefined;
			if (!entity) return;
			setSelectedItems([entity]);
			setDetailsPanelVisible(true);
		},
		[setSelectedItems, setDetailsPanelVisible]
	);

	const headerTitle = useMemo(
		() => (album?.name ? `Imágenes del álbum: ${album.name}` : 'Selecciona un álbum'),
		[album?.name]
	);

	if (!currentAlbumId) {
		return (
			<BaseContentView>
				<div className="flex h-full items-center justify-center">
					<EmptyState
						description="Selecciona un álbum para ver sus imágenes relacionadas"
						icon={Album}
						title="Sin álbum seleccionado"
					/>
				</div>
			</BaseContentView>
		);
	}

	if (error) {
		return (
			<BaseContentView title={headerTitle}>
				<div className="flex h-full items-center justify-center text-red-500">Error: {error.message}</div>
			</BaseContentView>
		);
	}

	if (isLoading && images.length === 0) {
		return (
			<BaseContentView title={headerTitle}>
				<LoadingScreen />
			</BaseContentView>
		);
	}

	return (
		<BaseContentView description={images.length ? `${images.length} imágenes` : undefined} title={headerTitle}>
			<FileBrowser className="h-full" items={browserItems} onItemClick={handleItemSelect} />
		</BaseContentView>
	);
}
