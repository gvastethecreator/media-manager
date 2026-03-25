import { Album } from 'lucide-react';
import { useCallback, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { EmptyState } from '@/components/core/data-display/empty-state/empty-state';
import { LoadingScreen } from '@/components/core/feedback/loading/loading-screen';
import { FileBrowser } from '@/components/features/file-browser-new/file-browser';
import { type BrowserItem, toBrowserItem } from '@/components/features/file-browser-new/types/item.types';
import { BaseContentView } from '@/components/views/base/base-content-view';
import { useAlbumImages } from '@/lib/api/albums';
import { clientLogger } from '@/lib/logger/client-logger';
import { useDetailsPanel } from '@/store/details-panel.store';
import { useAlbumStore } from '@/store/entities/album';
import type { AnyEntityWithStats } from '@/types/entities';

const viewLogger = clientLogger.withContext('AlbumContentView');

export function AlbumContentView() {
	const { id } = useParams<{ id: string }>();
	const currentAlbumId = useAlbumStore((state) => state.currentAlbumId);
	const setCurrentAlbumId = useAlbumStore((state) => state.setCurrentAlbumId);
	const loadAlbums = useAlbumStore((state) => state.loadAlbums);
	const effectiveAlbumId = id || currentAlbumId;
	const album = useAlbumStore((state) => (effectiveAlbumId ? state.albums[effectiveAlbumId] : null));
	const { setVisible: setDetailsPanelVisible, setSelectedItems } = useDetailsPanel();

	useEffect(() => {
		if (id && id !== currentAlbumId) {
			setCurrentAlbumId(id);
		}
	}, [currentAlbumId, id, setCurrentAlbumId]);

	useEffect(() => {
		if (effectiveAlbumId && !album) {
			void loadAlbums();
		}
	}, [album, effectiveAlbumId, loadAlbums]);

	const { data: images = [], isLoading, error } = useAlbumImages(effectiveAlbumId || '');
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

	if (!effectiveAlbumId) {
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
				<div className="flex h-full items-center justify-center text-destructive">Error: {error.message}</div>
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
