import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ColorPicker } from '@/components/ui/color-picker';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { serializePromptArtifactParametersForEditor, useCreatePrompt, useUpdatePrompt } from '@/lib/api/prompts';
import { getTaxonomyArtifactOrNull, type TaxonomyArtifactDocument } from '@/lib/api/taxonomy-artifacts';
import { clientLogger } from '@/lib/logger/client-logger';
import { DEFAULT_ENTITY_COLOR } from '@/lib/styles/color-tokens';
import { toastService } from '@/lib/ui/toast';
import type { PromptBase } from '@/types/entities/prompt/base';
import { PromptCategory, PromptModel } from '@/types/entities/prompt/enums';
import { DynamicCreateForm } from '../common/dynamic-create-form';

// Función para formatear los nombres de modelos para mostrar
const _formatModelName = (model: string): string => {
	// Eliminar prefijos y guiones, convertir a Title Case
	return model
		.split('-')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(' ');
};

// Esquema de validación con Zod
const promptSchema = z.object({
	name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
	description: z.string().optional(),
	content: z.string().min(1, 'El contenido es requerido'),
	color: z.string().min(1, 'El color es requerido'),
	emoji: z.string().min(1, 'El emoji es requerido'),
	category: z.nativeEnum(PromptCategory).optional(),
	model: z.nativeEnum(PromptModel).optional(),
	parameters: z.string().optional(),
	purpose: z.string().max(4_096, 'Purpose is too long').optional(),
});

type PromptForm = z.infer<typeof promptSchema>;

interface CreatePromptFormProps {
	isEditing?: boolean;
	onCancel?: () => void;
	onCreated?: (prompt: PromptBase) => void;
	onPreview?: (data: any) => void;
	onUpdated?: (prompt: PromptBase) => void;
	prompt?: PromptBase | null;
}

