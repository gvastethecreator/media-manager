import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreateNote, useUpdateNote } from '@/lib/api/notes';
import { getTaxonomyArtifactOrNull, type TaxonomyArtifactDocument } from '@/lib/api/taxonomy-artifacts';
import { DEFAULT_ENTITY_COLOR } from '@/lib/styles/color-tokens';
import { toastService } from '@/lib/ui/toast';
import { NoteCategory } from '@/types/entities/note/enums';
import type { NoteBase, NoteCreateInput, NoteUpdateInput, NoteWithStats } from '@/types/entities/note/types';

// Esquema de validación con Zod, alineado con los tipos canónicos
const noteSchema = z.object({
	title: z.string().min(1, 'Title is required'),
	summary: z.string().optional(),
	content: z.string().optional(),
	color: z.string().optional(),
	emoji: z.string().optional(),
	category: z.nativeEnum(NoteCategory).optional(),
	tags: z.array(z.string()),
});

// El tipo del formulario se infiere del esquema
type NoteFormData = z.infer<typeof noteSchema>;

interface CreateNoteFormProps {
	isEditing?: boolean;
	note?: NoteBase | null;
	onCancel?: () => void;
	onPreview?: (data: any) => void;
	onSuccess?: (note: NoteWithStats) => void;
	onUpdated?: (note: NoteWithStats) => void;
}

