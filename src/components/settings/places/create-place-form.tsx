'use client';

import { createPlace, updatePlace } from '@/app/actions/places/place.actions';
import { Button } from '@/components/ui/button';
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
	FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/services/toast.service';
import { Place } from '@/types/entities/place';
import { ClimateType, GovernmentType, PlaceCategory, PlaceType } from '@/types/entities/place/enums';
import { generateTagColor, generateTagEmoji } from '@/utils/tag/helpers';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckIcon, MapPin, SparklesIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Esquema de validación para el formulario de lugares
const createPlaceSchema = z.object({
	name: z.string().min(1, 'El nombre es obligatorio').max(50, 'Máximo 50 caracteres'),
	description: z.string().max(500, 'Máximo 500 caracteres').optional(),
	emoji: z.string().min(1, 'El emoji es obligatorio'),
	color: z.string().min(1, 'El color es obligatorio'),
	region: z.string().max(50, 'Máximo 50 caracteres').optional().nullable(),
	type: z.string().optional().nullable(),
	climate: z.string().optional().nullable(),
	population: z.coerce.number().optional().nullable(),
	government: z.string().optional().nullable(),
	dangerLevel: z.string().optional().nullable(),
	economy: z.string().max(200, 'Máximo 200 caracteres').optional().nullable(),
	culture: z.string().max(200, 'Máximo 200 caracteres').optional().nullable(),
	history: z.string().max(500, 'Máximo 500 caracteres').optional().nullable(),
	notableLocations: z.string().max(200, 'Máximo 200 caracteres').optional().nullable(),
	notablePersons: z.string().max(200, 'Máximo 200 caracteres').optional().nullable(),
	category: z.string().optional().nullable(),
	isFavorite: z.boolean().default(false)
});

type CreatePlaceFormValues = z.infer<typeof createPlaceSchema>;

// Valores iniciales del formulario
const defaultValues: Partial<CreatePlaceFormValues> = {
	name: '',
	description: '',
	emoji: '📍',
	color: '#6b7280',
	region: null,
	type: null,
	climate: null,
	population: null,
	government: null,
	dangerLevel: null,
	economy: null,
	culture: null,
	history: null,
	notableLocations: null,
	notablePersons: null,
	category: null,
	isFavorite: false
};

interface CreatePlaceFormProps {
	place?: Place | null;
	isEditing?: boolean;
	onCreated?: (place: Place) => void;
	onUpdated?: (place: Place) => void;
	onCancel?: () => void;
}

