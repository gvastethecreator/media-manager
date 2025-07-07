// 🛠️ Fix biome: errores de parseo JSX corregidos (junio 2025)
// Se corrigieron cierres incorrectos de <FormField ... /> y paréntesis extra en render props.
// Revisar si hay cambios futuros en la API de shadcn/ui para evitar este tipo de errores.
// 🛠️ Fix biome/TS: Reemplazo de useToast por toast de services/toast.service y ajuste de tipos para PlaceCreateInput/PlaceUpdateInput
// Todos los valores null se transforman a undefined antes de enviar a las acciones. population siempre es number o undefined.

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ColorPicker } from '@/components/ui/color-picker';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useCreatePlace, useUpdatePlace } from '@/lib/api/places';
import { toast } from '@/lib/ui/toast';
import type { PlaceBase, PlaceCreateInput, PlaceUpdateInput, PlaceWithStats } from '@/types/entities/place';

// Opciones para los selects que antes eran enums
const placeTypes = ['CITY', 'TOWN', 'VILLAGE', 'REGION', 'PLANET', 'OTHER'] as const;
const placeCategories = ['URBAN', 'RURAL', 'NATURAL', 'ARTIFICIAL', 'OTHER'] as const;
const climateTypes = ['TEMPERATE', 'TROPICAL', 'ARID', 'POLAR', 'CONTINENTAL'] as const;
const governmentTypes = ['DEMOCRACY', 'MONARCHY', 'DICTATORSHIP', 'ANARCHY', 'OTHER'] as const;

// 📝 Esquema de validación Zod: todos los campos string son obligatorios y nunca undefined
const placeFormSchema = z
	.object({
		name: z.string().min(1, 'El nombre es obligatorio').max(100).default('').catch(''),
		description: z.string().max(1000).default('').catch(''),
		emoji: z.string().min(1, 'El emoji es obligatorio').default('📍').catch('📍'),
		color: z.string().min(1, 'El color es obligatorio').default('#6b7280').catch('#6b7280'),
		category: z.string().default('general').catch('general'),
		region: z.string().default('unknown').catch('unknown'),
		type: z.string().default('unknown').catch('unknown'),
		climate: z.string().default('temperate').catch('temperate'),
		population: z.coerce.number().default(0),
		government: z.string().default('unknown').catch('unknown'),
		lore: z.string().default('').catch(''),
		history: z.string().default('').catch(''),
		isFavorite: z.boolean().default(false),
		featuredImage: z.string().default('').catch(''),
		shortcut: z.string().default('').catch(''),
	})
	.strict();

type PlaceFormValues = z.infer<typeof placeFormSchema>;

/**
 * Props para el formulario de creación/edición de lugares
 * @param place Lugar a editar (PlaceWithStats), si existe
 * @param isEditing Indica si está en modo edición
 * @param onCreated Callback al crear exitosamente
 * @param onUpdated Callback al actualizar exitosamente
 * @param onCancel Callback para cancelar
 * @param onPreview Callback para vista previa
 */
interface CreatePlaceFormProps {
	place?: PlaceWithStats;
	isEditing?: boolean;
	onCreated?: (place: PlaceWithStats) => void;
	onUpdated?: (place: PlaceWithStats) => void;
	onCancel?: () => void;
	onPreview?: (data: any) => void;
}

