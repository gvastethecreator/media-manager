import { Tag } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { EmptyState } from '@/components/core/data-display/empty-state/empty-state';
import { LoadingScreen } from '@/components/core/feedback';
import { type BrowserItem, FileBrowser, toBrowserItem } from '@/components/features/file-browser-new';
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
	const selectedId = useTagStore((state) => state.selectedId);
	const selectedTag = useSelectedTag();

	const { data: images = [], isLoading, error, refetch } = useTagImages(selectedId || '');
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

	if (!selectedId) {
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
				<div className="flex h-full items-center justify-center text-red-500">Error: {error.message}</div>
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
			description={selectedTag?._count?.images ? `${selectedTag._count.images} imágenes` : undefined}
			title={headerTitle}
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
