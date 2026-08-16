import { FileTextIcon } from 'lucide-react';
import { memo, useMemo } from 'react';
import { NoteCard } from '@/components/cards/note-card/note-card';
import { EmptyState } from '@/components/core/data-display/empty-state/empty-state';
import { LoadingScreen } from '@/components/core/feedback/loading/loading-screen';
import { motion } from '@/components/ui/motion-shim';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotes } from '@/lib/api/notes';
import type { NoteWithStats } from '@/types/entities/note';

const NotesContentView = () => {
	const { data, isLoading, error } = useNotes({
		limit: 48,
		sortBy: 'createdAt',
		sortOrder: 'desc',
	});

	const items: NoteWithStats[] = useMemo(() => {
		const list = data?.data ?? [];
		// Asumiendo que el API ya devuelve datos con el formato correcto
		return list as NoteWithStats[];
	}, [data]);

	if (error) {
		return (
			<div className="flex h-full items-center justify-center">
				<p className="text-destructive">Error: {error.message}</p>
			</div>
		);
	}

	if (isLoading) {
		return <LoadingScreen />;
	}

	return (
		<ScrollArea className="h-full">
			<div className="container mx-auto p-6">
				<h2 className="mb-4 font-bold text-xl">Notas</h2>
				{items.length === 0 ? (
					<EmptyState description="You have not created any notes yet." icon={FileTextIcon} title="Sin notas" />
				) : (
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
						{items.map((note, index) => (
							<motion.div
								animate={{ opacity: 1, y: 0 }}
								initial={{ opacity: 0, y: 10 }}
								key={note.id}
								transition={{ delay: index * 0.02 }}
							>
								<NoteCard noteId={note.id} />
							</motion.div>
						))}
					</div>
				)}
			</div>
		</ScrollArea>
	);
};

export default memo(NotesContentView);
