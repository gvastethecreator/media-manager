'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { GroupBase } from '@/types/entities/group/types';

// Esquema de validación para el formulario
const groupFormSchema = z.object({
	name: z.string().min(1, 'El nombre es requerido').max(50, 'El nombre no puede tener más de 50 caracteres'),
	emoji: z.string().default('📂'),
	color: z.string().default('#3b82f6'),
	description: z.string().optional(),
	shortcut: z.string().optional(),
	category: z.enum(['general', 'technical', 'artistic', 'management']).default('general'),
	sortBy: z.string().default('name'),
	filters: z.string().default('empty_array'),
	featuredImage: z.string().optional(),
	isFavorite: z.boolean().default(false),
});

type FormData = z.infer<typeof groupFormSchema>;

interface CreateGroupFormProps {
	group?: GroupBase;
	onSubmit: (data: FormData) => void;
	onCancel: () => void;
}

export function CreateGroupForm({ group, onSubmit, onCancel }: CreateGroupFormProps) {
	// Inicializar el formulario con el tipo correcto
	const form = useForm<FormData>({
		resolver: zodResolver(groupFormSchema),
		defaultValues: {
			name: group?.name ?? '',
			emoji: group?.emoji ?? '📂',
			color: group?.color ?? '#3b82f6',
			description: group?.description ?? '',
			shortcut: group?.shortcut ?? '',
			category: (group?.category as FormData['category']) ?? 'general',
			sortBy: group?.sortBy ?? 'name',
			filters: group?.filters ?? 'empty_array',
			featuredImage: group?.featuredImage ?? '',
			isFavorite: group?.isFavorite ?? false,
		},
	});

	return (
		<>
			<CardHeader className="pb-4 px-6">
				<div className="flex items-center justify-between">
					<CardTitle className="text-xl font-bold">{group ? 'Editar' : 'Nuevo'} Grupo</CardTitle>
				</div>
			</CardHeader>

			<CardContent className="space-y-6 px-6">
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="emoji"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Emoji</FormLabel>
										<FormControl>
											<Input {...field} />
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
											<div className="flex gap-2">
												<Input type="color" {...field} />
												<Input {...field} />
											</div>
										</FormControl>
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
										<Textarea placeholder="Descripción del grupo..." className="resize-none" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="category"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Categoría</FormLabel>
										<Select value={field.value} onValueChange={field.onChange}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Seleccionar categoría" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="general">General</SelectItem>
												<SelectItem value="technical">Técnico</SelectItem>
												<SelectItem value="artistic">Artístico</SelectItem>
												<SelectItem value="management">Gestión</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
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
											<Input placeholder="Ctrl+G" {...field} />
										</FormControl>
										<FormDescription>Opcional: teclas de atajo</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<FormField
							control={form.control}
							name="isFavorite"
							render={({ field }) => (
								<FormItem className="flex items-center justify-between rounded-lg border p-4">
									<div className="space-y-0.5">
										<FormLabel>Favorito</FormLabel>
										<FormDescription>Marcar este grupo como favorito</FormDescription>
									</div>
									<FormControl>
										<Switch checked={field.value} onCheckedChange={field.onChange} />
									</FormControl>
								</FormItem>
							)}
						/>

						<div className="flex justify-end gap-4">
							<Button type="button" variant="outline" onClick={onCancel}>
								Cancelar
							</Button>
							<Button type="submit">{group ? 'Actualizar' : 'Crear'} Grupo</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</>
	);
}
