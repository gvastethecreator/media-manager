'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { createCharacter, updateCharacter } from '@/app/actions/characters/character.actions';
import { ColorPicker } from '@/components/ui/color-picker';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import toastService from '@/services/toast.service';
import type { CharacterBase, CreateCharacterData } from '@/types/entities/character';
import {
	CHARACTER_CLASS_COLORS,
	CHARACTER_CLASS_EMOJIS,
	CharacterAlignment,
	CharacterCategory,
	CharacterClass,
	CharacterRace,
} from '@/types/entities/character/enums';
import { DynamicCreateForm } from '../common/dynamic-create-form';

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
	character?: CharacterBase | null;
	isEditing?: boolean;
	onCreated?: (character: CharacterBase) => void;
	onUpdated?: (character: CharacterBase) => void;
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
				class: (character.class as CharacterClass) || CharacterClass.UNKNOWN,
				race: (character.race as CharacterRace) || CharacterRace.UNKNOWN,
				alignment: (character.alignment as CharacterAlignment) || CharacterAlignment.NEUTRAL,
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

	const optionalFields = [
		{
			name: 'emoji',
			label: 'Emoji',
			render: ({ value, onChange }: any) => (
				<EmojiPicker value={value} onEmojiSelect={onChange} compact showLabel={false} />
			),
		},
		{
			name: 'color',
			label: 'Color',
			render: ({ value, onChange }: any) => <ColorPicker value={value} onChange={onChange} compact showLabel={false} />,
		},
		{
			name: 'description',
			label: 'Descripción',
			render: ({ value, onChange }: any) => (
				<textarea
					placeholder="Descripción del personaje..."
					value={value || ''}
					onChange={(e) => onChange(e.target.value)}
					rows={3}
					className="text-xs resize-none w-full border rounded p-2"
				/>
			),
		},
		{
			name: 'class',
			label: 'Clase',
			render: ({ value, onChange }: any) => (
				<Select onValueChange={onChange} value={value || undefined}>
					<SelectTrigger className="h-8 text-xs w-full">
						<SelectValue placeholder="Seleccionar clase" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="warrior">Guerrero</SelectItem>
						<SelectItem value="mage">Mago</SelectItem>
						<SelectItem value="rogue">Ladrón</SelectItem>
						<SelectItem value="cleric">Clérigo</SelectItem>
						<SelectItem value="ranger">Explorador</SelectItem>
					</SelectContent>
				</Select>
			),
		},
		// ...agregar más campos opcionales si es necesario...
	];

	return (
		<DynamicCreateForm
			optionalFields={optionalFields}
			onSubmit={async (data) => {
				if (isEditing && character) {
					await updateCharacter(character.id, data);
					onUpdated?.({ ...character, ...data });
				} else {
					const created = await createCharacter(data);
					onCreated?.(created);
				}
			}}
			submitLabel={isEditing ? 'Guardar cambios' : 'Crear personaje'}
		/>
	);
}
