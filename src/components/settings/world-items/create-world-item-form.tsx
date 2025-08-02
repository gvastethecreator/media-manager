// 🛠️ Refactor: DynamicCreateForm para WorldItem
// Ahora solo el campo "name" es obligatorio, el resto se agrega dinámicamente.
// Validación y tipos corregidos para compatibilidad con el patrón reusable.

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ColorPicker } from '@/components/ui/color-picker';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useCreateWorldItem, useUpdateWorldItem } from '@/lib/api/world-items';
import { toastService } from '@/lib/ui/toast';
import { WorldItemCategory, WorldItemRarity, WorldItemType } from '@/types/entities/world-item/enums';
import type { WorldItemComplete, WorldItemCreateInput, WorldItemStatistics } from '@/types/entities/world-item/types';
import { DynamicCreateForm } from '../common/dynamic-create-form';

// Esquema de validación con Zod (solo name requerido, el resto opcional)
const worldItemSchema = z.object({
	name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es demasiado largo'),
	description: z.string().optional(),
	color: z.string().optional(),
	emoji: z.string().optional(),
	type: z.string().optional(),
	category: z.string().optional(),
	rarity: z.string().optional(),
	origin: z.string().optional(),
	isFavorite: z.boolean().optional(),
});

type WorldItemForm = z.infer<typeof worldItemSchema>;

// Tipo específico para el input de creación del formulario
type WorldItemFormInput = Pick<
	WorldItemCreateInput,
	'name' | 'description' | 'color' | 'emoji' | 'type' | 'category' | 'rarity' | 'origin' | 'isFavorite'
> & {
	// Campos opcionales con valores por defecto

	totalImages?: number;
	totalVideos?: number;
	featuredImage?: string | null;
	parentId?: string | null;
	shortcut?: string | null;
	value?: string | null;
	weight?: string | null;
	materials?: string | null;
	properties?: string | null;
	uses?: string | null;
	history?: string | null;
	notes?: string | null;
	attributes?: string | null;
	effects?: string | null;
	requirements?: string | null;
};

interface CreateWorldItemFormProps {
	worldItem?: WorldItemComplete | null;
	isEditing?: boolean;
	onCreated?: (data: WorldItemCreateInput) => void;
	onUpdated?: (item: WorldItemComplete) => void;
	onCancel?: () => void;
	onPreview?: (item: WorldItemComplete) => void;
}