export function CreateNoteForm({ note, isEditing = false, onSuccess, onCancel, onPreview }: CreateNoteFormProps) {
	const createNoteMutation = useCreateNote();
	const updateNoteMutation = useUpdateNote();
	const [artifact, setArtifact] = useState<TaxonomyArtifactDocument | null>(null);
	const [artifactLoading, setArtifactLoading] = useState(Boolean(note && isEditing));
	const [artifactError, setArtifactError] = useState<string | null>(null);
	const [restoreMissingConfirmed, setRestoreMissingConfirmed] = useState(false);
	const noteRef = useRef(note);
	noteRef.current = note;

	const form = useForm<NoteFormData>({
		resolver: zodResolver(noteSchema),
		defaultValues: {
			title: '',
			summary: '',
			content: '',
			color: DEFAULT_ENTITY_COLOR,
			emoji: '📝',
			category: NoteCategory.GENERAL,
			tags: [],
		},
	});

	// Cargar datos iniciales si estamos editando
	useEffect(() => {
		const currentNote = noteRef.current;
		if (currentNote && isEditing) {
			form.reset({
				title: currentNote.title,
				summary: currentNote.summary || '',
				content: currentNote.content || '',
				color: currentNote.color || DEFAULT_ENTITY_COLOR,
				emoji: currentNote.emoji || '📝',
				category: (currentNote.category as NoteCategory | null) ?? NoteCategory.GENERAL,
				tags: Array.isArray(currentNote.tags) ? currentNote.tags : [],
			});
			return;
		}

		form.reset({
			category: NoteCategory.GENERAL,
			color: DEFAULT_ENTITY_COLOR,
			content: '',
			emoji: '📝',
			summary: '',
			tags: [],
			title: '',
		});
	}, [form, isEditing, note?.id]);

	useEffect(() => {
		let cancelled = false;
		const currentNote = noteRef.current;
		const noteId = currentNote?.id;
		if (!(noteId && currentNote && isEditing)) {
			setArtifact(null);
			setArtifactError(null);
			setArtifactLoading(false);
			setRestoreMissingConfirmed(false);
			return;
		}
		setArtifactLoading(true);
		setArtifactError(null);
		setRestoreMissingConfirmed(false);
		void getTaxonomyArtifactOrNull('note', noteId)
			.then((document) => {
				if (cancelled) return;
				setArtifact(document);
				if (document) {
					form.reset({
						category: document.metadata.category as NoteCategory | undefined,
						color: document.metadata.color ?? currentNote.color ?? DEFAULT_ENTITY_COLOR,
						content: document.body,
						emoji: document.metadata.emoji ?? currentNote.emoji ?? '📝',
						summary: document.metadata.summary ?? currentNote.summary ?? '',
						tags: Array.isArray(currentNote.tags) ? currentNote.tags : [],
						title: document.metadata.title,
					});
				}
				setArtifactLoading(false);
			})
			.catch((error) => {
				if (cancelled) return;
				setArtifactLoading(false);
				setArtifactError(error instanceof Error ? error.message : 'The canonical file could not be verified.');
			});
		return () => {
			cancelled = true;
		};
	}, [form, isEditing, note?.id]);

	const onSubmit = async (data: NoteFormData) => {
		try {
			let result: NoteWithStats;
			if (isEditing && note?.id) {
				const updateData: NoteUpdateInput & {
					fileBacking?: { expectedHash: string; restoreMissing?: boolean };
				} = {
					...data,
					...(artifact
						? {
								fileBacking: {
									expectedHash: artifact.contentHash,
									restoreMissing: artifact.syncStatus === 'missing' && restoreMissingConfirmed,
								},
							}
						: {}),
				};
				result = await updateNoteMutation.mutateAsync({ id: note.id, data: updateData });
				toastService.success('Nota actualizada correctamente');
			} else {
				const createData: NoteCreateInput = { ...data };
				result = await createNoteMutation.mutateAsync(createData);
				toastService.success('Nota creada correctamente');
				form.reset(); // Limpiar el formulario después de crear
			}
			onSuccess?.(result);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			toastService.error(isEditing ? 'Could not update note' : 'Could not create note', {
				description: errorMessage,
			});
		}
	};

	if (artifactLoading) return <p className="text-muted-foreground text-sm">Verifying canonical file…</p>;
	if (artifactError) return <p className="text-destructive text-sm">{artifactError}</p>;

	return (
		<Form {...form}>
			<form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
				{artifact?.syncStatus === 'missing' && (
					<div className="space-y-2 rounded-dt-md border border-destructive/40 bg-destructive/10 p-3" role="alert">
						<p className="font-medium text-sm">The canonical file no longer exists.</p>
						<p className="text-muted-foreground text-xs">
							Saving will recreate the file from this draft. Confirm restoration before continuing.
						</p>
						<label className="flex items-center gap-2 text-sm">
							<input
								checked={restoreMissingConfirmed}
								onChange={(event) => setRestoreMissingConfirmed(event.target.checked)}
								type="checkbox"
							/>
							Restore missing canonical file
						</label>
					</div>
				)}
				<FormField
					control={form.control}
					name="title"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Title</FormLabel>
							<FormControl>
								<Input placeholder="Note title" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="emoji"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Emoji</FormLabel>
							<FormControl>
								<EmojiPicker compact onEmojiSelect={field.onChange} showLabel={false} value={field.value} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="color"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Color</FormLabel>
							<FormControl>
								<ColorPicker
									compact
									onChange={field.onChange}
									showLabel={false}
									value={field.value || DEFAULT_ENTITY_COLOR}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="category"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Category</FormLabel>
							<Select defaultValue={field.value} onValueChange={field.onChange}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Select a category" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{Object.values(NoteCategory).map((category) => (
										<SelectItem key={category} value={category}>
											{category}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="summary"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Resumen</FormLabel>
							<FormControl>
								<Textarea placeholder="Un resumen corto..." rows={2} {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="content"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Contenido</FormLabel>
							<FormControl>
								<Textarea placeholder="Write your note here..." rows={4} {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="flex justify-end space-x-2">
					<Button disabled={form.formState.isSubmitting} onClick={onCancel} type="button" variant="outline">
						Cancel
					</Button>
					{onPreview && (
						<Button onClick={onPreview} type="button" variant="secondary">
							Preview
						</Button>
					)}
					<Button
						disabled={form.formState.isSubmitting || (artifact?.syncStatus === 'missing' && !restoreMissingConfirmed)}
						type="submit"
					>
						{form.formState.isSubmitting ? 'Guardando…' : isEditing ? 'Save Changes' : 'Create Note'}
					</Button>
				</div>
			</form>
		</Form>
	);
}
