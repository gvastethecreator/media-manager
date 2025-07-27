import { ScrollText } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { BaseContentProps } from '@/components/views/base';
import { BaseContentView, ContentViewProvider } from '@/components/views/base';
import { useNoteImages } from '@/lib/api/notes';
import { clientLogger } from '@/lib/logger/client-logger';
import { useNoteStore } from '@/store/entities/note';
import type { EntityWithStats } from '@/types/entities/entity.types';

const viewLogger = clientLogger.withContext('NoteContentView');

export function NoteContentView() {
	const selectedNote = useNoteStore((state) => state.selectedNote);
	const [items, setItems] = useState<EntityWithStats[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// React Query hook must be at top level
	const { data: noteImages, isLoading: isLoadingImages, error: noteError } = useNoteImages(selectedNote?.id || '');

	const loadNoteImages = useCallback(async () => {
		if (!selectedNote) {
			setItems([]);
			return;
		}

		try {
			setError(null);
			setIsLoading(true);
			viewLogger.info('🔄 Cargando imágenes de la nota...');
			if (noteImages) {
				setItems(noteImages as EntityWithStats[]);
			}
			viewLogger.info('✅ Imágenes cargadas');
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
			setError(errorMessage);
			viewLogger.error('❌ Error cargando imágenes de la nota:', errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, [selectedNote, noteImages]);

	useEffect(() => {
		loadNoteImages();
	}, [loadNoteImages]);

	const toggleItemSelection = useCallback((item: EntityWithStats): void => {
		// Implementar la lógica de selección de items si es necesaria
		viewLogger.info('🔄 Toggle selección de item:', item?.id);
	}, []);

	if (isLoading || isLoadingImages) {
		return <div className="flex items-center justify-center p-8">Cargando imágenes...</div>;
	}

	if (error || noteError) {
		return (
			<div className="flex items-center justify-center p-8 text-red-500">Error: {error || noteError?.message}</div>
		);
	}

	if (!items || items.length === 0) {
		return <div className="flex items-center justify-center p-8">No se encontraron imágenes</div>;
	}

	const contentProps: BaseContentProps = {
		items,
		isLoading,
		error,
		toggleItemSelection,
		currentContainerId: selectedNote?.id ?? null,
		containerName: selectedNote?.title ?? selectedNote?.name ?? null,
		setCurrentContainer: async (_id: string) => {}, // No es necesario en el nuevo enfoque
		emptyState: {
			icon: ScrollText,
			title: 'Nota vacía',
			description: `No se encontraron imágenes en ${
				selectedNote?.title ?? selectedNote?.name ?? 'esta nota'
			}. Puedes agregar imágenes arrastrándolas aquí.`,
		},
		onRefresh: loadNoteImages,
	};

	return (
		<ContentViewProvider {...contentProps}>
			<BaseContentView>
				{/* Note content will be added here */}
				<div className="p-4">
					<p>Contenido de la nota se mostrará aquí</p>
				</div>
			</BaseContentView>
		</ContentViewProvider>
	);
}