export function CreatePromptForm({
	prompt,
	isEditing = false,
	onCreated,
	onUpdated,
	onCancel: _onCancel,
	onPreview,
}: CreatePromptFormProps) {
	// React Query mutations
	const createPromptMutation = useCreatePrompt();
	const updatePromptMutation = useUpdatePrompt();

	const [_isSubmitting, setIsSubmitting] = useState(false);
	const [artifact, setArtifact] = useState<TaxonomyArtifactDocument | null>(null);
	const [artifactLoading, setArtifactLoading] = useState(Boolean(prompt && isEditing));
	const [artifactError, setArtifactError] = useState<string | null>(null);
	const [restoreMissingConfirmed, setRestoreMissingConfirmed] = useState(false);

	// Configurar react-hook-form
	const form = useForm<PromptForm>({
		resolver: zodResolver(promptSchema),
		defaultValues: {
			name: '',
			description: '',
			content: '',
			color: DEFAULT_ENTITY_COLOR,
			emoji: '💬',
			category: undefined,
			model: undefined,
			parameters: '[]',
			purpose: '',
		},
	});

	// Actualizar vista previa en tiempo real
	useEffect(() => {
		if (onPreview) {
			const subscription = form.watch((data) => {
				onPreview(data);
			});
			return () => subscription.unsubscribe();
		}
	}, [form, onPreview]);

	// Cargar datos iniciales si estamos editando
	useEffect(() => {
		if (prompt && isEditing) {
			form.reset({
				name: prompt.name,
				description: prompt.description || '',
				content: prompt.content || '',
				color: prompt.color || DEFAULT_ENTITY_COLOR,
				emoji: prompt.emoji || '💬',
				category: prompt.category as PromptCategory | undefined,
				parameters: prompt.parameters || '[]',
				purpose: prompt.purpose || '',
			});
		}
	}, [prompt, isEditing, form]);

	useEffect(() => {
		let cancelled = false;
		if (!(prompt?.id && isEditing)) {
			setArtifactLoading(false);
			return;
		}
		setArtifactLoading(true);
		setArtifactError(null);
		setRestoreMissingConfirmed(false);
		void getTaxonomyArtifactOrNull('prompt', prompt.id)
			.then((document) => {
				if (cancelled) return;
				setArtifact(document);
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
	}, [isEditing, prompt?.id]);

	// Manejar envío del formulario
	const _onSubmit = async (data: PromptForm) => {
		try {
			setIsSubmitting(true);

			if (isEditing && prompt) {
				// Actualizar prompt existente
				const updatedPrompt = await updatePromptMutation.mutateAsync({
					id: prompt.id,
					data: {
						...data,
						...(artifact
							? {
									fileBacking: {
										expectedHash: artifact.contentHash,
										restoreMissing: artifact.syncStatus === 'missing' && restoreMissingConfirmed,
									},
								}
							: {}),
					},
				});
				if (onUpdated) {
					onUpdated(updatedPrompt as PromptBase);
				}
				toastService.success('Prompt updated successfully');
			} else {
				// Crear nuevo prompt
				const newPrompt = await createPromptMutation.mutateAsync(data);
				if (onCreated) {
					onCreated(newPrompt as PromptBase);
				}
				form.reset(); // Limpiar formulario después de crear
				toastService.success('Prompt created successfully');
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			toastService.error(isEditing ? 'Could not update prompt' : 'Could not create prompt', {
				description: errorMessage,
			});
			throw error;
		} finally {
			setIsSubmitting(false);
		}
	};

	const optionalFields = [
		{
			name: 'content',
			label: 'Contenido',
			render: ({ value, onChange }: any) => (
				<textarea
					className="w-full resize-none rounded border border-input bg-background p-2 text-foreground text-xs"
					onChange={(e) => onChange(e.target.value)}
					placeholder="Contenido del prompt..."
					rows={5}
					value={value || ''}
				/>
			),
		},
		{
			name: 'parameters',
			label: 'Parameters (JSON)',
			render: ({ value, onChange }: any) => (
				<textarea
					className="w-full resize-y rounded border border-input bg-background p-2 font-mono text-foreground text-xs"
					onChange={(event) => onChange(event.target.value)}
					placeholder='[{ "key": "subject", "type": "text", "custom": false }]'
					rows={6}
					value={value || '[]'}
				/>
			),
		},
		{
			name: 'purpose',
			label: 'Purpose',
			render: ({ value, onChange }: any) => (
				<textarea
					className="w-full resize-y rounded border border-input bg-background p-2 text-foreground text-xs"
					onChange={(event) => onChange(event.target.value)}
					placeholder="What this prompt solves and when it should be used…"
					rows={3}
					value={value || ''}
				/>
			),
		},
		{
			name: 'emoji',
			label: 'Emoji',
			render: ({ value, onChange }: any) => (
				<EmojiPicker compact onEmojiSelect={onChange} showLabel={false} value={value} />
			),
		},
		{
			name: 'color',
			label: 'Color',
			render: ({ value, onChange }: any) => <ColorPicker onChange={onChange} value={value} />,
		},
		{
			name: 'description',
			label: 'Description',
			render: ({ value, onChange }: any) => (
				<textarea
					className="w-full resize-none rounded border border-input bg-background p-2 text-foreground text-xs"
					onChange={(e) => onChange(e.target.value)}
					placeholder="Prompt description..."
					rows={3}
					value={value || ''}
				/>
			),
		},
		{
			name: 'category',
			label: 'Category',
			render: ({ value, onChange }: any) => (
				<Select onValueChange={onChange} value={value || undefined}>
					<SelectTrigger>
						<SelectValue placeholder="Select category" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="general">General</SelectItem>
						<SelectItem value="creatividad">Creatividad</SelectItem>
						<SelectItem value="analysis">Analysis</SelectItem>
					</SelectContent>
				</Select>
			),
		},
		{
			name: 'model',
			label: 'Modelo',
			render: ({ value, onChange }: any) => (
				<Select onValueChange={onChange} value={value || undefined}>
					<SelectTrigger>
						<SelectValue placeholder="Select model" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="gpt-3.5-turbo">gpt-3.5-turbo</SelectItem>
						<SelectItem value="gpt-4">gpt-4</SelectItem>
					</SelectContent>
				</Select>
			),
		},
		// ...agregar más campos opcionales si es necesario...
	].filter((field) => !(artifact && field.name === 'model'));

	if (artifactLoading) return <p className="text-muted-foreground text-sm">Verifying canonical file…</p>;
	if (artifactError) return <p className="text-destructive text-sm">{artifactError}</p>;

	return (
		<div className="space-y-4">
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
			<DynamicCreateForm
				alwaysVisibleFields={['content', 'parameters', 'purpose']}
				extraValidation={(data) => {
					if (artifact?.syncStatus === 'missing' && !restoreMissingConfirmed) {
						return 'Explicitly confirm restoration of the missing canonical file.';
					}
					if (!data.content || String(data.content).trim().length === 0) {
						return 'El contenido es obligatorio';
					}

					return null;
				}}
				initialData={{
					name: artifact?.metadata.title || prompt?.name || '',
					content: artifact?.body || prompt?.content || '',
					description: artifact?.metadata.summary || prompt?.description || '',
					color: artifact?.metadata.color || prompt?.color || DEFAULT_ENTITY_COLOR,
					emoji: artifact?.metadata.emoji || prompt?.emoji || '💬',
					category: artifact?.metadata.category || prompt?.category,
					...(artifact ? {} : { model: prompt?.model }),
					parameters: artifact
						? serializePromptArtifactParametersForEditor(artifact.metadata.parameters)
						: prompt?.parameters || '[]',
					purpose: artifact?.metadata.purpose || prompt?.purpose || '',
				}}
				onCancel={_onCancel}
				onSubmit={_onSubmit as any}
				optionalFields={optionalFields}
				submitLabel={isEditing ? 'Save changes' : 'Create prompt'}
			/>
		</div>
	);
}
