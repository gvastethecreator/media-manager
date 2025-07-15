import { Box } from 'lucide-react';
import { memo, useCallback, useMemo } from 'react';
import type { BaseContentProps } from '@/components/views/base';
import { BaseContentView, ContentViewProvider } from '@/components/views/base';
import { useWorldItemImages } from '@/lib/api/world-items';
import { clientLogger } from '@/lib/logger/client-logger';
import { useWorldItemStore } from '@/store/entities/world-item';
import { useSelectionStore } from '@/store/selection.store';
import type { EntityWithStats } from '@/types/common/entity-with-stats';

const viewLogger = clientLogger.withContext('WorldItemContentView');

export const WorldItemContentView = memo(function WorldItemContentView() {
	const selectedId = useWorldItemStore((state) => state.ui.selectedId);
	const selectedWorldItem = useWorldItemStore((state) => state.worldItems.find((item) => item.id === selectedId));
	const { toggleSelection } = useSelectionStore();

	const { data: images = [], isLoading, error, refetch } = useWorldItemImages(selectedId || '');

	const handleItemSelection = useCallback(
		(item: EntityWithStats) => {
			viewLogger.info('🖱️ Item seleccionado:', item.name);
			toggleSelection(item.id, item);
		},
		[toggleSelection]
	);

	const emptyState = useMemo(
		() =>
			!selectedId
				? {
						icon: Box,
						title: 'No hay objeto del mundo seleccionado',
						description: 'Selecciona un objeto del mundo para ver su contenido.',
					}
				: {
						icon: Box,
						title: 'Objeto del mundo sin imágenes',
						description: 'Este objeto del mundo no tiene imágenes asociadas.',
					},
		[selectedId]
	);

	const contentProps: BaseContentProps = useMemo(
		() => ({
			items: images as EntityWithStats[],
			isLoading,
			error: error ? error.message : null,
			toggleItemSelection: handleItemSelection,
			currentContainerId: selectedId ?? null,
			containerName: selectedWorldItem?.name ?? null,
			emptyState,
			onRefresh: () => refetch(),
		}),
		[images, isLoading, error, handleItemSelection, selectedId, selectedWorldItem?.name, emptyState, refetch]
	);

	return (
		<ContentViewProvider {...contentProps}>
			<BaseContentView />
		</ContentViewProvider>
	);
});
