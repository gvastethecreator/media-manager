'use client';

import { getNoteImages } from '@/app/actions/notes/note.actions';
import type { BaseContentProps } from '@/components/views/base';
import { BaseContentView, ContentViewProvider } from '@/components/views/base';
import { clientLogger } from '@/lib/logger/client-logger';
import { useNoteStore } from '@/store/entities/note';
import { ScrollText } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

const viewLogger = clientLogger.withContext('NoteContentView');

export function NoteContentView() {
	const selectedNote = useNoteStore(state => state.selectedNote);
	const [items, setItems] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);

	const loadNoteImages = useCallback(async () => {
		if (!selectedNote) {
			setItems([]);
			return;
		}

		try {
			viewLogger.info('🔄 Cargando imágenes de la nota:', selectedNote.id);
			setIsLoading(true);
			const images = await getNoteImages(selectedNote.id);
			setItems(images);
			viewLogger.info(`✅ ${images.length} imágenes cargadas`);
		} catch (error) {
			viewLogger.error('❌ Error cargando imágenes:', error);
			toast.error('Error al cargar las imágenes de la nota');
			setItems([]);
			setError(error instanceof Error ? error.message : 'Error desconocido');
		} finally {
			setIsLoading(false);
		}
	}, [selectedNote]);

	useEffect(() => {
		loadNoteImages();
	}, [loadNoteImages]);

	const toggleItemSelection = useCallback((item) => {
		// Implementar la lógica de selección de items si es necesaria
		viewLogger.info('🔄 Toggle selección de item:', item?.id);
	}, []);

	const contentProps: BaseContentProps = {
		items,
		isLoading,
		error,
		toggleItemSelection,
		currentContainerId: selectedNote?.id ?? null,
		containerName: selectedNote?.title ?? selectedNote?.name ?? null,
		setCurrentContainer: () => { }, // No es necesario en el nuevo enfoque
		emptyState: {
			icon: ScrollText,
			title: 'Nota vacía',
			description: `No se encontraron imágenes en ${selectedNote?.title ?? selectedNote?.name ?? 'esta nota'
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
