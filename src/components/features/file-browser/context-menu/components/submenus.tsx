'use client';

import { Album, BookImage, Box, Loader2, MapPin, Tag, User2 } from 'lucide-react';
import { memo, useCallback } from 'react';
import {
	ContextMenuItem,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
} from '@/components/ui/context-menu';
import { clientLogger } from '@/lib/logger/client-logger';
import { useAlbumStore } from '@/store/entities/album';
import { useCollectionStore } from '@/store/entities/collection';
import { useTagStore } from '@/store/entities/tag';
import type { FileItem } from '@/types/files';
import type { ContextMenuAction, LoadingStates } from '../types';

// Logger para el componente
const _submenuLogger = clientLogger.withContext('ContextSubmenu');

/**
 * Props para todos los submenús del context menu
 * @param file Archivo sobre el que se actúa
 * @param onAction Callback para acciones
 * @param loadingStates Estado de carga de cada entidad
 * @param handleOpenChange Callback para apertura/cierre del submenú
 */
interface SubmenuProps {
	file: FileItem;
	onAction: (action: ContextMenuAction, file: FileItem, data?: Record<string, unknown>) => void;
	loadingStates: LoadingStates;
	handleOpenChange: (entity: keyof LoadingStates, isOpen: boolean) => void;
}

// Componente para el submenú de colecciones
export const CollectionsSubmenu = memo(function CollectionsSubmenu({
	file,
	onAction,
	loadingStates,
	handleOpenChange,
}: SubmenuProps) {
	// Obtener las colecciones del store
	const collections = useCollectionStore((state) => state.getCollections());

	// Manejar apertura del submenú
	const handleSubMenuOpenChange = useCallback(
		(open: boolean) => {
			handleOpenChange('collections', open);
		},
		[handleOpenChange]
	);

	return (
		<ContextMenuSub onOpenChange={handleSubMenuOpenChange}>
			<ContextMenuSubTrigger>
				<BookImage className="mr-2 h-4 w-4" />
				<span>Colecciones</span>
			</ContextMenuSubTrigger>
			<ContextMenuSubContent className="w-48">
				{loadingStates.collections.loading ? (
					<ContextMenuItem disabled>
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						<span>Cargando...</span>
					</ContextMenuItem>
				) : collections && collections.length > 0 ? (
					<>
						{collections.map((collection) => (
							<ContextMenuItem
								key={collection.id}
								onClick={() =>
									onAction('add-to-collection', file, { collectionId: collection.id, collectionName: collection.name })
								}
							>
								{collection.name}
							</ContextMenuItem>
						))}
						<ContextMenuItem onClick={() => onAction('collection-create', file)}>
							<span className="text-primary">+ Nueva colección</span>
						</ContextMenuItem>
					</>
				) : (
					<>
						<ContextMenuItem disabled>No hay colecciones disponibles</ContextMenuItem>
						<ContextMenuItem onClick={() => onAction('collection-create', file)}>
							<span className="text-primary">+ Nueva colección</span>
						</ContextMenuItem>
					</>
				)}
			</ContextMenuSubContent>
		</ContextMenuSub>
	);
});

// Componente para el submenú de etiquetas
export const TagsSubmenu = memo(function TagsSubmenu({
	file,
	onAction,
	loadingStates,
	handleOpenChange,
}: SubmenuProps) {
	// Obtener las etiquetas del store
	const tags = useTagStore((state) => (Array.isArray(state.tags) ? state.tags : Object.values(state.core?.tags ?? {})));

	// Manejar apertura del submenú
	const handleSubMenuOpenChange = useCallback(
		(open: boolean) => {
			handleOpenChange('tags', open);
		},
		[handleOpenChange]
	);

	return (
		<ContextMenuSub onOpenChange={handleSubMenuOpenChange}>
			<ContextMenuSubTrigger>
				<Tag className="mr-2 h-4 w-4" />
				<span>Etiquetas</span>
			</ContextMenuSubTrigger>
			<ContextMenuSubContent className="w-48">
				{loadingStates.tags.loading ? (
					<ContextMenuItem disabled>
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						<span>Cargando...</span>
					</ContextMenuItem>
				) : tags && tags.length > 0 ? (
					<>
						{tags.map((tag) => (
							<ContextMenuItem
								key={tag.id}
								onClick={() => onAction('add-tag', file, { tagId: tag.id, tagName: tag.name })}
							>
								{tag.name}
							</ContextMenuItem>
						))}
						<ContextMenuItem onClick={() => onAction('tag-create', file)}>
							<span className="text-primary">+ Nueva etiqueta</span>
						</ContextMenuItem>
					</>
				) : (
					<>
						<ContextMenuItem disabled>No hay etiquetas disponibles</ContextMenuItem>
						<ContextMenuItem onClick={() => onAction('tag-create', file)}>
							<span className="text-primary">+ Nueva etiqueta</span>
						</ContextMenuItem>
					</>
				)}
			</ContextMenuSubContent>
		</ContextMenuSub>
	);
});

