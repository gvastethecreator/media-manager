'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import type * as z from 'zod';

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
import { createWildcardSchema } from '@/lib/validations/wildcard';
import type { Wildcard } from '@prisma/client';
import { PlusIcon, Trash2Icon, XIcon } from 'lucide-react';

// Definir el tipo para el formulario
type FormValues = z.infer<typeof createWildcardSchema>;

interface CreateWildcardFormProps {
	wildcard?: Wildcard;
	parentWildcards?: Wildcard[];
	onSubmit: (data: FormValues) => void;
	onCancel: () => void;
}

export function CreateWildcardForm({
	wildcard,
	parentWildcards = [],
	onSubmit,
	onCancel,
}: CreateWildcardFormProps) {
	// Parsear el array de children almacenado como JSON
	const parseChildren = (childrenJson: string): string[] => {
		if (!childrenJson || childrenJson === 'empty_array') {
			return [];
		}
		try {
			return JSON.parse(childrenJson);
		} catch (e) {
			console.error('Error al parsear children:', e);
			return [];
		}
	};

	// Inicializar el formulario
	const form = useForm<FormValues>({
		resolver: zodResolver(createWildcardSchema),
		defaultValues: {
			name: wildcard?.name || '',
			emoji: wildcard?.emoji || '✨',
			color: wildcard?.color || '#ec4899',
			description: wildcard?.description || '',
			shortcut: wildcard?.shortcut || '',
			category: wildcard?.category || 'general',
			children: wildcard ? parseChildren(wildcard.children) : [],
			parentId: wildcard?.parentId || null,
			featuredImage: wildcard?.featuredImage || '',
			isFavorite: wildcard?.isFavorite || false,
		},
	});

	// Configurar field array para manejar dinámicamente los valores de children
	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "children",
	});

	// Filtrar los posibles padres para evitar ciclos (no permitir seleccionar a sí mismo o a sus hijos)
	const eligibleParents = parentWildcards.filter(parent => parent.id !== wildcard?.id);

	return (
		<>
			<CardHeader className="pb-4 px-6">
				<div className="flex items-center justify-between">
					<CardTitle className="text-xl font-bold">
						{wildcard ? 'Editar' : 'Nuevo'} Comodín
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
										<Input {...field} placeholder="Nombre del comodín" />
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
											placeholder="Descripción del comodín"
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
										<Select
											value={field.value}
											onValueChange={field.onChange}
										>
											<SelectTrigger>
												<SelectValue placeholder="Selecciona una categoría" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="general">General</SelectItem>
												<SelectItem value="personaje">Personaje</SelectItem>
												<SelectItem value="lugar">Lugar</SelectItem>
												<SelectItem value="objeto">Objeto</SelectItem>
												<SelectItem value="concepto">Concepto</SelectItem>
											</SelectContent>
										</Select>
									</FormControl>
								</FormItem>
							)}
						/>

						{/* Comodín padre */}
						<FormField
							control={form.control}
							name="parentId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Comodín padre</FormLabel>
									<Select
										value={field.value || ''}
										onValueChange={(value) => field.onChange(value === '' ? null : value)}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Sin padre (comodín raíz)" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="">Sin padre (comodín raíz)</SelectItem>
											{eligibleParents.map(parent => (
												<SelectItem key={parent.id} value={parent.id}>
													{parent.emoji} {parent.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormDescription>
										Selecciona un comodín padre para crear una jerarquía
									</FormDescription>
								</FormItem>
							)}
						/>

						{/* Valores */}
						<div className="space-y-2">
							<FormLabel>Valores</FormLabel>
							<FormDescription>
								Los valores son opciones predefinidas para este comodín
							</FormDescription>

							{fields.map((field, index) => (
								<div key={field.id} className="flex items-center gap-2">
									<FormField
										control={form.control}
										name={`children.${index}`}
										render={({ field }) => (
											<FormItem className="flex-1">
												<FormControl>
													<Input
														{...field}
														placeholder={`Valor ${index + 1}`}
													/>
												</FormControl>
											</FormItem>
										)}
									/>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onClick={() => remove(index)}
									>
										<Trash2Icon className="h-4 w-4" />
									</Button>
								</div>
							))}

							<Button
								type="button"
								variant="outline"
								size="sm"
								className="mt-2"
								onClick={() => append('')}
							>
								<PlusIcon className="h-4 w-4 mr-2" />
								Añadir valor
							</Button>
						</div>

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
											Este comodín aparecerá en la lista de favoritos
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
								{wildcard ? 'Guardar' : 'Crear'}
							</Button>
						</div>
					</CardFooter>
				</form>
			</Form>
		</>
	);
}