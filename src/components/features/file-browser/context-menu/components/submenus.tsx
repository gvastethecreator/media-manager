'use client';

import { Badge } from '@/components/ui/badge';
import { useAlbumStore } from '@/store/entities/album';
import { useCharacterStore } from '@/store/entities/character';
import { useCollectionStore } from '@/store/entities/collection';
import { useConceptStore } from '@/store/entities/concept';
import { useNoteStore } from '@/store/entities/note';
import { usePlaceStore } from '@/store/entities/place';
import { usePromptStore } from '@/store/entities/prompt';
import { useTagStore } from '@/store/entities/tag';
import { useWorldItemStore } from '@/store/entities/world-item';
import type { FileItem } from '@/types/file-item';
import {
	BookmarkPlus,
	Box,
	FileText,
	Heart,
	Lightbulb,
	MapPin,
	MessageSquare,
	Tag as TagIcon,
	User
} from 'lucide-react';
import React from 'react';
import type { ContextMenuAction, LoadingStates } from '../types';
import { EntitySubMenu } from './entity-submenu';

interface SubmenuProps {
	file: FileItem;
	onAction: (action: ContextMenuAction, file: FileItem, data?: Record<string, unknown>) => void;
	loadingStates: LoadingStates;

	onOpenChange: (entity: keyof LoadingStates, isOpen: boolean) => void;
}

// Interfaz base para entidades con nombre e ID
interface EntityWithNameAndId {
	id: string;
	name: string;
	[key: string]: any;
}

// Componente para el submenú de colecciones
export function CollectionsSubmenu({ file, onAction, loadingStates }: SubmenuProps) {
	// Llamar a los hooks directamente a nivel de componente
	const collectionsFromStore = useCollectionStore(state => state.collections || []);
	// Luego podemos memoizar los resultados si es necesario
	const collections = React.useMemo(() =>
		collectionsFromStore as EntityWithNameAndId[],
		[collectionsFromStore]
	);

	return (
		<EntitySubMenu<EntityWithNameAndId>
			title="Añadir a colección"
			icon={<BookmarkPlus className="mr-2 h-4 w-4" />}
			entityName="colección"
			entities={collections}
			isLoading={loadingStates.collections.loading}
			onSelectAction={(collection) => onAction('collection-add', file, { id: collection.id })}
			onCreateAction={() => onAction('collection-create', file)}
			renderItemAction={(collection) => (
				<div className="flex items-center gap-2 w-full">
					<div className="w-3 h-3 rounded" style={{ backgroundColor: collection.color || '#888' }} />
					<span className="flex-1">{collection.name}</span>
				</div>
			)}
		/>
	);
}

// Componente para el submenú de etiquetas
export function TagsSubmenu({ file, onAction, loadingStates }: SubmenuProps) {
	// Llamar al hook directamente
	const tagsFromStore = useTagStore(state => state.tags || {});
	// Luego memoizar los resultados
	const tagsList = React.useMemo(() =>
		Object.values(tagsFromStore) as EntityWithNameAndId[],
		[tagsFromStore]
	);

	return (
		<EntitySubMenu<EntityWithNameAndId>
			title="Añadir etiqueta"
			icon={<TagIcon className="mr-2 h-4 w-4" />}
			entityName="etiqueta"
			entities={tagsList}
			isLoading={loadingStates.tags.loading}
			onSelectAction={(tag) => onAction('tag-add', file, { id: tag.id })}
			onCreateAction={() => onAction('tag-create', file)}
			renderItemAction={(tag) => (
				<div className="flex items-center gap-2 w-full">
					<div className="w-3 h-3 rounded" style={{ backgroundColor: tag.color }} />
					<span className="flex-1">{tag.name}</span>
					{tag.shortcut && (
						<Badge variant="outline" className="text-[10px] h-4 px-1">
							{tag.shortcut}
						</Badge>
					)}
				</div>
			)}
		/>
	);
}

// Componente para el submenú de álbumes
export function AlbumsSubmenu({ file, onAction, loadingStates }: SubmenuProps) {
	// Llamar al hook directamente
	const albumsFromStore = useAlbumStore(state => state.core.albums || {});
	// Luego memoizar los resultados
	const albumsList = React.useMemo(() =>
		Object.values(albumsFromStore) as EntityWithNameAndId[],
		[albumsFromStore]
	);

	return (
		<EntitySubMenu<EntityWithNameAndId>
			title="Añadir a álbum"
			icon={<Heart className="mr-2 h-4 w-4" />}
			entityName="álbum"
			entities={albumsList}
			isLoading={loadingStates.albums.loading}
			onSelectAction={(album) => onAction('album-add', file, { id: album.id })}
			onCreateAction={() => onAction('album-create', file)}
			renderItemAction={(album) => (
				<div className="flex items-center gap-2 w-full">
					<span>📷</span>
					<span className="flex-1">{album.name}</span>
				</div>
			)}
		/>
	);
}

// Componente para el submenú de personajes
export function CharactersSubmenu({ file, onAction, loadingStates }: SubmenuProps) {
	// Llamar al hook directamente
	const charactersObj = useCharacterStore(state => state.characters || {});
	// Luego memoizar los resultados
	const characters = React.useMemo(() =>
		Object.values(charactersObj) as EntityWithNameAndId[],
		[charactersObj]
	);

	return (
		<EntitySubMenu<EntityWithNameAndId>
			title="Añadir a personaje"
			icon={<User className="mr-2 h-4 w-4" />}
			entityName="personaje"
			entities={characters}
			isLoading={loadingStates.characters.loading}
			onSelectAction={(character) => onAction('character-add', file, { id: character.id })}
			onCreateAction={() => onAction('character-create', file)}
			renderItemAction={(character) => (
				<div className="flex items-center gap-2 w-full">
					<span>{character.emoji || '👤'}</span>
					<span className="flex-1">{character.name}</span>
				</div>
			)}
		/>
	);
}

