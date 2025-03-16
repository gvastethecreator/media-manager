'use client';

import { getNoteImages } from '@/app/actions/notes/note.actions';
import { BaseContentView, ContentViewProvider } from '@/components/views/base';
import type { BaseContentProps } from '@/components/views/base';
import { serverLogger } from '@/lib/logger/server-logger';
import { useFileManager } from '@/store/file-manager.store';
import type { Note } from '@/types/entities/notes';
import { ScrollText } from 'lucide-react';
import { useCallback, useEffect } from 'react';
import { toast } from 'sonner';

const viewLogger = serverLogger.withContext('NoteContentView');

export function NoteContentView() {
	const {
		currentItems: items,
		toggleItemSelection,
		currentNoteId,
		setCurrentNote,
		isLoading,
		currentNote,
		setItems,
		setIsLoading,
	} = useFileManager();

	const loadNoteImages = useCallback(async () => {
		if (!currentNoteId) {
			setItems([]);
			return;
		}

		try {
			viewLogger.info('🔄 Cargando imágenes de la nota:', currentNoteId);
			setIsLoading(true);
			const images = await getNoteImages(currentNoteId);
			setItems(images);
			viewLogger.info(`✅ ${images.length} imágenes cargadas`);
		} catch (error) {
			viewLogger.error('❌ Error cargando imágenes:', error);
			toast.error('Error al cargar las imágenes de la nota');
			setItems([]);
		} finally {
			setIsLoading(false);
		}
	}, [currentNoteId, setIsLoading, setItems]);

	useEffect(() => {
		loadNoteImages();
	}, [loadNoteImages]);

	const contentProps: BaseContentProps = {
		items,
		isLoading,
		toggleItemSelection,
		currentContainerId: currentNoteId ?? null,
		containerName: currentNote?.title ?? currentNote?.name ?? null,
		setCurrentContainer: setCurrentNote,
		emptyState: {
			icon: ScrollText,
			title: 'Nota vacía',
			description: `No se encontraron imágenes en ${
				currentNote?.title ?? currentNote?.name ?? 'esta nota'
			}. Puedes agregar imágenes arrastrándolas aquí.`,
		},
		onRefresh: loadNoteImages,
	};

	return (
		<ContentViewProvider {...contentProps}>
			<BaseContentView />
		</ContentViewProvider>
	);
}
