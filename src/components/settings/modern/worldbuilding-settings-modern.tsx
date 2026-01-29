/**
 * @file Modern Worldbuilding Settings
 * @module components/settings/modern/worldbuilding-settings-modern
 * @description Configuración de worldbuilding: personajes, lugares, objetos, conceptos, prompts, notas y wildcards
 */

import {
	Users,
	Globe,
	Box,
	Book,
	FileAudio,
	FileText,
	Sparkles,
	Edit2,
	Trash2,
	Grid3X3,
	List,
	Plus,
	Search,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCharacters, useDeleteCharacter } from '@/lib/api/characters';
import { usePlaces, useDeletePlace } from '@/lib/api/places';
import { useWorldItems, useDeleteWorldItem } from '@/lib/api/world-items';
import { useConcepts, useDeleteConcept } from '@/lib/api/concepts';
import { usePrompts, useDeletePrompt } from '@/lib/api/prompts';
import { useNotes, useDeleteNote } from '@/lib/api/notes';
import { useWildcards, useDeleteWildcard } from '@/lib/api/wildcards';
import { toastService } from '@/lib/ui/toast';
import type { CharacterWithStats } from '@/types/entities/character';
import type { PlaceWithStats } from '@/types/entities/place';
import type { WorldItemWithStats } from '@/types/entities/world-item';
import type { ConceptWithStats } from '@/types/entities/concept';
import type { PromptWithStats } from '@/types/entities/prompt';
import type { NoteWithStats } from '@/types/entities/note';
import type { WildcardWithStats } from '@/types/entities/wildcard';
import { CreateCharacterForm } from '../characters/create-character-form';
import { CreatePlaceForm } from '../places/create-place-form';
import { CreateWorldItemForm } from '../world-items/create-world-item-form';
import { CreateConceptForm } from '../concepts/create-concept-form';
import { CreatePromptForm } from '../prompts/create-prompt-form';
import { CreateNoteForm } from '../notes/create-note-form';
import { CreateWildcardForm } from '../wildcards/create-wildcard-form';
import type { CardActions } from '../common/entity-settings-view';

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
				<CardTitle className="text-base mt-3">{character.name}</CardTitle>
				{character.description && (
					<CardDescription className="text-xs">{character.description}</CardDescription>
				)}
			</CardHeader>
			<CardContent>
				<div className="flex items-center justify-between">
					<div className="flex gap-1">
						{character.isFavorite && <span className="text-amber-400">★</span>}
					</div>
					<span className="text-sm text-muted-foreground">
						{character.statistics?.imageCount || 0} imágenes
					</span>
				</div>
			</CardContent>
		</>
	);

	if (isGrid) return <Card>{content}</Card>;

	return (
		<div className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/30 transition-colors">
			<div className="flex items-center gap-3">
				<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
					<Users className="h-5 w-5 text-primary" />
				</div>
				<div>
					<p className="font-medium flex items-center gap-2">
						{character.name}
						{character.isFavorite && <span className="text-amber-400 text-sm">★</span>}
					</p>
					{character.description && (
						<p className="text-sm text-muted-foreground">{character.description}</p>
					)}
				</div>
			</div>
			<div className="flex items-center gap-4">
				<span className="text-sm text-muted-foreground">
					{character.statistics?.imageCount || 0} imágenes
				</span>
				<div className="flex gap-1">
					<Button variant="ghost" size="sm" onClick={actions.onEdit}>
						<Edit2 className="h-4 w-4" />
					</Button>
					<Button variant="ghost" size="sm" onClick={actions.onDelete}>
						<Trash2 className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}

