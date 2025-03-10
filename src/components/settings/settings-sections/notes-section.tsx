'use client';

import { NoteCard } from '@/components/features/entity-cards/cards/note-card';
import { NoteForm } from '@/components/features/entity-cards/forms/note-form';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/ui/stats-card';
import { useToast } from '@/components/ui/use-toast';
import { calculateStats } from '@/lib/entity.utils';
import { logger } from '@/lib/logger';
import { type NoteFormData, useNoteStore } from '@/store/entities/note.store';
import { Loader2, StickyNote } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import * as React from 'react';

const noteLogger = logger.withContext('NotesSection');

export function NotesSection() {
	const { notes, isLoading, error, loadItems, createNote, updateNote, deleteNote } = useNoteStore();
	const [editingId, setEditingId] = React.useState<string | null>(null);
	const { toast } = useToast();

	React.useEffect(() => {
		loadItems();
	}, [loadItems]);

	const handleCreate = async (data: NoteFormData) => {
		try {
			noteLogger.info('✨ Creando nueva nota:', data);
			await createNote(data);
			toast({
				title: 'Éxito',
				description: 'Nota creada correctamente',
			});
		} catch (error) {
			noteLogger.error('❌ Error al crear nota:', error);
			toast({
				title: 'Error',
				description: 'No se pudo crear la nota',
				variant: 'destructive',
			});
		}
	};

	const handleUpdate = async (data: NoteFormData) => {
		if (!editingId) {
			return;
		}
		try {
			noteLogger.info('💾 Actualizando nota:', data);
			await updateNote(editingId, data);
			setEditingId(null);
			toast({
				title: 'Éxito',
				description: 'Nota actualizada correctamente',
			});
		} catch (error) {
			noteLogger.error('❌ Error al actualizar nota:', error);
			toast({
				title: 'Error',
				description: 'No se pudo actualizar la nota',
				variant: 'destructive',
			});
		}
	};

	const handleDelete = async (id: string) => {
		if (!confirm('¿Estás seguro de eliminar esta nota?')) {
			return;
		}
		try {
			noteLogger.info('🗑️ Eliminando nota:', { id });
			await deleteNote(id);
			toast({
				title: 'Éxito',
				description: 'Nota eliminada correctamente',
			});
		} catch (error) {
			noteLogger.error('❌ Error al eliminar nota:', error);
			toast({
				title: 'Error',
				description: 'No se pudo eliminar la nota',
				variant: 'destructive',
			});
		}
	};

	// Calcular estadísticas
	const stats = React.useMemo(() => calculateStats(notes), [notes]);

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<Card className="rounded-sm bg-muted/30">
					<CardHeader className="p-3">
						<CardTitle className="flex items-center gap-2 text-sm">
							<StickyNote className="h-5 w-5" />
							Crear nueva nota
						</CardTitle>
					</CardHeader>
					<CardContent>
						<NoteForm onSubmit={handleCreate} isLoading={isLoading} />
					</CardContent>
				</Card>

				<StatsCard title="Estadísticas" icon={<StickyNote className="h-5 w-5" />} isLoading={isLoading} stats={stats} />
			</div>

			<Card className="rounded-sm bg-muted/30">
				<CardHeader className="p-3">
					<CardTitle className="flex items-center justify-between text-sm">
						<div className="flex items-center gap-2">
							<StickyNote className="h-5 w-5" />
							Notas
						</div>
						<Button variant="outline" size="sm" onClick={() => loadItems()} disabled={isLoading}>
							{isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Recargar'}
						</Button>
					</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading && notes.length === 0 ? (
						<div className="flex items-center justify-center p-8">
							<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
						</div>
					) : error ? (
						<div className="flex flex-col items-center justify-center gap-2 p-8">
							<p className="text-sm text-muted-foreground text-center">{error}</p>
							<Button variant="outline" size="sm" onClick={() => loadItems()}>
								Reintentar
							</Button>
						</div>
					) : notes.length === 0 ? (
						<div className="flex flex-col items-center justify-center gap-2 p-8">
							<StickyNote className="h-8 w-8 text-muted-foreground" />
							<p className="text-sm text-muted-foreground text-center">No hay notas creadas</p>
							<p className="text-xs text-muted-foreground/75">Crea una nota para empezar</p>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
							<AnimatePresence>
								{notes.map((note) => (
									<motion.div
										key={note.id}
										layout
										initial={{ opacity: 0, scale: 0.9 }}
										animate={{ opacity: 1, scale: 1 }}
										exit={{ opacity: 0, scale: 0.9 }}
										transition={{
											duration: 0.2,
											ease: 'easeInOut',
										}}
									>
										{editingId === note.id ? (
											<Card className="relative">
												<CardContent className="p-4">
													<NoteForm
														initialData={{
															name: note.name,
															description: note.description || undefined,
															content: note.content,
															type: note.type,
															tags: note.tags,
														}}
														onSubmit={handleUpdate}
														onCancel={() => setEditingId(null)}
														isLoading={isLoading}
													/>
												</CardContent>
											</Card>
										) : (
											<NoteCard note={note} onEdit={() => setEditingId(note.id)} onDelete={handleDelete} />
										)}
									</motion.div>
								))}
							</AnimatePresence>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
