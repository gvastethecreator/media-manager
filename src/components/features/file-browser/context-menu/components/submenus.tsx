'use client';

import { useNavigationStore } from '@/components/navigation/navigation.store';
import { Badge } from '@/components/ui/badge';
import { clientLogger } from '@/lib/logger/client-logger';
import { useAlbumStore } from '@/store/entities/album';
import { useCollectionStore } from '@/store/entities/collection';
import { useTagStore } from '@/store/entities/tag';
import type { FileItem } from '@/types/file-item';
import {
	BookmarkPlus,
	Box,
	Laptop,
	Lightbulb,
	MapPin,
	Sparkles,
	StickyNote,
	Tag as TagIcon,
	User
} from 'lucide-react';
import { memo } from 'react';
import { useEntityLoader } from '../hooks/use-entity-loader';
import type { ContextMenuAction, LoadingStates } from '../types';
import { EntitySubMenu } from './entity-submenu';

// Logger para el componente
const submenuLogger = clientLogger.withContext('ContextSubmenu');

interface SubmenuProps {
	file: FileItem;
	onAction: (action: ContextMenuAction, file: FileItem, data?: Record<string, unknown>) => void;
	loadingStates: LoadingStates;
	onOpenChange: (entity: keyof LoadingStates, isOpen: boolean) => void;
}

// En NavigationStore, extender la interfaz
declare module '@/components/navigation/navigation.store' {
	interface NavigationState {
		openCollectionCreator?: (isOpen: boolean) => void;
		openTagCreator?: (isOpen: boolean) => void;
		openAlbumCreator?: (isOpen: boolean) => void;
	}
}

// Componente para el submenú de colecciones
export const CollectionsSubmenu = memo(function CollectionsSubmenu({
	file,
	onAction,
	loadingStates,
	onOpenChange,
}: SubmenuProps) {
	const collectionStore = useCollectionStore();
	const { loadEntityData } = useEntityLoader();
	// Usar as para hacer type assertion sin modificar el tipo base
	const navigation = useNavigationStore() as any;

	return (
		<EntitySubMenu
			title="Colecciones"
			icon={<Box className="mr-2 h-4 w-4" />}
			entityName="collections"
			entities={collectionStore.collections || []}
			isLoading={loadingStates.collections.loading}
			hasError={loadingStates.collections.hasError || false}
			loadedCount={loadingStates.collections.loadedCount}
			onSelectAction={(collection: any) => onAction('collection-add', file, { collection })}
			onCreateAction={() => {
				if (navigation.openCollectionCreator) {
					navigation.openCollectionCreator(true);
				}
				onAction('collection-create', file);
			}}
			renderItemAction={(collection: any) => (
				<>
					<Box className="mr-2 h-4 w-4" />
					{collection.name}
				</>
			)}
			onOpenChange={(open) => onOpenChange('collections', open)}
		/>
	);
});

// Componente para el submenú de etiquetas
export const TagsSubmenu = memo(function TagsSubmenu({
	file,
	onAction,
	loadingStates,
	onOpenChange
}: SubmenuProps) {
	const tagStore = useTagStore();
	const { loadEntityData } = useEntityLoader();
	// Usar as para hacer type assertion sin modificar el tipo base
	const navigation = useNavigationStore() as any;

	return (
		<EntitySubMenu
			title="Etiquetas"
			icon={<TagIcon className="mr-2 h-4 w-4" />}
			entityName="tags"
			entities={tagStore.tags || []}
			isLoading={loadingStates.tags.loading}
			hasError={loadingStates.tags.hasError || false}
			loadedCount={loadingStates.tags.loadedCount}
			onSelectAction={(tag: any) => onAction('tag-add', file, { tag })}
			onCreateAction={() => {
				if (navigation.openTagCreator) {
					navigation.openTagCreator(true);
				}
				onAction('tag-create', file);
			}}
			renderItemAction={(tag: any) => (
				<>
					<TagIcon className="mr-2 h-4 w-4" />
					<Badge variant="outline" className="truncate max-w-[160px]">
						{tag.name}
					</Badge>
				</>
			)}
			onOpenChange={(open) => onOpenChange('tags', open)}
		/>
	);
});

// Componente para el submenú de álbumes
export const AlbumsSubmenu = memo(function AlbumsSubmenu({
	file,
	onAction,
	loadingStates,
	onOpenChange
}: SubmenuProps) {
	const albumStore = useAlbumStore();
	const { loadEntityData } = useEntityLoader();
	// Usar as para hacer type assertion sin modificar el tipo base
	const navigation = useNavigationStore() as any;

	// Obtener los álbumes usando el método getter del store
	const albums = albumStore.getAlbums ? albumStore.getAlbums() : [];

	return (
		<EntitySubMenu
			title="Álbumes"
			icon={<BookmarkPlus className="mr-2 h-4 w-4" />}
			entityName="albums"
			entities={albums}
			isLoading={loadingStates.albums.loading}
			hasError={loadingStates.albums.hasError || false}
			loadedCount={loadingStates.albums.loadedCount}
			onSelectAction={(album: any) => onAction('album-add', file, { album })}
			onCreateAction={() => {
				if (navigation.openAlbumCreator) {
					navigation.openAlbumCreator(true);
				}
				onAction('album-create', file);
			}}
			renderItemAction={(album: any) => (
				<>
					<BookmarkPlus className="mr-2 h-4 w-4" />
					{album.name}
				</>
			)}
			onOpenChange={(open) => onOpenChange('albums', open)}
		/>
	);
});

