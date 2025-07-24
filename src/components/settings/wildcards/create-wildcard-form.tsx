import { zodResolver } from '@hookform/resolvers/zod';
import { PlusIcon, Trash2Icon, XIcon } from 'lucide-react';
import { useFieldArray, useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ColorPicker } from '@/components/ui/color-picker';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ImagePicker } from '@/components/ui/image-picker';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { WildcardBase } from '@/types/entities/wildcard/base';
import { CreateWildcardSchema } from '@/types/entities/wildcard/schema';

// Esquema Zod adaptado para el formulario
const formSchema = z.object({
	name: z.string().min(1, 'El nombre es obligatorio'),
	emoji: z.string().default('🎭'),
	color: z.string().default('#6366F1'),
	description: z.string().nullable().optional(),
	shortcut: z.string().nullable().optional(),
	category: z.string().nullable().optional(),
	children: z.array(z.object({ value: z.string().min(1, 'El valor no puede estar vacío') })).default([]),
	featuredImage: z.string().nullable().optional(),
	isFavorite: z.boolean().default(false),
	parentId: z.string().nullable().optional(),
	sortBy: z.string().optional(),
	viewMode: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateWildcardFormProps {
	wildcard?: WildcardBase;
	parentWildcards?: WildcardBase[];
	onSubmit: (data: z.infer<typeof CreateWildcardSchema>) => Promise<void> | void;
	onCancel: () => void;
}

// Función para convertir FormValues a CreateWildcardSchema
const convertFormToSchema = (data: FormValues): z.infer<typeof CreateWildcardSchema> => {
	return {
		...data,
		children: JSON.stringify(data.children.map((c) => c.value).filter(Boolean)),
	};
};

export function CreateWildcardForm({ wildcard, parentWildcards = [], onSubmit, onCancel }: CreateWildcardFormProps) {
	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: wildcard?.name || '',
			emoji: wildcard?.emoji || '🎭',
			color: wildcard?.color || '#6366F1',
			description: wildcard?.description || null,
			shortcut: wildcard?.shortcut || null,
			category: wildcard?.category || null,
			children: wildcard?.children ? JSON.parse(wildcard.children).map((c: string) => ({ value: c })) : [],
			parentId: wildcard?.parentId || null,
			featuredImage: wildcard?.featuredImage || null,
			isFavorite: wildcard?.isFavorite || false,
		},
	});

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: 'children',
	});

	const handleSubmit: SubmitHandler<FormValues> = (data) => {
		// Convertir los datos del formulario al formato esperado
		const wildcardData = {
			...data,
			children: JSON.stringify(data.children.map((c) => c.value).filter(Boolean)),
		};

		// Validar con el esquema original antes de enviar
		const result = CreateWildcardSchema.safeParse(wildcardData);

		if (result.success) {
			onSubmit(result.data);
		} else {
			console.error('Error de validación final:', result.error.flatten());
		}
	};

	const eligibleParents = parentWildcards.filter((parent) => parent.id !== wildcard?.id);

	return (
		<>
			<CardHeader className="pb-4 px-6">
				<div className="flex items-center justify-between">
					<CardTitle className="text-xl font-bold">{wildcard ? 'Editar' : 'Nuevo'} Comodín</CardTitle>
					<Button variant="ghost" size="icon" onClick={onCancel} title="Cerrar">
						<XIcon className="h-4 w-4" />
					</Button>
				</div>
			</CardHeader>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
					<CardContent className="space-y-4 px-6">
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

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="emoji"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Emoji</FormLabel>
										<FormControl>
											<EmojiPicker value={field.value} onChange={field.onChange} />
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
											<ColorPicker value={field.value} onChange={field.onChange} />
										</FormControl>
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
										<Input {...field} value={field.value || ''} placeholder="Descripción del comodín" />
									</FormControl>
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
										<Input {...field} value={field.value || ''} placeholder="Atajo de teclado (opcional)" />
									</FormControl>
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
										<Select value={field.value || ''} onValueChange={field.onChange}>
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

						<FormField
							control={form.control}
							name="parentId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Comodín padre</FormLabel>
									<Select
										value={field.value || 'none'}
										onValueChange={(value) => field.onChange(value === 'none' ? null : value)}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Sin padre (comodín raíz)" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="none">Sin padre (comodín raíz)</SelectItem>
											{eligibleParents.map((parent) => (
												<SelectItem key={parent.id} value={parent.id}>
													{parent.emoji} {parent.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormDescription>Selecciona un comodín padre para crear una jerarquía</FormDescription>
								</FormItem>
							)}
						/>

						<div className="space-y-2">
							<FormLabel>Valores</FormLabel>
							<FormDescription>Los valores son opciones predefinidas para este comodín</FormDescription>

							{fields.map((field: any, index: number) => (
								<div key={field.id} className="flex items-center gap-2">
									<FormField
										control={form.control}
										name={`children.${index}.value`}
										render={({ field }) => (
											<FormItem className="flex-1">
												<FormControl>
													<Input {...field} placeholder={`Valor ${index + 1}`} />
												</FormControl>
											</FormItem>
										)}
									/>
									<Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
										<Trash2Icon className="h-4 w-4" />
									</Button>
								</div>
							))}

							<Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => append({ value: '' })}>
								<PlusIcon className="h-4 w-4 mr-2" />
								Añadir valor
							</Button>
						</div>

						<FormField
							control={form.control}
							name="featuredImage"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Imagen destacada</FormLabel>
									<FormControl>
										<ImagePicker value={field.value} onChange={field.onChange} />
									</FormControl>
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="isFavorite"
							render={({ field }) => (
								<FormItem className="flex items-center gap-2">
									<FormControl>
										<Checkbox checked={field.value} onCheckedChange={field.onChange} />
									</FormControl>
									<FormLabel>Marcar como favorito</FormLabel>
								</FormItem>
							)}
						/>
					</CardContent>
					<CardFooter className="flex justify-end gap-2 px-6">
						<Button type="button" variant="outline" onClick={onCancel}>
							Cancelar
						</Button>
						<Button type="submit">{wildcard ? 'Guardar cambios' : 'Crear comodín'}</Button>
					</CardFooter>
				</form>
			</Form>
		</>
	);
}
