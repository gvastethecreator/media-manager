import { Edit, Trash2 } from 'lucide-react';
import { memo, useCallback, useState } from 'react';
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
// ViewContainer removido - obsoleto
import { useCategoryData } from '@/lib/api/navigation';
import { useCreateNote, useDeleteNote, useUpdateNote } from '@/lib/api/notes'; // Importar los hooks de mutación

export const NotesView = memo(function NotesView({ className }: ViewProps) {
	const { data: notes, isLoading } = useCategoryData<any>('notes');
	const { mutate: createNote } = useCreateNote();
	const { mutate: updateNote } = useUpdateNote();
	const { mutate: deleteNote } = useDeleteNote();

	const [showForm, setShowForm] = useState(false);
	const [editingNote, setEditingNote] = useState<any | null>(null);
	const [noteTitle, setNoteTitle] = useState('');
	const [noteContent, setNoteContent] = useState('');

	const handleEditNote = useCallback((note: any) => {
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
			createNote({ title: noteTitle, content: noteContent });
		}
		setNoteTitle('');
		setNoteContent('');
		setEditingNote(null);
		setShowForm(false);
	}, [noteTitle, noteContent, editingNote, createNote, updateNote]);

	return (
		<div className={className}>
			<div className="p-4">
				<h2 className="text-xl font-bold mb-4">Vista de Notas</h2>

				<Button
					onClick={() => {
						setShowForm(!showForm);
						setEditingNote(null);
						setNoteTitle('');
						setNoteContent('');
					}}
					className="mb-4"
				>
					{showForm ? 'Cancelar' : 'Crear Nota'}
				</Button>

				{showForm && (
					<div className="mb-6 p-4 border rounded-lg shadow-sm">
						<h3 className="text-lg font-semibold mb-3">{editingNote ? 'Editar Nota' : 'Nueva Nota'}</h3>
						<div className="grid gap-2 mb-3">
							<Label htmlFor="noteTitle">Título</Label>
							<Input
								id="noteTitle"
								value={noteTitle}
								onChange={(e) => setNoteTitle(e.target.value)}
								placeholder="Título de la nota"
							/>
						</div>
						<div className="grid gap-2 mb-4">
							<Label htmlFor="noteContent">Contenido</Label>
							<Textarea
								id="noteContent"
								value={noteContent}
								onChange={(e) => setNoteContent(e.target.value)}
								placeholder="Contenido de la nota"
							/>
						</div>
						<Button onClick={handleSubmitForm}>{editingNote ? 'Guardar Cambios' : 'Guardar Nota'}</Button>
					</div>
				)}

				{isLoading ? (
					<p>Cargando notas...</p>
				) : notes && notes.length > 0 ? (
					<ScrollArea className="h-[calc(100vh-200px)]">
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{notes.map((note: any) => (
								<Card key={note.id}>
									<CardHeader>
										<CardTitle>{note.title}</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-sm text-muted-foreground">{note.content}</p>
										<div className="flex gap-2 mt-2">
											<Button variant="outline" size="sm" onClick={() => handleEditNote(note)}>
												<Edit className="h-4 w-4 mr-1" /> Editar
											</Button>
											<AlertDialog>
												<AlertDialogTrigger asChild>
													<Button variant="destructive" size="sm">
														<Trash2 className="h-4 w-4 mr-1" /> Eliminar
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
															onClick={() => handleDeleteNote(note.id)}
															className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