// Componente para el submenú de personajes
export const CharactersSubmenu = memo(function CharactersSubmenu({
	file,
	onAction,
	loadingStates,
	onOpenChange
}: SubmenuProps) {
	return (
		<EntitySubMenu
			title="Personajes"
			icon={<User className="mr-2 h-4 w-4" />}
			entityName="characters"
			entities={[]}
			isLoading={loadingStates.characters?.loading || false}
			hasError={loadingStates.characters?.hasError || false}
			loadedCount={loadingStates.characters?.loadedCount || 0}
			onSelectAction={(character: any) => {
				onAction('character-add', file, {
					characterId: character.id,
					characterName: character.name,
					characterImage: character.image,
					characterDescription: character.description
				});
			}}
			onCreateAction={() => {
				onAction('character-create', file);
			}}
			renderItemAction={(character: any) => (
				<>
					<User className="mr-2 h-4 w-4" />
					{character.name}
				</>
			)}
			onOpenChange={(open) => onOpenChange('characters', open)}
		/>
	);
});

// Componente para el submenú de lugares
export const PlacesSubmenu = memo(function PlacesSubmenu({
	file,
	onAction,
	loadingStates,
	onOpenChange
}: SubmenuProps) {
	return (
		<EntitySubMenu
			title="Lugares"
			icon={<MapPin className="mr-2 h-4 w-4" />}
			entityName="places"
			entities={[]}
			isLoading={loadingStates.places?.loading || false}
			hasError={loadingStates.places?.hasError || false}
			loadedCount={loadingStates.places?.loadedCount || 0}
			onSelectAction={(place: any) => onAction('place-add', file, { place })}
			onCreateAction={() => onAction('place-create', file)}
			renderItemAction={(place: any) => (
				<>
					<MapPin className="mr-2 h-4 w-4" />
					{place.name}
				</>
			)}
			onOpenChange={(open) => onOpenChange('places', open)}
		/>
	);
});

// Componente para el submenú de objetos del mundo
export const WorldItemsSubmenu = memo(function WorldItemsSubmenu({
	file,
	onAction,
	loadingStates,
	onOpenChange
}: SubmenuProps) {
	return (
		<EntitySubMenu
			title="Objetos del mundo"
			icon={<Laptop className="mr-2 h-4 w-4" />}
			entityName="world-items"
			entities={[]}
			isLoading={loadingStates.worldItems?.loading || false}
			hasError={loadingStates.worldItems?.hasError || false}
			loadedCount={loadingStates.worldItems?.loadedCount || 0}
			onSelectAction={(item: any) => onAction('world-item-add', file, { item })}
			onCreateAction={() => onAction('world-item-create', file)}
			renderItemAction={(item: any) => (
				<>
					<Laptop className="mr-2 h-4 w-4" />
					{item.name}
				</>
			)}
			onOpenChange={(open) => onOpenChange('worldItems', open)}
		/>
	);
});

// Componente para el submenú de prompts
export const PromptsSubmenu = memo(function PromptsSubmenu({
	file,
	onAction,
	loadingStates,
	onOpenChange
}: SubmenuProps) {
	return (
		<EntitySubMenu
			title="Prompts"
			icon={<Sparkles className="mr-2 h-4 w-4" />}
			entityName="prompts"
			entities={[]}
			isLoading={loadingStates.prompts?.loading || false}
			hasError={loadingStates.prompts?.hasError || false}
			loadedCount={loadingStates.prompts?.loadedCount || 0}
			onSelectAction={(prompt: any) => onAction('prompt-add', file, { prompt })}
			onCreateAction={() => onAction('prompt-create', file)}
			renderItemAction={(prompt: any) => (
				<>
					<Sparkles className="mr-2 h-4 w-4" />
					{prompt.name}
				</>
			)}
			onOpenChange={(open) => onOpenChange('prompts', open)}
		/>
	);
});

// Componente para el submenú de notas
export const NotesSubmenu = memo(function NotesSubmenu({
	file,
	onAction,
	loadingStates,
	onOpenChange
}: SubmenuProps) {
	return (
		<EntitySubMenu
			title="Notas"
			icon={<StickyNote className="mr-2 h-4 w-4" />}
			entityName="notes"
			entities={[]}
			isLoading={loadingStates.notes?.loading || false}
			hasError={loadingStates.notes?.hasError || false}
			loadedCount={loadingStates.notes?.loadedCount || 0}
			onSelectAction={(note: any) => onAction('note-add', file, { note })}
			onCreateAction={() => onAction('note-create', file)}
			renderItemAction={(note: any) => (
				<>
					<StickyNote className="mr-2 h-4 w-4" />
					{note.name}
				</>
			)}
			onOpenChange={(open) => onOpenChange('notes', open)}
		/>
	);
});

// Componente para el submenú de conceptos
export const ConceptsSubmenu = memo(function ConceptsSubmenu({
	file,
	onAction,
	loadingStates,
	onOpenChange
}: SubmenuProps) {
	return (
		<EntitySubMenu
			title="Conceptos"
			icon={<Lightbulb className="mr-2 h-4 w-4" />}
			entityName="concepts"
			entities={[]}
			isLoading={loadingStates.concepts?.loading || false}
			hasError={loadingStates.concepts?.hasError || false}
			loadedCount={loadingStates.concepts?.loadedCount || 0}
			onSelectAction={(concept: any) => onAction('concept-add', file, { concept })}
			onCreateAction={() => onAction('concept-create', file)}
			renderItemAction={(concept: any) => (
				<>
					<Lightbulb className="mr-2 h-4 w-4" />
					{concept.name}
				</>
			)}
			onOpenChange={(open) => onOpenChange('concepts', open)}
		/>
	);
});
