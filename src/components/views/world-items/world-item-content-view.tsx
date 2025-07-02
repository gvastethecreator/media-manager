import type { BaseContentProps } from '@/components/views/base';
import { BaseContentView, ContentViewProvider } from '@/components/views/base';
import { useWorldItemImages } from '@/lib/api/world-items';
import { clientLogger } from '@/lib/logger/client-logger';
import { useWorldItemStore } from '@/store/entities/world-item';
import { useSelectionStore } from '@/store/selection.store';
import type { FileItem } from '@/types/files';
import { Box } from 'lucide-react';
import { useCallback } from 'react';

const viewLogger = clientLogger.withContext('WorldItemContentView');

export function WorldItemContentView() {
	const selectedId = useWorldItemStore((state) => state.ui.selectedId);
	const selectedWorldItem = useWorldItemStore((state) => state.worldItems.find((item) => item.id === selectedId));
	const { toggleSelection } = useSelectionStore();

	const { data: images = [], isLoading, error, refetch } = useWorldItemImages(selectedId || '');

	const handleItemSelection = useCallback(
		(item: FileItem) => {
			viewLogger.info('🖱️ Item seleccionado:', item.name);
			toggleSelection(item.id, item);
		},
		[toggleSelection]
	);

	const contentProps: BaseContentProps = {
		items: images as unknown as FileItem[],
		isLoading,
		error: error ? error.message : null,
		toggleItemSelection: handleItemSelection,
		currentContainerId: selectedId ?? null,
		containerName: selectedWorldItem?.name ?? null,
		emptyState: !selectedId
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
		onRefresh: () => refetch(),
	};

	return (
		<ContentViewProvider {...contentProps}>
			<BaseContentView />
		</ContentViewProvider>
	);
}