// Componente para el submenú de lugares
export function PlacesSubmenu({ file, onAction, loadingStates }: SubmenuProps) {
	// Llamar al hook directamente
	const placesFromStore = usePlaceStore(state => state.places);
	// Luego memoizar los resultados
	const places = React.useMemo(() =>
		placesFromStore as EntityWithNameAndId[],
		[placesFromStore]
	);

	return (
		<EntitySubMenu<EntityWithNameAndId>
			title="Añadir a lugar"
			icon={<MapPin className="mr-2 h-4 w-4" />}
			entityName="lugar"
			entities={places}
			isLoading={loadingStates.places.loading}
			onSelectAction={(place) => onAction('place-add', file, { id: place.id })}
			onCreateAction={() => onAction('place-create', file)}
			renderItemAction={(place) => (
				<div className="flex items-center gap-2 w-full">
					<span>{place.emoji || '📍'}</span>
					<span className="flex-1">{place.name}</span>
				</div>
			)}
		/>
	);
}

// Componente para el submenú de objetos del mundo
export function WorldItemsSubmenu({ file, onAction, loadingStates }: SubmenuProps) {
	// Llamar al hook directamente
	const worldItemsObj = useWorldItemStore(state => state.worldItems || {});
	// Luego memoizar los resultados
	const worldItems = React.useMemo(() =>
		Object.values(worldItemsObj) as EntityWithNameAndId[],
		[worldItemsObj]
	);

	return (
		<EntitySubMenu<EntityWithNameAndId>
			title="Añadir a objeto"
			icon={<Box className="mr-2 h-4 w-4" />}
			entityName="objeto del mundo"
			entities={worldItems}
			isLoading={loadingStates.worldItems.loading}
			onSelectAction={(worldItem) => onAction('world-item-add', file, { id: worldItem.id })}
			onCreateAction={() => onAction('world-item-create', file)}
			renderItemAction={(worldItem) => (
				<div className="flex items-center gap-2 w-full">
					<span>{worldItem.emoji || '📦'}</span>
					<span className="flex-1">{worldItem.name}</span>
				</div>
			)}
		/>
	);
}

// Componente para el submenú de prompts
export function PromptsSubmenu({ file, onAction, loadingStates }: SubmenuProps) {
	// Llamar al hook directamente
	const promptsObj = usePromptStore(state => state.prompts || {});
	// Luego memoizar los resultados
	const prompts = React.useMemo(() =>
		Object.values(promptsObj) as EntityWithNameAndId[],
		[promptsObj]
	);

	return (
		<EntitySubMenu<EntityWithNameAndId>
			title="Añadir prompt"
			icon={<MessageSquare className="mr-2 h-4 w-4" />}
			entityName="prompt"
			entities={prompts}
			isLoading={loadingStates.prompts.loading}
			onSelectAction={(prompt) => onAction('prompt-add', file, { id: prompt.id })}
			onCreateAction={() => onAction('prompt-create', file)}
			renderItemAction={(prompt) => (
				<div className="flex items-center gap-2 w-full">
					<span>{prompt.emoji || '💬'}</span>
					<span className="flex-1">{prompt.name}</span>
				</div>
			)}
		/>
	);
}

// Componente para el submenú de notas
export function NotesSubmenu({ file, onAction, loadingStates }: SubmenuProps) {
	// Llamar al hook directamente
	const notesFromStore = useNoteStore(state => state.notes || []);
	// Luego memoizar los resultados
	const notesList = React.useMemo(() =>
		notesFromStore.map(note => ({
			name: note.title || 'Sin título',
			...note
		})) as EntityWithNameAndId[],
		[notesFromStore]);

	return (
		<EntitySubMenu<EntityWithNameAndId>
			title="Añadir nota"
			icon={<FileText className="mr-2 h-4 w-4" />}
			entityName="nota"
			entities={notesList}
			isLoading={loadingStates.notes.loading}
			onSelectAction={(note) => onAction('note-add', file, { id: note.id })}
			onCreateAction={() => onAction('note-create', file)}
			renderItemAction={(note) => (
				<div className="flex items-center gap-2 w-full">
					<span className="flex-1">{note.title || note.name}</span>
				</div>
			)}
		/>
	);
}

// Componente para el submenú de conceptos
export function ConceptsSubmenu({ file, onAction, loadingStates }: SubmenuProps) {
	// Llamar al hook directamente
	const conceptsObj = useConceptStore(state => state.concepts || {});
	// Luego memoizar los resultados
	const concepts = React.useMemo(() =>
		Object.values(conceptsObj) as EntityWithNameAndId[],
		[conceptsObj]
	);

	return (
		<EntitySubMenu<EntityWithNameAndId>
			title="Añadir concepto"
			icon={<Lightbulb className="mr-2 h-4 w-4" />}
			entityName="concepto"
			entities={concepts}
			isLoading={loadingStates.concepts.loading}
			onSelectAction={(concept) => onAction('concept-add', file, { id: concept.id })}
			onCreateAction={() => onAction('concept-create', file)}
			renderItemAction={(concept) => (
				<div className="flex items-center gap-2 w-full">
					<span>{concept.emoji || '💡'}</span>
					<span className="flex-1">{concept.name}</span>
				</div>
			)}
		/>
	);
}
