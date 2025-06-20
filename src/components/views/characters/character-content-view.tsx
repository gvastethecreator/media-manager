'use client';

import { Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { getCharacterImages } from '@/app/actions/characters/character.actions';
import type { BaseContentProps } from '@/components/views/base';
import { BaseContentView, ContentViewProvider } from '@/components/views/base';
import { clientEvents } from '@/lib/client/events.client';
import { clientLogger } from '@/lib/logger/client-logger';
import { useCharacterStore } from '@/store/entities/character';
import type { FileItem } from '@/types/files';

const viewLogger = clientLogger.withContext('CharacterContentView');

export function CharacterContentView() {
	const { selectedCharacterId, characters } = useCharacterStore();
	const currentCharacter = selectedCharacterId ? characters[selectedCharacterId] : null;

	const [items, setItems] = useState<FileItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Usar el hook de eventos optimistas del cliente
	const [optimisticItems, _addEvent] = clientEvents.useEvents<FileItem[]>(items);

	const loadCharacterImages = useCallback(async () => {
		if (!selectedCharacterId) {
			setItems([]);
			setIsLoading(false);
			return;
		}

		try {
			setIsLoading(true);
			viewLogger.info(`🔄 Cargando imágenes del personaje: ${selectedCharacterId}`);
			const data = await getCharacterImages(selectedCharacterId);
			setItems(data as unknown as FileItem[]);
			viewLogger.info(`✅ ${data.length} imágenes cargadas para el personaje`);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
			viewLogger.error('❌ Error cargando imágenes:', errorMessage);
			setError(errorMessage);
			setItems([]);
		} finally {
			setIsLoading(false);
		}
	}, [selectedCharacterId]);

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
		currentContainerId: selectedCharacterId ?? null,
		containerName: currentCharacter?.name ?? null,
		emptyState: !selectedCharacterId
			? {
					icon: Users,
					title: 'No hay personaje seleccionado',
					description: 'Selecciona un personaje para ver su contenido.',
				}
			: {
					icon: Users,
					title: 'Personaje sin imágenes',
					description: currentCharacter
						? `${currentCharacter.name} no tiene imágenes asociadas.`
						: 'Este personaje no tiene imágenes asociadas.',
				},
	};

	return (
		<ContentViewProvider {...contentProps}>
			<BaseContentView />
		</ContentViewProvider>
	);
}
