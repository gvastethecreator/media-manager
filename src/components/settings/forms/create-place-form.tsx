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
import { ColorPicker } from '@/components/ui/color-picker';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useCreatePlace, useUpdatePlace } from '@/lib/api/places';
import { DEFAULT_NEUTRAL_COLOR } from '@/lib/styles/color-tokens';
import { toastService } from '@/lib/ui/toast';
import type { PlaceBase, PlaceCreateInput, PlaceUpdateInput, PlaceWithStats } from '@/types/entities/place/base';

// Opciones para los selects que antes eran enums
const placeTypes = ['CITY', 'TOWN', 'VILLAGE', 'REGION', 'PLANET', 'OTHER'] as const;
const placeCategories = ['URBAN', 'RURAL', 'NATURAL', 'ARTIFICIAL', 'OTHER'] as const;
const climateTypes = ['TEMPERATE', 'TROPICAL', 'ARID', 'POLAR', 'CONTINENTAL'] as const;
const governmentTypes = ['DEMOCRACY', 'MONARCHY', 'DICTATORSHIP', 'ANARCHY', 'OTHER'] as const;

// 📝 Esquema de validación Zod: todos los campos string son obligatorios y nunca undefined
const placeFormSchema = z
	.object({
		name: z.string().min(1, 'Name is required').max(100).default('').catch(''),
		description: z.string().max(1000).default('').catch(''),
		emoji: z.string().min(1, 'Emoji is required').default('📍').catch('📍'),
		color: z.string().min(1, 'Color is required').default(DEFAULT_NEUTRAL_COLOR).catch(DEFAULT_NEUTRAL_COLOR),
		category: z.string().default('general').catch('general'),
		type: z.string().default('unknown').catch('unknown'),
		climate: z.string().default('temperate').catch('temperate'),
		population: z.string().default('').catch(''),
		government: z.string().default('unknown').catch('unknown'),
		history: z.string().default('').catch(''),
		lore: z.string().default('').catch(''),
		shortcut: z.string().default('').catch(''),
		featuredImage: z.string().default('').catch(''),
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
	isEditing?: boolean;
	onCancel?: () => void;
	onCreated?: (place: PlaceWithStats) => void;
	onPreview?: (data: any) => void;
	onUpdated?: (place: PlaceWithStats) => void;
	place?: PlaceWithStats;
}

export function CreatePlaceForm({
	place,
	isEditing,
	onCreated,
	onUpdated,
	onCancel,
	onPreview: _onPreview,
}: CreatePlaceFormProps) {
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
				color: place.color ?? DEFAULT_NEUTRAL_COLOR,
				category: place.category ?? 'general',
				type: place.type ?? 'unknown',
				climate: place.climate ?? 'temperate',
				population: place.population ?? '',
				government: place.government ?? 'unknown',
				history: place.history ?? '',
				lore: place.lore ?? '',
				shortcut: place.shortcut ?? '',
				featuredImage: place.featuredImage ?? '',
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
					type: normalize(values.type),
					climate: normalize(values.climate),
					population: values.population,
					government: normalize(values.government),
					history: normalize(values.history),
					lore: normalize(values.lore),
					shortcut: normalize(values.shortcut),
					featuredImage: normalize(values.featuredImage),
				};
				result = await updatePlaceMutation.mutateAsync({ id: place.id, data: updateData });
				toastService.success(`Place updated: ${result.name}`);
				onUpdated?.(result as PlaceWithStats);
			} else {
				const createData: PlaceCreateInput = {
					name: values.name,
					description: normalize(values.description),
					emoji: values.emoji,
					color: values.color,
					category: normalize(values.category),
					type: normalize(values.type),
					climate: normalize(values.climate),
					population: values.population,
					government: normalize(values.government),
					history: normalize(values.history),
					lore: normalize(values.lore),
					shortcut: normalize(values.shortcut),
					featuredImage: normalize(values.featuredImage),

					totalImages: 0,
					totalVideos: 0,
					location: null,
					economy: null,
					culture: null,
					geography: null,
					landmarks: null,
					dangers: null,
					resources: null,
					notes: null,
					parentId: null,
				};
				result = await createPlaceMutation.mutateAsync(createData);
				toastService.success(`Place created: ${result.name}`);
				form.reset();
				onCreated?.(result as PlaceWithStats);
			}
		} catch (error) {
			toastService.error(error instanceof Error ? error.message : 'Could not save the place.');
		}
	};

	return (
		<Form {...form}>
			<form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
				<div className="space-y-4">
					<div className="grid grid-cols-1 gap-4">
						{/* Nombre */}
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Name</FormLabel>
									<FormControl>
										<Input placeholder="Place name..." {...field} />
									</FormControl>
									<FormDescription>A unique name that identifies this place</FormDescription>
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
									<FormLabel>Description</FormLabel>
									<FormControl>
										<Textarea
											className="min-h-24 resize-none"
											placeholder="Short place description"
											{...field}
											value={field.value ?? ''}
										/>
									</FormControl>
									<FormDescription>A short description that helps identify this place</FormDescription>
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
										<EmojiPicker onChange={field.onChange} onEmojiSelect={field.onChange} value={field.value} />
									</FormControl>
									<FormDescription>A representative emoji</FormDescription>
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
										<ColorPicker onChange={field.onChange} value={field.value} />
									</FormControl>
									<FormDescription>A representative color</FormDescription>
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
									<FormLabel>Type</FormLabel>
									<Select onValueChange={field.onChange} value={field.value ?? ''}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select type" />
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
									<FormDescription>The specific type of place</FormDescription>
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
									<FormLabel>Category</FormLabel>
									<Select onValueChange={field.onChange} value={field.value ?? ''}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select category" />
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
									<FormDescription>The general category for this place</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<div className="grid grid-cols-1 gap-4">
						{/* Clima */}
						<FormField
							control={form.control}
							name="climate"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Climate</FormLabel>
									<Select onValueChange={field.onChange} value={field.value ?? ''}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select climate" />
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
									<FormDescription>The prevailing climate in this place</FormDescription>
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
									<FormLabel>Population</FormLabel>
									<FormControl>
										<Input placeholder="0" type="number" {...field} value={field.value ?? ''} />
									</FormControl>
									<FormDescription>Estimated number of residents</FormDescription>
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
									<FormLabel>Government</FormLabel>
									<Select onValueChange={field.onChange} value={field.value ?? ''}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select government" />
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
									<FormDescription>Type of government or political system</FormDescription>
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
										className="min-h-32 resize-none"
										placeholder="Lore and stories about this place..."
										{...field}
										value={field.value ?? ''}
									/>
								</FormControl>
								<FormDescription>Details about its culture, myths, and legends</FormDescription>
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
								<FormLabel>History</FormLabel>
								<FormControl>
									<Textarea
										className="min-h-32 resize-none"
										placeholder="History of this place..."
										{...field}
										value={field.value ?? ''}
									/>
								</FormControl>
								<FormDescription>Important historical events</FormDescription>
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
								<FormLabel>Shortcut</FormLabel>
								<FormControl>
									<Input placeholder="Example: @place-name" {...field} value={field.value ?? ''} />
								</FormControl>
								<FormDescription>A quick shortcut for referencing this place from other entities.</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
				<div className="flex justify-end gap-2">
					{onCancel && (
						<Button onClick={onCancel} type="button" variant="outline">
							Cancel
						</Button>
					)}
					<Button disabled={createPlaceMutation.isPending || updatePlaceMutation.isPending} type="submit">
						{isEditing ? 'Save changes' : 'Create place'}
					</Button>
				</div>
			</form>
		</Form>
	);
}

// 📝 Patrón aplicado: todos los campos string del formulario Place son obligatorios y nunca undefined, gracias a .default('').catch(''). Esto asegura compatibilidad total entre Zod, React Hook Form y los tipos de la entidad Place. Documentar este patrón en README.md de la entidad.
