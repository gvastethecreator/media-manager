import {
	BookImage,
	Camera,
	FolderKanban,
	Lightbulb,
	MapPin,
	MessageSquare,
	StickyNote,
	TagIcon,
	Users,
	WandSparkles,
} from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useCreateAlbum } from '@/lib/api/albums';
import { useCreateCharacter } from '@/lib/api/characters';
import { useCreateCollection } from '@/lib/api/collections';
import { useCreateConcept } from '@/lib/api/concepts';
import { useCreateGroup } from '@/lib/api/groups';
import { useCreateNote } from '@/lib/api/notes';
import { useCreatePlace } from '@/lib/api/places';
import { useCreatePrompt } from '@/lib/api/prompts';
import { useCreateTag } from '@/lib/api/tags';
import { useCreateWildcard } from '@/lib/api/wildcards';

export type EntityType =
	| 'character'
	| 'place'
	| 'concept'
	| 'collection'
	| 'album'
	| 'group'
	| 'tag'
	| 'note'
	| 'prompt'
	| 'wildcard';

interface CreateEntityModalProps {
	isOpen: boolean;
	onClose: () => void;
	entityType: EntityType | null;
	/** IDs de archivos que se asociarán a la nueva entidad */
	fileIds?: string[];
	/** Callback cuando se crea la entidad exitosamente */
	onEntityCreated?: (entityId: string, entityType: EntityType) => void;
}

const entityConfig = {
	character: {
		icon: Users,
		label: 'Personaje',
		fields: ['name', 'description', 'gender'],
		placeholder: {
			name: 'Nombre del personaje',
			description: 'Descripción del personaje',
			gender: 'Género (opcional)',
		},
	},
	place: {
		icon: MapPin,
		label: 'Lugar',
		fields: ['name', 'description', 'location'],
		placeholder: {
			name: 'Nombre del lugar',
			description: 'Descripción del lugar',
			location: 'Ubicación (opcional)',
		},
	},
	concept: {
		icon: Lightbulb,
		label: 'Concepto',
		fields: ['name', 'description', 'category'],
		placeholder: {
			name: 'Nombre del concepto',
			description: 'Descripción del concepto',
			category: 'Categoría (opcional)',
		},
	},
	collection: {
		icon: BookImage,
		label: 'Colección',
		fields: ['name', 'description'],
		placeholder: {
			name: 'Nombre de la colección',
			description: 'Descripción de la colección',
		},
	},
	album: {
		icon: Camera,
		label: 'Álbum',
		fields: ['name', 'description'],
		placeholder: {
			name: 'Nombre del álbum',
			description: 'Descripción del álbum',
		},
	},
	group: {
		icon: FolderKanban,
		label: 'Grupo',
		fields: ['name', 'description'],
		placeholder: {
			name: 'Nombre del grupo',
			description: 'Descripción del grupo',
		},
	},
	tag: {
		icon: TagIcon,
		label: 'Etiqueta',
		fields: ['name', 'description'],
		placeholder: {
			name: 'Nombre de la etiqueta',
			description: 'Descripción de la etiqueta',
		},
	},
	note: {
		icon: StickyNote,
		label: 'Nota',
		fields: ['name', 'content'],
		placeholder: {
			name: 'Título de la nota',
			content: 'Contenido de la nota',
		},
	},
	prompt: {
		icon: MessageSquare,
		label: 'Prompt',
		fields: ['name', 'content', 'description'],
		placeholder: {
			name: 'Nombre del prompt',
			content: 'Contenido del prompt',
			description: 'Descripción (opcional)',
		},
	},
	wildcard: {
		icon: WandSparkles,
		label: 'Wildcard',
		fields: ['name', 'description'],
		placeholder: {
			name: 'Nombre del wildcard',
			description: 'Descripción del wildcard',
		},
	},
};