export function CreatePlaceForm({
	place,
	isEditing = false,
	onCreated,
	onUpdated,
	onCancel
}: CreatePlaceFormProps) {
	const [isPending, setIsPending] = useState(false);

	// Inicializar el formulario con react-hook-form
	const form = useForm<CreatePlaceFormValues>({
		resolver: zodResolver(createPlaceSchema),
		defaultValues,
		mode: 'onChange'
	});

	// Cargar los datos del lugar si está en modo edición
	useEffect(() => {
		if (isEditing && place) {
			const formValues: Partial<CreatePlaceFormValues> = {
				name: place.name,
				description: place.description || '',
				emoji: place.emoji || '📍',
				color: place.color || '#6b7280',
				region: place.region || null,
				type: place.type || null,
				climate: place.climate || null,
				population: place.population || null,
				government: place.government || null,
				dangerLevel: place.dangerLevel || null,
				economy: place.economy || null,
				culture: place.culture || null,
				history: place.history || null,
				notableLocations: place.notableLocations || null,
				notablePersons: place.notablePersons || null,
				category: place.category || null,
				isFavorite: place.isFavorite || false
			};

			form.reset(formValues);
		}
	}, [form, isEditing, place]);

	// Generar sugerencias de color y emoji basados en el tipo o nombre
	const generateSuggestions = () => {
		const type = form.getValues('type');
		const category = form.getValues('category');
		const name = form.getValues('name');

		// Prioridad: tipo > categoría > nombre
		const baseText = type || category || name;

		if (!baseText) {
			toast.error('Introduce al menos un nombre para generar sugerencias');
			return;
		}

		const newColor = generateTagColor(baseText);
		const newEmoji = generateTagEmoji(baseText, category || type);

		form.setValue('color', newColor);
		form.setValue('emoji', newEmoji);

		toast.success('Sugerencias generadas', {
			description: 'Se han generado nuevas sugerencias de color y emoji.'
		});
	};

	// Manejar envío del formulario
	const onSubmit = async (values: CreatePlaceFormValues) => {
		try {
			setIsPending(true);

			if (isEditing && place) {
				const updatedPlace = await updatePlace(place.id, values);

				if (onUpdated) {
					onUpdated(updatedPlace);
				}

				toast.success('Lugar actualizado', {
					description: 'El lugar ha sido actualizado correctamente.'
				});
			} else {
				const newPlace = await createPlace(values);

				if (onCreated) {
					onCreated(newPlace);
				}

				form.reset(defaultValues);

				toast.success('Lugar creado', {
					description: 'El lugar ha sido creado correctamente.'
				});
			}
		} catch (error) {
			const errorMessage = error instanceof Error
				? error.message
				: 'Ocurrió un error al procesar el lugar';

			toast.error('Error', {
				description: errorMessage
			});
		} finally {
			setIsPending(false);
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
										<Input placeholder="Nombre del lugar" {...field} />
									</FormControl>
									<FormDescription>
										Nombre único que identifica este lugar
									</FormDescription>
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
											value={field.value || ''}
										/>
									</FormControl>
									<FormDescription>
										Una descripción breve que ayude a identificar este lugar
									</FormDescription>
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
										<EmojiPicker
											value={field.value}
											onChange={field.onChange}
										/>
									</FormControl>
									<FormDescription>
										Un emoji representativo
									</FormDescription>
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
										<ColorPicker
											value={field.value}
											onChange={field.onChange}
										/>
									</FormControl>
									<FormDescription>
										Color representativo
									</FormDescription>
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
									<Select
										onValueChange={field.onChange}
										value={field.value || ''}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Seleccionar tipo" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{Object.values(PlaceType).map(type => (
												<SelectItem key={type} value={type}>
													{type}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormDescription>
										El tipo específico de lugar
									</FormDescription>
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
									<Select
										onValueChange={field.onChange}
										value={field.value || ''}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Seleccionar categoría" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{Object.values(PlaceCategory).map(category => (
												<SelectItem key={category} value={category}>
													{category}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormDescription>
										Categoría general del lugar
									</FormDescription>
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
										<Input
											placeholder="Región a la que pertenece"
											{...field}
											value={field.value || ''}
										/>
									</FormControl>
									<FormDescription>
										Ubicación geográfica más amplia
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Población */}
						<FormField
							control={form.control}
							name="population"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Población</FormLabel>
									<FormControl>
										<Input
											type="number"
											placeholder="Número de habitantes"
											{...field}
											value={field.value || ''}
											onChange={(e) => {
												const value = e.target.value === '' ? null : parseInt(e.target.value);
												field.onChange(value);
											}}
										/>
									</FormControl>
									<FormDescription>
										Número aproximado de habitantes
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						{/* Clima */}
						<FormField
							control={form.control}
							name="climate"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Clima</FormLabel>
									<Select
										onValueChange={field.onChange}
										value={field.value || ''}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Seleccionar clima" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{Object.values(ClimateType).map(climate => (
												<SelectItem key={climate} value={climate}>
													{climate}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormDescription>
										Condiciones climáticas predominantes
									</FormDescription>
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
									<Select
										onValueChange={field.onChange}
										value={field.value || ''}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Seleccionar gobierno" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{Object.values(GovernmentType).map(government => (
												<SelectItem key={government} value={government}>
													{government}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormDescription>
										Tipo de gobierno o liderazgo
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<Separator />

					<div className="grid grid-cols-1 gap-4">
						{/* Economía */}
						<FormField
							control={form.control}
							name="economy"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Economía</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Detalles sobre la economía del lugar"
											className="min-h-20 resize-none"
											{...field}
											value={field.value || ''}
										/>
									</FormControl>
									<FormDescription>
										Principales actividades económicas
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Cultura */}
						<FormField
							control={form.control}
							name="culture"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Cultura</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Detalles sobre la cultura local"
											className="min-h-20 resize-none"
											{...field}
											value={field.value || ''}
										/>
									</FormControl>
									<FormDescription>
										Aspectos culturales destacables
									</FormDescription>
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
											placeholder="Historia del lugar"
											className="min-h-20 resize-none"
											{...field}
											value={field.value || ''}
										/>
									</FormControl>
									<FormDescription>
										Eventos históricos importantes
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{/* Lugares notables */}
						<FormField
							control={form.control}
							name="notableLocations"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Lugares notables</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Lugares destacados dentro de esta ubicación"
											className="min-h-20 resize-none"
											{...field}
											value={field.value || ''}
										/>
									</FormControl>
									<FormDescription>
										Sitios de interés dentro del lugar
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Personas notables */}
						<FormField
							control={form.control}
							name="notablePersons"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Personas notables</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Personas importantes de este lugar"
											className="min-h-20 resize-none"
											{...field}
											value={field.value || ''}
										/>
									</FormControl>
									<FormDescription>
										Personajes relevantes del lugar
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<Separator />

					{/* Favorito */}
					<FormField
						control={form.control}
						name="isFavorite"
						render={({ field }) => (
							<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
								<FormControl>
									<Checkbox
										checked={field.value}
										onCheckedChange={field.onChange}
									/>
								</FormControl>
								<div className="space-y-1 leading-none">
									<FormLabel>Marcar como favorito</FormLabel>
									<FormDescription>
										Los lugares favoritos aparecerán destacados en la aplicación
									</FormDescription>
								</div>
							</FormItem>
						)}
					/>
				</div>

				<div className="flex justify-between">
					<div className="flex gap-2">
						{onCancel && (
							<Button
								type="button"
								variant="outline"
								onClick={onCancel}
							>
								Cancelar
							</Button>
						)}
						<Button
							type="button"
							variant="outline"
							onClick={generateSuggestions}
						>
							<SparklesIcon className="mr-2 h-4 w-4" />
							Generar sugerencias
						</Button>
					</div>
					<Button type="submit" disabled={isPending}>
						{isPending ? (
							<>
								<MapPin className="mr-2 h-4 w-4 animate-spin" />
								{isEditing ? 'Actualizando...' : 'Creando...'}
							</>
						) : (
							<>
								<CheckIcon className="mr-2 h-4 w-4" />
								{isEditing ? 'Actualizar lugar' : 'Crear lugar'}
							</>
						)}
					</Button>
				</div>
			</form>
		</Form>
	);
}