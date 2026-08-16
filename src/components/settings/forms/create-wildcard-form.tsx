import { zodResolver } from '@hookform/resolvers/zod';
import { PlusIcon, Trash2Icon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { type SubmitHandler, useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { CardContent, CardFooter } from '@/components/ui/card';
import { ColorPicker } from '@/components/ui/color-picker';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ImagePicker } from '@/components/ui/image-picker';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { clientLogger } from '@/lib/logger/client-logger';
import { useAuthorizedRoots } from '@/lib/api/authorized-roots';
import { getTaxonomyArtifactOrNull, type TaxonomyArtifactDocument } from '@/lib/api/taxonomy-artifacts';
import type { WildcardCreateMutationInput } from '@/lib/api/wildcards';
import { DEFAULT_ENTITY_COLOR } from '@/lib/styles/color-tokens';
import type { WildcardBase } from '@/types/entities/wildcard/base';
import { CreateWildcardSchema } from '@/types/entities/wildcard/schema';

// Esquema Zod adaptado para el formulario
const formSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	emoji: z.string(),
	color: z.string(),
	description: z.string().nullable().optional(),
	shortcut: z.string().nullable().optional(),
	category: z.string().nullable().optional(),
	parentId: z.string().nullable().optional(),
	featuredImage: z.string().nullable().optional(),
	children: z.array(z.object({ value: z.string() })),
});

type FormData = z.infer<typeof formSchema>;

export function parseWildcardChildrenForEditor(children: string | null | undefined): {
	error: string | null;
	values: Array<{ value: string }>;
} {
	if (!children) return { error: null, values: [] };
	try {
		const parsed: unknown = JSON.parse(children);
		if (!Array.isArray(parsed) || !parsed.every((value) => typeof value === 'string')) throw new Error('invalid');
		return { error: null, values: parsed.map((value) => ({ value })) };
	} catch {
		return {
			error: 'The legacy Wildcard values are damaged. Repair the record before saving.',
			values: [],
		};
	}
}

interface CreateWildcardFormProps {
	onCancel: () => void;
	onSubmit: (data: WildcardCreateMutationInput) => Promise<void> | void;
	parentWildcards?: WildcardBase[];
	wildcard?: WildcardBase;
}

