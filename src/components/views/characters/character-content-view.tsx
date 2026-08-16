import { Users } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { EmptyState } from '@/components/core/data-display/empty-state/empty-state';
import { LoadingScreen } from '@/components/core/feedback/loading/loading-screen';
import { FileBrowser } from '@/components/features/file-browser-new/file-browser';
import { type BrowserItem, toBrowserItem } from '@/components/features/file-browser-new/types/item.types';
import { BaseContentView } from '@/components/views/base/base-content-view';
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
		return currentCharacter?.name ? `Character images: ${currentCharacter.name}` : 'Character Images';
	}, [effectiveId, currentCharacter?.name]);

	if (!effectiveId) {
		return (
			<BaseContentView>
				<div className="flex h-full items-center justify-center">
					<EmptyState
						description="Select a character to view related images"
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
				<div className="flex h-full items-center justify-center text-destructive">Error: {error.message}</div>
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
		<BaseContentView description={images.length ? `${images.length} images` : undefined} title={headerTitle}>
			<FileBrowser className="h-full" items={browserItems} onItemClick={handleItemSelect} />
		</BaseContentView>
	);
});
