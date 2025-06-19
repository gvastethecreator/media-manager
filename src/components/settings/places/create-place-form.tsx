'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { createPlace, updatePlace } from '@/app/actions/places/place.actions';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ColorPicker } from '@/components/ui/color-picker';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { PlaceComplete, PlaceCreateInput, PlaceUpdateInput } from '@/types/entities/place/types';

// Opciones para los selects que antes eran enums
const placeTypes = ['CITY', 'TOWN', 'VILLAGE', 'REGION', 'PLANET', 'OTHER'] as const;
const placeCategories = ['URBAN', 'RURAL', 'NATURAL', 'ARTIFICIAL', 'OTHER'] as const;
const climateTypes = ['TEMPERATE', 'TROPICAL', 'ARID', 'POLAR', 'CONTINENTAL'] as const;
const governmentTypes = ['DEMOCRACY', 'MONARCHY', 'DICTATORSHIP', 'ANARCHY', 'OTHER'] as const;

// Esquema de validación Zod
const placeFormSchema = z.object({
	name: z.string().min(1, 'El nombre es obligatorio').max(100),
	description: z.string().max(1000).optional().nullable(),
	emoji: z.string().min(1, 'El emoji es obligatorio'),
	color: z.string().min(1, 'El color es obligatorio'),
	category: z.string().optional().nullable(),
	region: z.string().optional().nullable(),
	type: z.string().optional().nullable(),
	climate: z.string().optional().nullable(),
	population: z.coerce.number().optional().nullable(),
	government: z.string().optional().nullable(),
	lore: z.string().optional().nullable(),
	history: z.string().optional().nullable(),
	isFavorite: z.boolean().default(false),
	featuredImage: z.string().optional().nullable(),
	shortcut: z.string().optional().nullable(),
});

type PlaceFormValues = z.infer<typeof placeFormSchema>;

/**
 * Props para el formulario de creación/edición de lugares
 * @param place Lugar a editar (PlaceComplete), si existe
 * @param onSuccess Callback al crear/editar exitosamente (PlaceComplete)
 * @param onCancel Callback para cancelar
 */
interface CreatePlaceFormProps {
	place?: PlaceComplete;
	onSuccess?: (place: PlaceComplete) => void;
	onCancel?: () => void;
}