// Componente para el submenú de álbumes
export const AlbumsSubmenu = memo(function AlbumsSubmenu({
	file,
	onAction,
	loadingStates,
	handleOpenChange,
}: SubmenuProps) {
	// Obtener los álbumes del store
	const albums = useAlbumStore((state) => state.getAlbums());

	// Manejar apertura del submenú
	const handleSubMenuOpenChange = useCallback(
		(open: boolean) => {
			handleOpenChange('albums', open);
		},
		[handleOpenChange]
	);

	return (
		<ContextMenuSub onOpenChange={handleSubMenuOpenChange}>
			<ContextMenuSubTrigger>
				<Album className="mr-2 h-4 w-4" />
				<span>Álbumes</span>
			</ContextMenuSubTrigger>
			<ContextMenuSubContent className="w-48">
				{loadingStates.albums.loading ? (
					<ContextMenuItem disabled>
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						<span>Cargando...</span>
					</ContextMenuItem>
				) : albums && albums.length > 0 ? (
					<>
						{albums.map((album) => (
							<ContextMenuItem
								key={album.id}
								onClick={() => onAction('add-to-album', file, { albumId: album.id, albumName: album.name })}
							>
								{album.name}
							</ContextMenuItem>
						))}
						<ContextMenuItem onClick={() => onAction('album-create', file)}>
							<span className="text-primary">+ Nuevo álbum</span>
						</ContextMenuItem>
					</>
				) : (
					<>
						<ContextMenuItem disabled>No hay álbumes disponibles</ContextMenuItem>
						<ContextMenuItem onClick={() => onAction('album-create', file)}>
							<span className="text-primary">+ Nuevo álbum</span>
						</ContextMenuItem>
					</>
				)}
			</ContextMenuSubContent>
		</ContextMenuSub>
	);
});

// Componente para el submenú de personajes
export const CharactersSubmenu = memo(function CharactersSubmenu({
	file,
	onAction,
	loadingStates,
	handleOpenChange,
}: SubmenuProps) {
	// Manejar apertura del submenú
	const handleSubMenuOpenChange = useCallback(
		(open: boolean) => {
			handleOpenChange('characters', open);
		},
		[handleOpenChange]
	);

	return (
		<ContextMenuSub onOpenChange={handleSubMenuOpenChange}>
			<ContextMenuSubTrigger>
				<User2 className="mr-2 h-4 w-4" />
				<span>Personajes</span>
			</ContextMenuSubTrigger>
			<ContextMenuSubContent className="w-48">
				{loadingStates.characters.loading ? (
					<ContextMenuItem disabled>
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						<span>Cargando...</span>
					</ContextMenuItem>
				) : (
					<>
						<ContextMenuItem disabled>Sin personajes disponibles</ContextMenuItem>
						<ContextMenuItem onClick={() => onAction('character-create', file)}>
							<span className="text-primary">+ Nuevo personaje</span>
						</ContextMenuItem>
					</>
				)}
			</ContextMenuSubContent>
		</ContextMenuSub>
	);
});

