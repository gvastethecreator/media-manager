import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreateTag, useUpdateTag } from '@/lib/api/tags';
import { DEFAULT_ENTITY_COLOR } from '@/lib/styles/color-tokens';
import { generateTagColor } from '@/lib/utils/string.utils';
import { createTagSchema, type ValidatedCreateTagData } from '@/lib/utils/tag/validators';
import { toastService } from '@/services/toast/toast.service';
import { TagCategory, TagWithStats } from '@/types/entities/tag';

interface CreateTagFormProps {
	isEditing?: boolean;
	onCancel?: () => void;
	onCreated?: (tag: TagWithStats) => void;
	onPreview?: (data: any) => void;
	onUpdated?: (tag: TagWithStats) => void;
	tag?: TagWithStats | null;
}

export function CreateTagForm({
	tag,
	isEditing = false,
	onCreated,
	onUpdated,
	onCancel,
	onPreview,
}: CreateTagFormProps) {
	// React Query hooks
	const createTagMutation = useCreateTag();
	const updateTagMutation = useUpdateTag();

	// Inicializar formulario con valores por defecto
	const form = useForm<ValidatedCreateTagData>({
		resolver: zodResolver(createTagSchema),
		defaultValues: {
			name: '',
			description: '',
			color: generateTagColor(''),
			emoji: '🏷️',
			category: undefined,
		},
	});

	// Cargar datos de la etiqueta si estamos editando
	useEffect(() => {
		if (isEditing && tag) {
			form.reset({
				name: tag.name,
				description: tag.description || '',
				color: tag.color || undefined,
				emoji: tag.emoji || '🏷️',
				category: tag.category as TagCategory | undefined,
			});
		}
	}, [form, isEditing, tag]);

	// Manejar envío del formulario
	const onSubmit: SubmitHandler<ValidatedCreateTagData> = async (data: ValidatedCreateTagData) => {
		try {
			// Crear datos comunes
			const tagData = {
				name: data.name,
				description: data.description,
				color: data.color,
				emoji: data.emoji,
				category: data.category,
			};

			// Crear o actualizar etiqueta
			if (isEditing && tag) {
				const updated = await updateTagMutation.mutateAsync({ id: tag.id, data: tagData });
				onUpdated?.(updated);
				onPreview?.(updated);
				toastService.success('Tag updated');
			} else {
				const created = await createTagMutation.mutateAsync(tagData);
				onCreated?.(created);
				onPreview?.(created);
				form.reset();
				toastService.success('Tag created');
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			toastService.error(`Could not ${isEditing ? 'update' : 'create'} the tag`, {
				description: errorMessage,
			});
		}
	};

	// Actualizar la vista previa cuando cambian los valores del formulario
	useEffect(() => {
		const subscription = form.watch((value) => {
			if (onPreview) {
				onPreview(value);
			}
		});
		return () => subscription.unsubscribe();
	}, [form, onPreview]);

	return (
		<Form {...form}>
			<form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Name</FormLabel>
							<FormControl>
								<Input placeholder="Tag name" {...field} />
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
								<EmojiPicker
									compact
									onEmojiSelect={field.onChange}
									showLabel={false}
									value={field.value || undefined}
								/>
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
							<Select defaultValue={field.value || undefined} onValueChange={field.onChange}>
								<FormControl>
									<SelectTrigger>
									<SelectValue placeholder="Select a category" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{Object.values(TagCategory).map((category) => (
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
					name="description"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Description</FormLabel>
							<FormControl>
								<Textarea placeholder="Tag description..." rows={3} {...field} value={field.value ?? ''} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="flex justify-end space-x-2">
					<Button onClick={onCancel} type="button" variant="outline">
						Cancel
					</Button>
					{onPreview && (
						<Button onClick={() => onPreview(form.getValues())} type="button" variant="secondary">
							Preview
						</Button>
					)}
					<Button type="submit">{isEditing ? 'Save changes' : 'Create tag'}</Button>
				</div>
			</form>
		</Form>
	);
}
