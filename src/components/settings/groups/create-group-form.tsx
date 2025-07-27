import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ColorPicker } from '@/components/ui/color-picker';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { GroupWithStats } from '@/types/entities/group/base';
import type { CreateGroupInput } from '@/types/entities/group/types';

// Esquema de validación para el formulario
const groupFormSchema = z.object({
	name: z.string().min(1, 'El nombre es requerido').max(50, 'El nombre no puede tener más de 50 caracteres'),
	emoji: z.string().optional(),
	color: z.string().optional(),
	description: z.string().optional(),
	category: z.string().optional(),
	filters: z.string().optional(),
	isFavorite: z.boolean().optional(),
});

type FormData = z.infer<typeof groupFormSchema>;

// Los tipos GroupCreateInput y GroupUpdateInput se importan desde @/types/entities/group

interface CreateGroupFormProps {
	group?: GroupWithStats;
	isEditing?: boolean;
	onSubmit: (data: CreateGroupInput) => Promise<void>;
	onCancel: () => void;
	onPreview?: () => void;
}

export function CreateGroupForm({ group, isEditing = false, onSubmit, onCancel, onPreview }: CreateGroupFormProps) {
	// Inicializar el formulario con el tipo correcto
	const form = useForm<FormData>({
		resolver: zodResolver(groupFormSchema),
		defaultValues: {
			name: group?.name ?? '',
			emoji: group?.emoji ?? '📂',
			color: group?.color ?? '#3b82f6',
			description: group?.description ?? '',
			category: group?.category ?? '',
			filters: group?.filters ?? '',
			isFavorite: group?.isFavorite ?? false,
		},
	});

	const handleSubmit = async (data: FormData) => {
		if (!data.name) {
			throw new Error('El nombre es requerido');
		}

		const submitData: CreateGroupInput = {
			name: data.name,
			emoji: data.emoji,
			color: data.color,
			description: data.description,
			category: data.category,
			filters: data.filters,
			isFavorite: data.isFavorite,
		};

		await onSubmit(submitData);
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Nombre</FormLabel>
							<FormControl>
								<Input placeholder="Nombre del grupo" {...field} />
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
								<EmojiPicker value={field.value} onEmojiSelect={field.onChange} compact showLabel={false} />
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
					name="description"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Descripción</FormLabel>
							<FormControl>
								<Textarea placeholder="Descripción del grupo..." {...field} />
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
							<FormControl>
								<Input placeholder="Categoría del grupo" {...field} />
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
						<Button type="button" variant="secondary" onClick={onPreview}>
							Vista previa
						</Button>
					)}
					<Button type="submit">{isEditing ? 'Guardar cambios' : 'Crear grupo'}</Button>
				</div>
			</form>
		</Form>
	);
}
