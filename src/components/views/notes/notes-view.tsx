import { Edit, Trash2 } from 'lucide-react';
import { memo, useCallback, useEffect, useState } from 'react';
import { CreateNoteForm } from '@/components/settings/forms/create-note-form';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { ViewProps } from '@/components/views/types';
import { useDeleteNote, useNotes } from '@/lib/api/notes';
import { getTaxonomyArtifactOrNull } from '@/lib/api/taxonomy-artifacts';
import { clientLogger } from '@/lib/logger/client-logger';
import type { NoteWithStats } from '@/types/entities/note';

const viewLogger = clientLogger.withContext('NotesView');

export const NotesView = memo(function NotesView({ className }: ViewProps) {
	const { data: notesResponse, isLoading, error } = useNotes();
	const deleteNote = useDeleteNote();
	const { toast } = useToast();

	const [showForm, setShowForm] = useState(false);
	const [editingNote, setEditingNote] = useState<NoteWithStats | null>(null);

	const notes = notesResponse?.data || [];

	useEffect(() => {
		if (notes.length === 0) {
			viewLogger.info('Loading notes from the server...');
		}
	}, [notes.length]);

	const handleEditNote = useCallback((note: NoteWithStats) => {
		setEditingNote(note);
		setShowForm(true);
	}, []);

	const handleDeleteNote = useCallback(
		async (noteId: string) => {
			try {
				const artifact = await getTaxonomyArtifactOrNull('note', noteId);
				let deleteMissingConfirmed = false;
				if (artifact?.syncStatus === 'missing') {
					deleteMissingConfirmed = globalThis.confirm(
						'The canonical file is missing. Also delete the identity and its latest indexed projection?'
					);
					if (!deleteMissingConfirmed) return;
				}
				await deleteNote.mutateAsync({
					contentHash: artifact?.contentHash,
					deleteMissingConfirmed,
					id: noteId,
					syncStatus: artifact?.syncStatus,
				});
			} catch (error) {
				toast({
					description: error instanceof Error ? error.message : 'The note could not be deleted.',
					title: 'Could not delete',
					variant: 'destructive',
				});
			}
		},
		[deleteNote, toast]
	);

	const closeForm = useCallback(() => {
		setEditingNote(null);
		setShowForm(false);
	}, []);

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
				<h2 className="mb-4 font-bold text-xl">Notes</h2>

				<Button
					className="mb-4"
					onClick={() => {
						setShowForm(!showForm);
						setEditingNote(null);
					}}
				>
					{showForm ? 'Cancel' : 'Create Note'}
				</Button>

				{showForm && (
					<div className="mb-6 rounded-lg border p-4 shadow-sm">
						<h3 className="mb-3 font-semibold text-lg">{editingNote ? 'Edit Note' : 'New Note'}</h3>
						<CreateNoteForm
							isEditing={Boolean(editingNote)}
							note={editingNote}
							onCancel={closeForm}
							onSuccess={closeForm}
						/>
					</div>
				)}

				{isLoading ? (
					<p>Loading notes...</p>
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
												<Edit className="mr-1 h-4 w-4" /> Edit
											</Button>
											<AlertDialog>
												<AlertDialogTrigger asChild>
													<Button size="sm" variant="destructive">
														<Trash2 className="mr-1 h-4 w-4" /> Delete
													</Button>
												</AlertDialogTrigger>
												<AlertDialogContent>
													<AlertDialogHeader>
														<AlertDialogTitle>Are you sure?</AlertDialogTitle>
														<AlertDialogDescription>
															This action will permanently delete the note "{note.title}".
														</AlertDialogDescription>
													</AlertDialogHeader>
													<AlertDialogFooter>
														<AlertDialogCancel>Cancel</AlertDialogCancel>
														<AlertDialogAction
															className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
															disabled={deleteNote.isPending}
															onClick={() => handleDeleteNote(note.id)}
														>
															Delete
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
