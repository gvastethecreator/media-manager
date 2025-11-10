import {
	BookImage,
	Camera,
	FolderKanban,
	Heart,
	Lightbulb,
	MapPin,
	MessageSquare,
	Plus,
	StickyNote,
	TagIcon,
	Users,
	WandSparkles,
} from 'lucide-react';
import React, { useState } from 'react';
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
	ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { useAlbumStore } from '@/store/entities/album';
import { useCharacterStore } from '@/store/entities/character';
import { useCollectionStore } from '@/store/entities/collection';
import { useConceptStore } from '@/store/entities/concept';
import { useFavoriteStore } from '@/store/entities/favorite';
import { useGroupStore } from '@/store/entities/group';
import { useNoteStore } from '@/store/entities/note';
import { usePlaceStore } from '@/store/entities/place';
import { usePromptStore } from '@/store/entities/prompt';
import { useTagStore } from '@/store/entities/tag';
import { useWildcardStore } from '@/store/entities/wildcard';
import type { AnyEntityWithStats } from '@/types/entities';

interface AddToEntityMenuProps {
	/** El item sobre el cual se hace click derecho */
	item: AnyEntityWithStats;
	/** Contenido que activará el menú contextual */
	children: React.ReactNode;
	/** Callback cuando se agrega a una entidad */
	onAddToEntity?: (entityType: string, entityId: string) => void;
	/** Callback cuando se crea una nueva entidad */
	onCreateNewEntity?: (entityType: string) => void;
}

/**
 * Menú contextual para agregar archivos a entidades
 *
 * Permite:
 * - Agregar el archivo a entidades existentes (Characters, Places, etc.)
 * - Crear nuevas entidades y asociar el archivo
 * - Organizado por categorías de entidades
 */
