'use client';

import { createWorldItem, updateWorldItem } from '@/app/actions/world-items/world-item.actions';
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
import type { WorldItem } from '@/types/entities/world-item';
import { RarityLevel, WorldItemCategory, WorldItemType } from '@/types/entities/world-item/enums';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Esquema de validación con Zod
const worldItemSchema = z.object({
	name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es demasiado largo'),
	description: z.string().optional(),
	color: z.string().min(1, 'El color es requerido'),
	emoji: z.string().min(1, 'El emoji es requerido'),
	type: z.string().optional(),
	category: z.string().optional(),
	rarity: z.string().optional(),
	origin: z.string().optional(),
	isFavorite: z.boolean().default(false),
});

type WorldItemForm = z.infer<typeof worldItemSchema>;

interface CreateWorldItemFormProps {
	worldItem?: WorldItem | null;
	isEditing?: boolean;
	onCreated?: (item: WorldItem) => void;
	onUpdated?: (item: WorldItem) => void;
	onCancel?: () => void;
	onPreview?: (item: WorldItem) => void;
}

export function CreateWorldItemForm({
	worldItem,
	isEditing = false,
	onCreated,
	onUpdated,
	onCancel,
	onPreview
}: CreateWorldItemFormProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Configurar react-hook-form
	const form = useForm<WorldItemForm>({
		resolver: zodResolver(worldItemSchema),
		defaultValues: {
			name: '',
			description: '',
			color: '#6b7280',
			emoji: '📦',
			type: 'none',
			category: 'none',
			rarity: 'none',
			origin: '',
			isFavorite: false
		}
	});

	// Enviar datos para vista previa en tiempo real
	useEffect(() => {
		if (onPreview) {
			const subscription = form.watch((data) => {
				onPreview(data as WorldItem);
			});
			return () => subscription.unsubscribe();
		}
	}, [form, onPreview]);

	// Cargar datos iniciales si estamos editando
	useEffect(() => {
		if (worldItem && isEditing) {
			form.reset({
				name: worldItem.name,
				description: worldItem.description || '',
				color: worldItem.color || '#6b7280',
				emoji: worldItem.emoji || '📦',
				type: worldItem.type || 'none',
				category: worldItem.category || 'none',
				rarity: worldItem.rarity || 'none',
				origin: worldItem.origin || '',
				isFavorite: worldItem.isFavorite || false
			});
		}
	}, [worldItem, isEditing, form]);

	// Manejar envío del formulario
	const onSubmit = async (data: WorldItemForm) => {
		try {
			setIsSubmitting(true);

			if (isEditing && worldItem) {
				// Actualizar objeto existente
				const updatedItem = await updateWorldItem(worldItem.id, data);
				if (onUpdated) {
					onUpdated(updatedItem);
				}
			} else {
				// Crear nuevo objeto
				const newItem = await createWorldItem(data);
				if (onCreated) {
					onCreated(newItem);
				}
				form.reset(); // Limpiar formulario después de crear
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			toastService.error(isEditing ? 'Error al actualizar el objeto' : 'Error al crear el objeto', {
				description: errorMessage
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	// Cancelar edición
	const handleCancel = () => {
		form.reset();
		if (onCancel) {
			onCancel();
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				<div className="space-y-4">
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem className="space-y-2">
									<FormLabel>Nombre</FormLabel>
									<FormControl>
										<Input
											placeholder="Nombre del objeto"
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
							name="origin"
							render={({ field }) => (
								<FormItem className="space-y-2">
									<FormLabel>Origen</FormLabel>
									<FormControl>
										<Input
											placeholder="Origen del objeto"
											{...field}
										/>
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
							<FormItem className="space-y-2">
								<FormLabel>Descripción</FormLabel>
								<FormControl>
									<Textarea
										placeholder="Descripción del objeto"
										{...field}
										value={field.value || ''}
										rows={3}
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
													variant="outline"
													className="h-10 w-10 p-0"
													type="button"
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

					<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
						<FormField
							control={form.control}
							name="type"
							render={({ field }) => (
								<FormItem className="space-y-2">
									<FormLabel>Tipo</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Seleccionar tipo" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="none">Ninguno</SelectItem>
											{Object.values(WorldItemType).map((type) => (
												<SelectItem key={type} value={type}>{type}</SelectItem>
											))}
										</SelectContent>
									</Select>
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
											<SelectItem value="none">Ninguna</SelectItem>
											{Object.values(WorldItemCategory).map((category) => (
												<SelectItem key={category} value={category}>{category}</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="rarity"
							render={({ field }) => (
								<FormItem className="space-y-2">
									<FormLabel>Rareza</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Seleccionar rareza" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="none">Ninguna</SelectItem>
											{Object.values(RarityLevel).map((rarity) => (
												<SelectItem key={rarity} value={rarity}>{rarity}</SelectItem>
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
						name="isFavorite"
						render={({ field }) => (
							<FormItem className="flex items-center space-x-2 pt-2">
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
				</div>

				<div className="flex gap-2 justify-end">
					{isEditing && (
						<Button type="button" variant="outline" onClick={handleCancel}>
							Cancelar
						</Button>
					)}
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						{isEditing ? 'Actualizar' : 'Crear'} Objeto
					</Button>
				</div>
			</form>
		</Form>
	);
}