export function CreateEntityModal({ isOpen, onClose, entityType, fileIds = [], onEntityCreated }: CreateEntityModalProps) {
	const { toast } = useToast();

	// Estados para los campos del formulario
	const [formData, setFormData] = useState({
		name: '',
		description: '',
		content: '',
		gender: '',
		location: '',
		category: '',
	});

	// Hooks de creación
	const { mutate: createCharacter, isPending: isCreatingCharacter } = useCreateCharacter();
	const { mutate: createPlace, isPending: isCreatingPlace } = useCreatePlace();
	const { mutate: createConcept, isPending: isCreatingConcept } = useCreateConcept();
	const { mutate: createCollection, isPending: isCreatingCollection } = useCreateCollection();
	const { mutate: createAlbum, isPending: isCreatingAlbum } = useCreateAlbum();
	const { mutate: createGroup, isPending: isCreatingGroup } = useCreateGroup();
	const { mutate: createTag, isPending: isCreatingTag } = useCreateTag();
	const { mutate: createNote, isPending: isCreatingNote } = useCreateNote();
	const { mutate: createPrompt, isPending: isCreatingPrompt } = useCreatePrompt();
	const { mutate: createWildcard, isPending: isCreatingWildcard } = useCreateWildcard();

	const isPending =
		isCreatingCharacter ||
		isCreatingPlace ||
		isCreatingConcept ||
		isCreatingCollection ||
		isCreatingAlbum ||
		isCreatingGroup ||
		isCreatingTag ||
		isCreatingNote ||
		isCreatingPrompt ||
		isCreatingWildcard;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!entityType) return;

		if (!formData.name.trim()) {
			toast({
				title: 'Error',
				description: 'El nombre es requerido',
				variant: 'destructive',
			});
			return;
		}

		const onSuccess = (data: any) => {
			toast({
				title: '✅ Éxito',
				description: `${entityConfig[entityType].label} creado exitosamente`,
			});

			// Callback con el ID de la entidad creada
			if (onEntityCreated && data?.id) {
				onEntityCreated(data.id, entityType);
			}

			// Limpiar formulario y cerrar
			setFormData({
				name: '',
				description: '',
				content: '',
				gender: '',
				location: '',
				category: '',
			});
			onClose();
		};

		const onError = (error: Error) => {
			toast({
				title: '❌ Error',
				description: error.message || `Error al crear ${entityConfig[entityType].label}`,
				variant: 'destructive',
			});
		};

		// Crear según el tipo de entidad
		switch (entityType) {
			case 'character':
				createCharacter(
					{
						name: formData.name,
						description: formData.description || undefined,
						gender: formData.gender || undefined,
					},
					{ onSuccess, onError }
				);
				break;

			case 'place':
				createPlace(
					{
						name: formData.name,
						description: formData.description || undefined,
						location: formData.location || undefined,
					},
					{ onSuccess, onError }
				);
				break;

			case 'concept':
				createConcept(
					{
						name: formData.name,
						description: formData.description || undefined,
						category: formData.category || undefined,
					},
					{ onSuccess, onError }
				);
				break;

			case 'collection':
				createCollection(
					{
						name: formData.name,
						emoji: '📚',
						color: '#10b981',
						sortBy: 'name',
						filters: '{}',
						isFavorite: false,
						description: formData.description || undefined,
					} as any,
					{ onSuccess, onError }
				);
				break;

			case 'album':
				createAlbum(
					{
						name: formData.name,
						emoji: '📸',
						color: '#3b82f6',
						sortBy: 'name',
						filters: '[]',
						isFavorite: false,
						description: formData.description || undefined,
					},
					{ onSuccess, onError }
				);
				break;

			case 'group':
				createGroup(
					{
						name: formData.name,
						emoji: '👥',
						color: '#8B5CF6',
						sortBy: 'name:asc',
						filters: '{}',
						isFavorite: false,
						description: formData.description || undefined,
					} as any,
					{ onSuccess, onError }
				);
				break;

			case 'tag':
				createTag(
					{
						name: formData.name,
						emoji: '🏷️',
						color: '#f59e0b',
						isFavorite: false,
						description: formData.description || undefined,
					} as any,
					{ onSuccess, onError }
				);
				break;

			case 'note':
				createNote(
					{
						title: formData.name,
						content: formData.content || '',
					},
					{ onSuccess, onError }
				);
				break;

			case 'prompt':
				createPrompt(
					{
						name: formData.name,
						content: formData.content || '',
						description: formData.description || undefined,
					},
					{ onSuccess, onError }
				);
				break;

			case 'wildcard':
				createWildcard(
					{
						name: formData.name,
						description: formData.description || undefined,
					},
					{ onSuccess, onError }
				);
				break;
		}
	};

	const handleCancel = () => {
		setFormData({
			name: '',
			description: '',
			content: '',
			gender: '',
			location: '',
			category: '',
		});
		onClose();
	};

	if (!entityType) return null;

	const config = entityConfig[entityType];
	const Icon = config.icon;

	return (
		<Dialog onOpenChange={(open) => !open && handleCancel()} open={isOpen}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Icon className="h-5 w-5" />
						Crear {config.label}
					</DialogTitle>
					<DialogDescription>
						{fileIds.length > 0
							? `Se asociarán ${fileIds.length} archivo(s) a este ${config.label.toLowerCase()}`
							: `Completa los datos para crear un nuevo ${config.label.toLowerCase()}`}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit}>
					<div className="grid gap-4 py-4">
						{/* Campo Nombre (siempre presente) */}
						<div className="grid gap-2">
							<Label htmlFor="name">Nombre *</Label>
							<Input
								autoFocus
								id="name"
								onChange={(e) => setFormData({ ...formData, name: e.target.value })}
								placeholder={config.placeholder.name}
								required
								value={formData.name}
							/>
						</div>

						{/* Campo Descripción (si está en fields) */}
						{config.fields.includes('description') && (
							<div className="grid gap-2">
								<Label htmlFor="description">Descripción</Label>
								<Textarea
									id="description"
									onChange={(e) => setFormData({ ...formData, description: e.target.value })}
									placeholder={(config.placeholder as any).description || 'Descripción'}
									rows={3}
									value={formData.description}
								/>
							</div>
						)}

						{/* Campo Contenido (para notas y prompts) */}
						{config.fields.includes('content') && (
							<div className="grid gap-2">
								<Label htmlFor="content">Contenido {entityType === 'note' ? '' : '*'}</Label>
								<Textarea
									id="content"
									onChange={(e) => setFormData({ ...formData, content: e.target.value })}
									placeholder={(config.placeholder as any).content || 'Contenido'}
									required={entityType === 'prompt'}
									rows={5}
									value={formData.content}
								/>
							</div>
						)}

						{/* Campos específicos por tipo */}
						{config.fields.includes('gender') && (
							<div className="grid gap-2">
								<Label htmlFor="gender">Género</Label>
								<Input
									id="gender"
									onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
									placeholder={(config.placeholder as any).gender || 'Género'}
									value={formData.gender}
								/>
							</div>
						)}

						{config.fields.includes('location') && (
							<div className="grid gap-2">
								<Label htmlFor="location">Ubicación</Label>
								<Input
									id="location"
									onChange={(e) => setFormData({ ...formData, location: e.target.value })}
									placeholder={(config.placeholder as any).location || 'Ubicación'}
									value={formData.location}
								/>
							</div>
						)}

						{config.fields.includes('category') && (
							<div className="grid gap-2">
								<Label htmlFor="category">Categoría</Label>
								<Input
									id="category"
									onChange={(e) => setFormData({ ...formData, category: e.target.value })}
									placeholder={(config.placeholder as any).category || 'Categoría'}
									value={formData.category}
								/>
							</div>
						)}
					</div>

					<DialogFooter>
						<Button disabled={isPending} onClick={handleCancel} type="button" variant="outline">
							Cancelar
						</Button>
						<Button disabled={isPending} type="submit">
							{isPending ? 'Creando...' : 'Crear'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
