'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';

import { CategoryPicker } from '@/components/forms/category-picker';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ColorPicker } from '@/components/ui/color-picker';
import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ImagePicker } from '@/components/ui/image-picker';
import { Input } from '@/components/ui/input';
import { createPropertySchema } from '@/lib/validations/property';
import type { Property } from '@prisma/client';

type FormData = z.infer<typeof createPropertySchema>;

interface CreatePropertyFormProps {
	property?: Property;
	onSubmit: (data: FormData) => void;
	onCancel: () => void;
}

export function CreatePropertyForm({ property, onSubmit, onCancel }: CreatePropertyFormProps) {
	const form = useForm<FormData>({
		resolver: zodResolver(createPropertySchema),
		defaultValues: {
			name: property?.name ?? '',
			category: (property?.category as FormData['category']) ?? 'general',
			emoji: property?.emoji ?? '🔧',
			color: property?.color ?? '#64748b',
			description: property?.description ?? '',
			shortcut: property?.shortcut ?? '',
			featuredImage: property?.featuredImage ?? undefined,
			isFavorite: property?.isFavorite ?? false,
		},
	});

	const handleSubmit = form.handleSubmit((data) => {
		onSubmit(data);
	});

	return (
		<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
			<DialogHeader>
				<DialogTitle>
					{property ? 'Editar propiedad' : 'Crear nueva propiedad'}
				</DialogTitle>
			</DialogHeader>

			<Form {...form}>
				<form onSubmit={handleSubmit} className="space-y-6">
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Nombre</FormLabel>
								<FormControl>
									<Input {...field} placeholder="Nombre de la propiedad" />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<div className="grid grid-cols-3 gap-4">
						<FormField
							control={form.control}
							name="emoji"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Emoji</FormLabel>
									<FormControl>
										<EmojiPicker value={field.value} onChange={field.onChange} />
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
										<ColorPicker value={field.value} onChange={field.onChange} />
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
										<CategoryPicker value={field.value} onChange={field.onChange} />
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
									<Input
										{...field}
										placeholder="Describe la propiedad"
										className="min-h-[80px]"
									/>
								</FormControl>
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
									<Input {...field} placeholder="Atajo para esta propiedad" />
								</FormControl>
								<FormDescription>
									Un atajo te permite acceder rápidamente a esta propiedad
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

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
										placeholder="Selecciona una imagen destacada"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="isFavorite"
						render={({ field }) => (
							<FormItem className="flex flex-row items-center justify-between gap-2 rounded-lg border p-3 shadow-sm">
								<div className="space-y-0.5">
									<FormLabel>Favorito</FormLabel>
									<FormDescription>
										Marcar esta propiedad como favorita
									</FormDescription>
								</div>
								<FormControl>
									<Checkbox
										checked={field.value}
										onCheckedChange={field.onChange}
									/>
								</FormControl>
							</FormItem>
						)}
					/>

					<DialogFooter>
						<Button variant="outline" type="button" onClick={onCancel}>
							Cancelar
						</Button>
						<Button type="submit">
							{property ? 'Actualizar' : 'Crear'} propiedad
						</Button>
					</DialogFooter>
				</form>
			</Form>
		</DialogContent>
	);
}