function PlaceCard({
	place,
	actions,
	isGrid,
}: {
	place: PlaceWithStats;
	actions: CardActions;
	isGrid: boolean;
}) {
	const content = (
		<>
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between">
					<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
						<Globe className="h-5 w-5 text-primary" />
					</div>
					{place.category && <Badge variant="secondary">{place.category}</Badge>}
				</div>
				<CardTitle className="text-base mt-3">{place.name}</CardTitle>
				{place.description && <CardDescription className="text-xs">{place.description}</CardDescription>}
			</CardHeader>
			<CardContent>
				<div className="flex items-center justify-between">
					<div className="flex gap-1">
						{place.isFavorite && <span className="text-amber-400">★</span>}
					</div>
					<span className="text-sm text-muted-foreground">{place.statistics?.imageCount || 0} imágenes</span>
				</div>
			</CardContent>
		</>
	);

	if (isGrid) return <Card>{content}</Card>;

	return (
		<div className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/30 transition-colors">
			<div className="flex items-center gap-3">
				<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
					<Globe className="h-5 w-5 text-primary" />
				</div>
				<div>
					<p className="font-medium flex items-center gap-2">
						{place.name}
						{place.isFavorite && <span className="text-amber-400 text-sm">★</span>}
					</p>
					{place.description && <p className="text-sm text-muted-foreground">{place.description}</p>}
				</div>
			</div>
			<div className="flex items-center gap-4">
				<span className="text-sm text-muted-foreground">{place.statistics?.imageCount || 0} imágenes</span>
				<div className="flex gap-1">
					<Button variant="ghost" size="sm" onClick={actions.onEdit}>
						<Edit2 className="h-4 w-4" />
					</Button>
					<Button variant="ghost" size="sm" onClick={actions.onDelete}>
						<Trash2 className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}

function WorldItemCard({
	item,
	actions,
	isGrid,
}: {
	item: WorldItemWithStats;
	actions: CardActions;
	isGrid: boolean;
}) {
	const content = (
		<>
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between">
					<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
						<Box className="h-5 w-5 text-primary" />
					</div>
					{item.category && <Badge variant="secondary">{item.category}</Badge>}
				</div>
				<CardTitle className="text-base mt-3">{item.name}</CardTitle>
				{item.description && <CardDescription className="text-xs">{item.description}</CardDescription>}
			</CardHeader>
			<CardContent>
				<div className="flex items-center justify-between">
					<div className="flex gap-1">
						{item.isFavorite && <span className="text-amber-400">★</span>}
					</div>
					<span className="text-sm text-muted-foreground">{item.statistics?.imageCount || 0} imágenes</span>
				</div>
			</CardContent>
		</>
	);

	if (isGrid) return <Card>{content}</Card>;

	return (
		<div className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/30 transition-colors">
			<div className="flex items-center gap-3">
				<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
					<Box className="h-5 w-5 text-primary" />
				</div>
				<div>
					<p className="font-medium flex items-center gap-2">
						{item.name}
						{item.isFavorite && <span className="text-amber-400 text-sm">★</span>}
					</p>
					{item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
				</div>
			</div>
			<div className="flex items-center gap-4">
				<span className="text-sm text-muted-foreground">{item.statistics?.imageCount || 0} imágenes</span>
				<div className="flex gap-1">
					<Button variant="ghost" size="sm" onClick={actions.onEdit}>
						<Edit2 className="h-4 w-4" />
					</Button>
					<Button variant="ghost" size="sm" onClick={actions.onDelete}>
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
				<CardTitle className="text-base mt-3">{concept.name}</CardTitle>
				{concept.description && <CardDescription className="text-xs">{concept.description}</CardDescription>}
			</CardHeader>
			<CardContent>
				<div className="flex items-center justify-between">
					<div className="flex gap-1">
						{concept.isFavorite && <span className="text-amber-400">★</span>}
					</div>
					<span className="text-sm text-muted-foreground">{concept.statistics?.imageCount || 0} imágenes</span>
				</div>
			</CardContent>
		</>
	);

	if (isGrid) return <Card>{content}</Card>;

	return (
		<div className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/30 transition-colors">
			<div className="flex items-center gap-3">
				<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
					<Book className="h-5 w-5 text-primary" />
				</div>
				<div>
					<p className="font-medium flex items-center gap-2">
						{concept.name}
						{concept.isFavorite && <span className="text-amber-400 text-sm">★</span>}
					</p>
					{concept.description && <p className="text-sm text-muted-foreground">{concept.description}</p>}
				</div>
			</div>
			<div className="flex items-center gap-4">
				<span className="text-sm text-muted-foreground">{concept.statistics?.imageCount || 0} imágenes</span>
				<div className="flex gap-1">
					<Button variant="ghost" size="sm" onClick={actions.onEdit}>
						<Edit2 className="h-4 w-4" />
					</Button>
					<Button variant="ghost" size="sm" onClick={actions.onDelete}>
						<Trash2 className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}

function PromptCard({
	prompt,
	actions,
	isGrid,
}: {
	prompt: PromptWithStats;
	actions: CardActions;
	isGrid: boolean;
}) {
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
					<p className="text-sm text-muted-foreground line-clamp-2">{prompt.content}</p>
					<div className="flex items-center justify-between mt-4">
						<span className="text-sm text-muted-foreground">
							{prompt._count?.images || 0} usos
						</span>
						<div className="flex gap-1">
							<Button variant="ghost" size="sm" onClick={actions.onEdit}>
								<Edit2 className="h-4 w-4" />
							</Button>
							<Button variant="ghost" size="sm" onClick={actions.onDelete}>
								<Trash2 className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/30 transition-colors">
			<div className="flex items-center gap-3 flex-1 min-w-0">
				<FileAudio className="h-5 w-5 text-primary" />
				<div className="min-w-0">
					<p className="font-medium">{prompt.name}</p>
					<p className="text-sm text-muted-foreground truncate">{prompt.content}</p>
				</div>
			</div>
			<div className="flex items-center gap-4">
				<span className="text-sm text-muted-foreground">{prompt._count?.images || 0} usos</span>
				<div className="flex gap-1">
					<Button variant="ghost" size="sm" onClick={actions.onEdit}>
						<Edit2 className="h-4 w-4" />
					</Button>
					<Button variant="ghost" size="sm" onClick={actions.onDelete}>
						<Trash2 className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}

function NoteCard({
	note,
	actions,
	isGrid,
}: {
	note: NoteWithStats;
	actions: CardActions;
	isGrid: boolean;
}) {
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
					<p className="text-sm text-muted-foreground line-clamp-2">{note.content}</p>
					<div className="flex items-center justify-between mt-4">
						<span className="text-sm text-muted-foreground">
							{note.updatedAt ? new Date(note.updatedAt).toLocaleDateString() : 'Nunca'}
						</span>
						<div className="flex gap-1">
							<Button variant="ghost" size="sm" onClick={actions.onEdit}>
								<Edit2 className="h-4 w-4" />
							</Button>
							<Button variant="ghost" size="sm" onClick={actions.onDelete}>
								<Trash2 className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/30 transition-colors">
			<div className="flex items-center gap-3 flex-1 min-w-0">
				<FileText className="h-5 w-5 text-primary" />
				<div className="min-w-0">
					<p className="font-medium">{note.name}</p>
					<p className="text-sm text-muted-foreground truncate">{note.content}</p>
				</div>
			</div>
			<div className="flex items-center gap-4">
				<span className="text-sm text-muted-foreground">
					{note.updatedAt ? new Date(note.updatedAt).toLocaleDateString() : 'Nunca'}
				</span>
				<div className="flex gap-1">
					<Button variant="ghost" size="sm" onClick={actions.onEdit}>
						<Edit2 className="h-4 w-4" />
					</Button>
					<Button variant="ghost" size="sm" onClick={actions.onDelete}>
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
						<code className="text-sm font-bold">{wildcard.name}</code>
					</div>
				</CardHeader>
				<CardContent>
					<div className="flex flex-wrap gap-1 mb-4">
						{values.map((v, i) => (
							<Badge key={i} variant="outline" className="text-xs">
								{v.trim()}
							</Badge>
						))}
						{values.length >= 5 && <Badge variant="outline">...</Badge>}
					</div>
					<div className="flex items-center justify-between">
						<span className="text-sm text-muted-foreground">{wildcard._count?.images || 0} usos</span>
						<div className="flex gap-1">
							<Button variant="ghost" size="sm" onClick={actions.onEdit}>
								<Edit2 className="h-4 w-4" />
							</Button>
							<Button variant="ghost" size="sm" onClick={actions.onDelete}>
								<Trash2 className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/30 transition-colors">
			<div className="flex items-center gap-3 flex-1 min-w-0">
				<Sparkles className="h-5 w-5 text-primary" />
				<div className="min-w-0">
					<code className="text-sm font-bold">{wildcard.name}</code>
					<div className="flex flex-wrap gap-1 mt-1">
						{values.map((v, i) => (
							<Badge key={i} variant="outline" className="text-xs">
								{v.trim()}
							</Badge>
						))}
					</div>
				</div>
			</div>
			<div className="flex items-center gap-4">
				<span className="text-sm text-muted-foreground">{wildcard._count?.images || 0} usos</span>
				<div className="flex gap-1">
					<Button variant="ghost" size="sm" onClick={actions.onEdit}>
						<Edit2 className="h-4 w-4" />
					</Button>
					<Button variant="ghost" size="sm" onClick={actions.onDelete}>
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
		const withImages = items.filter((i: AnyEntity) =>
			((i as { statistics?: { imageCount?: number } }).statistics?.imageCount || 0) > 0
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
					<Dialog open={showForm} onOpenChange={setShowForm}>
						<DialogContent className="sm:max-w-[600px]">
							<DialogHeader>
								<DialogTitle>{editingItem ? 'Editar Wildcard' : 'Crear Wildcard'}</DialogTitle>
							</DialogHeader>
							<CreateWildcardForm
								wildcard={editingItem as WildcardWithStats}
								onSubmit={async () => handleSuccess()}
								onCancel={onCancel}
							/>
						</DialogContent>
					</Dialog>
				);
			default: {
				// Para el resto de entidades que usan onCreated/onUpdated
				const FormComponent = config.CreateForm as any;
				return (
					<Dialog open={showForm} onOpenChange={setShowForm}>
						<DialogContent className="sm:max-w-[600px]">
							<DialogHeader>
								<DialogTitle>
									{editingItem ? `Editar ${config.singular}` : `Crear ${config.singular}`}
								</DialogTitle>
							</DialogHeader>
							<FormComponent
								{...{ [activeEntity.slice(0, -1)]: editingItem }}
								isEditing={!!editingItem}
								onCreated={handleSuccess}
								onUpdated={handleSuccess}
								onCancel={onCancel}
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
				return <CharacterCard character={item as CharacterWithStats} actions={actions} isGrid={isGrid} />;
			case 'places':
				return <PlaceCard place={item as PlaceWithStats} actions={actions} isGrid={isGrid} />;
			case 'items':
				return <WorldItemCard item={item as WorldItemWithStats} actions={actions} isGrid={isGrid} />;
			case 'concepts':
				return <ConceptCard concept={item as ConceptWithStats} actions={actions} isGrid={isGrid} />;
			case 'prompts':
				return <PromptCard prompt={item as PromptWithStats} actions={actions} isGrid={isGrid} />;
			case 'notes':
				return <NoteCard note={item as NoteWithStats} actions={actions} isGrid={isGrid} />;
			case 'wildcards':
				return <WildcardCard wildcard={item as WildcardWithStats} actions={actions} isGrid={isGrid} />;
			default:
				return null;
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h2 className="text-2xl font-semibold text-foreground">Worldbuilding</h2>
				<p className="mt-1 text-sm text-muted-foreground">
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
							key={type}
							onClick={() => setActiveEntity(type)}
							className={`
								flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all
								${isActive ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/30 hover:bg-muted/50'}
							`}
						>
							<div
								className="flex h-8 w-8 items-center justify-center rounded-lg"
								style={{ backgroundColor: `${entityConfig.color}20` }}
							>
								<Icon className="h-4 w-4" style={{ color: entityConfig.color }} />
							</div>
							<span className={`text-xs font-medium ${isActive ? 'text-primary' : ''}`}>
								{entityConfig.label}
							</span>
							<Badge variant="secondary" className="text-[10px]">
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
						<Card key={stat.label} className="border-l-4" style={{ borderLeftColor: stat.color }}>
							<CardContent className="p-4">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
										<p className="text-2xl font-bold">{stat.value}</p>
									</div>
									<div
										className="flex h-10 w-10 items-center justify-center rounded-lg"
										style={{ backgroundColor: `${stat.color}20` }}
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
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<input
						type="text"
						placeholder={`Buscar ${config.label.toLowerCase()}...`}
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full px-4 py-2 pl-10 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
					/>
				</div>
				<div className="flex items-center gap-2">
					<div className="flex items-center border rounded-lg p-0.5">
						<Button
							variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
							size="sm"
							className="h-8 w-8 p-0"
							onClick={() => setViewMode('grid')}
						>
							<Grid3X3 className="h-4 w-4" />
						</Button>
						<Button
							variant={viewMode === 'list' ? 'secondary' : 'ghost'}
							size="sm"
							className="h-8 w-8 p-0"
							onClick={() => setViewMode('list')}
						>
							<List className="h-4 w-4" />
						</Button>
					</div>
					<Button onClick={handleCreate} className="gap-2">
						<Plus className="h-4 w-4" />
						Crear {config.singular}
					</Button>
				</div>
			</div>

			{/* Content */}
			{isLoading ? (
				<div className="flex items-center justify-center p-12">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
				</div>
			) : items.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-12 text-center">
					<div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
						<config.icon className="h-6 w-6 text-muted-foreground" />
					</div>
					<h3 className="text-lg font-medium">No hay {config.label.toLowerCase()}</h3>
					<p className="text-sm text-muted-foreground mt-1">
						{searchQuery
							? 'No se encontraron resultados'
							: `Comienza creando tu primer ${config.singular.toLowerCase()}`}
					</p>
					<div className="mt-4">
						{searchQuery ? (
							<Button variant="outline" onClick={() => setSearchQuery('')}>
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
						viewMode === 'grid'
							? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
							: 'flex flex-col gap-2'
					}
				>
					{items.map((item) =>
						renderCard(item, { onEdit: () => handleEdit(item), onDelete: () => handleDelete(item.id) }, viewMode === 'grid')
					)}
				</div>
			)}

			{showForm && renderForm()}
		</div>
	);
}
