import { ScrollText } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { EmptyState } from '@/components/core/data-display/empty-state/empty-state';
import { LoadingScreen } from '@/components/core/feedback';
import { type BrowserItem, FileBrowser, toBrowserItem } from '@/components/features/file-browser-new';
import { BaseContentView } from '@/components/views/base';
import { useNoteImages } from '@/lib/api/notes';
import { clientLogger } from '@/lib/logger/client-logger';
import { useDetailsPanel } from '@/store/details-panel.store';
import { useNoteStore } from '@/store/entities/note';
import type { AnyEntityWithStats } from '@/types/entities';

const viewLogger = clientLogger.withContext('NoteContentView');

export function NoteContentView() {
	const selectedNote = useNoteStore((state) => state.selectedNote);
	const { setVisible: setDetailsPanelVisible, setSelectedItems } = useDetailsPanel();

	const noteId = selectedNote?.id ?? null;
	const { data: images = [], isLoading, error } = useNoteImages(noteId || '');
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
		() =>
			selectedNote?.title || selectedNote?.name
				? `Imágenes de la nota: ${selectedNote?.title ?? selectedNote?.name}`
				: 'Selecciona una nota',
		[selectedNote?.title, selectedNote?.name]
	);

	if (!noteId) {
		return (
			<BaseContentView>
				<div className="flex h-full items-center justify-center">
					<EmptyState
						description="Selecciona una nota para ver sus imágenes relacionadas"
						icon={ScrollText}
						title="Sin nota seleccionada"
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
}
