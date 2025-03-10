'use client';

import { BaseContentView, ContentViewProvider } from '@/components/views/base';
import type { BaseContentProps } from '@/components/views/base';
import { clientEvents } from '@/lib/client/events.client';
import { useFiles } from '@/lib/contexts';
import { logger } from '@/lib/logger';
import type { FileItem } from '@/types/file-item';
import { ImageIcon } from 'lucide-react';
import { useCallback, useEffect } from 'react';

const _viewLogger = logger.withContext('AllImagesView');

export function AllImagesView() {
	const { currentItems: items, handleSelectItem, isLoading } = useFiles();

	// Usar el hook de eventos optimistas del cliente
	const [optimisticItems, _addEvent] = clientEvents.useEvents<FileItem[]>(items);

	const contentProps: BaseContentProps = {
		items: optimisticItems,
		isLoading,
		toggleItemSelection: handleSelectItem,
		emptyState: {
			icon: ImageIcon,
			title: 'No hay imágenes',
			description:
				'No se encontraron imágenes en el sistema. Agrega imágenes desde el panel de configuración o arrastra y suelta archivos aquí.',
		},
	};

	return (
		<ContentViewProvider {...contentProps}>
			<BaseContentView />
		</ContentViewProvider>
	);
}
