import { ScrollText } from 'lucide-react';
import { useCallback, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { EmptyState } from '@/components/core/data-display/empty-state/empty-state';
import { LoadingScreen } from '@/components/core/feedback/loading/loading-screen';
import { FileBrowser } from '@/components/features/file-browser-new/file-browser';
import { type BrowserItem, toBrowserItem } from '@/components/features/file-browser-new/types/item.types';
import { BaseContentView } from '@/components/views/base/base-content-view';
import { useNote, useNoteImages } from '@/lib/api/notes';
import { clientLogger } from '@/lib/logger/client-logger';
import { useDetailsPanel } from '@/store/details-panel.store';
import { useNoteStore } from '@/store/entities/note';
import type { AnyEntityWithStats } from '@/types/entities';

const viewLogger = clientLogger.withContext('NoteContentView');

export function NoteContentView() {
	const { id } = useParams<{ id: string }>();
	const selectedNote = useNoteStore((state) => state.selectedNote);
	const selectNote = useNoteStore((state) => state.selectNote);
	const { setVisible: setDetailsPanelVisible, setSelectedItems } = useDetailsPanel();

	const { data: routedNote, error: noteError, isLoading: isLoadingNote } = useNote(id ?? '');
	const effectiveNote = id ? (routedNote ?? null) : selectedNote;
	const noteId = id ?? selectedNote?.id ?? null;
	const { data: images = [], isLoading: isLoadingImages, error: imagesError } = useNoteImages(noteId || '');
	const error = noteError ?? imagesError;
	const isLoading = isLoadingNote || isLoadingImages;

	useEffect(() => {
		if (routedNote && routedNote.id !== selectedNote?.id) {
			selectNote(routedNote);
		}
	}, [routedNote, selectNote, selectedNote?.id]);
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
			effectiveNote?.title || effectiveNote?.name
				? `Imágenes de la nota: ${effectiveNote?.title ?? effectiveNote?.name}`
				: 'Selecciona una nota',
		[effectiveNote?.title, effectiveNote?.name]
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
		<BaseContentView description={images.length ? `${images.length} imágenes` : undefined} title={headerTitle}>
			<FileBrowser className="h-full" items={browserItems} onItemClick={handleItemSelect} />
		</BaseContentView>
	);
}