export function CreatePlaceForm({ place, isEditing, onCreated, onUpdated, onCancel, onPreview }: CreatePlaceFormProps) {
	const createPlaceMutation = useCreatePlace();
	const updatePlaceMutation = useUpdatePlace();

	const form = useForm<PlaceFormValues>({
		resolver: zodResolver(placeFormSchema) as any, // Forzamos el tipo para evitar conflicto de opcionales
		defaultValues: placeFormSchema.parse({}),
	});

	useEffect(() => {
		if (isEditing && place) {
			form.reset({
				name: place.name,
				description: place.description ?? '',
				emoji: place.emoji ?? '📍',
				color: place.color ?? '#6b7280',
				category: place.category ?? 'general',
				region: place.region ?? 'unknown',
				type: place.type ?? 'unknown',
				climate: place.climate ?? 'temperate',
				population: place.population ?? 0,
				government: place.government ?? 'unknown',
				lore: place.lore ?? '',
				history: place.history ?? '',
				isFavorite: !!place.isFavorite,
				featuredImage: place.featuredImage ?? '',
				shortcut: place.shortcut ?? '',
			});
		}
	}, [form, isEditing, place]);

	// 🛠️ Fix: normalize solo retorna string vacío para campos requeridos (no null)
	const normalize = (v: string) => v ?? '';

	const onSubmit = async (values: PlaceFormValues) => {
		try {
			let result: PlaceBase;
			if (isEditing && place) {
				const updateData: PlaceUpdateInput = {
					name: values.name,
					description: normalize(values.description),
					emoji: values.emoji,
					color: values.color,
					category: normalize(values.category),
					region: normalize(values.region),
					type: normalize(values.type),
					climate: normalize(values.climate),
					population: values.population,
					government: normalize(values.government),
					lore: normalize(values.lore),
					history: normalize(values.history),
					isFavorite: !!values.isFavorite,
					featuredImage: normalize(values.featuredImage),
					shortcut: normalize(values.shortcut),
				};
				result = await updatePlaceMutation.mutateAsync({ id: place.id, data: updateData });
				toast(`Lugar actualizado: ${result.name}`);
				onUpdated?.(result as PlaceWithStats);
			} else {
				const createData: PlaceCreateInput = {
					...values,
					description: normalize(values.description),
					category: normalize(values.category),
					region: normalize(values.region),
					type: normalize(values.type),
					climate: normalize(values.climate),
					government: normalize(values.government),
					lore: normalize(values.lore),
					history: normalize(values.history),
					featuredImage: normalize(values.featuredImage),
					shortcut: normalize(values.shortcut),
					isFavorite: !!values.isFavorite,
				};
				result = await createPlaceMutation.mutateAsync(createData);
				toast(`Lugar creado: ${result.name}`);
				form.reset();
				onCreated?.(result as PlaceWithStats);
			}
		} catch (error) {
			toast(error instanceof Error ? error.message : 'No se pudo guardar el lugar.');
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
									<FormDescription>Tipo de gobierno o sistema político</FormDescription>
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
										placeholder="Lore e historias del lugar..."
										className="min-h-32 resize-none"
										{...field}
										value={field.value ?? ''}
									/>
								</FormControl>
								<FormDescription>Detalles sobre la cultura, mitos y leyendas</FormDescription>
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
										placeholder="Historia del lugar..."
										className="min-h-32 resize-none"
										{...field}
										value={field.value ?? ''}
									/>
								</FormControl>
								<FormDescription>Eventos históricos importantes</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* Atajo (Shortcut) */}
					<FormField
						control={form.control}
						name="shortcut"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Atajo</FormLabel>
								<FormControl>
									<Input placeholder="Ej: @nombre-lugar" {...field} value={field.value ?? ''} />
								</FormControl>
								<FormDescription>Atajo rápido para referenciar el lugar en otras entidades.</FormDescription>
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
									<FormLabel className="text-base">Marcar como favorito</FormLabel>
									<FormDescription>Los lugares favoritos aparecen primero en las búsquedas.</FormDescription>
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
					<Button type="submit" disabled={createPlaceMutation.isPending || updatePlaceMutation.isPending}>
						{isEditing ? 'Guardar Cambios' : 'Crear Lugar'}
					</Button>
				</div>
			</form>
		</Form>
	);
}

// 📝 Patrón aplicado: todos los campos string del formulario Place son obligatorios y nunca undefined, gracias a .default('').catch(''). Esto asegura compatibilidad total entre Zod, React Hook Form y los tipos de la entidad Place. Documentar este patrón en README.md de la entidad.
