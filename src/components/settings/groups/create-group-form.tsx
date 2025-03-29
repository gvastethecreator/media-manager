'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { CategoryPicker } from '@/components/forms/category-picker';
import { Button } from '@/components/ui/button';
import {
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import { ImagePicker } from '@/components/ui/image-picker';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import type { Group } from '@prisma/client';
import { XIcon } from 'lucide-react';

// Esquema de validación para el formulario
const groupFormSchema = z.object({
	name: z.string()
		.min(1, 'El nombre es requerido')
		.max(50, 'El nombre no puede tener más de 50 caracteres'),
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
	group?: Group;
	onSubmit: (data: FormData) => void;
	onCancel: () => void;
}

export function CreateGroupForm({
	group,
	onSubmit,
	onCancel,
}: CreateGroupFormProps) {
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
					<CardTitle className="text-xl font-bold">
						{group ? 'Editar' : 'Nuevo'} Grupo
					</CardTitle>
					<Button
						variant="ghost"
						size="icon"
						onClick={onCancel}
						title="Cerrar"
					>
						<XIcon className="h-4 w-4" />
					</Button>
				</div>
			</CardHeader>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
					<CardContent className="space-y-4 px-6">
						{/* Nombre */}
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Nombre</FormLabel>
									<FormControl>
										<Input {...field} placeholder="Nombre del grupo" />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Emoji y Color */}
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="emoji"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Emoji</FormLabel>
										<FormControl>
											<EmojiPicker
												value={field.value}
												onChange={field.onChange}
											/>
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
											<ColorPicker
												value={field.value}
												onChange={field.onChange}
											/>
										</FormControl>
									</FormItem>
								)}
							/>
						</div>

						{/* Descripción */}
						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Descripción</FormLabel>
									<FormControl>
										<Input
											{...field}
											placeholder="Descripción del grupo"
										/>
									</FormControl>
								</FormItem>
							)}
						/>

						{/* Atajo */}
						<FormField
							control={form.control}
							name="shortcut"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Atajo</FormLabel>
									<FormControl>
										<Input
											{...field}
											placeholder="Atajo de teclado (opcional)"
										/>
									</FormControl>
								</FormItem>
							)}
						/>

						{/* Categoría */}
						<FormField
							control={form.control}
							name="category"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Categoría</FormLabel>
									<FormControl>
										<CategoryPicker
											value={field.value}
											onChange={field.onChange}
										/>
									</FormControl>
								</FormItem>
							)}
						/>

						{/* Ordenar por */}
						<FormField
							control={form.control}
							name="sortBy"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Ordenar por</FormLabel>
									<Select
										value={field.value}
										onValueChange={field.onChange}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Selecciona un campo" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="name">Nombre</SelectItem>
											<SelectItem value="category">Categoría</SelectItem>
											<SelectItem value="createdAt">Fecha de creación</SelectItem>
										</SelectContent>
									</Select>
								</FormItem>
							)}
						/>

						{/* Filtros */}
						<FormField
							control={form.control}
							name="filters"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Filtros</FormLabel>
									<Select
										value={field.value}
										onValueChange={field.onChange}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Selecciona un filtro" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="empty_array">Sin filtros</SelectItem>
											<SelectItem value="favorites">Solo favoritos</SelectItem>
											<SelectItem value="recent">Recientes</SelectItem>
										</SelectContent>
									</Select>
								</FormItem>
							)}
						/>

						{/* Imagen destacada */}
						<FormField
							control={form.control}
							name="featuredImage"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Imagen destacada</FormLabel>
									<FormControl>
										<ImagePicker
											value={field.value}
											onChange={field.onChange}
										/>
									</FormControl>
								</FormItem>
							)}
						/>

						{/* Favorito */}
						<FormField
							control={form.control}
							name="isFavorite"
							render={({ field }) => (
								<FormItem className="flex flex-row items-start space-x-3 space-y-0">
									<FormControl>
										<Checkbox
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
									<div className="space-y-1 leading-none">
										<FormLabel>
											Marcar como favorito
										</FormLabel>
										<FormDescription>
											Este grupo aparecerá en la lista de favoritos
										</FormDescription>
									</div>
								</FormItem>
							)}
						/>
					</CardContent>

					<CardFooter className="px-6">
						<div className="flex justify-end gap-4 w-full">
							<Button
								type="button"
								variant="outline"
								onClick={onCancel}
							>
								Cancelar
							</Button>
							<Button type="submit">
								{group ? 'Guardar' : 'Crear'}
							</Button>
						</div>
					</CardFooter>
				</form>
			</Form>
		</>
	);
}