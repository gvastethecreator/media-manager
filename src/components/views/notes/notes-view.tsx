import { Edit, Trash2 } from 'lucide-react';
import { memo, useCallback, useEffect, useState } from 'react';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { ViewProps } from '@/components/views/types';
import { useCreateNote, useDeleteNote, useNotes, useUpdateNote } from '@/lib/api/notes';
import { clientLogger } from '@/lib/logger/client-logger';
import type { NoteWithStats } from '@/types/entities/note';

const viewLogger = clientLogger.withContext('NotesView');

export const NotesView = memo(function NotesView({ className }: ViewProps) {
	const { data: notesResponse, isLoading, error } = useNotes();
	const { mutate: createNote } = useCreateNote();
	const { mutate: updateNote } = useUpdateNote();
	const { mutate: deleteNote } = useDeleteNote();

	const [showForm, setShowForm] = useState(false);
	const [editingNote, setEditingNote] = useState<NoteWithStats | null>(null);
	const [noteTitle, setNoteTitle] = useState('');
	const [noteContent, setNoteContent] = useState('');

	const notes = notesResponse?.data || [];

	useEffect(() => {
		if (notes.length === 0) {
			viewLogger.info('Cargando notas desde el servidor...');
		}
	}, [notes.length]);

	const handleEditNote = useCallback((note: NoteWithStats) => {
		setEditingNote(note);
		setNoteTitle(note.title);
		setNoteContent(note.content || '');
		setShowForm(true);
	}, []);

	const handleDeleteNote = useCallback(
		(noteId: string) => {
			deleteNote(noteId);
		},
		[deleteNote]
	);

	const { toast } = useToast();
	const handleSubmitForm = useCallback(() => {
		if (noteTitle.trim() === '') {
			toast({
				title: '❌ Error',
				description: 'El título de la nota no puede estar vacío.',
				variant: 'destructive',
			});
			return;
		}

		if (editingNote) {
			updateNote({ id: editingNote.id, data: { title: noteTitle, content: noteContent } });
		} else {
			createNote({
				title: noteTitle,
				content: noteContent,
				category: null,
				priority: 1,
				status: null,
				featuredImage: null,
				presetId: null,
			});
		}
		setNoteTitle('');
		setNoteContent('');
		setEditingNote(null);
		setShowForm(false);
	}, [noteTitle, noteContent, editingNote, createNote, updateNote, toast]);

	if (error) {
		return (
			<div className="flex h-full items-center justify-center">
				<p className="text-destructive">Error: {error.message}</p>
			</div>
		);
	}

	return (
		<div className={className}>
			<div className="p-4">
				<h2 className="mb-4 font-bold text-xl">Vista de Notas</h2>

				<Button
					className="mb-4"
					onClick={() => {
						setShowForm(!showForm);
						setEditingNote(null);
						setNoteTitle('');
						setNoteContent('');
					}}
				>
					{showForm ? 'Cancelar' : 'Crear Nota'}
				</Button>

				{showForm && (
					<div className="mb-6 rounded-lg border p-4 shadow-sm">
						<h3 className="mb-3 font-semibold text-lg">{editingNote ? 'Editar Nota' : 'Nueva Nota'}</h3>
						<div className="mb-3 grid gap-2">
							<Label htmlFor="noteTitle">Título</Label>
							<Input
								id="noteTitle"
								onChange={(e) => setNoteTitle(e.target.value)}
								placeholder="Título de la nota"
								value={noteTitle}
							/>
						</div>
						<div className="mb-4 grid gap-2">
							<Label htmlFor="noteContent">Contenido</Label>
							<Textarea
								id="noteContent"
								onChange={(e) => setNoteContent(e.target.value)}
								placeholder="Contenido de la nota"
								value={noteContent}
							/>
						</div>
						<Button onClick={handleSubmitForm}>{editingNote ? 'Guardar Cambios' : 'Guardar Nota'}</Button>
					</div>
				)}

				{isLoading ? (
					<p>Cargando notas...</p>
				) : notes && notes.length > 0 ? (
					<ScrollArea className="h-[calc(100vh-200px)]">
						<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
							{notes.map((note: NoteWithStats) => (
								<Card key={note.id}>
									<CardHeader>
										<CardTitle>{note.title}</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-muted-foreground text-sm">{note.content}</p>
										<div className="mt-2 flex gap-2">
											<Button onClick={() => handleEditNote(note)} size="sm" variant="outline">
												<Edit className="mr-1 h-4 w-4" /> Editar
											</Button>
											<AlertDialog>
												<AlertDialogTrigger asChild>
													<Button size="sm" variant="destructive">
														<Trash2 className="mr-1 h-4 w-4" /> Eliminar
													</Button>
												</AlertDialogTrigger>
												<AlertDialogContent>
													<AlertDialogHeader>
														<AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
														<AlertDialogDescription>
															Esta acción eliminará permanentemente la nota "{note.title}".
														</AlertDialogDescription>
													</AlertDialogHeader>
													<AlertDialogFooter>
														<AlertDialogCancel>Cancelar</AlertDialogCancel>
														<AlertDialogAction
															className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
															onClick={() => handleDeleteNote(note.id)}
														>
															Eliminar
														</AlertDialogAction>
													</AlertDialogFooter>
												</AlertDialogContent>
											</AlertDialog>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					</ScrollArea>
				) : (
					<p>No hay notas disponibles.</p>
				)}
			</div>
		</div>
	);
});
