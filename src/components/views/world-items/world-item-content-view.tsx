import { Box } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { EmptyState } from '@/components/core/data-display/empty-state/empty-state';
import { LoadingScreen } from '@/components/core/feedback/loading/loading-screen';
import { FileBrowser } from '@/components/features/file-browser-new/file-browser';
import { type BrowserItem, toBrowserItem } from '@/components/features/file-browser-new/types/item.types';
import { BaseContentView } from '@/components/views/base/base-content-view';
import { useWorldItemImages } from '@/lib/api/world-items';
import { useDetailsPanel } from '@/store/details-panel.store';
import { useWorldItemStore } from '@/store/entities/world-item';
import type { AnyEntityWithStats } from '@/types/entities';

export const WorldItemContentView = memo(function WorldItemContentView() {
	const { id } = useParams<{ id: string }>();
	const selectedId = useWorldItemStore((state) => state.ui.selectedId);
	const selectWorldItem = useWorldItemStore((state) => state.selectWorldItem);
	const loadWorldItems = useWorldItemStore((state) => state.loadWorldItems);
	const effectiveWorldItemId = id || selectedId;
	const selectedWorldItem = useWorldItemStore((state) => state.getWorldItemById(effectiveWorldItemId || ''));

	useEffect(() => {
		if (id && id !== selectedId) {
			selectWorldItem(id);
		}
	}, [id, selectWorldItem, selectedId]);

	useEffect(() => {
		if (effectiveWorldItemId && !selectedWorldItem) {
			void loadWorldItems();
		}
	}, [effectiveWorldItemId, loadWorldItems, selectedWorldItem]);

	const { data: images = [], isLoading, error } = useWorldItemImages(effectiveWorldItemId || '');
	const { setVisible: setDetailsPanelVisible, setSelectedItems } = useDetailsPanel();
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

	if (!effectiveWorldItemId) {
		return (
			<BaseContentView>
				<div className="flex h-full items-center justify-center">
					<EmptyState
						description="Selecciona un objeto del mundo para ver su contenido"
						icon={Box}
						title="Sin objeto seleccionado"
					/>
				</div>
			</BaseContentView>
		);
	}

	if (error) {
		return (
			<BaseContentView>
				<div className="flex h-full items-center justify-center text-destructive">Error: {error.message}</div>
			</BaseContentView>
		);
	}

	if (isLoading && images.length === 0) {
		return (
			<BaseContentView description={undefined} title={selectedWorldItem?.name ?? 'Objeto del mundo'}>
				<LoadingScreen />
			</BaseContentView>
		);
	}

	return (
		<BaseContentView
			description={selectedWorldItem?._count?.images ? `${selectedWorldItem._count.images} imágenes` : undefined}
			title={selectedWorldItem?.name ?? 'Objeto del mundo'}
		>
			<FileBrowser className="h-full" items={browserItems} onItemClick={handleItemSelect} />
		</BaseContentView>
	);
});
