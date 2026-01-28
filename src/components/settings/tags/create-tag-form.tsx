import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
	tag?: TagWithStats | null;
	isEditing?: boolean;
	onCreated?: (tag: TagWithStats) => void;
	onUpdated?: (tag: TagWithStats) => void;
	onCancel?: () => void;
	onPreview?: (data: any) => void;
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
			isFavorite: false,
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
				isFavorite: tag.isFavorite,
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
				isFavorite: data.isFavorite,
			};

			// Crear o actualizar etiqueta
			if (isEditing && tag) {
				const updated = await updateTagMutation.mutateAsync({ id: tag.id, data: tagData });
				onUpdated?.(updated);
				onPreview?.(updated);
				toastService.success('Etiqueta actualizada correctamente');
			} else {
				const created = await createTagMutation.mutateAsync(tagData);
				onCreated?.(created);
				onPreview?.(created);
				form.reset();
				toastService.success('Etiqueta creada correctamente');
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			toastService.error(`Error al ${isEditing ? 'actualizar' : 'crear'} la etiqueta`, {
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
							<FormLabel>Nombre</FormLabel>
							<FormControl>
								<Input placeholder="Nombre de la etiqueta" {...field} />
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
							<FormLabel>Categoría</FormLabel>
							<Select defaultValue={field.value || undefined} onValueChange={field.onChange}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Selecciona una categoría" />
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
							<FormLabel>Descripción</FormLabel>
							<FormControl>
								<Textarea placeholder="Descripción de la etiqueta..." rows={3} {...field} value={field.value ?? ''} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="isFavorite"
					render={({ field }) => (
						<FormItem className="flex flex-row items-start space-x-3 space-y-0">
							<FormControl>
								<Checkbox checked={field.value} onCheckedChange={field.onChange} />
							</FormControl>
							<div className="space-y-1 leading-none">
								<FormLabel>Marcar como favorito</FormLabel>
							</div>
						</FormItem>
					)}
				/>

				<div className="flex justify-end space-x-2">
					<Button onClick={onCancel} type="button" variant="outline">
						Cancelar
					</Button>
					{onPreview && (
						<Button onClick={() => onPreview(form.getValues())} type="button" variant="secondary">
							Vista previa
						</Button>
					)}
					<Button type="submit">{isEditing ? 'Guardar cambios' : 'Crear etiqueta'}</Button>
				</div>
			</form>
		</Form>
	);
}