export function CreateWorldItemForm({
	worldItem,
	isEditing = false,
	onCreated,
	onUpdated,
	onCancel,
	onPreview,
}: CreateWorldItemFormProps) {
	// React Query mutations
	const createWorldItemMutation = useCreateWorldItem();
	const updateWorldItemMutation = useUpdateWorldItem();

	const [_isSubmitting, setIsSubmitting] = useState(false);

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
			isFavorite: false,
		},
	});

	// Enviar datos para vista previa en tiempo real
	useEffect(() => {
		if (onPreview) {
			const subscription = form.watch((data) => {
				// Crear un objeto mock para preview con los datos del formulario
				const mockStatistics: WorldItemStatistics = {
					// Conteos originales
					imageCount: 0,
					videoCount: 0,
					albumCount: 0,
					collectionCount: 0,
					tagCount: 0,
					characterCount: 0,
					placeCount: 0,
					conceptCount: 0,
					promptCount: 0,
					noteCount: 0,
					wildcardCount: 0,
					propertyCount: 0,
					groupCount: 0,

					// Propiedades requeridas por EntityStats
					totalItems: 0,
					totalAssociations: 0,
					worldItemCount: 0,
					lastUpdated: new Date(),
					lastViewed: undefined,
					lastModified: new Date(),
					size: 0,
					mtime: new Date(),
					birthtime: new Date(),
					type: 'world-item',
					isDirectory: false,
					isFile: false,

					// Métricas RPG
					powerLevel: 1,
					rarityScore: 0,
					completenessScore: 0,
					popularityScore: 0,
					hasDescription: Boolean(data.description),
					hasAttributes: false,
					hasEffects: false,
					hasRequirements: false,
					hasStats: false,
					mediaRichness: 0,
					createdThisMonth: true,
					updatedThisWeek: true,
					daysSinceCreation: 0,
					daysSinceLastUpdate: 0,
					totalAttributes: 0,
					totalEffects: 0,
					totalRequirements: 0,
					totalStats: 0,
					itemTier: 'common' as const,
				};

				const previewItem: WorldItemComplete = {
					id: worldItem?.id || 'preview',
					name: data.name || '',
					description: data.description || null,
					emoji: data.emoji || null,
					color: data.color || null,
					category: data.category || null,
					entityType: 'world-item',
				statistics: mockStatistics,
				stats: mockStatistics,
					tags: [],
					relations: {
						images: [],
						videos: [],
						albums: [],
						collections: [],
						characters: [],
						places: [],
						concepts: [],
						prompts: [],
						notes: [],
						wildcards: [],
						properties: [],
						groups: [],
					},

					isFavorite: data.isFavorite || false,
					totalImages: 0,
					totalVideos: 0,
					type: data.type ?? null,
					rarity: data.rarity ?? null,
					origin: data.origin ?? null,
					featuredImage: null,
					parentId: null,
					shortcut: null,
					value: null,
					weight: null,
					materials: null,
					properties: null,
					uses: null,
					history: null,
					notes: null,
					attributes: null,
					effects: null,
					requirements: null,
					createdAt: new Date(),
					updatedAt: new Date(),
					_count: {
						images: 0,
						videos: 0,
						albums: 0,
						collections: 0,
						tags: 0,
						characters: 0,
						places: 0,
						concepts: 0,
						prompts: 0,
						notes: 0,
						wildcards: 0,
						properties: 0,
						groups: 0,
					},
				};
				onPreview(previewItem);
			});
			return () => subscription.unsubscribe();
		}
	}, [form, onPreview, worldItem?.id]);

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
				isFavorite: worldItem.isFavorite || false,
			});
		}
	}, [worldItem, isEditing, form]);

	// Manejar envío del formulario
	const _onSubmit = async (data: WorldItemForm) => {
		try {
			setIsSubmitting(true);

			if (isEditing && worldItem) {
				// Actualizar objeto existente
				const updatedItem = await updateWorldItemMutation.mutateAsync({ id: worldItem.id, data });
				if (onUpdated) {
					// Convertir WorldItemWithStats a WorldItemComplete agregando las propiedades faltantes
					const completeItem = {
						...updatedItem,
						totalImages: updatedItem._count?.images || 0,
						totalVideos: updatedItem._count?.videos || 0,
					} as WorldItemComplete;
					onUpdated(completeItem);
				}
			} else {
				// Crear nuevo objeto con valores por defecto
				const createData: WorldItemCreateInput = {
					name: data.name,
					description: data.description || null,
					emoji: data.emoji || null,
					color: data.color || null,
					category: data.category || null,

					isFavorite: data.isFavorite || false,
					totalImages: 0,
					totalVideos: 0,
					type: data.type || null,
					rarity: data.rarity || null,
					origin: data.origin || null,
					featuredImage: null,
					parentId: null,
					shortcut: null,
					value: null,
					weight: null,
					materials: null,
					properties: null,
					uses: null,
					history: null,
					notes: null,
					attributes: null,
					effects: null,
					requirements: null,
				};
				await createWorldItemMutation.mutateAsync(createData);
				if (onCreated) {
					onCreated(createData);
				}
				form.reset(); // Limpiar formulario después de crear
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
			toastService.error(isEditing ? 'Error al actualizar el objeto' : 'Error al crear el objeto', {
				description: errorMessage,
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	// Cancelar edición
	const _handleCancel = () => {
		form.reset();
		if (onCancel) {
			onCancel();
		}
	};

	// Campos opcionales para el formulario dinámico
	const optionalFields = [
		{
			name: 'emoji',
			label: 'Emoji',
			render: ({ value, onChange }: any) => <EmojiPicker value={value} onEmojiSelect={onChange} />,
		},
		{
			name: 'color',
			label: 'Color',
			render: ({ value, onChange }: any) => <ColorPicker value={value} onChange={onChange} />,
		},
		{
			name: 'description',
			label: 'Descripción',
			render: ({ value, onChange }: any) => (
				<textarea
					placeholder="Descripción del objeto..."
					value={value || ''}
					onChange={(e) => onChange(e.target.value)}
					rows={3}
					className="text-xs resize-none w-full border rounded p-2"
				/>
			),
		},
		{
			name: 'type',
			label: 'Tipo',
			render: ({ value, onChange }: any) => (
				<Select onValueChange={onChange} value={value || undefined}>
					<SelectTrigger>
						<SelectValue placeholder="Seleccionar tipo" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="none">Ninguno</SelectItem>
						{Object.values(WorldItemType).map((type) => (
							<SelectItem key={type} value={String(type)}>
								{String(type)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			),
		},
		{
			name: 'category',
			label: 'Categoría',
			render: ({ value, onChange }: any) => (
				<Select onValueChange={onChange} value={value || undefined}>
					<SelectTrigger>
						<SelectValue placeholder="Seleccionar categoría" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="none">Ninguna</SelectItem>
						{Object.values(WorldItemCategory).map((cat) => (
							<SelectItem key={cat} value={String(cat)}>
								{String(cat)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			),
		},
		{
			name: 'rarity',
			label: 'Rareza',
			render: ({ value, onChange }: any) => (
				<Select onValueChange={onChange} value={value || undefined}>
					<SelectTrigger>
						<SelectValue placeholder="Seleccionar rareza" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="none">Ninguna</SelectItem>
						{Object.values(WorldItemRarity).map((rarity) => (
							<SelectItem key={rarity} value={String(rarity)}>
								{String(rarity)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			),
		},
		{
			name: 'origin',
			label: 'Origen',
			render: ({ value, onChange }: any) => (
				<input
					type="text"
					value={value || ''}
					onChange={(e) => onChange(e.target.value)}
					className="w-full border rounded p-2 text-xs"
					placeholder="Origen del objeto"
				/>
			),
		},
		{
			name: 'isFavorite',
			label: 'Favorito',
			render: ({ value, onChange }: any) => <Switch checked={!!value} onCheckedChange={onChange} />,
		},
	];

	return (
		<DynamicCreateForm<WorldItemFormInput>
			optionalFields={optionalFields as any}
			onSubmit={async (data) => {
				try {
					if (isEditing && worldItem) {
						const updated = await updateWorldItemMutation.mutateAsync({ id: worldItem.id, data });
						// Convertir WorldItemWithStats a WorldItemComplete
						const completeUpdated = {
							...updated,
							totalImages: updated._count?.images || 0,
							totalVideos: updated._count?.videos || 0,
						} as WorldItemComplete;
						onUpdated?.(completeUpdated);
					} else {
						// Crear con valores por defecto
						const createData: WorldItemCreateInput = {
							...data,

							totalImages: 0,
							totalVideos: 0,
							featuredImage: null,
							parentId: null,
							shortcut: null,
							value: null,
							weight: null,
							materials: null,
							properties: null,
							uses: null,
							history: null,
							notes: null,
							attributes: null,
							effects: null,
							requirements: null,
						};
						await createWorldItemMutation.mutateAsync(createData);
						onCreated?.(createData);
					}
				} catch (error) {
					console.error('Error al procesar el world item:', error);
				}
			}}
			submitLabel={isEditing ? 'Guardar cambios' : 'Crear objeto'}
		/>
	);
}

/**
 * 📝 Documentación: Formulario de creación dinámica para WorldItem
 * - Solo el campo "name" es obligatorio inicialmente.
 * - Los campos opcionales se agregan uno a uno desde un selector.
 * - Compatible con el patrón DynamicCreateForm reusable.
 * - Validación con Zod y tipos canónicos.
 * - Ejemplo de uso y props en el README de common/dynamic-create-form.
 */
