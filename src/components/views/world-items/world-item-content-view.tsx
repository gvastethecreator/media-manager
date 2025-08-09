import { Box } from 'lucide-react';
import { memo, useCallback, useMemo } from 'react';
import type { BaseContentProps } from '@/components/views/base';
import { BaseContentView, ContentViewProvider } from '@/components/views/base';
import { useWorldItemImages } from '@/lib/api/world-items';
import { clientLogger } from '@/lib/logger/client-logger';
import { useWorldItemStore } from '@/store/entities/world-item';
import { useSelectionStore } from '@/store/selection.store';
import type { EntityWithStats } from '@/types/entities/entity.types';

const viewLogger = clientLogger.withContext('WorldItemContentView');

export const WorldItemContentView = memo(function WorldItemContentView() {
	const selectedId = useWorldItemStore((state) => state.ui.selectedId);
	const selectedWorldItem = useWorldItemStore((state) => state.getWorldItemById(selectedId || ''));
	const { toggleSelection } = useSelectionStore();

	const { data: images = [], isLoading, error, refetch } = useWorldItemImages(selectedId || '');

	const handleItemSelection = useCallback(
		(item: EntityWithStats, _isMultiSelect: boolean) => {
			viewLogger.info('🖱️ Item seleccionado:', item.name);
			toggleSelection(item.id, item);
		},
		[toggleSelection]
	);

	const emptyState = useMemo(
		() =>
			selectedId
				? {
						icon: Box,
						title: 'Objeto del mundo sin imágenes',
						description: 'Este objeto del mundo no tiene imágenes asociadas.',
					}
				: {
						icon: Box,
						title: 'No hay objeto del mundo seleccionado',
						description: 'Selecciona un objeto del mundo para ver su contenido.',
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
			onRefresh: async () => {
				await refetch();
			},
		}),
		[images, isLoading, error, handleItemSelection, selectedId, selectedWorldItem?.name, emptyState, refetch]
	);

	return (
		<ContentViewProvider {...contentProps}>
			<BaseContentView>
				<div className="p-4">
					<p>World item content view</p>
				</div>
			</BaseContentView>
		</ContentViewProvider>
	);
});