export function AddToEntityMenu({ item, children, onAddToEntity, onCreateNewEntity }: AddToEntityMenuProps) {
	// Obtener entidades de todos los stores
	const { selectedIds: characterIds, characters } = useCharacterStore((s) => ({ selectedIds: s.selectedIds, characters: s.characters }));
	const { places } = usePlaceStore((s) => ({ places: s.places }));
	const { concepts } = useConceptStore((s) => ({ concepts: s.concepts }));
	const { getCollections } = useCollectionStore();
	const { albums } = useAlbumStore((s) => ({ albums: Object.values(s.albums) }));
	const { tags } = useTagStore((s) => ({ tags: s.tags }));
	const { groups } = useGroupStore((s) => ({ groups: Object.values(s.groups) }));
	const { notes } = useNoteStore((s) => ({ notes: s.notes }));
	const { selectedPrompt, prompts } = usePromptStore((s) => ({ selectedPrompt: s.selectedPrompt, prompts: s.prompts }));

	const collections = getCollections();

	// Handlers
	const handleAddTo = (entityType: string, entityId: string) => {
		console.log(`Agregando ${item.name} a ${entityType}:${entityId}`);
		onAddToEntity?.(entityType, entityId);
	};

	const handleCreateNew = (entityType: string) => {
		console.log(`Creando nueva entidad ${entityType} con ${item.name}`);
		onCreateNewEntity?.(entityType);
	};

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
			<ContextMenuContent className="w-64">
				{/* Favoritos */}
				<ContextMenuItem onClick={() => handleAddTo('favorite', item.id)}>
					<Heart className="mr-2 h-4 w-4" />
					Agregar a Favoritos
				</ContextMenuItem>

				<ContextMenuSeparator />

				{/* Personajes */}
				<ContextMenuSub>
					<ContextMenuSubTrigger>
						<Users className="mr-2 h-4 w-4" />
						Personajes
					</ContextMenuSubTrigger>
					<ContextMenuSubContent className="w-56">
						<ContextMenuItem onClick={() => handleCreateNew('character')}>
							<Plus className="mr-2 h-4 w-4" />
							Nuevo Personaje...
						</ContextMenuItem>
						{Array.isArray(characters) && characters.length > 0 && <ContextMenuSeparator />}
						{Array.isArray(characters) &&
							characters.slice(0, 10).map((character) => (
								<ContextMenuItem key={character.id} onClick={() => handleAddTo('character', character.id)}>
									{character.name}
								</ContextMenuItem>
							))}
						{Array.isArray(characters) && characters.length > 10 && (
							<ContextMenuItem disabled>...y {characters.length - 10} más</ContextMenuItem>
						)}
					</ContextMenuSubContent>
				</ContextMenuSub>

				{/* Lugares */}
				<ContextMenuSub>
					<ContextMenuSubTrigger>
						<MapPin className="mr-2 h-4 w-4" />
						Lugares
					</ContextMenuSubTrigger>
					<ContextMenuSubContent className="w-56">
						<ContextMenuItem onClick={() => handleCreateNew('place')}>
							<Plus className="mr-2 h-4 w-4" />
							Nuevo Lugar...
						</ContextMenuItem>
						{Array.isArray(places) && places.length > 0 && <ContextMenuSeparator />}
						{Array.isArray(places) &&
							places.slice(0, 10).map((place) => (
								<ContextMenuItem key={place.id} onClick={() => handleAddTo('place', place.id)}>
									{place.name}
								</ContextMenuItem>
							))}
						{Array.isArray(places) && places.length > 10 && (
							<ContextMenuItem disabled>...y {places.length - 10} más</ContextMenuItem>
						)}
					</ContextMenuSubContent>
				</ContextMenuSub>

				{/* Conceptos */}
				<ContextMenuSub>
					<ContextMenuSubTrigger>
						<Lightbulb className="mr-2 h-4 w-4" />
						Conceptos
					</ContextMenuSubTrigger>
					<ContextMenuSubContent className="w-56">
						<ContextMenuItem onClick={() => handleCreateNew('concept')}>
							<Plus className="mr-2 h-4 w-4" />
							Nuevo Concepto...
						</ContextMenuItem>
						{Array.isArray(concepts) && concepts.length > 0 && <ContextMenuSeparator />}
						{Array.isArray(concepts) &&
							concepts.slice(0, 10).map((concept) => (
								<ContextMenuItem key={concept.id} onClick={() => handleAddTo('concept', concept.id)}>
									{concept.name}
								</ContextMenuItem>
							))}
						{Array.isArray(concepts) && concepts.length > 10 && (
							<ContextMenuItem disabled>...y {concepts.length - 10} más</ContextMenuItem>
						)}
					</ContextMenuSubContent>
				</ContextMenuSub>

				<ContextMenuSeparator />

				{/* Colecciones */}
				<ContextMenuSub>
					<ContextMenuSubTrigger>
						<BookImage className="mr-2 h-4 w-4" />
						Colecciones
					</ContextMenuSubTrigger>
					<ContextMenuSubContent className="w-56">
						<ContextMenuItem onClick={() => handleCreateNew('collection')}>
							<Plus className="mr-2 h-4 w-4" />
							Nueva Colección...
						</ContextMenuItem>
						{Array.isArray(collections) && collections.length > 0 && <ContextMenuSeparator />}
						{Array.isArray(collections) &&
							collections.slice(0, 10).map((collection) => (
								<ContextMenuItem key={collection.id} onClick={() => handleAddTo('collection', collection.id)}>
									{collection.name}
								</ContextMenuItem>
							))}
						{Array.isArray(collections) && collections.length > 10 && (
							<ContextMenuItem disabled>...y {collections.length - 10} más</ContextMenuItem>
						)}
					</ContextMenuSubContent>
				</ContextMenuSub>

				{/* Álbumes */}
				<ContextMenuSub>
					<ContextMenuSubTrigger>
						<Camera className="mr-2 h-4 w-4" />
						Álbumes
					</ContextMenuSubTrigger>
					<ContextMenuSubContent className="w-56">
						<ContextMenuItem onClick={() => handleCreateNew('album')}>
							<Plus className="mr-2 h-4 w-4" />
							Nuevo Álbum...
						</ContextMenuItem>
						{Array.isArray(albums) && albums.length > 0 && <ContextMenuSeparator />}
						{Array.isArray(albums) &&
							albums.slice(0, 10).map((album) => (
								<ContextMenuItem key={album.id} onClick={() => handleAddTo('album', album.id)}>
									{album.name}
								</ContextMenuItem>
							))}
						{Array.isArray(albums) && albums.length > 10 && (
							<ContextMenuItem disabled>...y {albums.length - 10} más</ContextMenuItem>
						)}
					</ContextMenuSubContent>
				</ContextMenuSub>

				{/* Grupos */}
				<ContextMenuSub>
					<ContextMenuSubTrigger>
						<FolderKanban className="mr-2 h-4 w-4" />
						Grupos
					</ContextMenuSubTrigger>
					<ContextMenuSubContent className="w-56">
						<ContextMenuItem onClick={() => handleCreateNew('group')}>
							<Plus className="mr-2 h-4 w-4" />
							Nuevo Grupo...
						</ContextMenuItem>
						{Array.isArray(groups) && groups.length > 0 && <ContextMenuSeparator />}
						{Array.isArray(groups) &&
							groups.slice(0, 10).map((group) => (
								<ContextMenuItem key={group.id} onClick={() => handleAddTo('group', group.id)}>
									{group.name}
								</ContextMenuItem>
							))}
						{Array.isArray(groups) && groups.length > 10 && (
							<ContextMenuItem disabled>...y {groups.length - 10} más</ContextMenuItem>
						)}
					</ContextMenuSubContent>
				</ContextMenuSub>

				<ContextMenuSeparator />

				{/* Etiquetas */}
				<ContextMenuSub>
					<ContextMenuSubTrigger>
						<TagIcon className="mr-2 h-4 w-4" />
						Etiquetas
					</ContextMenuSubTrigger>
					<ContextMenuSubContent className="w-56">
						<ContextMenuItem onClick={() => handleCreateNew('tag')}>
							<Plus className="mr-2 h-4 w-4" />
							Nueva Etiqueta...
						</ContextMenuItem>
						{Array.isArray(tags) && tags.length > 0 && <ContextMenuSeparator />}
						{Array.isArray(tags) &&
							tags.slice(0, 10).map((tag) => (
								<ContextMenuItem key={tag.id} onClick={() => handleAddTo('tag', tag.id)}>
									{tag.name}
								</ContextMenuItem>
							))}
						{Array.isArray(tags) && tags.length > 10 && (
							<ContextMenuItem disabled>...y {tags.length - 10} más</ContextMenuItem>
						)}
					</ContextMenuSubContent>
				</ContextMenuSub>

				{/* Prompts */}
				<ContextMenuSub>
					<ContextMenuSubTrigger>
						<MessageSquare className="mr-2 h-4 w-4" />
						Prompts
					</ContextMenuSubTrigger>
					<ContextMenuSubContent className="w-56">
						<ContextMenuItem onClick={() => handleCreateNew('prompt')}>
							<Plus className="mr-2 h-4 w-4" />
							Nuevo Prompt...
						</ContextMenuItem>
						{Array.isArray(prompts) && prompts.length > 0 && <ContextMenuSeparator />}
						{Array.isArray(prompts) &&
							prompts.slice(0, 10).map((prompt) => (
								<ContextMenuItem key={prompt.id} onClick={() => handleAddTo('prompt', prompt.id)}>
									{prompt.name}
								</ContextMenuItem>
							))}
						{Array.isArray(prompts) && prompts.length > 10 && (
							<ContextMenuItem disabled>...y {prompts.length - 10} más</ContextMenuItem>
						)}
					</ContextMenuSubContent>
				</ContextMenuSub>

				{/* Notas */}
				<ContextMenuSub>
					<ContextMenuSubTrigger>
						<StickyNote className="mr-2 h-4 w-4" />
						Notas
					</ContextMenuSubTrigger>
					<ContextMenuSubContent className="w-56">
						<ContextMenuItem onClick={() => handleCreateNew('note')}>
							<Plus className="mr-2 h-4 w-4" />
							Nueva Nota...
						</ContextMenuItem>
						{Array.isArray(notes) && notes.length > 0 && <ContextMenuSeparator />}
						{Array.isArray(notes) &&
							notes.slice(0, 10).map((note) => (
								<ContextMenuItem key={note.id} onClick={() => handleAddTo('note', note.id)}>
									{note.title || note.name || `Nota ${note.id.substring(0, 8)}`}
								</ContextMenuItem>
							))}
						{Array.isArray(notes) && notes.length > 10 && (
							<ContextMenuItem disabled>...y {notes.length - 10} más</ContextMenuItem>
						)}
					</ContextMenuSubContent>
				</ContextMenuSub>
			</ContextMenuContent>
		</ContextMenu>
	);
}
