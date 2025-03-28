'use client';

import { getWorldItemImages } from '@/app/actions/world-items/world-item.actions';
import type { BaseContentProps } from '@/components/views/base';
import { BaseContentView, ContentViewProvider } from '@/components/views/base';
import { clientEvents } from '@/lib/client/events.client';
import { serverLogger } from '@/lib/logger/server-logger';
import { useFileManager } from '@/store/files/file-manager.store';
import type { FileItem } from '@/types/file-item';
import { Box } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const viewLogger = serverLogger.withContext('WorldItemContentView');

export function WorldItemContentView() {
	const { currentWorldItemId } = useFileManager();
	const [items, setItems] = useState<FileItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Usar el hook de eventos optimistas del cliente
	const [optimisticItems, _addEvent] = clientEvents.useEvents<FileItem[]>(items);

	const loadWorldItemImages = useCallback(async () => {
		if (!currentWorldItemId) {
			return;
		}

		try {
			setIsLoading(true);
			viewLogger.info('🔄 Cargando imágenes del objeto del mundo...');
			const data = await getWorldItemImages(currentWorldItemId);
			setItems(data as unknown as FileItem[]);
			viewLogger.info('✅ Imágenes cargadas');
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
			viewLogger.error('❌ Error cargando imágenes:', errorMessage);
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, [currentWorldItemId]);

	useEffect(() => {
		// Cargar imágenes inicialmente
		loadWorldItemImages();
	}, [loadWorldItemImages]);

	const handleItemSelection = useCallback((item: FileItem) => {
		viewLogger.info('🖱️ Item seleccionado:', item.name);
	}, []);

	const contentProps: BaseContentProps = {
		items: optimisticItems,
		isLoading,
		error,
		toggleItemSelection: handleItemSelection,
		currentContainerId: currentWorldItemId ?? null,
		emptyState: !currentWorldItemId
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
	};

	return (
		<ContentViewProvider {...contentProps}>
			<BaseContentView />
		</ContentViewProvider>
	);
}
