'use client';

import { Badge } from '@/components/ui/badge';
import { useAlbumsStore } from '@/store/entities/albums.store';
import { useCharactersStore } from '@/store/entities/characters.store';
import { useCollectionsStore } from '@/store/entities/collections.store';
import { useConceptStore } from '@/store/entities/concept.store';
import { useNoteStore } from '@/store/entities/note.store';
import { useTagsStore } from '@/store/entities/tags.store';
import { useObjectsStore } from '@/store/objects.store';
import { usePlacesStore } from '@/store/places.store';
import { usePromptStore } from '@/store/prompt.store';
import type { FileItem } from '@/types/file-item';
import {
	BookmarkPlus,
	Box,
	FileText,
	Heart,
	Lightbulb,
	MapPin,
	MessageSquare,
	Palette,
	Tag as TagIcon,
	User,
} from 'lucide-react';
import type { ContextMenuAction, LoadingStates } from '../types';
import { EntitySubMenu } from './entity-submenu';

interface SubmenuProps {
	file: FileItem;
	onAction: (action: ContextMenuAction, file: FileItem, data?: Record<string, unknown>) => void;
	loadingStates: LoadingStates;
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	onOpenChange: (entity: keyof LoadingStates, isOpen: boolean) => void;
}

// Componente para el submenú de colecciones
export function CollectionsSubmenu({ file, onAction, loadingStates }: SubmenuProps) {
	const { collections } = useCollectionsStore();

	return (
		<EntitySubMenu
			title="Añadir a colección"
			icon={<BookmarkPlus className="mr-2 h-4 w-4" />}
			entityName="colección"
			entities={collections}
			isLoading={loadingStates.collections.loading}
			onSelect={(collection) => onAction('collection-add', file, { id: collection.id })}
			onCreate={() => onAction('collection-create', file)}
			renderItem={(collection) => (
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
	const { tags } = useTagsStore();

	return (
		<EntitySubMenu
			title="Añadir etiqueta"
			icon={<TagIcon className="mr-2 h-4 w-4" />}
			entityName="etiqueta"
			entities={tags}
			isLoading={loadingStates.tags.loading}
			onSelect={(tag) => onAction('tag-add', file, { id: tag.id })}
			onCreate={() => onAction('tag-create', file)}
			renderItem={(tag) => (
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
	const { albums } = useAlbumsStore();

	return (
		<EntitySubMenu
			title="Añadir a álbum"
			icon={<Heart className="mr-2 h-4 w-4" />}
			entityName="álbum"
			entities={albums}
			isLoading={loadingStates.albums.loading}
			onSelect={(album) => onAction('album-add', file, { id: album.id })}
			onCreate={() => onAction('album-create', file)}
			renderItem={(album) => (
				<div className="flex items-center gap-2 w-full">
					<span>{album.emoji || '📷'}</span>
					<span className="flex-1">{album.name}</span>
				</div>
			)}
		/>
	);
}

// Componente para el submenú de personajes
export function CharactersSubmenu({ file, onAction, loadingStates }: SubmenuProps) {
	const { characters } = useCharactersStore();

	return (
		<EntitySubMenu
			title="Añadir a personaje"
			icon={<User className="mr-2 h-4 w-4" />}
			entityName="personaje"
			entities={characters}
			isLoading={loadingStates.characters.loading}
			onSelect={(character) => onAction('character-add', file, { id: character.id })}
			onCreate={() => onAction('character-create', file)}
			renderItem={(character) => (
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
	const { places } = usePlacesStore();

	return (
		<EntitySubMenu
			title="Añadir a lugar"
			icon={<MapPin className="mr-2 h-4 w-4" />}
			entityName="lugar"
			entities={places}
			isLoading={loadingStates.places.loading}
			onSelect={(place) => onAction('place-add', file, { id: place.id })}
			onCreate={() => onAction('place-create', file)}
			renderItem={(place) => (
				<div className="flex items-center gap-2 w-full">
					<span>{place.emoji || '📍'}</span>
					<span className="flex-1">{place.name}</span>
				</div>
			)}
		/>
	);
}

// Componente para el submenú de objetos
export function ObjectsSubmenu({ file, onAction, loadingStates }: SubmenuProps) {
	const { objects } = useObjectsStore();

	return (
		<EntitySubMenu
			title="Añadir a objeto"
			icon={<Box className="mr-2 h-4 w-4" />}
			entityName="objeto"
			entities={objects}
			isLoading={loadingStates.objects.loading}
			onSelect={(object) => onAction('object-add', file, { id: object.id })}
			onCreate={() => onAction('object-create', file)}
			renderItem={(object) => (
				<div className="flex items-center gap-2 w-full">
					<span>{object.emoji || '📦'}</span>
					<span className="flex-1">{object.name}</span>
				</div>
			)}
		/>
	);
}

// Componente para el submenú de prompts
export function PromptsSubmenu({ file, onAction, loadingStates }: SubmenuProps) {
	const { prompts } = usePromptStore();

	return (
		<EntitySubMenu
			title="Añadir prompt"
			icon={<MessageSquare className="mr-2 h-4 w-4" />}
			entityName="prompt"
			entities={prompts}
			isLoading={loadingStates.prompts.loading}
			onSelect={(prompt) => onAction('prompt-add', file, { id: prompt.id })}
			onCreate={() => onAction('prompt-create', file)}
			renderItem={(prompt) => (
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
	const { notes } = useNoteStore();

	return (
		<EntitySubMenu
			title="Añadir nota"
			icon={<FileText className="mr-2 h-4 w-4" />}
			entityName="nota"
			entities={notes}
			isLoading={loadingStates.notes.loading}
			onSelect={(note) => onAction('note-add', file, { id: note.id })}
			onCreate={() => onAction('note-create', file)}
			renderItem={(note) => (
				<div className="flex items-center gap-2 w-full">
					<span className="flex-1">{note.title}</span>
				</div>
			)}
		/>
	);
}

// Componente para el submenú de conceptos
export function ConceptsSubmenu({ file, onAction, loadingStates }: SubmenuProps) {
	const { concepts } = useConceptStore();

	return (
		<EntitySubMenu
			title="Añadir concepto"
			icon={<Lightbulb className="mr-2 h-4 w-4" />}
			entityName="concepto"
			entities={concepts}
			isLoading={loadingStates.concepts.loading}
			onSelect={(concept) => onAction('concept-add', file, { id: concept.id })}
			onCreate={() => onAction('concept-create', file)}
			renderItem={(concept) => (
				<div className="flex items-center gap-2 w-full">
					<span>{concept.emoji || '💡'}</span>
					<span className="flex-1">{concept.name}</span>
				</div>
			)}
		/>
	);
}
