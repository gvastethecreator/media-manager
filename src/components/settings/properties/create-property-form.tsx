'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';

import { createProperty, updateProperty } from '@/app/actions/properties/property.actions';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';
import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import type { PropertyWithStats as Property } from '@/types/entities/property';
import { CreatePropertySchema } from '@/types/entities/property/schema';
import { DynamicCreateForm } from '../common/dynamic-create-form';

type FormData = z.infer<typeof CreatePropertySchema>;

interface CreatePropertyFormProps {
	property?: Property;
	isEditing?: boolean;
	onCreated: (data: Property) => void;
	onUpdated: (data: Property) => void;
	onCancel: () => void;
	onPreview?: () => void;
}

export function CreatePropertyForm({
	property,
	isEditing = false,
	onCreated,
	onUpdated,
	onCancel,
}: CreatePropertyFormProps) {
	const form = useForm<FormData>({
		resolver: zodResolver(CreatePropertySchema),
		defaultValues: {
			name: property?.name ?? '',
			category: property?.category ?? 'general',
			emoji: property?.emoji ?? '🔧',
			color: property?.color ?? '#64748b',
			description: property?.description ?? '',
			shortcut: property?.shortcut ?? '',
			featuredImage: property?.featuredImage ?? undefined,
			isFavorite: property?.isFavorite ?? false,
		},
	});

	const optionalFields = [
		{
			name: 'emoji' as const,
			label: 'Emoji',
			render: ({ value, onChange }: { value: any; onChange: (v: any) => void }) => (
				<EmojiPicker value={value} onEmojiSelect={onChange} compact showLabel={false} />
			),
		},
		{
			name: 'color' as const,
			label: 'Color',
			render: ({ value, onChange }: { value: any; onChange: (v: any) => void }) => (
				<ColorPicker value={value} onChange={onChange} compact showLabel={false} />
			),
		},
		{
			name: 'description' as const,
			label: 'Descripción',
			render: ({ value, onChange }: { value: any; onChange: (v: any) => void }) => (
				<textarea
					placeholder="Descripción de la propiedad..."
					value={value || ''}
					onChange={(e) => onChange(e.target.value)}
					rows={3}
					className="text-xs resize-none w-full border rounded p-2"
				/>
			),
		},
		// ...agregar más campos opcionales si es necesario...
	];

	const handleSubmit = async (data: FormData) => {
		// Validar que name esté presente
		if (!data.name) {
			return;
		}

		if (isEditing && property) {
			const updated = await updateProperty(property.id, data);
			if (updated) {
				onUpdated?.(updated);
			}
		} else {
			const created = await createProperty(data);
			if (created) {
				onCreated?.(created);
			}
		}
	};

	return (
		<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
			<DialogHeader>
				<DialogTitle>{property ? 'Editar propiedad' : 'Crear nueva propiedad'}</DialogTitle>
			</DialogHeader>

			<DynamicCreateForm
				optionalFields={optionalFields}
				form={form}
				onSubmit={handleSubmit}
				submitLabel={isEditing ? 'Guardar cambios' : 'Crear propiedad'}
			/>

			<DialogFooter>
				<Button variant="outline" type="button" onClick={onCancel}>
					Cancelar
				</Button>
			</DialogFooter>
		</DialogContent>
	);
}
