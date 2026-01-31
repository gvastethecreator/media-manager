/**
 * @file Modern Worldbuilding Settings
 * @module components/settings/modern/worldbuilding-settings-modern
 * @description Configuración de worldbuilding: personajes, lugares, objetos, conceptos, prompts, notas y wildcards
 */

import {
	Book,
	Box,
	Edit2,
	FileAudio,
	FileText,
	Globe,
	Grid3X3,
	List,
	Plus,
	Search,
	Sparkles,
	Trash2,
	Users,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCharacters, useDeleteCharacter } from '@/lib/api/characters';
import { useConcepts, useDeleteConcept } from '@/lib/api/concepts';
import { useDeleteNote, useNotes } from '@/lib/api/notes';
import { useDeletePlace, usePlaces } from '@/lib/api/places';
import { useDeletePrompt, usePrompts } from '@/lib/api/prompts';
import { useDeleteWildcard, useWildcards } from '@/lib/api/wildcards';
import { useDeleteWorldItem, useWorldItems } from '@/lib/api/world-items';
import { toastService } from '@/lib/ui/toast';
import { cn } from '@/lib/utils';
import type { CharacterWithStats } from '@/types/entities/character';
import type { ConceptWithStats } from '@/types/entities/concept';
import type { NoteWithStats } from '@/types/entities/note';
import type { PlaceWithStats } from '@/types/entities/place';
import type { PromptWithStats } from '@/types/entities/prompt';
import type { WildcardWithStats } from '@/types/entities/wildcard';
import type { WorldItemWithStats } from '@/types/entities/world-item';
import { CreateCharacterForm } from '../characters/create-character-form';
import type { CardActions } from '../common/entity-settings-view';
import { CreateConceptForm } from '../concepts/create-concept-form';
import { CreateNoteForm } from '../notes/create-note-form';
import { CreatePlaceForm } from '../places/create-place-form';
import { CreatePromptForm } from '../prompts/create-prompt-form';
import { CreateWildcardForm } from '../wildcards/create-wildcard-form';
import { CreateWorldItemForm } from '../world-items/create-world-item-form';

// ============================================================================
// CONFIGURACIÓN DE ENTIDADES
// ============================================================================

const ENTITY_CONFIG = {
	characters: {
		label: 'Personajes',
		singular: 'Personaje',
		icon: Users,
		color: 'var(--entity-character)',
		useQuery: useCharacters,
		useDelete: useDeleteCharacter,
		CreateForm: CreateCharacterForm,
	},
	places: {
		label: 'Lugares',
		singular: 'Lugar',
		icon: Globe,
		color: 'var(--entity-place)',
		useQuery: usePlaces,
		useDelete: useDeletePlace,
		CreateForm: CreatePlaceForm,
	},
	items: {
		label: 'Objetos',
		singular: 'Objeto',
		icon: Box,
		color: 'var(--entity-world-item)',
		useQuery: useWorldItems,
		useDelete: useDeleteWorldItem,
		CreateForm: CreateWorldItemForm,
	},
	concepts: {
		label: 'Conceptos',
		singular: 'Concepto',
		icon: Book,
		color: 'var(--entity-concept)',
		useQuery: useConcepts,
		useDelete: useDeleteConcept,
		CreateForm: CreateConceptForm,
	},
	prompts: {
		label: 'Prompts',
		singular: 'Prompt',
		icon: FileAudio,
		color: 'var(--entity-prompt)',
		useQuery: usePrompts,
		useDelete: useDeletePrompt,
		CreateForm: CreatePromptForm,
	},
	notes: {
		label: 'Notas',
		singular: 'Nota',
		icon: FileText,
		color: 'var(--entity-note)',
		useQuery: useNotes,
		useDelete: useDeleteNote,
		CreateForm: CreateNoteForm,
	},
	wildcards: {
		label: 'Wildcards',
		singular: 'Wildcard',
		icon: Sparkles,
		color: 'var(--entity-wildcard)',
		useQuery: useWildcards,
		useDelete: useDeleteWildcard,
		CreateForm: CreateWildcardForm,
	},
};

