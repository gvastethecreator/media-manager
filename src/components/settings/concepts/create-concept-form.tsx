'use client';

import { createConcept, updateConcept } from '@/app/actions/concepts/concept.actions';
import { Button } from '@/components/ui/button';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import toastService from '@/services/toast.service';
import { ConceptCategory } from '@/types/entities/concept/enums';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Esquema de validación con Zod
const conceptSchema = z.object({
	name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es demasiado largo'),
	description: z.string().optional(),
	content: z.string().optional(),
	color: z.string().min(1, 'El color es requerido'),
	emoji: z.string().min(1, 'El emoji es requerido'),
	category: z.string().optional(),
	tags: z.string().optional(),
	isFavorite: z.boolean().default(false),
});

type Concept = {
	id: string;
	name: string;
	description?: string | null;
	content?: string;
	emoji: string;
	color: string;
	category: string;
	tags: string;
	isFavorite?: boolean;
	featuredImage?: string | null;
	createdAt: Date;
	updatedAt: Date;
	presetId?: string | null;
};

type ConceptForm = z.infer<typeof conceptSchema>;

interface CreateConceptFormProps {
	concept?: Concept | null;
	isEditing?: boolean;
	onCreated?: (concept: Concept) => void;
	onUpdated?: (concept: Concept) => void;
	onCancel?: () => void;
	onPreview?: (data: any) => void;
}

export function CreateConceptForm({
	concept,
	isEditing = false,
	onCreated,
	onUpdated,
	onCancel,
	onPreview
}: CreateConceptFormProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Configurar react-hook-form
	const form = useForm<ConceptForm>({
		resolver: zodResolver(conceptSchema),
		defaultValues: {
			name: '',
			description: '',
			content: '',
			color: '#3b82f6',
			emoji: '💡',
			category: 'general',
			tags: '[]',
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
		if (concept && isEditing) {
			form.reset({
				name: concept.name,
				description: concept.description || '',
				content: concept.content || '',
				color: concept.color || '#3b82f6',
				emoji: concept.emoji || '💡',
				category: concept.category || 'general',
				tags: concept.tags || '[]',
				isFavorite: concept.isFavorite || false
			});
		}
	}, [concept, isEditing, form]);

	// Manejar envío del formulario
	const onSubmit = async (data: ConceptForm) => {
		try {
			setIsSubmitting(true);

			if (isEditing && concept) {
				// Actualizar concepto existente con el ID
				const updatedConcept = await updateConcept({
					id: concept.id,
					...data
				});
				if (onUpdated) {
					onUpdated(updatedConcept);
				}
				toastService.success('Concepto actualizado correctamente');
			} else {
				// Crear nuevo concepto
				const newConcept = await createConcept(data);
				if (onCreated) {
					onCreated(newConcept);
				}
				form.reset(); // Limpiar formulario después de crear
				toastService.success('Concepto creado correctamente');
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			toastService.error(isEditing ? 'Error al actualizar el concepto' : 'Error al crear el concepto', {
				description: errorMessage
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} id="concept-form" className="space-y-4">
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem className="space-y-2">
								<FormLabel>Nombre</FormLabel>
								<FormControl>
									<Input
										placeholder="Nombre del concepto"
										{...field}
										className={cn(form.formState.errors.name && "border-destructive")}
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
							<FormItem className="space-y-2">
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
										{Object.values(ConceptCategory).map((category) => (
											<SelectItem key={category} value={category}>{category.replace('_', ' ')}</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<FormField
					control={form.control}
					name="description"
					render={({ field }) => (
						<FormItem className="space-y-2">
							<FormLabel>Descripción</FormLabel>
							<FormControl>
								<Textarea
									placeholder="Descripción breve del concepto"
									{...field}
									value={field.value || ''}
									rows={2}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="content"
					render={({ field }) => (
						<FormItem className="space-y-2">
							<FormLabel>Contenido</FormLabel>
							<FormControl>
								<Textarea
									placeholder="Contenido detallado del concepto"
									{...field}
									value={field.value || ''}
									rows={5}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<FormField
						control={form.control}
						name="color"
						render={({ field }) => (
							<FormItem className="space-y-2">
								<FormLabel>Color</FormLabel>
								<div className="flex items-center gap-2">
									<Popover>
										<PopoverTrigger asChild>
											<Button
												type="button"
												variant="outline"
												className="h-10 w-10 p-0"
												style={{ backgroundColor: field.value }}
											>
												<span className="sr-only">Seleccionar color</span>
											</Button>
										</PopoverTrigger>
										<PopoverContent side="right" className="w-auto p-0 border-none">
											<FormControl>
												<HexColorPicker
													color={field.value}
													onChange={field.onChange}
												/>
											</FormControl>
										</PopoverContent>
									</Popover>
									<FormControl>
										<Input
											value={field.value}
											onChange={(e) => field.onChange(e.target.value)}
											className="flex-1"
										/>
									</FormControl>
								</div>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="emoji"
						render={({ field }) => (
							<FormItem className="space-y-2">
								<FormLabel>Emoji</FormLabel>
								<div className="flex items-center gap-2">
									<Popover>
										<PopoverTrigger asChild>
											<Button type="button" variant="outline" className="h-10 w-10 p-0">
												<span className="text-xl">{field.value}</span>
											</Button>
										</PopoverTrigger>
										<PopoverContent side="right" className="w-auto p-0">
											<FormControl>
												<EmojiPicker onEmojiSelect={field.onChange} value={field.value} />
											</FormControl>
										</PopoverContent>
									</Popover>
									<FormControl>
										<Input
											value={field.value}
											onChange={(e) => field.onChange(e.target.value)}
											className="flex-1"
										/>
									</FormControl>
								</div>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<FormField
					control={form.control}
					name="tags"
					render={({ field }) => (
						<FormItem className="space-y-2">
							<FormLabel>Etiquetas (separadas por coma)</FormLabel>
							<FormControl>
								<Input
									placeholder="Ej: teoría, personaje, mundo"
									value={field.value !== '[]' && field.value ? JSON.parse(field.value).join(', ') : ''}
									onChange={(e) => {
										// Convertir texto separado por comas a formato JSON
										const tagsArray = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
										field.onChange(JSON.stringify(tagsArray));
									}}
								/>
							</FormControl>
							<FormMessage />
							<p className="text-xs text-muted-foreground">Las etiquetas te ayudan a organizar y encontrar tus conceptos más fácilmente.</p>
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="isFavorite"
					render={({ field }) => (
						<FormItem className="flex items-center space-x-2">
							<FormControl>
								<Switch
									checked={field.value}
									onCheckedChange={field.onChange}
									id="isFavorite"
								/>
							</FormControl>
							<FormLabel htmlFor="isFavorite">Marcar como favorito</FormLabel>
						</FormItem>
					)}
				/>
			</form>
		</Form>
	);
}