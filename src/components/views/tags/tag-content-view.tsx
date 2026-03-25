import { Tag } from 'lucide-react';
import { useCallback, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { EmptyState } from '@/components/core/data-display/empty-state/empty-state';
import { LoadingScreen } from '@/components/core/feedback/loading/loading-screen';
import { FileBrowser } from '@/components/features/file-browser-new/file-browser';
import { type BrowserItem, toBrowserItem } from '@/components/features/file-browser-new/types/item.types';
import { BaseContentView } from '@/components/views/base/base-content-view';
import { useTagImages } from '@/lib/api/tags';
import { useDetailsPanel } from '@/store/details-panel.store';
import { useTagStore } from '@/store/entities/tag';
import { useSelectedTag } from '@/store/entities/tag/selectors';
import type { AnyEntityWithStats } from '@/types/entities';

/**
 * 🏷️ Vista de contenido de etiquetas (refactor a FileBrowser)
 */
export function TagContentView() {
	const { id } = useParams<{ id: string }>();
	const selectedId = useTagStore((state) => state.selectedId);
	const selectTag = useTagStore((state) => state.selectTag);
	const loadTags = useTagStore((state) => state.loadTags);
	const effectiveTagId = id || selectedId;
	const selectedTag = useSelectedTag();
	const routedTag = useTagStore((state) => (effectiveTagId ? state.getTagById(effectiveTagId) : null));
	const effectiveTag = routedTag ?? selectedTag;

	useEffect(() => {
		if (id && id !== selectedId) {
			selectTag(id);
		}
	}, [id, selectTag, selectedId]);

	useEffect(() => {
		if (effectiveTagId && !routedTag) {
			void loadTags();
		}
	}, [effectiveTagId, loadTags, routedTag]);

	const { data: images = [], isLoading, error } = useTagImages(effectiveTagId || '');
	const { setVisible: setDetailsPanelVisible, setSelectedItems } = useDetailsPanel();
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

	const headerTitle = useMemo(
		() => (selectedTag?.name ? `Imágenes con etiqueta: ${selectedTag.name}` : 'Selecciona una etiqueta'),
		[selectedTag?.name]
	);

	if (!effectiveTagId) {
		return (
			<BaseContentView>
				<div className="flex h-full items-center justify-center">
					<EmptyState
						description="Selecciona una etiqueta para ver su contenido"
						icon={Tag}
						title="Sin etiqueta seleccionada"
					/>
				</div>
			</BaseContentView>
		);
	}

	if (error) {
		return (
			<BaseContentView>
				<div className="flex h-full items-center justify-center text-destructive">Error: {error.message}</div>
			</BaseContentView>
		);
	}

	if (isLoading && images.length === 0) {
		return (
			<BaseContentView description={undefined} title={headerTitle}>
				<LoadingScreen />
			</BaseContentView>
		);
	}

	return (
		<BaseContentView
			description={effectiveTag?._count?.images ? `${effectiveTag._count.images} imágenes` : undefined}
			title={effectiveTag?.name ? `Imágenes con etiqueta: ${effectiveTag.name}` : headerTitle}
		>
			<FileBrowser
				className="h-full"
				items={browserItems}
				onItemClick={handleItemSelect}
				// Doble clic: el FileBrowser abre visor por defecto para imágenes
			/>
		</BaseContentView>
	);
}
