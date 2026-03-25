import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { useCreateProperty, useUpdateProperty } from '@/lib/api/properties';
import { clientLogger } from '@/lib/logger/client-logger';
import { DEFAULT_NEUTRAL_COLOR } from '@/lib/styles/color-tokens';
import type { PropertyWithStats as Property } from '@/types/entities/property/types';
import { DynamicCreateForm } from '../common/dynamic-create-form';

interface CreatePropertyFormProps {
	isEditing?: boolean;
	onCancel: () => void;
	onCreated: (data: Property) => void;
	onPreview?: () => void;
	onUpdated: (data: Property) => void;
	property?: Property;
}

export function CreatePropertyForm({
	property,
	isEditing = false,
	onCreated,
	onUpdated,
	onCancel,
}: CreatePropertyFormProps) {
	// React Query mutations
	const createPropertyMutation = useCreateProperty();
	const updatePropertyMutation = useUpdateProperty();

	const optionalFields = [
		{
			name: 'emoji' as const,
			label: 'Emoji',
			render: ({ value, onChange }: { value: any; onChange: (v: any) => void }) => (
				<EmojiPicker compact onEmojiSelect={onChange} showLabel={false} value={value} />
			),
		},
		{
			name: 'color' as const,
			label: 'Color',
			render: ({ value, onChange }: { value: any; onChange: (v: any) => void }) => (
				<ColorPicker compact onChange={onChange} showLabel={false} value={value} />
			),
		},
		{
			name: 'description' as const,
			label: 'Descripción',
			render: ({ value, onChange }: { value: any; onChange: (v: any) => void }) => (
				<textarea
					className="w-full resize-none rounded border border-input bg-background p-2 text-foreground text-xs"
					onChange={(e) => onChange(e.target.value)}
					placeholder="Descripción de la propiedad..."
					rows={3}
					value={value || ''}
				/>
			),
		},
		{
			name: 'category' as const,
			label: 'Categoría',
			render: ({ value, onChange }: { value: any; onChange: (v: any) => void }) => (
				<input
					className="w-full rounded border border-input bg-background p-2 text-foreground text-xs"
					onChange={(e) => onChange(e.target.value)}
					placeholder="Categoría de la propiedad"
					type="text"
					value={value || ''}
				/>
			),
		},
		{
			name: 'shortcut' as const,
			label: 'Atajo',
			render: ({ value, onChange }: { value: any; onChange: (v: any) => void }) => (
				<input
					className="w-full rounded border border-input bg-background p-2 text-foreground text-xs"
					onChange={(e) => onChange(e.target.value)}
					placeholder="Atajo opcional"
					type="text"
					value={value || ''}
				/>
			),
		},
		// ...agregar más campos opcionales si es necesario...
	];

	const handleSubmit = async (data: {
		category?: string | null;
		color?: string | null;
		description?: string | null;
		emoji?: string | null;
		featuredImage?: string | null;
		isFavorite?: boolean;
		name: string;
		shortcut?: string | null;
	}) => {
		// Validar que name esté presente
		if (!data.name) {
			return;
		}

		try {
			if (isEditing && property) {
				const updated = await updatePropertyMutation.mutateAsync({ id: property.id, data });
				if (updated) {
					onUpdated?.(updated);
				}
			} else {
				const created = await createPropertyMutation.mutateAsync(data);
				if (created) {
					onCreated?.(created);
				}
			}
		} catch (error) {
			clientLogger.error('Error al procesar la propiedad:', error);
		}
	};

	return (
		<DynamicCreateForm
			initialData={{
				name: property?.name ?? '',
				category: property?.category ?? 'general',
				emoji: property?.emoji ?? '🔧',
				color: property?.color ?? DEFAULT_NEUTRAL_COLOR,
				description: property?.description ?? '',
				shortcut: property?.shortcut ?? '',
				featuredImage: property?.featuredImage ?? undefined,
				isFavorite: property?.isFavorite ?? false,
			}}
			onCancel={onCancel}
			onSubmit={handleSubmit}
			optionalFields={optionalFields}
			submitLabel={isEditing ? 'Guardar cambios' : 'Crear propiedad'}
		/>
	);
}
