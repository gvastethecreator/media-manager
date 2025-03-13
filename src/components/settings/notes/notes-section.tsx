'use client';

import { NoteForm } from '@/components/features/entity-cards/forms/note-form';
import { NoteCard } from '@/components/features/entity-cards/layouts/note-card-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/ui/stats-card';
import { logger } from '@/lib/logger/logger';
import { toastService } from '@/lib/services/toast.service';
import { useNoteStore } from '@/store/entities/note.store';
import { Loader2, StickyNote } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import * as React from 'react';

// Definición local del tipo NoteFormData para evitar problemas de incompatibilidad
interface NoteFormData {
	id?: string;
	name: string;
	emoji: string;
	color: string;
	description: string;
	title: string;
	content: string;
	category: string;
	priority: number;
	status: string;
	tags: string[];
	featuredImage?: string | null;
	isFavorite: boolean;
}

const noteLogger = logger.withContext('NotesSection');

export function NotesSection() {
	const { notes, isLoading, error, loadNotes, createNote, updateNote, deleteNote } = useNoteStore();
	const [editingId, setEditingId] = React.useState<string | null>(null);

	React.useEffect(() => {
		loadNotes();
	}, [loadNotes]);

	const handleCreate = async (data: NoteFormData) => {
		try {
			noteLogger.info('✨ Creando nueva nota:', data);
			await createNote({
				title: data.title,
				content: data.content,
				category: data.category,
				priority: data.priority,
				status: data.status,
				tags: Array.isArray(data.tags) ? data.tags.join(',') : '',
				featuredImage: data.featuredImage || null,
			});
			toastService.success('Nota creada correctamente');
		} catch (error) {
			noteLogger.error('❌ Error al crear nota:', error);
			toastService.error('No se pudo crear la nota');
		}
	};

	const handleUpdate = async (data: NoteFormData) => {
		if (!editingId) {
			return;
		}
		try {
			noteLogger.info('💾 Actualizando nota:', data);
			await updateNote(editingId, {
				id: editingId,
				title: data.title,
				content: data.content,
				category: data.category,
				priority: data.priority,
				status: data.status,
				tags: Array.isArray(data.tags) ? data.tags.join(',') : '',
				featuredImage: data.featuredImage || null,
			});
			setEditingId(null);
			toastService.success('Nota actualizada correctamente');
		} catch (error) {
			noteLogger.error('❌ Error al actualizar nota:', error);
			toastService.error('No se pudo actualizar la nota');
		}
	};

	const handleDelete = async (id: string) => {
		if (!confirm('¿Estás seguro de eliminar esta nota?')) {
			return;
		}
		try {
			noteLogger.info('🗑️ Eliminando nota:', { id });
			await deleteNote(id);
			toastService.success('Nota eliminada correctamente');
		} catch (error) {
			noteLogger.error('❌ Error al eliminar nota:', error);
			toastService.error('No se pudo eliminar la nota');
		}
	};

	// Calcular estadísticas
	const stats = React.useMemo(() => {
		if (!notes.length) {
			return {
				totalItems: 0,
				totalImages: 0,
				totalSize: 0,
				distribution: [],
				recentItems: [],
				lastUpdated: undefined,
				// Base stats
				total: 0,
				active: 0,
				favorite: 0,
				archived: 0,
			};
		}

		const totalImages = notes.reduce((acc, note) => {
			// Suma todas las referencias a otras entidades
			const count = note._count
				? note._count.concepts +
					note._count.prompts +
					note._count.characters +
					note._count.places +
					note._count.worldItems
				: 0;
			return acc + count;
		}, 0);

		// Para totalSize, usar solo notas con propiedad calculada
		const totalSize = notes.reduce((acc, note) => {
			// Se asume que totalSize no es una propiedad estándar
			const noteWithSize = note as typeof note & { totalSize?: number };
			return acc + (noteWithSize.totalSize || 0);
		}, 0);

		// Obtener notas recientes
		const recentNotes = [...notes]
			.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
			.slice(0, 5)
			.map((note) => ({
				id: note.id,
				name: note.title,
				emoji: '📝',
				count: 0, // Para mantener la compatibilidad
			}));

		return {
			totalItems: notes.length,
			totalImages,
			totalSize,
			distribution: [],
			recentItems: recentNotes,
			lastUpdated: new Date(),
			// Base stats
			total: notes.length,
			active: notes.length,
			favorite: notes.filter((note) => note.isFavorite).length,
			archived: 0,
		};
	}, [notes]);

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
						<NoteForm
							onSubmit={(data) => {
								void handleCreate(data);
							}}
							isLoading={isLoading}
						/>
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
						<Button variant="outline" size="sm" onClick={() => loadNotes()} disabled={isLoading}>
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
							<Button variant="outline" size="sm" onClick={() => loadNotes()}>
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
															name: note.title, // Usar title como name
															description: '',
															emoji: '📝', // Emoji por defecto
															color: '#3b82f6', // Color por defecto
															title: note.title,
															content: note.content,
															category: note.category || '',
															priority: note.priority,
															status: note.status,
															tags: note.tags ? note.tags.split(',').filter(Boolean) : [],
															featuredImage: note.featuredImage,
															isFavorite: note.isFavorite,
														}}
														onSubmit={(data) => {
															void handleUpdate(data);
														}}
														onCancel={() => setEditingId(null)}
														isLoading={isLoading}
													/>
												</CardContent>
											</Card>
										) : (
											<NoteCard
												note={{
													id: note.id,
													title: note.title,
													content: note.content,
													category: note.category || '',
													priority: note.priority || 0,
													status: note.status || '',
													tags: note.tags || '',
													featuredImage: note.featuredImage || null,
													isFavorite: note.isFavorite || false,
													createdAt: new Date(note.createdAt),
													updatedAt: new Date(note.updatedAt),
												}}
												onEdit={() => setEditingId(note.id)}
												onDelete={handleDelete}
											/>
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
