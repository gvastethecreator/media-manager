'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ColorPicker } from '@/components/ui/color-picker';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import type { GroupBase } from '@/types/entities/group/types';
import { DynamicCreateForm } from '../common/dynamic-create-form';

// Esquema de validación para el formulario
const groupFormSchema = z.object({
	name: z.string().min(1, 'El nombre es requerido').max(50, 'El nombre no puede tener más de 50 caracteres'),
	emoji: z.string().default('📂'),
	color: z.string().default('#3b82f6'),
	description: z.string().optional(),
	shortcut: z.string().optional(),
	category: z.enum(['general', 'technical', 'artistic', 'management']).default('general'),
	sortBy: z.string().default('name'),
	filters: z.string().default('empty_array'),
	featuredImage: z.string().optional(),
	isFavorite: z.boolean().default(false),
});

type FormData = z.infer<typeof groupFormSchema>;

interface CreateGroupFormProps {
	group?: GroupBase;
	isEditing?: boolean;
	onCreated?: (data: GroupBase) => void;
	onUpdated?: (data: GroupBase) => void;
	onCancel: () => void;
	onPreview?: () => void;
}

export function CreateGroupForm({
	group,
	isEditing = false,
	onCreated,
	onUpdated,
	onCancel,
	onPreview,
}: CreateGroupFormProps) {
	// Inicializar el formulario con el tipo correcto
	const _form = useForm<FormData>({
		resolver: zodResolver(groupFormSchema),
		defaultValues: {
			name: group?.name ?? '',
			emoji: group?.emoji ?? '📂',
			color: group?.color ?? '#3b82f6',
			description: group?.description ?? '',
			shortcut: group?.shortcut ?? '',
			category: (group?.category as FormData['category']) ?? 'general',
			sortBy: group?.sortBy ?? 'name',
			filters: group?.filters ?? 'empty_array',
			featuredImage: group?.featuredImage ?? '',
			isFavorite: group?.isFavorite ?? false,
		},
	});

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
					placeholder="Descripción del grupo..."
					value={value || ''}
					onChange={(e) => onChange(e.target.value)}
					rows={3}
					className="text-xs resize-none w-full border rounded p-2"
				/>
			),
		},
		// ...agregar más campos opcionales si es necesario...
	];

	return (
		<DynamicCreateForm
			optionalFields={optionalFields}
			onSubmit={async (data) => {
				if (isEditing && group) {
					// await updateGroup(group.id, data);
					onUpdated?.({ ...group, ...data });
				} else {
					// const created = await createGroup(data);
					onCreated?.(data as GroupBase);
				}
			}}
			submitLabel={isEditing ? 'Guardar cambios' : 'Crear grupo'}
		/>
	);
}
