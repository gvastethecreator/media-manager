'use client';

import { createCharacter, updateCharacter } from '@/app/actions/characters/character.actions';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ColorPicker } from '@/components/ui/color-picker';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import toastService from '@/services/toast.service';
import type { CharacterBase as Character, CreateCharacterData } from '@/types/entities/character/base';
import { CHARACTER_CLASS_COLORS, CHARACTER_CLASS_EMOJIS, CharacterAlignment, CharacterCategory, CharacterClass, CharacterRace } from '@/types/entities/character/enums';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Esquema de validación
const createCharacterSchema = z.object({
	name: z.string().min(2, {
		message: 'El nombre debe tener al menos 2 caracteres',
	}).max(50, {
		message: 'El nombre no debe exceder los 50 caracteres',
	}),
	description: z.string().max(200, {
		message: 'La descripción no debe exceder los 200 caracteres',
	}).optional(),
	color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
		message: 'El color debe ser un código hexadecimal válido',
	}),
	emoji: z.string().min(1, {
		message: 'Debes seleccionar un emoji',
	}),
	class: z.nativeEnum(CharacterClass).optional(),
	race: z.nativeEnum(CharacterRace).optional(),
	alignment: z.nativeEnum(CharacterAlignment).optional(),
	level: z.number().int().min(1).max(100).optional(),
	backstory: z.string().max(1000).optional(),
	psychologicalProfile: z.string().max(500).optional(),
	socialProfile: z.string().max(500).optional(),
	category: z.nativeEnum(CharacterCategory).optional(),
	isFavorite: z.boolean().default(false),
});

type FormValues = z.infer<typeof createCharacterSchema>;

interface CreateCharacterFormProps {
	character?: Character | null;
	isEditing?: boolean;
	onCreated?: (character: Character) => void;
	onUpdated?: (character: Character) => void;
	onCancel?: () => void;
	onPreview?: (data: any) => void;
}

