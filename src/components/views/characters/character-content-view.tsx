import { Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { BaseContentProps } from '@/components/views/base';
import { BaseContentView, ContentViewProvider } from '@/components/views/base';
import { useCharacterImages } from '@/lib/api/characters';
import { clientEvents } from '@/lib/client/events.client';
import { clientLogger } from '@/lib/logger/client-logger';
import { useCharacterStore } from '@/store/entities/character';
import type { FileItem } from '@/types/files';

const viewLogger = clientLogger.withContext('CharacterContentView');

export function CharacterContentView() {
	const { selectedCharacterId, getSelectedCharacter } = useCharacterStore();
	const currentCharacter = getSelectedCharacter();

	const [items, setItems] = useState<FileItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [currentCharacterId, setCurrentCharacterId] = useState(selectedCharacterId);

	// React Query hook must be at top level
	const {
		data: characterImages,
		isLoading: isLoadingImages,
		error: characterError,
	} = useCharacterImages(currentCharacterId);

	// Usar el hook de eventos optimistas del cliente
	const [optimisticItems, _addEvent] = clientEvents.useEvents<FileItem[]>(items);

	const loadCharacterImages = useCallback(async () => {
		if (!currentCharacterId) return;

		try {
			setError(null);
			setIsLoading(true);
			viewLogger.info('🔄 Cargando imágenes del personaje...');
			if (characterImages) {
				setItems(characterImages as unknown as FileItem[]);
			}
			viewLogger.info('✅ Imágenes cargadas');
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
			setError(errorMessage);
			viewLogger.error('❌ Error cargando imágenes del personaje:', errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, [currentCharacterId, characterImages]);

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

	if (isLoading || isLoadingImages) {
		return <div className="flex items-center justify-center p-8">Cargando imágenes...</div>;
	}

	if (error || characterError) {
		return (
			<div className="flex items-center justify-center p-8 text-red-500">Error: {error || characterError?.message}</div>
		);
	}

	if (!items || items.length === 0) {
		return <div className="flex items-center justify-center p-8">No se encontraron imágenes</div>;
	}

	return (
		<ContentViewProvider {...contentProps}>
			<BaseContentView />
		</ContentViewProvider>
	);
}