export function CreateWildcardForm({ wildcard, parentWildcards = [], onSubmit, onCancel }: CreateWildcardFormProps) {
	const { data: authorizedRoots = [], isLoading: rootsLoading } = useAuthorizedRoots();
	const initialChildren = useMemo(() => parseWildcardChildrenForEditor(wildcard?.children), [wildcard?.children]);
	const writableRoots = useMemo(
		() =>
			authorizedRoots.filter(
				(root) =>
					root.permissions.includes('read') && root.permissions.includes('write') && root.permissions.includes('index')
			),
		[authorizedRoots]
	);
	const [existingArtifact, setExistingArtifact] = useState<TaxonomyArtifactDocument | null>(null);
	const [artifactChecked, setArtifactChecked] = useState(!wildcard);
	const [artifactRootId, setArtifactRootId] = useState('');
	const [backingError, setBackingError] = useState<string | null>(initialChildren.error);
	const [artifactLookupLoading, setArtifactLookupLoading] = useState(Boolean(wildcard));
	const [artifactLookupFailed, setArtifactLookupFailed] = useState(false);
	const [restoreMissingConfirmed, setRestoreMissingConfirmed] = useState(false);

	useEffect(() => {
		let cancelled = false;
		if (!wildcard?.id) {
			setArtifactLookupLoading(false);
			setArtifactLookupFailed(false);
			return;
		}
		setArtifactLookupLoading(true);
		setArtifactLookupFailed(false);
		setBackingError(null);
		setRestoreMissingConfirmed(false);
		void getTaxonomyArtifactOrNull('wildcard', wildcard.id)
			.then((artifact) => {
				if (cancelled) return;
				setExistingArtifact(artifact);
				if (artifact) {
					setArtifactChecked(true);
					setArtifactRootId(artifact.rootId);
				}
				if (!artifact && initialChildren.error) setBackingError(initialChildren.error);
				setArtifactLookupLoading(false);
			})
			.catch((error) => {
				if (!cancelled) {
					setArtifactLookupLoading(false);
					setArtifactLookupFailed(true);
					setBackingError(error instanceof Error ? error.message : 'No se pudo consultar el backing.');
				}
			});
		return () => {
			cancelled = true;
		};
	}, [initialChildren.error, wildcard?.id]);

	useEffect(() => {
		if (!artifactRootId && writableRoots[0]) setArtifactRootId(writableRoots[0].id);
	}, [artifactRootId, writableRoots]);

	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: wildcard?.name || '',
			emoji: wildcard?.emoji || '🎭',
			color: wildcard?.color || DEFAULT_ENTITY_COLOR,
			description: wildcard?.description || null,
			shortcut: wildcard?.shortcut || null,
			category: wildcard?.category || null,
			children: initialChildren.values,
			featuredImage: wildcard?.featuredImage || null,
			parentId: wildcard?.parentId || null,
		},
	});

	useEffect(() => {
		if (!existingArtifact || !wildcard) return;
		form.reset({
			category: existingArtifact.metadata.category ?? null,
			children: existingArtifact.body.split('\n').map((value) => ({ value })),
			color: existingArtifact.metadata.color ?? wildcard.color ?? DEFAULT_ENTITY_COLOR,
			description: existingArtifact.metadata.summary ?? null,
			emoji: existingArtifact.metadata.emoji ?? wildcard.emoji ?? '🎭',
			featuredImage: wildcard.featuredImage ?? null,
			name: existingArtifact.metadata.title,
			parentId: wildcard.parentId ?? null,
			shortcut: wildcard.shortcut ?? null,
		});
	}, [existingArtifact, form, wildcard]);

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: 'children',
	});

	const handleSubmit: SubmitHandler<FormData> = async (data) => {
		setBackingError(null);
		if (artifactLookupLoading || artifactLookupFailed) {
			setBackingError('The canonical backing was not verified. Close and reopen the editor before saving.');
			return;
		}
		if (!existingArtifact && initialChildren.error) {
			setBackingError(initialChildren.error);
			return;
		}
		const values = data.children.map((child) => child.value.trim()).filter(Boolean);
		if (artifactChecked && !artifactRootId) {
			setBackingError('Select a root with read, write, and index permissions.');
			return;
		}
		if (artifactChecked && values.length === 0) {
			setBackingError('Un Wildcard file-backed necesita al menos un valor.');
			return;
		}
		if (existingArtifact?.syncStatus === 'missing' && !restoreMissingConfirmed) {
			setBackingError('Explicitly confirm restoration of the missing canonical file.');
			return;
		}
		// Convertir los datos del formulario al formato esperado
		const wildcardData = {
			...data,
			children: JSON.stringify(values),
		};

		// Validar con el esquema original antes de enviar
		const result = CreateWildcardSchema.safeParse(wildcardData);

		if (result.success) {
			try {
				await onSubmit({
					...result.data,
					...(artifactChecked
						? {
								fileBacking: {
									body: values.join('\n'),
									expectedHash: existingArtifact?.contentHash,
									restoreMissing: existingArtifact?.syncStatus === 'missing' && restoreMissingConfirmed,
									rootId: artifactRootId,
								},
							}
						: {}),
				});
			} catch (error) {
				setBackingError(error instanceof Error ? error.message : 'The Wildcard could not be saved.');
			}
		} else {
			clientLogger.error('Final validation error:', result.error.flatten());
			setBackingError(result.error.issues[0]?.message ?? 'The Wildcard data is invalid.');
		}
	};

	const eligibleParents = parentWildcards.filter((parent) => parent.id !== wildcard?.id);

	return (
		<>
			<Form {...form}>
				<form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
					<fieldset disabled={artifactLookupLoading || form.formState.isSubmitting}>
						<CardContent className="space-y-4 px-6">
							<div className="space-y-3 rounded-dt-md border bg-muted/30 p-3">
								<div className="flex items-start gap-3">
									<Checkbox
										checked={artifactChecked}
										disabled={artifactLookupLoading || Boolean(existingArtifact)}
										id="wildcardFileBacked"
										onCheckedChange={(checked) => setArtifactChecked(checked === true)}
									/>
									<div className="space-y-1">
										<Label htmlFor="wildcardFileBacked">Canonical File</Label>
										<p className="text-muted-foreground text-xs">
											Recommended: store values in portable Markdown and use SQLite only as a derived index.
										</p>
										{artifactLookupLoading && (
											<p className="text-muted-foreground text-xs">Verifying canonical backing…</p>
										)}
									</div>
								</div>
								{artifactChecked && (
									<div className="space-y-2">
										<Label>Canonical Library</Label>
										<Select
											disabled={Boolean(existingArtifact) || rootsLoading}
											onValueChange={setArtifactRootId}
											value={artifactRootId || undefined}
										>
											<SelectTrigger>
												<SelectValue placeholder={rootsLoading ? 'Loading roots…' : 'Select a root'} />
											</SelectTrigger>
											<SelectContent>
												{writableRoots.map((root) => (
													<SelectItem key={root.id} value={root.id}>
														{root.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								)}
								{existingArtifact?.syncStatus === 'missing' && (
									<div
										className="space-y-2 rounded-dt-md border border-destructive/40 bg-destructive/10 p-3"
										role="alert"
									>
										<p className="font-medium text-sm">The canonical file no longer exists.</p>
										<p className="text-muted-foreground text-xs">
											Saving will recreate the file from these values. Confirm restoration before continuing.
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
								{backingError && <p className="text-destructive text-sm">{backingError}</p>}
							</div>
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Name</FormLabel>
										<FormControl>
											<Input {...field} placeholder="Wildcard name" />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="emoji"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Emoji</FormLabel>
											<FormControl>
												<EmojiPicker compact onChange={field.onChange} showLabel={false} value={field.value} />
											</FormControl>
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
												<ColorPicker onChange={field.onChange} value={field.value} />
											</FormControl>
										</FormItem>
									)}
								/>
							</div>

							<FormField
								control={form.control}
								name="description"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Description</FormLabel>
										<FormControl>
											<Input {...field} placeholder="Wildcard description" value={field.value || ''} />
										</FormControl>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="shortcut"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Atajo</FormLabel>
										<FormControl>
											<Input {...field} placeholder="Atajo de teclado (opcional)" value={field.value || ''} />
										</FormControl>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="category"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Category</FormLabel>
										<FormControl>
											<Select onValueChange={field.onChange} value={field.value || undefined}>
												<SelectTrigger>
													<SelectValue placeholder="Select a category" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="general">General</SelectItem>
													<SelectItem value="personaje">Character</SelectItem>
													<SelectItem value="lugar">Place</SelectItem>
													<SelectItem value="objeto">Object</SelectItem>
													<SelectItem value="concepto">Concept</SelectItem>
												</SelectContent>
											</Select>
										</FormControl>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="parentId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Parent Wildcard</FormLabel>
										<Select
											onValueChange={(value) => field.onChange(value === 'none' ? null : value)}
											value={field.value || 'none'}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="No parent (root Wildcard)" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="none">No parent (root Wildcard)</SelectItem>
												{eligibleParents.map((parent) => (
													<SelectItem key={parent.id} value={parent.id}>
														{parent.emoji} {parent.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormDescription>Select a parent Wildcard to create a hierarchy</FormDescription>
									</FormItem>
								)}
							/>

							<div className="space-y-2">
								<Label>Valores</Label>
								<p className="text-muted-foreground text-sm">Values are predefined options for this Wildcard</p>

								{fields.map((field: any, index: number) => (
									<div className="flex items-center gap-2" key={field.id}>
										<FormField
											control={form.control}
											name={`children.${index}.value`}
											render={({ field }) => (
												<FormItem className="flex-1">
													<FormControl>
														<Input {...field} placeholder={`Valor ${index + 1}`} />
													</FormControl>
												</FormItem>
											)}
										/>
										<Button
											aria-label={`Delete value ${index + 1}`}
											onClick={() => remove(index)}
											size="icon"
											type="button"
											variant="ghost"
										>
											<Trash2Icon className="h-4 w-4" />
										</Button>
									</div>
								))}

								<Button
									className="mt-2"
									onClick={() => append({ value: '' })}
									size="sm"
									type="button"
									variant="outline"
								>
									<PlusIcon className="mr-2 h-4 w-4" />
									Add value
								</Button>
							</div>

							<FormField
								control={form.control}
								name="featuredImage"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Featured image</FormLabel>
										<FormControl>
											<ImagePicker onChange={field.onChange} value={field.value} />
										</FormControl>
									</FormItem>
								)}
							/>
						</CardContent>
					</fieldset>
					<CardFooter className="flex justify-end gap-2 px-6">
						<Button disabled={form.formState.isSubmitting} onClick={onCancel} type="button" variant="outline">
							Cancel
						</Button>
						<Button
							disabled={
								artifactLookupLoading ||
								artifactLookupFailed ||
								form.formState.isSubmitting ||
								(existingArtifact?.syncStatus === 'missing' && !restoreMissingConfirmed)
							}
							type="submit"
						>
							{form.formState.isSubmitting ? 'Guardando…' : wildcard ? 'Save changes' : 'Create Wildcard'}
						</Button>
					</CardFooter>
				</form>
			</Form>
		</>
	);
}