type EntityType = keyof typeof ENTITY_CONFIG;
type AnyEntity =
	| CharacterWithStats
	| PlaceWithStats
	| WorldItemWithStats
	| ConceptWithStats
	| PromptWithStats
	| NoteWithStats
	| WildcardWithStats;

// ============================================================================
// TARJETAS DE ENTIDADES
// ============================================================================

function CharacterCard({
	character,
	actions,
	isGrid,
}: {
	character: CharacterWithStats;
	actions: CardActions;
	isGrid: boolean;
}) {
	const content = (
		<>
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between">
					<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
						<Users className="h-5 w-5 text-primary" />
					</div>
					{character.category && <Badge variant="secondary">{character.category}</Badge>}
				</div>
				<CardTitle className="mt-3 text-base">{character.name}</CardTitle>
				{character.description && <CardDescription className="text-sm">{character.description}</CardDescription>}
			</CardHeader>
			<CardContent>
				<div className="flex items-center justify-between">
					<div className="flex gap-1">
						{character.isFavorite && <span style={{ color: 'var(--entity-favorite)' }}>★</span>}
					</div>
					<span className="text-muted-foreground text-sm">{character.statistics?.imageCount || 0} imágenes</span>
				</div>
			</CardContent>
		</>
	);

	if (isGrid) return <Card>{content}</Card>;

	return (
		<div className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/30">
			<div className="flex items-center gap-3">
				<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
					<Users className="h-5 w-5 text-primary" />
				</div>
				<div>
					<p className="flex items-center gap-2 font-medium">
						{character.name}
						{character.isFavorite && (
							<span className="text-sm" style={{ color: 'var(--entity-favorite)' }}>
								★
							</span>
						)}
					</p>
					{character.description && <p className="text-muted-foreground text-sm">{character.description}</p>}
				</div>
			</div>
			<div className="flex items-center gap-4">
				<span className="text-muted-foreground text-sm">{character.statistics?.imageCount || 0} imágenes</span>
				<div className="flex gap-1">
					<Button onClick={actions.onEdit} size="sm" variant="ghost">
						<Edit2 className="h-4 w-4" />
					</Button>
					<Button onClick={actions.onDelete} size="sm" variant="ghost">
						<Trash2 className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}

function PlaceCard({ place, actions, isGrid }: { place: PlaceWithStats; actions: CardActions; isGrid: boolean }) {
	const content = (
		<>
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between">
					<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
						<Globe className="h-5 w-5 text-primary" />
					</div>
					{place.category && <Badge variant="secondary">{place.category}</Badge>}
				</div>
				<CardTitle className="mt-3 text-base">{place.name}</CardTitle>
				{place.description && <CardDescription className="text-sm">{place.description}</CardDescription>}
			</CardHeader>
			<CardContent>
				<div className="flex items-center justify-between">
					<div className="flex gap-1">
						{place.isFavorite && <span style={{ color: 'var(--entity-favorite)' }}>★</span>}
					</div>
					<span className="text-muted-foreground text-sm">{place.statistics?.imageCount || 0} imágenes</span>
				</div>
			</CardContent>
		</>
	);

	if (isGrid) return <Card>{content}</Card>;

	return (
		<div className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/30">
			<div className="flex items-center gap-3">
				<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
					<Globe className="h-5 w-5 text-primary" />
				</div>
				<div>
					<p className="flex items-center gap-2 font-medium">
						{place.name}
						{place.isFavorite && (
							<span className="text-sm" style={{ color: 'var(--entity-favorite)' }}>
								★
							</span>
						)}
					</p>
					{place.description && <p className="text-muted-foreground text-sm">{place.description}</p>}
				</div>
			</div>
			<div className="flex items-center gap-4">
				<span className="text-muted-foreground text-sm">{place.statistics?.imageCount || 0} imágenes</span>
				<div className="flex gap-1">
					<Button onClick={actions.onEdit} size="sm" variant="ghost">
						<Edit2 className="h-4 w-4" />
					</Button>
					<Button onClick={actions.onDelete} size="sm" variant="ghost">
						<Trash2 className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}

function WorldItemCard({ item, actions, isGrid }: { item: WorldItemWithStats; actions: CardActions; isGrid: boolean }) {
	const content = (
		<>
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between">
					<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
						<Box className="h-5 w-5 text-primary" />
					</div>
					{item.category && <Badge variant="secondary">{item.category}</Badge>}
				</div>
				<CardTitle className="mt-3 text-base">{item.name}</CardTitle>
				{item.description && <CardDescription className="text-sm">{item.description}</CardDescription>}
			</CardHeader>
			<CardContent>
				<div className="flex items-center justify-between">
					<div className="flex gap-1">
						{item.isFavorite && <span style={{ color: 'var(--entity-favorite)' }}>★</span>}
					</div>
					<span className="text-muted-foreground text-sm">{item.statistics?.imageCount || 0} imágenes</span>
				</div>
			</CardContent>
		</>
	);

	if (isGrid) return <Card>{content}</Card>;

	return (
		<div className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/30">
			<div className="flex items-center gap-3">
				<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
					<Box className="h-5 w-5 text-primary" />
				</div>
				<div>
					<p className="flex items-center gap-2 font-medium">
						{item.name}
						{item.isFavorite && (
							<span className="text-sm" style={{ color: 'var(--entity-favorite)' }}>
								★
							</span>
						)}
					</p>
					{item.description && <p className="text-muted-foreground text-sm">{item.description}</p>}
				</div>
			</div>
			<div className="flex items-center gap-4">
				<span className="text-muted-foreground text-sm">{item.statistics?.imageCount || 0} imágenes</span>
				<div className="flex gap-1">
					<Button onClick={actions.onEdit} size="sm" variant="ghost">
						<Edit2 className="h-4 w-4" />
					</Button>
					<Button onClick={actions.onDelete} size="sm" variant="ghost">
						<Trash2 className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}

function ConceptCard({
	concept,
	actions,
	isGrid,
}: {
	concept: ConceptWithStats;
	actions: CardActions;
	isGrid: boolean;
}) {
	const content = (
		<>
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between">
					<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
						<Book className="h-5 w-5 text-primary" />
					</div>
					{concept.category && <Badge variant="secondary">{concept.category}</Badge>}
				</div>
				<CardTitle className="mt-3 text-base">{concept.name}</CardTitle>
				{concept.description && <CardDescription className="text-sm">{concept.description}</CardDescription>}
			</CardHeader>
			<CardContent>
				<div className="flex items-center justify-between">
					<div className="flex gap-1">
						{concept.isFavorite && <span style={{ color: 'var(--entity-favorite)' }}>★</span>}
					</div>
					<span className="text-muted-foreground text-sm">{concept.statistics?.imageCount || 0} imágenes</span>
				</div>
			</CardContent>
		</>
	);

	if (isGrid) return <Card>{content}</Card>;

	return (
		<div className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/30">
			<div className="flex items-center gap-3">
				<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
					<Book className="h-5 w-5 text-primary" />
				</div>
				<div>
					<p className="flex items-center gap-2 font-medium">
						{concept.name}
						{concept.isFavorite && (
							<span className="text-sm" style={{ color: 'var(--entity-favorite)' }}>
								★
							</span>
						)}
					</p>
					{concept.description && <p className="text-muted-foreground text-sm">{concept.description}</p>}
				</div>
			</div>
			<div className="flex items-center gap-4">
				<span className="text-muted-foreground text-sm">{concept.statistics?.imageCount || 0} imágenes</span>
				<div className="flex gap-1">
					<Button onClick={actions.onEdit} size="sm" variant="ghost">
						<Edit2 className="h-4 w-4" />
					</Button>
					<Button onClick={actions.onDelete} size="sm" variant="ghost">
						<Trash2 className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}

function PromptCard({ prompt, actions, isGrid }: { prompt: PromptWithStats; actions: CardActions; isGrid: boolean }) {
	if (isGrid) {
		return (
			<Card>
				<CardHeader className="pb-3">
					<div className="flex items-center gap-3">
						<FileAudio className="h-5 w-5 text-primary" />
						<CardTitle className="text-base">{prompt.name}</CardTitle>
					</div>
				</CardHeader>
				<CardContent>
					<p className="line-clamp-2 text-muted-foreground text-sm">{prompt.content}</p>
					<div className="mt-4 flex items-center justify-between">
						<span className="text-muted-foreground text-sm">{prompt._count?.images || 0} usos</span>
						<div className="flex gap-1">
							<Button onClick={actions.onEdit} size="sm" variant="ghost">
								<Edit2 className="h-4 w-4" />
							</Button>
							<Button onClick={actions.onDelete} size="sm" variant="ghost">
								<Trash2 className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/30">
			<div className="flex min-w-0 flex-1 items-center gap-3">
				<FileAudio className="h-5 w-5 text-primary" />
				<div className="min-w-0">
					<p className="font-medium">{prompt.name}</p>
					<p className="truncate text-muted-foreground text-sm">{prompt.content}</p>
				</div>
			</div>
			<div className="flex items-center gap-4">
				<span className="text-muted-foreground text-sm">{prompt._count?.images || 0} usos</span>
				<div className="flex gap-1">
					<Button onClick={actions.onEdit} size="sm" variant="ghost">
						<Edit2 className="h-4 w-4" />
					</Button>
					<Button onClick={actions.onDelete} size="sm" variant="ghost">
						<Trash2 className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}

function NoteCard({ note, actions, isGrid }: { note: NoteWithStats; actions: CardActions; isGrid: boolean }) {
	if (isGrid) {
		return (
			<Card>
				<CardHeader className="pb-3">
					<div className="flex items-center gap-3">
						<FileText className="h-5 w-5 text-primary" />
						<CardTitle className="text-base">{note.name}</CardTitle>
					</div>
				</CardHeader>
				<CardContent>
					<p className="line-clamp-2 text-muted-foreground text-sm">{note.content}</p>
					<div className="mt-4 flex items-center justify-between">
						<span className="text-muted-foreground text-sm">
							{note.updatedAt ? new Date(note.updatedAt).toLocaleDateString() : 'Nunca'}
						</span>
						<div className="flex gap-1">
							<Button onClick={actions.onEdit} size="sm" variant="ghost">
								<Edit2 className="h-4 w-4" />
							</Button>
							<Button onClick={actions.onDelete} size="sm" variant="ghost">
								<Trash2 className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/30">
			<div className="flex min-w-0 flex-1 items-center gap-3">
				<FileText className="h-5 w-5 text-primary" />
				<div className="min-w-0">
					<p className="font-medium">{note.name}</p>
					<p className="truncate text-muted-foreground text-sm">{note.content}</p>
				</div>
			</div>
			<div className="flex items-center gap-4">
				<span className="text-muted-foreground text-sm">
					{note.updatedAt ? new Date(note.updatedAt).toLocaleDateString() : 'Nunca'}
				</span>
				<div className="flex gap-1">
					<Button onClick={actions.onEdit} size="sm" variant="ghost">
						<Edit2 className="h-4 w-4" />
					</Button>
					<Button onClick={actions.onDelete} size="sm" variant="ghost">
						<Trash2 className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}

function WildcardCard({
	wildcard,
	actions,
	isGrid,
}: {
	wildcard: WildcardWithStats;
	actions: CardActions;
	isGrid: boolean;
}) {
	const values = wildcard.content?.split(',').slice(0, 5) || [];

	if (isGrid) {
		return (
			<Card>
				<CardHeader className="pb-3">
					<div className="flex items-center gap-3">
						<Sparkles className="h-5 w-5 text-primary" />
						<code className="font-bold text-sm">{wildcard.name}</code>
					</div>
				</CardHeader>
				<CardContent>
					<div className="mb-4 flex flex-wrap gap-1">
						{values.map((v, i) => (
							<Badge className="text-sm" key={i} variant="outline">
								{v.trim()}
							</Badge>
						))}
						{values.length >= 5 && <Badge variant="outline">...</Badge>}
					</div>
					<div className="flex items-center justify-between">
						<span className="text-muted-foreground text-sm">{wildcard._count?.images || 0} usos</span>
						<div className="flex gap-1">
							<Button onClick={actions.onEdit} size="sm" variant="ghost">
								<Edit2 className="h-4 w-4" />
							</Button>
							<Button onClick={actions.onDelete} size="sm" variant="ghost">
								<Trash2 className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/30">
			<div className="flex min-w-0 flex-1 items-center gap-3">
				<Sparkles className="h-5 w-5 text-primary" />
				<div className="min-w-0">
					<code className="font-bold text-sm">{wildcard.name}</code>
					<div className="mt-1 flex flex-wrap gap-1">
						{values.map((v, i) => (
							<Badge className="text-sm" key={i} variant="outline">
								{v.trim()}
							</Badge>
						))}
					</div>
				</div>
			</div>
			<div className="flex items-center gap-4">
				<span className="text-muted-foreground text-sm">{wildcard._count?.images || 0} usos</span>
				<div className="flex gap-1">
					<Button onClick={actions.onEdit} size="sm" variant="ghost">
						<Edit2 className="h-4 w-4" />
					</Button>
					<Button onClick={actions.onDelete} size="sm" variant="ghost">
						<Trash2 className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function WorldbuildingSettingsModern() {
	const [activeEntity, setActiveEntity] = useState<EntityType>('characters');
	const [showForm, setShowForm] = useState(false);
	const [editingItem, setEditingItem] = useState<AnyEntity | null>(null);
	const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
	const [searchQuery, setSearchQuery] = useState('');

	const config = ENTITY_CONFIG[activeEntity];

	// Hooks de datos dinámicos
	const queries = {
		characters: useCharacters({ search: searchQuery }),
		places: usePlaces({ search: searchQuery }),
		items: useWorldItems({ search: searchQuery }),
		concepts: useConcepts({ search: searchQuery }),
		prompts: usePrompts({ search: searchQuery }),
		notes: useNotes({ search: searchQuery }),
		wildcards: useWildcards({ search: searchQuery }),
	};

	const deleteMutations = {
		characters: useDeleteCharacter(),
		places: useDeletePlace(),
		items: useDeleteWorldItem(),
		concepts: useDeleteConcept(),
		prompts: useDeletePrompt(),
		notes: useDeleteNote(),
		wildcards: useDeleteWildcard(),
	};

	const currentQuery = queries[activeEntity];
	const currentDeleteMutation = deleteMutations[activeEntity];
	const items = currentQuery.data?.data || [];
	const isLoading = currentQuery.isLoading;

	// Stats
	const stats = useMemo(() => {
		const total = items.length;
		const favorites = items.filter((i: AnyEntity) => (i as { isFavorite?: boolean }).isFavorite).length;
		const withImages = items.filter(
			(i: AnyEntity) => ((i as { statistics?: { imageCount?: number } }).statistics?.imageCount || 0) > 0
		).length;

		return [
			{ label: 'Total', value: total, icon: config.icon, color: config.color },
			{ label: 'Favoritos', value: favorites, icon: Users, color: 'var(--amber-500)' },
			{ label: 'Con imágenes', value: withImages, icon: config.icon, color: 'var(--primary)' },
		];
	}, [items, config]);

	// Handlers
	const handleCreate = useCallback(() => {
		setEditingItem(null);
		setShowForm(true);
	}, []);

	const handleEdit = useCallback((item: AnyEntity) => {
		setEditingItem(item);
		setShowForm(true);
	}, []);

	const handleSuccess = useCallback(() => {
		setShowForm(false);
		setEditingItem(null);
		toastService.success(editingItem ? 'Actualizado correctamente' : 'Creado correctamente');
	}, [editingItem]);

	const handleDelete = useCallback(
		async (id: string) => {
			try {
				await currentDeleteMutation.mutateAsync(id);
				toastService.success(`${config.singular} eliminado correctamente`);
			} catch (err) {
				toastService.error(`Error al eliminar ${config.singular.toLowerCase()}`);
			}
		},
		[currentDeleteMutation, config.singular]
	);

	// Render del formulario específico según el tipo de entidad
	const renderForm = () => {
		const onCancel = () => setShowForm(false);

		switch (activeEntity) {
			case 'wildcards':
				return (
					<Dialog onOpenChange={setShowForm} open={showForm}>
						<DialogContent className="sm:max-w-[600px]">
							<DialogHeader>
								<DialogTitle>{editingItem ? 'Editar Wildcard' : 'Crear Wildcard'}</DialogTitle>
							</DialogHeader>
							<CreateWildcardForm
								onCancel={onCancel}
								onSubmit={async () => handleSuccess()}
								wildcard={editingItem as WildcardWithStats}
							/>
						</DialogContent>
					</Dialog>
				);
			default: {
				// Para el resto de entidades que usan onCreated/onUpdated
				const FormComponent = config.CreateForm as any;
				return (
					<Dialog onOpenChange={setShowForm} open={showForm}>
						<DialogContent className="sm:max-w-[600px]">
							<DialogHeader>
								<DialogTitle>{editingItem ? `Editar ${config.singular}` : `Crear ${config.singular}`}</DialogTitle>
							</DialogHeader>
							<FormComponent
								{...{ [activeEntity.slice(0, -1)]: editingItem }}
								isEditing={!!editingItem}
								onCancel={onCancel}
								onCreated={handleSuccess}
								onUpdated={handleSuccess}
							/>
						</DialogContent>
					</Dialog>
				);
			}
		}
	};

	// Render de la tarjeta según el tipo de entidad
	const renderCard = (item: AnyEntity, actions: CardActions, isGrid: boolean) => {
		switch (activeEntity) {
			case 'characters':
				return <CharacterCard actions={actions} character={item as CharacterWithStats} isGrid={isGrid} />;
			case 'places':
				return <PlaceCard actions={actions} isGrid={isGrid} place={item as PlaceWithStats} />;
			case 'items':
				return <WorldItemCard actions={actions} isGrid={isGrid} item={item as WorldItemWithStats} />;
			case 'concepts':
				return <ConceptCard actions={actions} concept={item as ConceptWithStats} isGrid={isGrid} />;
			case 'prompts':
				return <PromptCard actions={actions} isGrid={isGrid} prompt={item as PromptWithStats} />;
			case 'notes':
				return <NoteCard actions={actions} isGrid={isGrid} note={item as NoteWithStats} />;
			case 'wildcards':
				return <WildcardCard actions={actions} isGrid={isGrid} wildcard={item as WildcardWithStats} />;
			default:
				return null;
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h2 className="font-semibold text-2xl text-foreground">Worldbuilding</h2>
				<p className="mt-1 text-muted-foreground text-sm">
					Gestiona personajes, lugares, objetos y elementos de tu universo creativo
				</p>
			</div>

			{/* Entity Type Selector */}
			<div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
				{(Object.keys(ENTITY_CONFIG) as EntityType[]).map((type) => {
					const entityConfig = ENTITY_CONFIG[type];
					const Icon = entityConfig.icon;
					const isActive = activeEntity === type;
					const count = queries[type].data?.data?.length || 0;

					return (
						<button
							className={cn(
								'flex flex-col items-center gap-1.5 rounded-lg border p-2.5 transition-all duration-200',
								isActive
									? 'border-primary/40 bg-primary/5'
									: 'border-border/30 bg-muted/30 hover:border-border/50 hover:bg-muted/50'
							)}
							key={type}
							onClick={() => setActiveEntity(type)}
							type="button"
						>
							<div
								className="flex h-7 w-7 items-center justify-center rounded-md"
								style={{ backgroundColor: `color-mix(in oklch, ${entityConfig.color} 15%, transparent)` }}
							>
								<Icon className="h-3.5 w-3.5" style={{ color: entityConfig.color }} />
							</div>
							<span className={cn('font-medium text-xs', isActive ? 'text-primary' : 'text-foreground')}>
								{entityConfig.label}
							</span>
							<Badge className="h-4 px-1.5 text-[10px]" variant="secondary">
								{count}
							</Badge>
						</button>
					);
				})}
			</div>

			{/* Stats */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				{stats.map((stat) => {
					const Icon = stat.icon;
					return (
						<Card
							className="border-l-4"
							key={stat.label}
							style={{ borderLeftColor: `color-mix(in oklch, ${stat.color} 60%, transparent)` }}
						>
							<CardContent className="p-4">
								<div className="flex items-center justify-between">
									<div>
										<p className="font-medium text-muted-foreground text-sm">{stat.label}</p>
										<p className="font-bold text-2xl">{stat.value}</p>
									</div>
									<div
										className="flex h-10 w-10 items-center justify-center rounded-lg"
										style={{ backgroundColor: `color-mix(in oklch, ${stat.color} 12%, transparent)` }}
									>
										<Icon className="h-5 w-5" style={{ color: stat.color }} />
									</div>
								</div>
							</CardContent>
						</Card>
					);
				})}
			</div>

			{/* Toolbar */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="relative max-w-sm">
					<Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<input
						className="w-full rounded-lg border bg-background px-4 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder={`Buscar ${config.label.toLowerCase()}...`}
						type="text"
						value={searchQuery}
					/>
				</div>
				<div className="flex items-center gap-2">
					<div className="flex items-center rounded-lg border p-0.5">
						<Button
							className="h-8 w-8 p-0"
							onClick={() => setViewMode('grid')}
							size="sm"
							variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
						>
							<Grid3X3 className="h-4 w-4" />
						</Button>
						<Button
							className="h-8 w-8 p-0"
							onClick={() => setViewMode('list')}
							size="sm"
							variant={viewMode === 'list' ? 'secondary' : 'ghost'}
						>
							<List className="h-4 w-4" />
						</Button>
					</div>
					<Button className="gap-2" onClick={handleCreate}>
						<Plus className="h-4 w-4" />
						Crear {config.singular}
					</Button>
				</div>
			</div>

			{/* Content */}
			{isLoading ? (
				<div className="flex items-center justify-center p-6">
					<div className="h-8 w-8 animate-spin rounded-full border-primary border-b-2" />
				</div>
			) : items.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-6 text-center">
					<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
						<config.icon className="h-6 w-6 text-muted-foreground" />
					</div>
					<h3 className="font-medium text-lg">No hay {config.label.toLowerCase()}</h3>
					<p className="mt-1 text-muted-foreground text-sm">
						{searchQuery
							? 'No se encontraron resultados'
							: `Comienza creando tu primer ${config.singular.toLowerCase()}`}
					</p>
					<div className="mt-4">
						{searchQuery ? (
							<Button onClick={() => setSearchQuery('')} variant="outline">
								Limpiar búsqueda
							</Button>
						) : (
							<Button onClick={handleCreate}>Crear {config.singular}</Button>
						)}
					</div>
				</div>
			) : (
				<div
					className={
						viewMode === 'grid' ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'flex flex-col gap-2'
					}
				>
					{items.map((item) =>
						renderCard(
							item,
							{ onEdit: () => handleEdit(item), onDelete: () => handleDelete(item.id) },
							viewMode === 'grid'
						)
					)}
				</div>
			)}

			{showForm && renderForm()}
		</div>
	);
}