export function CreatePlaceForm({ place, onSuccess, onCancel }: CreatePlaceFormProps) {
	const { toast } = useToast();
	const isEditing = !!place;

	const form = useForm<PlaceFormValues>({
		resolver: zodResolver(placeFormSchema),
		defaultValues: {
			name: '',
			description: '',
			emoji: '📍',
			color: '#6b7280',
			category: '',
			region: '',
			type: '',
			climate: '',
			population: 0,
			government: '',
			lore: '',
			history: '',
			isFavorite: false,
			featuredImage: '',
			shortcut: '',
		},
	});

	useEffect(() => {
		if (isEditing && place) {
			form.reset({
				...place,
				population: place.population ?? 0,
			});
		}
	}, [form, isEditing, place]);

	const onSubmit = async (values: PlaceFormValues) => {
		try {
			let result: PlaceComplete;

			if (isEditing && place) {
				const updateData: PlaceUpdateInput = values;
				result = await updatePlace(place.id, updateData);
				toast({ title: 'Lugar actualizado', description: `Se ha actualizado "${result.name}".` });
			} else {
				const createData: PlaceCreateInput = {
					...values,
					population: values.population || null, // Asegurar que sea null si es 0 o undefined
				};
				result = await createPlace(createData);
				toast({ title: 'Lugar creado', description: `Se ha creado "${result.name}".` });
				form.reset();
			}

			onSuccess?.(result);
		} catch (error) {
			toast({
				variant: 'destructive',
				title: 'Error',
				description: error instanceof Error ? error.message : 'No se pudo guardar el lugar.',
			});
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				<div className="space-y-4">
					<div className="grid grid-cols-1 gap-4">
						{/* Nombre */}
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Nombre</FormLabel>
									<FormControl>
										<Input placeholder="Nombre del lugar..." {...field} />
									</FormControl>
									<FormDescription>Nombre único que identifica este lugar</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Descripción */}
						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Descripción</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Descripción breve del lugar"
											className="min-h-24 resize-none"
											{...field}
											value={field.value ?? ''}
										/>
									</FormControl>
									<FormDescription>Una descripción breve que ayude a identificar este lugar</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						{/* Emoji */}
						<FormField
							control={form.control}
							name="emoji"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Emoji</FormLabel>
									<FormControl>
										<EmojiPicker value={field.value} onChange={field.onChange} onEmojiSelect={field.onChange} />
									</FormControl>
									<FormDescription>Un emoji representativo</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Color */}
						<FormField
							control={form.control}
							name="color"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Color</FormLabel>
									<FormControl>
										<ColorPicker value={field.value} onChange={field.onChange} />
									</FormControl>
									<FormDescription>Color representativo</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<Separator />

					<div className="grid grid-cols-2 gap-4">
						{/* Tipo */}
						<FormField
							control={form.control}
							name="type"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Tipo</FormLabel>
									<Select onValueChange={field.onChange} value={field.value ?? ''}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Seleccionar tipo" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{placeTypes.map((type) => (
												<SelectItem key={type} value={type}>
													{type}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormDescription>El tipo específico de lugar</FormDescription>
									<FormMessage />
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
									<Select onValueChange={field.onChange} value={field.value ?? ''}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Seleccionar categoría" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{placeCategories.map((category) => (
												<SelectItem key={category} value={category}>
													{category}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormDescription>Categoría general del lugar</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						{/* Región */}
						<FormField
							control={form.control}
							name="region"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Región</FormLabel>
									<FormControl>
										<Input placeholder="Región a la que pertenece" {...field} value={field.value ?? ''} />
									</FormControl>
									<FormDescription>Ubicación geográfica más amplia</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Clima */}
						<FormField
							control={form.control}
							name="climate"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Clima</FormLabel>
									<Select onValueChange={field.onChange} value={field.value ?? ''}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Seleccionar clima" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{climateTypes.map((climate) => (
												<SelectItem key={climate} value={climate}>
													{climate}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormDescription>El clima predominante en el lugar</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						{/* Población */}
						<FormField
							control={form.control}
							name="population"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Población</FormLabel>
									<FormControl>
										<Input type="number" placeholder="0" {...field} value={field.value ?? ''} />
									</FormControl>
									<FormDescription>Número estimado de habitantes</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Gobierno */}
						<FormField
							control={form.control}
							name="government"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Gobierno</FormLabel>
									<Select onValueChange={field.onChange} value={field.value ?? ''}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Seleccionar gobierno" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{governmentTypes.map((government) => (
												<SelectItem key={government} value={government}>
													{government}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormDescription>Forma de gobierno del lugar</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<Separator />

					{/* Lore */}
					<FormField
						control={form.control}
						name="lore"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Lore</FormLabel>
								<FormControl>
									<Textarea
										placeholder="Historia, mitos y leyendas del lugar..."
										className="min-h-32 resize-none"
										{...field}
										value={field.value ?? ''}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* Historia */}
					<FormField
						control={form.control}
						name="history"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Historia</FormLabel>
								<FormControl>
									<Textarea
										placeholder="Hechos históricos y cronología..."
										className="min-h-32 resize-none"
										{...field}
										value={field.value ?? ''}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* Favorito */}
					<FormField
						control={form.control}
						name="isFavorite"
						render={({ field }) => (
							<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
								<div className="space-y-0.5">
									<FormLabel>Marcar como favorito</FormLabel>
									<FormDescription>
										Los lugares favoritos aparecen destacados en algunas vistas.
									</FormDescription>
								</div>
								<FormControl>
									<Checkbox checked={field.value} onCheckedChange={field.onChange} />
								</FormControl>
							</FormItem>
						)}
					/>
				</div>
				<div className="flex justify-end gap-2">
					{onCancel && (
						<Button type="button" variant="outline" onClick={onCancel}>
							Cancelar
						</Button>
					)}
					<Button type="submit">{isEditing ? 'Guardar cambios' : 'Crear lugar'}</Button>
				</div>
			</form>
		</Form>
	);
}
