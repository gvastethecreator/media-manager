import { Box } from 'lucide-react';
import { memo, useCallback } from 'react';
import { EmptyState } from '@/components/core/data-display/empty-state/empty-state';
import { FileBrowser } from '@/components/features/file-browser/file-browser';
import { BaseContentView } from '@/components/views/base/base-content-view';
import { useWorldItemImages } from '@/lib/api/world-items';
import { useDetailsPanel } from '@/store/details-panel.store';
import { useWorldItemStore } from '@/store/entities/world-item';
import type { AnyEntityWithStats } from '@/types/entities';

export const WorldItemContentView = memo(function WorldItemContentView() {
	const selectedId = useWorldItemStore((state) => state.ui.selectedId);
	const selectedWorldItem = useWorldItemStore((state) => state.getWorldItemById(selectedId || ''));

	const { data: images = [], isLoading, error } = useWorldItemImages(selectedId || '');
	const { setVisible: setDetailsPanelVisible, setSelectedItems } = useDetailsPanel();

	const handleItemSelect = useCallback(
		(item: AnyEntityWithStats) => {
			setSelectedItems([item]);
			setDetailsPanelVisible(true);
		},
		[setSelectedItems, setDetailsPanelVisible]
	);

	if (!selectedId) {
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
				<div className="flex h-full items-center justify-center text-red-500">Error: {error.message}</div>
			</BaseContentView>
		);
	}

	return (
		<BaseContentView
			description={selectedWorldItem?._count?.images ? `${selectedWorldItem._count.images} imágenes` : undefined}
			title={selectedWorldItem?.name ?? 'Objeto del mundo'}
		>
			<FileBrowser
				className="h-full"
				isLoading={isLoading}
				items={images as unknown as AnyEntityWithStats[]}
				onItemClick={handleItemSelect}
			/>
		</BaseContentView>
	);
});
