import { Users } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import type { BaseContentProps } from '@/components/views/base';
import { BaseContentView, ContentViewProvider } from '@/components/views/base';
import { useCharacterImages } from '@/lib/api/characters';
import { clientEvents } from '@/lib/client/events.client';
import { clientLogger } from '@/lib/logger/client-logger';
import { useCharacterStore } from '@/store/entities/character';
import type { EntityWithStats } from '@/types/entities/entity.types';

const viewLogger = clientLogger.withContext('CharacterContentView');

export const CharacterContentView = memo(function CharacterContentView() {
	const { selectedCharacterId, getCharacterById } = useCharacterStore();
	const currentCharacter = selectedCharacterId ? getCharacterById(selectedCharacterId) : null;

	const [items, setItems] = useState<EntityWithStats[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [currentCharacterId, setCurrentCharacterId] = useState(selectedCharacterId);

	// React Query hook must be at top level
	const {
		data: characterImages,
		isLoading: isLoadingImages,
		error: characterError,
	} = useCharacterImages(currentCharacterId || '');

	// Usar el hook de eventos optimistas del cliente
	const [optimisticItems, _addEvent] = clientEvents.useEvents<EntityWithStats[]>(items);

	const loadCharacterImages = useCallback(async () => {
		if (!currentCharacterId) return;

		try {
			setError(null);
			setIsLoading(true);
			viewLogger.info('🔄 Cargando imágenes del personaje...');
			if (characterImages) {
				setItems(characterImages as EntityWithStats[]);
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

	const handleItemSelection = useCallback((item: EntityWithStats) => {
		viewLogger.info('🖱️ Item seleccionado:', item.name);
	}, []);

	const emptyState = useMemo(
		() =>
			!selectedCharacterId
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
		[selectedCharacterId, currentCharacter]
	);

	const contentProps: BaseContentProps = useMemo(
		() => ({
			items: optimisticItems,
			isLoading,
			error,
			toggleItemSelection: handleItemSelection,
			currentContainerId: selectedCharacterId ?? null,
			containerName: currentCharacter?.name ?? null,
			emptyState,
		}),
		[optimisticItems, isLoading, error, handleItemSelection, selectedCharacterId, currentCharacter?.name, emptyState]
	);

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
			<BaseContentView>
				<div className="p-4">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
						{items.map((item) => (
							<div
								key={item.id}
								className="p-4 border rounded-lg hover:bg-accent cursor-pointer"
								onClick={() => handleItemSelection(item)}
							>
								<h3 className="font-medium">{item.name}</h3>
								<p className="text-sm text-muted-foreground">{item.entityType}</p>
							</div>
						))}
					</div>
				</div>
			</BaseContentView>
		</ContentViewProvider>
	);
});