// Componente para el submenú de lugares
export const PlacesSubmenu = memo(function PlacesSubmenu({
	file,
	onAction,
	loadingStates,
	handleOpenChange,
}: SubmenuProps) {
	// Manejar apertura del submenú
	const handleSubMenuOpenChange = useCallback(
		(open: boolean) => {
			handleOpenChange('places', open);
		},
		[handleOpenChange]
	);

	return (
		<ContextMenuSub onOpenChange={handleSubMenuOpenChange}>
			<ContextMenuSubTrigger>
				<MapPin className="mr-2 h-4 w-4" />
				<span>Lugares</span>
			</ContextMenuSubTrigger>
			<ContextMenuSubContent className="w-48">
				{loadingStates.places.loading ? (
					<ContextMenuItem disabled>
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						<span>Cargando...</span>
					</ContextMenuItem>
				) : (
					<>
						<ContextMenuItem disabled>Sin lugares disponibles</ContextMenuItem>
						<ContextMenuItem onClick={() => onAction('place-create', file)}>
							<span className="text-primary">+ Nuevo lugar</span>
						</ContextMenuItem>
					</>
				)}
			</ContextMenuSubContent>
		</ContextMenuSub>
	);
});

// Componente para el submenú de objetos del mundo
export const WorldItemsSubmenu = memo(function WorldItemsSubmenu({
	file,
	onAction,
	loadingStates,
	handleOpenChange,
}: SubmenuProps) {
	// Manejar apertura del submenú
	const handleSubMenuOpenChange = useCallback(
		(open: boolean) => {
			handleOpenChange('worldItems', open);
		},
		[handleOpenChange]
	);

	return (
		<ContextMenuSub onOpenChange={handleSubMenuOpenChange}>
			<ContextMenuSubTrigger>
				<Box className="mr-2 h-4 w-4" />
				<span>Objetos</span>
			</ContextMenuSubTrigger>
			<ContextMenuSubContent className="w-48">
				{loadingStates.worldItems.loading ? (
					<ContextMenuItem disabled>
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						<span>Cargando...</span>
					</ContextMenuItem>
				) : (
					<>
						<ContextMenuItem disabled>Sin objetos disponibles</ContextMenuItem>
						<ContextMenuItem onClick={() => onAction('world-item-create', file)}>
							<span className="text-primary">+ Nuevo objeto</span>
						</ContextMenuItem>
					</>
				)}
			</ContextMenuSubContent>
		</ContextMenuSub>
	);
});

// Componente para el submenú de prompts
export const PromptsSubmenu = memo(function PromptsSubmenu({
	file,
	onAction,
	loadingStates,
	handleOpenChange,
}: SubmenuProps) {
	return (
		<ContextMenuSub>
			<ContextMenuSubTrigger>
				<Box className="mr-2 h-4 w-4" />
				<span>Prompts</span>
			</ContextMenuSubTrigger>
			<ContextMenuSubContent className="w-48">
				<ContextMenuItem disabled>Funcionalidad en desarrollo</ContextMenuItem>
			</ContextMenuSubContent>
		</ContextMenuSub>
	);
});

// Componente para el submenú de notas
export const NotesSubmenu = memo(function NotesSubmenu({
	file,
	onAction,
	loadingStates,
	handleOpenChange,
}: SubmenuProps) {
	return (
		<ContextMenuSub>
			<ContextMenuSubTrigger>
				<Box className="mr-2 h-4 w-4" />
				<span>Notas</span>
			</ContextMenuSubTrigger>
			<ContextMenuSubContent className="w-48">
				<ContextMenuItem disabled>Funcionalidad en desarrollo</ContextMenuItem>
			</ContextMenuSubContent>
		</ContextMenuSub>
	);
});

// Componente para el submenú de conceptos
export const ConceptsSubmenu = memo(function ConceptsSubmenu({
	file,
	onAction,
	loadingStates,
	handleOpenChange,
}: SubmenuProps) {
	return (
		<ContextMenuSub>
			<ContextMenuSubTrigger>
				<Box className="mr-2 h-4 w-4" />
				<span>Conceptos</span>
			</ContextMenuSubTrigger>
			<ContextMenuSubContent className="w-48">
				<ContextMenuItem disabled>Funcionalidad en desarrollo</ContextMenuItem>
			</ContextMenuSubContent>
		</ContextMenuSub>
	);
});