export function CreateCharacterForm({
	character,
	isEditing = false,
	onCreated,
	onUpdated,
	onCancel
}: CreateCharacterFormProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Inicializar formulario con valores por defecto
	const form = useForm<FormValues>({
		resolver: zodResolver(createCharacterSchema),
		defaultValues: {
			name: '',
			description: '',
			color: '#3b82f6',
			emoji: '👤',
			class: CharacterClass.UNKNOWN,
			race: CharacterRace.UNKNOWN,
			alignment: CharacterAlignment.NEUTRAL,
			level: 1,
			backstory: '',
			psychologicalProfile: '',
			socialProfile: '',
			category: undefined,
			isFavorite: false,
		},
	});

	// Cargar datos del personaje si estamos editando
	useEffect(() => {
		if (isEditing && character) {
			form.reset({
				name: character.name,
				description: character.description || '',
				color: character.color || '#3b82f6',
				emoji: character.emoji || '👤',
				class: character.class as CharacterClass || CharacterClass.UNKNOWN,
				race: character.race as CharacterRace || CharacterRace.UNKNOWN,
				alignment: character.alignment as CharacterAlignment || CharacterAlignment.NEUTRAL,
				level: character.level || 1,
				backstory: character.backstory || '',
				psychologicalProfile: character.psychologicalProfile || '',
				socialProfile: character.socialProfile || '',
				category: character.category as CharacterCategory | undefined,
				isFavorite: character.isFavorite || false,
			});
		}
	}, [form, isEditing, character]);

	// Generar color y emoji basados en la clase
	const generateSuggestions = useCallback(() => {
		const characterClass = form.getValues('class');
		const name = form.getValues('name');

		if (characterClass && Object.values(CharacterClass).includes(characterClass)) {
			// Usar colores y emojis predefinidos por clase
			const color = CHARACTER_CLASS_COLORS[characterClass] || '#3b82f6';
			const emoji = CHARACTER_CLASS_EMOJIS[characterClass] || '👤';

			form.setValue('color', color);
			form.setValue('emoji', emoji);
		} else if (name.length > 1) {
			// Generar color basado en el nombre
			const stringToColor = (str: string) => {
				let hash = 0;
				for (let i = 0; i < str.length; i++) {
					hash = str.charCodeAt(i) + ((hash << 5) - hash);
				}
				let color = '#';
				for (let i = 0; i < 3; i++) {
					const value = (hash >> (i * 8)) & 0xFF;
					color += ('00' + value.toString(16)).substr(-2);
				}
				return color;
			};

			form.setValue('color', stringToColor(name));

			// Intentar asignar un emoji relevante basado en palabras clave
			const keywords: Record<string, string> = {
				'guerrero': '⚔️', 'warrior': '⚔️',
				'mago': '🔮', 'mage': '🔮', 'wizard': '🔮',
				'ladrón': '🗡️', 'rogue': '🗡️', 'thief': '🗡️',
				'clérigo': '✨', 'cleric': '✨', 'priest': '✨',
				'ranger': '🏹', 'arquero': '🏹', 'archer': '🏹',
				'bardo': '🎭', 'bard': '🎭',
				'paladín': '🛡️', 'paladin': '🛡️',
				'druida': '🌿', 'druid': '🌿',
				'monje': '👊', 'monk': '👊',
				'brujo': '📜', 'warlock': '📜',
				'hechicero': '🌟', 'sorcerer': '🌟',
				'bárbaro': '🪓', 'barbarian': '🪓',
				'artificero': '⚙️', 'artificer': '⚙️',
			};

			const lowerName = name.toLowerCase();
			let chosenEmoji = '👤';

			Object.entries(keywords).forEach(([keyword, emoji]) => {
				if (lowerName.includes(keyword)) {
					chosenEmoji = emoji;
				}
			});

			form.setValue('emoji', chosenEmoji);
		}
	}, [form]);

	// Manejar envío del formulario
	const onSubmit = async (data: FormValues) => {
		try {
			setIsSubmitting(true);

			const characterData: CreateCharacterData = {
				name: data.name,
				description: data.description,
				color: data.color,
				emoji: data.emoji,
				class: data.class,
				race: data.race,
				alignment: data.alignment,
				level: data.level,
				category: data.category,
			};

			// Crear o actualizar personaje
			if (isEditing && character) {
				const updated = await updateCharacter(character.id, {
					...characterData,
					backstory: data.backstory,
					psychologicalProfile: data.psychologicalProfile,
					socialProfile: data.socialProfile,
					isFavorite: data.isFavorite,
				});
				onUpdated?.(updated);
			} else {
				const created = await createCharacter(characterData);
				onCreated?.(created);
				form.reset();
			}

		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			toastService.error(`Error al ${isEditing ? 'actualizar' : 'crear'} el personaje`, {
				description: errorMessage,
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Nombre</FormLabel>
							<FormControl>
								<Input
									placeholder="Nombre del personaje"
									{...field}
									onChange={(e) => {
										field.onChange(e);
										// Solo generar sugerencias si no estamos editando o si el usuario no ha modificado manualmente
										if (!isEditing) {
											generateSuggestions();
										}
									}}
								/>
							</FormControl>
							<FormDescription>
								El nombre del personaje, visible en listados e imágenes.
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="description"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Descripción (Opcional)</FormLabel>
							<FormControl>
								<Textarea
									placeholder="Describe brevemente este personaje"
									{...field}
									value={field.value || ''}
								/>
							</FormControl>
							<FormDescription>
								Una descripción breve para entender quién es este personaje.
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<FormField
						control={form.control}
						name="emoji"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Emoji</FormLabel>
								<FormControl>
									<EmojiPicker
										value={field.value}
										onEmojiSelect={(emoji) => field.onChange(emoji)}
									/>
								</FormControl>
								<FormDescription>
									Selecciona un emoji representativo.
								</FormDescription>
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
									<ColorPicker
										value={field.value}
										onChange={(color) => field.onChange(color)}
									/>
								</FormControl>
								<FormDescription>
									Color para identificar visualmente al personaje.
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<FormField
						control={form.control}
						name="class"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Clase</FormLabel>
								<Select
									onValueChange={(value) => {
										field.onChange(value || CharacterClass.UNKNOWN);
										// Generar sugerencias basadas en clase
										if (value) {
											generateSuggestions();
										}
									}}
									value={field.value}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Selecciona una clase" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{Object.entries(CharacterClass).map(([key, value]) => (
											<SelectItem key={key} value={value}>
												{value.charAt(0).toUpperCase() + value.slice(1)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormDescription>
									Clase o profesión del personaje.
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="race"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Raza</FormLabel>
								<Select
									onValueChange={(value) => field.onChange(value || CharacterRace.UNKNOWN)}
									value={field.value}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Selecciona una raza" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{Object.entries(CharacterRace).map(([key, value]) => (
											<SelectItem key={key} value={value}>
												{value.charAt(0).toUpperCase() + value.slice(1)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormDescription>
									Raza o especie del personaje.
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<FormField
						control={form.control}
						name="alignment"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Alineamiento</FormLabel>
								<Select
									onValueChange={(value) => field.onChange(value || CharacterAlignment.NEUTRAL)}
									value={field.value}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Selecciona un alineamiento" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{Object.entries(CharacterAlignment).map(([key, value]) => (
											<SelectItem key={key} value={value}>
												{value.replace('-', ' ').split(' ').map(word =>
													word.charAt(0).toUpperCase() + word.slice(1)
												).join(' ')}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormDescription>
									Alineamiento moral y ético del personaje.
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="level"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Nivel</FormLabel>
								<FormControl>
									<Input
										type="number"
										placeholder="1"
										min={1}
										max={100}
										{...field}
										onChange={(e) => field.onChange(Number(e.target.value) || 1)}
										value={field.value || 1}
									/>
								</FormControl>
								<FormDescription>
									Nivel de experiencia o poder (1-100).
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<FormField
					control={form.control}
					name="backstory"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Historia (Opcional)</FormLabel>
							<FormControl>
								<Textarea
									placeholder="Cuenta la historia de este personaje"
									{...field}
									value={field.value || ''}
									className="min-h-[120px]"
								/>
							</FormControl>
							<FormDescription>
								Trasfondo o historia de origen del personaje.
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<FormField
						control={form.control}
						name="psychologicalProfile"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Perfil Psicológico (Opcional)</FormLabel>
								<FormControl>
									<Textarea
										placeholder="Rasgos psicológicos del personaje"
										{...field}
										value={field.value || ''}
									/>
								</FormControl>
								<FormDescription>
									Personalidad, motivaciones, temores, etc.
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="socialProfile"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Perfil Social (Opcional)</FormLabel>
								<FormControl>
									<Textarea
										placeholder="Relaciones sociales del personaje"
										{...field}
										value={field.value || ''}
									/>
								</FormControl>
								<FormDescription>
									Relaciones, status social, amistades y enemistades.
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<FormField
					control={form.control}
					name="category"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Categoría (Opcional)</FormLabel>
							<Select
								onValueChange={(value) => field.onChange(value || undefined)}
								value={field.value}
							>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Selecciona una categoría" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{Object.entries(CharacterCategory).map(([key, value]) => (
										<SelectItem key={key} value={value}>
											{value.charAt(0).toUpperCase() + value.slice(1)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FormDescription>
								Categoría o rol del personaje (protagonista, antagonista, etc.).
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="isFavorite"
					render={({ field }) => (
						<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
							<FormControl>
								<Checkbox
									checked={field.value}
									onCheckedChange={(checked) => {
										field.onChange(checked === true);
									}}
								/>
							</FormControl>
							<div className="space-y-1 leading-none">
								<FormLabel>Marcar como favorito</FormLabel>
								<FormDescription>
									Los personajes favoritos aparecerán destacados y tendrán prioridad en los listados.
								</FormDescription>
							</div>
						</FormItem>
					)}
				/>

				<div className="flex justify-end gap-2">
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
						Generar sugerencias
					</Button>
					<Button
						type="submit"
						disabled={isSubmitting}
					>
						{isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
					</Button>
				</div>
			</form>
		</Form>
	);
}