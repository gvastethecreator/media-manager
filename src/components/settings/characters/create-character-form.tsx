import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ColorPicker } from '@/components/ui/color-picker';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreateCharacter, useUpdateCharacter } from '@/lib/api/characters';
import { toastService } from '@/lib/ui/toast';
import {
	CHARACTER_CLASS_COLORS,
	CHARACTER_CLASS_EMOJIS,
	CharacterAlignment,
	CharacterCategory,
	CharacterClass,
	CharacterRace,
} from '@/types/entities/character/enums';
import type { CharacterCreateInput, CharacterUpdateInput, CharacterWithStats } from '@/types/entities/character/types';

// Esquema de validación
const createCharacterSchema = z.object({
	name: z
		.string()
		.min(2, {
			message: 'El nombre debe tener al menos 2 caracteres',
		})
		.max(50, {
			message: 'El nombre no debe exceder los 50 caracteres',
		}),
	description: z
		.string()
		.max(200, {
			message: 'La descripción no debe exceder los 200 caracteres',
		})
		.optional(),
	color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
		message: 'El color debe ser un código hexadecimal válido',
	}),
	emoji: z.string().min(1, {
		message: 'Debes seleccionar un emoji',
	}),
	backstory: z.string().max(1000).optional(),
	category: z.nativeEnum(CharacterCategory).optional(),
	class: z.nativeEnum(CharacterClass).optional(),
	race: z.nativeEnum(CharacterRace).optional(),
	level: z.number().min(1).max(100).optional(),
	isFavorite: z.boolean(),
});

type FormValues = z.infer<typeof createCharacterSchema>;

interface CreateCharacterFormProps {
	character?: CharacterWithStats | null;
	isEditing?: boolean;
	onCreated?: (character: CharacterWithStats) => void;
	onUpdated?: (character: CharacterWithStats) => void;
	onCancel?: () => void;
	onPreview?: (data: any) => void;
}

export function CreateCharacterForm({
	character,
	isEditing = false,
	onCreated,
	onUpdated,
	onCancel,
}: CreateCharacterFormProps) {
	const [_isSubmitting, setIsSubmitting] = useState(false);

	// React Query hooks
	const createCharacterMutation = useCreateCharacter();
	const updateCharacterMutation = useUpdateCharacter();

	// Inicializar formulario con valores por defecto
	const form = useForm<FormValues>({
		resolver: zodResolver(createCharacterSchema),
		defaultValues: {
			name: '',
			description: '',
			color: '#3b82f6',
			emoji: '👤',
			backstory: '',
			category: undefined,
			class: undefined,
			race: undefined,
			level: undefined,
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
				backstory: character.background || '',
				category: character.category as CharacterCategory | undefined,
				isFavorite: character.isFavorite || false,
			});
		}
	}, [form, isEditing, character]);

	// Generar color y emoji basados en la clase
	const _generateSuggestions = useCallback(() => {
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
					const value = (hash >> (i * 8)) & 0xff;
					color += `00${value.toString(16)}`.substr(-2);
				}
				return color;
			};

			form.setValue('color', stringToColor(name));

			// Intentar asignar un emoji relevante basado en palabras clave
			const keywords: Record<string, string> = {
				guerrero: '⚔️',
				warrior: '⚔️',
				mago: '🔮',
				mage: '🔮',
				wizard: '🔮',
				ladrón: '🗡️',
				rogue: '🗡️',
				thief: '🗡️',
				clérigo: '✨',
				cleric: '✨',
				priest: '✨',
				ranger: '🏹',
				arquero: '🏹',
				archer: '🏹',
				bardo: '🎭',
				bard: '🎭',
				paladín: '🛡️',
				paladin: '🛡️',
				druida: '🌿',
				druid: '🌿',
				monje: '👊',
				monk: '👊',
				brujo: '📜',
				warlock: '📜',
				hechicero: '🌟',
				sorcerer: '🌟',
				bárbaro: '🪓',
				barbarian: '🪓',
				artificero: '⚙️',
				artificer: '⚙️',
			};

			const lowerName = name.toLowerCase();
			let chosenEmoji = '👤';

			for (const [keyword, emoji] of Object.entries(keywords)) {
				if (lowerName.includes(keyword)) {
					chosenEmoji = emoji;
				}
			}

			form.setValue('emoji', chosenEmoji);
		}
	}, [form]);

	// Manejar envío del formulario
	const _onSubmit = async (data: FormValues) => {
		try {
			setIsSubmitting(true);

			const characterData: CharacterCreateInput = {
				name: data.name,
				description: data.description || null,
				category: data.category || null,
				emoji: data.emoji || '👤',
				color: data.color || '#3b82f6',
				isPublic: true,
				isFavorite: data.isFavorite || false,
				totalImages: 0,
				totalVideos: 0,
				age: null,
				gender: null,
				species: null,
				occupation: null,
				personality: null,
				background: data.backstory || null,
				relationships: null,
				skills: null,
				equipment: null,
				notes: null,
				featuredImage: null,
				parentId: null,
			};

			// Crear o actualizar personaje
			if (isEditing && character) {
				const updateData: CharacterUpdateInput = {
					...characterData,
					background: data.backstory || null,
					isFavorite: data.isFavorite || false,
				};
				const updated = await updateCharacterMutation.mutateAsync({ id: character.id, data: updateData });
				onUpdated?.(updated);
				toastService.success('Personaje actualizado correctamente');
			} else {
				const created = await createCharacterMutation.mutateAsync(characterData);
				onCreated?.(created);
				form.reset();
				toastService.success('Personaje creado correctamente');
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
			<form onSubmit={form.handleSubmit(_onSubmit)} className="space-y-4">
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Nombre</FormLabel>
							<FormControl>
								<Input placeholder="Nombre del personaje" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="emoji"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Emoji</FormLabel>
							<FormControl>
								<EmojiPicker value={field.value} onEmojiSelect={field.onChange} compact showLabel={false} />
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
								<ColorPicker value={field.value} onChange={field.onChange} compact showLabel={false} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="class"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Clase</FormLabel>
							<Select onValueChange={field.onChange} defaultValue={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Seleccionar clase" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{Object.values(CharacterClass).map((characterClass) => (
										<SelectItem key={characterClass} value={characterClass}>
											{characterClass}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
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
							<Select onValueChange={field.onChange} defaultValue={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Seleccionar raza" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{Object.values(CharacterRace).map((race) => (
										<SelectItem key={race} value={race}>
											{race}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="description"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Descripción</FormLabel>
							<FormControl>
								<Textarea placeholder="Descripción del personaje..." rows={3} {...field} />
							</FormControl>
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
									min={1}
									max={100}
									value={field.value ?? ''}
									onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
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
						<FormItem className="flex flex-row items-start space-x-3 space-y-0">
							<FormControl>
								<Checkbox checked={field.value} onCheckedChange={field.onChange} />
							</FormControl>
							<div className="space-y-1 leading-none">
								<FormLabel>Marcar como favorito</FormLabel>
							</div>
						</FormItem>
					)}
				/>

				<div className="flex justify-end space-x-2">
					<Button type="button" variant="outline" onClick={onCancel}>
						Cancelar
					</Button>
					<Button type="submit">{isEditing ? 'Guardar cambios' : 'Crear personaje'}</Button>
				</div>
			</form>
		</Form>
	);
}
