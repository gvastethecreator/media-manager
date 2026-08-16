import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreateCharacter, useUpdateCharacter } from '@/lib/api/characters';
import { DEFAULT_ENTITY_COLOR } from '@/lib/styles/color-tokens';
import { toastService } from '@/lib/ui/toast';
import { generateTagColor } from '@/lib/utils/string.utils';
import {
	CHARACTER_CLASS_COLORS,
	CHARACTER_CLASS_EMOJIS,
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
			message: 'Name must be at least 2 characters',
		})
		.max(50, {
			message: 'Name must be 50 characters or fewer',
		}),
	description: z
		.string()
		.max(200, {
			message: 'Description must be 200 characters or fewer',
		})
		.optional(),
	color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
		message: 'Color must be a valid hexadecimal value',
	}),
	emoji: z.string().min(1, {
		message: 'Select an emoji',
	}),
	backstory: z.string().max(1000).optional(),
	category: z.nativeEnum(CharacterCategory).optional(),
	class: z.nativeEnum(CharacterClass).optional(),
	race: z.nativeEnum(CharacterRace).optional(),
	level: z.number().min(1).max(100).optional(),
});

type FormValues = z.infer<typeof createCharacterSchema>;

interface CreateCharacterFormProps {
	character?: CharacterWithStats | null;
	isEditing?: boolean;
	onCancel?: () => void;
	onCreated?: (character: CharacterWithStats) => void;
	onPreview?: (data: any) => void;
	onUpdated?: (character: CharacterWithStats) => void;
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
			color: DEFAULT_ENTITY_COLOR,
			emoji: '👤',
			backstory: '',
			category: undefined,
			class: undefined,
			race: undefined,
			level: undefined,
		},
	});

	// Cargar datos del personaje si estamos editando
	useEffect(() => {
		if (isEditing && character) {
			form.reset({
				name: character.name,
				description: character.description || '',
				color: character.color || DEFAULT_ENTITY_COLOR,
				emoji: character.emoji || '👤',
				backstory: character.background || '',
				category: character.category as CharacterCategory | undefined,
			});
		}
	}, [form, isEditing, character]);

	// Generar color y emoji basados en la clase
	const _generateSuggestions = useCallback(() => {
		const characterClass = form.getValues('class');
		const name = form.getValues('name');

		if (characterClass && Object.values(CharacterClass).includes(characterClass)) {
			// Usar colores y emojis predefinidos por clase
			const color = CHARACTER_CLASS_COLORS[characterClass] || DEFAULT_ENTITY_COLOR;
			const emoji = CHARACTER_CLASS_EMOJIS[characterClass] || '👤';

			form.setValue('color', color);
			form.setValue('emoji', emoji);
		} else if (name.length > 1) {
			// Generar color basado en el nombre utilizando util central (sin bitwise)
			form.setValue('color', generateTagColor(name));

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
				color: data.color || DEFAULT_ENTITY_COLOR,
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
				};
				const updated = await updateCharacterMutation.mutateAsync({ id: character.id, data: updateData });
				onUpdated?.(updated);
				toastService.success('Character updated');
			} else {
				const created = await createCharacterMutation.mutateAsync(characterData);
				onCreated?.(created);
				form.reset();
				toastService.success('Character created');
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			toastService.error(`Could not ${isEditing ? 'update' : 'create'} the character`, {
				description: errorMessage,
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Form {...form}>
			<form className="space-y-4" onSubmit={form.handleSubmit(_onSubmit)}>
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Name</FormLabel>
							<FormControl>
								<Input placeholder="Character name" {...field} />
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
								<EmojiPicker compact onEmojiSelect={field.onChange} showLabel={false} value={field.value} />
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
								<ColorPicker compact onChange={field.onChange} showLabel={false} value={field.value} />
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
							<FormLabel>Class</FormLabel>
							<Select defaultValue={field.value} onValueChange={field.onChange}>
								<FormControl>
									<SelectTrigger>
									<SelectValue placeholder="Select a class" />
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
							<FormLabel>Race</FormLabel>
							<Select defaultValue={field.value} onValueChange={field.onChange}>
								<FormControl>
									<SelectTrigger>
									<SelectValue placeholder="Select a race" />
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
							<FormLabel>Description</FormLabel>
							<FormControl>
								<Textarea placeholder="Character description..." rows={3} {...field} />
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
							<FormLabel>Level</FormLabel>
							<FormControl>
								<Input
									max={100}
									min={1}
									onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
									type="number"
									value={field.value ?? ''}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="flex justify-end space-x-2">
					<Button onClick={onCancel} type="button" variant="outline">
						Cancel
					</Button>
					<Button type="submit">{isEditing ? 'Save changes' : 'Create character'}</Button>
				</div>
			</form>
		</Form>
	);
}
