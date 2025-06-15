'use client';

import { ContextMenuItem, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger } from '@/components/ui/context-menu';
import { clientLogger } from '@/lib/logger/client-logger';
import type { FileItem } from '@/types/file-item';
import { Album, BookImage, Box, MapPin, Tag, User2 } from 'lucide-react';
import { memo, useCallback } from 'react';
import type { ContextMenuAction, LoadingStates } from '../types';

// Logger para el componente
const submenuLogger = clientLogger.withContext('ContextSubmenu');

interface SubmenuProps {
	file: FileItem;
	onAction: (action: ContextMenuAction, file: FileItem, data?: Record<string, unknown>) => void;
	loadEntityData: (entity: keyof LoadingStates) => Promise<void>;
	loadingStates: LoadingStates;
}

// Componente para el submenú de colecciones
export const CollectionsSubmenu = memo(function CollectionsSubmenu({
	file,
	onAction,
	loadEntityData,
	loadingStates,
}: SubmenuProps) {
	// Cargar colecciones cuando se abre el submenú
	const handleOpenChange = useCallback(() => {
		loadEntityData('collections');
	}, [loadEntityData]);

	return (
		<ContextMenuSub onOpenChange={handleOpenChange}>
			<ContextMenuSubTrigger>
				<BookImage className="mr-2 h-4 w-4" />
				<span>Colecciones</span>
			</ContextMenuSubTrigger>
			<ContextMenuSubContent className="w-48">
				{loadingStates.collections.loading ? (
					<ContextMenuItem disabled>Cargando...</ContextMenuItem>
				) : (
					<>
						<ContextMenuItem
							onClick={() => onAction('add-to-collection', file, { collectionId: 'collection1', collectionName: 'Paisajes' })}
						>
							Paisajes
						</ContextMenuItem>
						<ContextMenuItem
							onClick={() => onAction('add-to-collection', file, { collectionId: 'collection2', collectionName: 'Retratos' })}
						>
							Retratos
						</ContextMenuItem>
					</>
				)}
			</ContextMenuSubContent>
		</ContextMenuSub>
	);
});

// Componente para el submenú de etiquetas
export const TagsSubmenu = memo(function TagsSubmenu({ file, onAction, loadEntityData, loadingStates }: SubmenuProps) {
	// Cargar etiquetas cuando se abre el submenú
	const handleOpenChange = useCallback(() => {
		loadEntityData('tags');
	}, [loadEntityData]);

	return (
		<ContextMenuSub onOpenChange={handleOpenChange}>
			<ContextMenuSubTrigger>
				<Tag className="mr-2 h-4 w-4" />
				<span>Etiquetas</span>
			</ContextMenuSubTrigger>
			<ContextMenuSubContent className="w-48">
				{loadingStates.tags.loading ? (
					<ContextMenuItem disabled>Cargando...</ContextMenuItem>
				) : (
					<>
						<ContextMenuItem onClick={() => onAction('add-tag', file, { tagId: 'tag1', tagName: 'Naturaleza' })}>
							Naturaleza
						</ContextMenuItem>
						<ContextMenuItem onClick={() => onAction('add-tag', file, { tagId: 'tag2', tagName: 'Personas' })}>
							Personas
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
	loadEntityData,
	loadingStates,
}: SubmenuProps) {
	// Cargar álbumes cuando se abre el submenú
	const handleOpenChange = useCallback(() => {
		loadEntityData('albums');
	}, [loadEntityData]);

	return (
		<ContextMenuSub onOpenChange={handleOpenChange}>
			<ContextMenuSubTrigger>
				<Album className="mr-2 h-4 w-4" />
				<span>Álbumes</span>
			</ContextMenuSubTrigger>
			<ContextMenuSubContent className="w-48">
				{loadingStates.albums.loading ? (
					<ContextMenuItem disabled>Cargando...</ContextMenuItem>
				) : (
					<>
						<ContextMenuItem onClick={() => onAction('add-to-album', file, { albumId: 'album1', albumName: 'Vacaciones' })}>
							Vacaciones
						</ContextMenuItem>
						<ContextMenuItem onClick={() => onAction('add-to-album', file, { albumId: 'album2', albumName: 'Trabajo' })}>
							Trabajo
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
	loadEntityData,
	loadingStates,
}: SubmenuProps) {
	// Cargar personajes cuando se abre el submenú
	const handleOpenChange = useCallback(() => {
		loadEntityData('characters');
	}, [loadEntityData]);

	return (
		<ContextMenuSub onOpenChange={handleOpenChange}>
			<ContextMenuSubTrigger>
				<User2 className="mr-2 h-4 w-4" />
				<span>Personajes</span>
			</ContextMenuSubTrigger>
			<ContextMenuSubContent className="w-48">
				{loadingStates.characters.loading ? (
					<ContextMenuItem disabled>Cargando...</ContextMenuItem>
				) : (
					<ContextMenuItem disabled>Sin personajes disponibles</ContextMenuItem>
				)}
			</ContextMenuSubContent>
		</ContextMenuSub>
	);
});

// Componente para el submenú de lugares
export const PlacesSubmenu = memo(function PlacesSubmenu({
	file,
	onAction,
	loadEntityData,
	loadingStates,
}: SubmenuProps) {
	// Cargar lugares cuando se abre el submenú
	const handleOpenChange = useCallback(() => {
		loadEntityData('places');
	}, [loadEntityData]);

	return (
		<ContextMenuSub onOpenChange={handleOpenChange}>
			<ContextMenuSubTrigger>
				<MapPin className="mr-2 h-4 w-4" />
				<span>Lugares</span>
			</ContextMenuSubTrigger>
			<ContextMenuSubContent className="w-48">
				{loadingStates.places.loading ? (
					<ContextMenuItem disabled>Cargando...</ContextMenuItem>
				) : (
					<ContextMenuItem disabled>Sin lugares disponibles</ContextMenuItem>
				)}
			</ContextMenuSubContent>
		</ContextMenuSub>
	);
});

// Componente para el submenú de objetos del mundo
export const WorldItemsSubmenu = memo(function WorldItemsSubmenu({
	file,
	onAction,
	loadEntityData,
	loadingStates,
}: SubmenuProps) {
	// Cargar objetos del mundo cuando se abre el submenú
	const handleOpenChange = useCallback(() => {
		loadEntityData('worldItems');
	}, [loadEntityData]);

	return (
		<ContextMenuSub onOpenChange={handleOpenChange}>
			<ContextMenuSubTrigger>
				<Box className="mr-2 h-4 w-4" />
				<span>Objetos</span>
			</ContextMenuSubTrigger>
			<ContextMenuSubContent className="w-48">
				{loadingStates.worldItems.loading ? (
					<ContextMenuItem disabled>Cargando...</ContextMenuItem>
				) : (
					<ContextMenuItem disabled>Sin objetos disponibles</ContextMenuItem>
				)}
			</ContextMenuSubContent>
		</ContextMenuSub>
	);
});

// Componente para el submenú de prompts
export const PromptsSubmenu = memo(function PromptsSubmenu({
	file,
	onAction,
	loadEntityData,
	loadingStates,
}: SubmenuProps) {
	return null;
});

// Componente para el submenú de notas
export const NotesSubmenu = memo(function NotesSubmenu({ file, onAction, loadEntityData, loadingStates }: SubmenuProps) {
	return null;
});

// Componente para el submenú de conceptos
export const ConceptsSubmenu = memo(function ConceptsSubmenu({
	file,
	onAction,
	loadEntityData,
	loadingStates,
}: SubmenuProps) {
	return null;
});
