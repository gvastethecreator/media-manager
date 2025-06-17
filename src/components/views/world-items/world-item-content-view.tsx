'use client';

import { Box } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { getWorldItemImages } from '@/app/actions/world-items/world-item.actions';
import type { BaseContentProps } from '@/components/views/base';
import { BaseContentView, ContentViewProvider } from '@/components/views/base';
import { clientEvents } from '@/lib/client/events.client';
import { clientLogger } from '@/lib/logger/client-logger';
import { useWorldItemStore } from '@/store/entities/world-item';
import { useSelectionStore } from '@/store/selection.store';
import type { FileItem } from '@/types/file-item';

const viewLogger = clientLogger.withContext('WorldItemContentView');

export function WorldItemContentView() {
	const selectedId = useWorldItemStore((state) => state.ui.selectedId);
	const selectedWorldItem = useWorldItemStore((state) => state.worldItems.find((item) => item.id === selectedId));
	const { toggleSelection } = useSelectionStore();

	const [items, setItems] = useState<FileItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Usar el hook de eventos optimistas del cliente
	const [optimisticItems, _addEvent] = clientEvents.useEvents<FileItem[]>(items);

	const loadWorldItemImages = useCallback(async () => {
		if (!selectedId) {
			return;
		}

		try {
			setIsLoading(true);
			viewLogger.info('🔄 Cargando imágenes del objeto del mundo...');
			const data = await getWorldItemImages(selectedId);
			setItems(data as unknown as FileItem[]);
			viewLogger.info('✅ Imágenes cargadas');
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
			viewLogger.error('❌ Error cargando imágenes:', errorMessage);
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, [selectedId]);

	useEffect(() => {
		// Cargar imágenes inicialmente
		loadWorldItemImages();
	}, [loadWorldItemImages]);

	const handleItemSelection = useCallback(
		(item: FileItem) => {
			viewLogger.info('🖱️ Item seleccionado:', item.name);
			toggleSelection(item.id, item);
		},
		[toggleSelection]
	);

	const contentProps: BaseContentProps = {
		items: optimisticItems,
		isLoading,
		error,
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
		onRefresh: loadWorldItemImages,
	};

	return (
		<ContentViewProvider {...contentProps}>
			<BaseContentView />
		</ContentViewProvider>
	);
}
