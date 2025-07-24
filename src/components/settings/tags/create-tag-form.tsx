import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { ColorPicker } from '@/components/ui/color-picker';
import { useCreateTag, useUpdateTag } from '@/lib/api/tags';
import { TagComplete, TagCategory } from '@/types/entities/tag';
import { generateTagColor } from '@/lib/utils/string.utils';
import { toastService } from '@/services/toast/toast.service';
import { createTagSchema, ValidatedCreateTagData } from '@/lib/utils/tag/validators';


interface CreateTagFormProps {
	tag?: TagComplete | null;
	isEditing?: boolean;
	onCreated?: (tag: TagComplete) => void;
	onUpdated?: (tag: TagComplete) => void;
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
				isFavorite: tag.isFavorite || false,
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
				onUpdated?.(updated as unknown as TagComplete);
				onPreview?.(updated);
				toastService.success('Etiqueta actualizada correctamente');
			} else {
				const created = await createTagMutation.mutateAsync(tagData);
				onCreated?.(created as unknown as TagComplete);
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
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
								<EmojiPicker value={field.value || undefined} onEmojiSelect={field.onChange} compact showLabel={false} />
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
								<ColorPicker value={field.value || '#3b82f6'} onChange={field.onChange} compact showLabel={false} />
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
							<Select onValueChange={field.onChange} defaultValue={field.value}>
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
								<Textarea placeholder="Descripción de la etiqueta..." rows={3} {...field} />
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
					<Button type="button" variant="outline" onClick={onCancel}>
						Cancelar
					</Button>
					{onPreview && (
						<Button type="button" variant="secondary" onClick={() => onPreview(form.getValues())}>
							Vista previa
						</Button>
					)}
					<Button type="submit">
						{isEditing ? 'Guardar cambios' : 'Crear etiqueta'}
					</Button>
				</div>
			</form>
		</Form>
	);
}
