'use client';

import { getCharacterImages } from '@/app/actions/characters/character.actions';
import type { BaseContentProps } from '@/components/views/base';
import { BaseContentView, ContentViewProvider } from '@/components/views/base';
import { clientEvents } from '@/lib/client/events.client';
import { serverLogger } from '@/lib/logger/server-logger';
import { useFileManager } from '@/store/files/file-manager.store';
import type { FileItem } from '@/types/file-item';
import { Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const viewLogger = serverLogger.withContext('CharacterContentView');

export function CharacterContentView() {
	const { currentCharacterId } = useFileManager();
	const [items, setItems] = useState<FileItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Usar el hook de eventos optimistas del cliente
	const [optimisticItems, _addEvent] = clientEvents.useEvents<FileItem[]>(items);

	const loadCharacterImages = useCallback(async () => {
		if (!currentCharacterId) {
			return;
		}

		try {
			setIsLoading(true);
			viewLogger.info('🔄 Cargando imágenes del personaje...');
			const data = await getCharacterImages(currentCharacterId);
			setItems(data as unknown as FileItem[]);
			viewLogger.info('✅ Imágenes cargadas');
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
			viewLogger.error('❌ Error cargando imágenes:', errorMessage);
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, [currentCharacterId]);

	useEffect(() => {
		// Cargar imágenes inicialmente
		loadCharacterImages();
	}, [loadCharacterImages]);

	const handleItemSelection = useCallback((item: FileItem) => {
		viewLogger.info('🖱️ Item seleccionado:', item.name);
	}, []);

	const contentProps: BaseContentProps = {
		items: optimisticItems,
		isLoading,
		error,
		toggleItemSelection: handleItemSelection,
		currentContainerId: currentCharacterId ?? null,
		emptyState: !currentCharacterId
			? {
				icon: Users,
				title: 'No hay personaje seleccionado',
				description: 'Selecciona un personaje para ver su contenido.',
			}
			: {
				icon: Users,
				title: 'Personaje sin imágenes',
				description: 'Este personaje no tiene imágenes asociadas.',
			},
	};

	return (
		<ContentViewProvider {...contentProps}>
			<BaseContentView />
		</ContentViewProvider>
	);
}
