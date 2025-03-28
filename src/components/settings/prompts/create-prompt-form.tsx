'use client';

import { createPrompt, updatePrompt } from '@/app/actions/prompts/prompt.actions';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import toastService from '@/services/toast.service';
import { PromptBase } from '@/types/entities/prompt/base';
import { PromptCategory, PromptModel } from '@/types/entities/prompt/enums';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Función para formatear los nombres de modelos para mostrar
const formatModelName = (model: string): string => {
	// Eliminar prefijos y guiones, convertir a Title Case
	return model.split('-')
		.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(' ');
};

// Esquema de validación con Zod
const promptSchema = z.object({
	name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es demasiado largo'),
	description: z.string().optional(),
	content: z.string().min(1, 'El contenido es requerido'),
	color: z.string().min(1, 'El color es requerido'),
	emoji: z.string().min(1, 'El emoji es requerido'),
	category: z.nativeEnum(PromptCategory).optional(),
	model: z.nativeEnum(PromptModel).optional(),
	parameters: z.string().optional(),
	isFavorite: z.boolean().default(false),
});

type PromptForm = z.infer<typeof promptSchema>;

interface CreatePromptFormProps {
	prompt?: PromptBase | null;
	isEditing?: boolean;
	onCreated?: (prompt: PromptBase) => void;
	onUpdated?: (prompt: PromptBase) => void;
	onCancel?: () => void;
	onPreview?: (data: any) => void;
}

export function CreatePromptForm({
	prompt,
	isEditing = false,
	onCreated,
	onUpdated,
	onCancel,
	onPreview
}: CreatePromptFormProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Configurar react-hook-form
	const form = useForm<PromptForm>({
		resolver: zodResolver(promptSchema),
		defaultValues: {
			name: '',
			description: '',
			content: '',
			color: '#3b82f6',
			emoji: '💬',
			category: undefined,
			model: undefined,
			parameters: '{}',
			isFavorite: false
		}
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
				color: prompt.color || '#3b82f6',
				emoji: prompt.emoji || '💬',
				category: prompt.category as PromptCategory | undefined,
				parameters: prompt.parameters || '{}',
				isFavorite: prompt.isFavorite || false
			});
		}
	}, [prompt, isEditing, form]);

	// Manejar envío del formulario
	const onSubmit = async (data: PromptForm) => {
		try {
			setIsSubmitting(true);

			if (isEditing && prompt) {
				// Actualizar prompt existente
				const updatedPrompt = await updatePrompt(prompt.id, {
					id: prompt.id,
					...data
				});
				if (onUpdated) {
					onUpdated(updatedPrompt);
				}
				toastService.success('Prompt actualizado correctamente');
			} else {
				// Crear nuevo prompt
				const newPrompt = await createPrompt(data);
				if (onCreated) {
					onCreated(newPrompt);
				}
				form.reset(); // Limpiar formulario después de crear
				toastService.success('Prompt creado correctamente');
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			toastService.error(isEditing ? 'Error al actualizar el prompt' : 'Error al crear el prompt', {
				description: errorMessage
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} id="prompt-form" className="space-y-4">
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Nombre</FormLabel>
								<FormControl>
									<Input
										placeholder="Nombre del prompt"
										{...field}
									/>
								</FormControl>
								<FormDescription>
									Un nombre descriptivo para identificar este prompt
								</FormDescription>
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
								<Select
									onValueChange={field.onChange}
									defaultValue={field.value}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Seleccionar categoría" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{Object.values(PromptCategory).map((category) => (
											<SelectItem key={category} value={category}>{category}</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormDescription>
									La categoría ayuda a organizar tus prompts
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<FormField
					control={form.control}
					name="description"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Descripción</FormLabel>
							<FormControl>
								<Textarea
									placeholder="Descripción breve del prompt"
									{...field}
									value={field.value || ''}
									rows={2}
								/>
							</FormControl>
							<FormDescription>
								Una descripción que explique el propósito de este prompt
							</FormDescription>
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
								<Textarea
									placeholder="Contenido del prompt"
									{...field}
									value={field.value || ''}
									rows={8}
									className="font-mono text-sm"
								/>
							</FormControl>
							<FormDescription>
								El texto del prompt que se utilizará para generar contenido
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<Separator />

				<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
					<FormField
						control={form.control}
						name="emoji"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Emoji</FormLabel>
								<FormControl>
									<EmojiPicker
										value={field.value}
										onEmojiSelect={field.onChange}
									/>
								</FormControl>
								<FormDescription>
									Un emoji representativo
								</FormDescription>
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
										value={field.value}
										onChange={field.onChange}
									/>
								</FormControl>
								<FormDescription>
									Color para identificar visualmente
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="model"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Modelo</FormLabel>
								<Select
									onValueChange={field.onChange}
									defaultValue={field.value}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Seleccionar modelo" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{PromptModel && typeof PromptModel === 'object' ?
											Object.values(PromptModel).map((model) => (
												<SelectItem key={model} value={model}>{formatModelName(model)}</SelectItem>
											)) :
											<SelectItem value="gpt-3.5-turbo">gpt-3.5-turbo</SelectItem>
										}
									</SelectContent>
								</Select>
								<FormDescription>
									Modelo de IA recomendado
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<FormField
					control={form.control}
					name="isFavorite"
					render={({ field }) => (
						<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
							<FormControl>
								<Switch
									checked={field.value}
									onCheckedChange={field.onChange}
								/>
							</FormControl>
							<div className="space-y-1 leading-none">
								<FormLabel>Marcar como favorito</FormLabel>
								<FormDescription>
									Los prompts favoritos aparecerán destacados en los listados
								</FormDescription>
							</div>
						</FormItem>
					)}
				/>

				<div className="flex justify-end gap-2">
					{onCancel && (
						<Button
							type="button"
							variant="outline"
							onClick={onCancel}
							disabled={isSubmitting}
						>
							Cancelar
						</Button>
					)}
					<Button
						type="submit"
						disabled={isSubmitting}
					>
						{isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
					</Button>
				</div>
			</form>
		</Form>
	);
}