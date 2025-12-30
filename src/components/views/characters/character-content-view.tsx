import { Users } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { EmptyState } from '@/components/core/data-display/empty-state/empty-state';
import { LoadingScreen } from '@/components/core/feedback';
import { FileBrowser, toBrowserItem, type BrowserItem } from '@/components/features/file-browser-new';
import { BaseContentView } from '@/components/views/base';
import { useCharacterImages } from '@/lib/api/characters';
import { clientLogger } from '@/lib/logger/client-logger';
import { useDetailsPanel } from '@/store/details-panel.store';
import { useCharacterStore } from '@/store/entities/character';
import type { AnyEntityWithStats } from '@/types/entities';

const viewLogger = clientLogger.withContext('CharacterContentView');

export const CharacterContentView = memo(function CharacterContentView() {
	const { id } = useParams<{ id: string }>();
	const { selectedCharacterId, getCharacterById, selectCharacter } = useCharacterStore();
	const { setVisible: setDetailsPanelVisible, setSelectedItems } = useDetailsPanel();

	// Priorizar ID de URL, luego store
	const effectiveId = id || selectedCharacterId;
	const currentCharacter = effectiveId ? getCharacterById(effectiveId) : null;

	// Sincronizar URL con store si es necesario
	useEffect(() => {
		if (id && id !== selectedCharacterId) {
			selectCharacter(id);
		}
	}, [id, selectedCharacterId, selectCharacter]);

	const { data: images = [], isLoading, error } = useCharacterImages(effectiveId || '');
	const browserItems = useMemo(
		() => images.map((img) => toBrowserItem(img as unknown as Record<string, unknown>)),
		[images]
	);

	const handleItemSelect = useCallback(
		(item: BrowserItem) => {
			const entity = item.raw as unknown as AnyEntityWithStats | undefined;
			if (!entity) return;
			setSelectedItems([entity]);
			setDetailsPanelVisible(true);
		},
		[setSelectedItems, setDetailsPanelVisible]
	);

	const headerTitle = useMemo(() => {
		if (!effectiveId) return 'Selecciona un personaje';
		return currentCharacter?.name ? `Imágenes de personaje: ${currentCharacter.name}` : 'Imágenes del personaje';
	}, [effectiveId, currentCharacter?.name]);

	if (!effectiveId) {
		return (
			<BaseContentView>
				<div className="flex h-full items-center justify-center">
					<EmptyState
						description="Selecciona un personaje para ver sus imágenes relacionadas"
						icon={Users}
						title="Sin personaje seleccionado"
					/>
				</div>
			</BaseContentView>
		);
	}

	if (error) {
		return (
			<BaseContentView title={headerTitle}>
				<div className="flex h-full items-center justify-center text-red-500">Error: {error.message}</div>
			</BaseContentView>
		);
	}

	if (isLoading && images.length === 0) {
		return (
			<BaseContentView title={headerTitle}>
				<LoadingScreen />
			</BaseContentView>
		);
	}

	return (
		<BaseContentView description={images.length ? `${images.length} imágenes` : undefined} title={headerTitle}>
			<FileBrowser className="h-full" items={browserItems} onItemClick={handleItemSelect} />
		</BaseContentView>
	);
});
