import { FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { NoteCard } from '@/components/cards/note-card';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotes } from '@/lib/api/notes';
import { clientEvents } from '@/lib/client/events.client';
import { clientLogger } from '@/lib/logger/client-logger';
import { useNoteStore } from '@/store/entities/note';
import type { ViewProps } from '../types';

const viewLogger = clientLogger.withContext('NotesView');

export function NotesView({ isVisible }: ViewProps) {
	const { searchTerm, sortBy, sortOrder } = useNavigationStore();
	const { selectedNoteId, setSelectedNoteId } = useNoteStore();
	const [localSearch, setLocalSearch] = useState(searchTerm || '');

	// Usar React Query hook en lugar de server action
	const {
		data: notes = [],
		isLoading,
		error,
		refetch,
	} = useNotes({
		search: localSearch,
		sortBy: sortBy as 'name' | 'createdAt' | 'updatedAt',
		sortOrder: sortOrder as 'asc' | 'desc',
	});

	// Sincronizar búsqueda local con store de navegación
	useEffect(() => {
		if (searchTerm !== localSearch) {
			setLocalSearch(searchTerm || '');
		}
	}, [searchTerm, localSearch]);

	const handleNoteSelect = useCallback(
		(noteId: string) => {
			viewLogger.info('📝 Seleccionando note', { noteId });
			setSelectedNoteId(noteId);
			clientEvents.emit('note:selected', { noteId });
		},
		[setSelectedNoteId]
	);

	const handleRetry = useCallback(() => {
		viewLogger.info('🔄 Reintentando cargar notes');
		refetch();
	}, [refetch]);

	if (!isVisible) return null;

	if (isLoading) {
		return <LoadingScreen message="Cargando notas..." />;
	}

	if (error) {
		return (
			<EmptyState
				icon={FileText}
				title="Error al cargar notas"
				description={error instanceof Error ? error.message : 'Ha ocurrido un error inesperado'}
				action={{
					label: 'Reintentar',
					onClick: handleRetry,
				}}
			/>
		);
	}

	if (!notes.length) {
		const emptyMessage = localSearch
			? `No se encontraron notas que coincidan con "${localSearch}"`
			: 'No hay notas disponibles';

		return <EmptyState icon={FileText} title="Sin notas" description={emptyMessage} />;
	}

	return (
		<ScrollArea className="flex-1">
			<div className="p-6">
				<motion.div
					className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3 }}
				>
					{notes.map((note, index) => (
						<motion.div
							key={note.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3, delay: index * 0.05 }}
						>
							<NoteCard
								note={note}
								isSelected={note.id === selectedNoteId}
								onSelect={() => handleNoteSelect(note.id)}
							/>
						</motion.div>
					))}
				</motion.div>
			</div>
		</ScrollArea>
	);
}
