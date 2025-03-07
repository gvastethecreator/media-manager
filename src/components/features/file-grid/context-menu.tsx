'use client';

import { Badge } from '@/components/ui/badge';
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuShortcut,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
	ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { logger } from '@/lib/logger';
import { useAlbumsStore } from '@/store/albums.store';
import { useCharactersStore } from '@/store/characters.store';
import { useCollectionsStore } from '@/store/collections.store';
import { useFavoritesStore } from '@/store/favorites.store';
import { useObjectsStore } from '@/store/objects.store';
import { usePlacesStore } from '@/store/places.store';
import { useTagsStore } from '@/store/tags.store';
import type { FileItem } from '@/types/file-item';
import type { Album, Character, Collection, Object as ObjectEntity, Place, Tag } from '@prisma/client';
import {
	BookmarkPlus,
	Box,
	Copy,
	Download,
	Flag,
	FolderOpen,
	Heart,
	HeartOff,
	ImageIcon,
	Info,
	MapPin,
	Palette,
	Pencil,
	Share2,
	Tag as TagIcon,
	Trash2,
	User,
} from 'lucide-react';
import type * as React from 'react';
import { useCallback, useEffect, useState } from 'react';

const contextMenuLogger = logger.withContext('ContextMenu');

// Tipos de acciones del menú contextual
export type ContextMenuAction =
	| 'mark-toggle'
	| 'favorite-toggle'
	| 'collection-add'
	| 'tag-add'
	| 'album-add'
	| 'character-add'
	| 'place-add'
	| 'object-add'
	| 'preview'
	| 'open'
	| 'download'
	| 'copy'
	| 'delete';

interface FileContextMenuProps {
	file: FileItem;
	children: React.ReactNode;
	onAction: (action: ContextMenuAction, file: FileItem, data?: Record<string, unknown>) => void;
}

const _getMetadata = (metadata: string | null) => {
	if (!metadata) {
		return null;
	}
	try {
		return JSON.parse(metadata);
	} catch {
		return false;
	}
};

export function FileContextMenu({ file, children, onAction }: FileContextMenuProps) {
	// Stores con tipos correctos y valores por defecto
	const { toggleFavorite, isFavorited } = useFavoritesStore();
	const { collections, addImageToCollection, loadCollections } = useCollectionsStore();
	const { tags, addTagToImage, loadTags } = useTagsStore();
	const { albums, addImageToAlbum, loadAlbums } = useAlbumsStore();
	const { characters, addImageToCharacter, loadCharacters } = useCharactersStore();
	const { places, addImageToPlace, loadPlaces } = usePlacesStore();
	const { objects, addImageToObject, loadObjects } = useObjectsStore();

	// Estado para controlar si el menú está abierto
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [hasLoadedData, setHasLoadedData] = useState(false);

	// Cargar datos solo cuando se abre el menú por primera vez
	useEffect(() => {
		const loadInitialData = async () => {
			if (isMenuOpen && !hasLoadedData) {
				try {
					contextMenuLogger.info('🔄 Cargando datos iniciales...');
					await Promise.all([
						loadCollections(),
						loadTags(),
						loadAlbums(),
						loadCharacters(),
						loadPlaces(),
						loadObjects(),
					]);
					setHasLoadedData(true);
					contextMenuLogger.info('✅ Datos iniciales cargados');
				} catch (error) {
					contextMenuLogger.error('❌ Error al cargar datos iniciales:', error);
				}
			}
		};

		loadInitialData();
	}, [isMenuOpen, hasLoadedData, loadCollections, loadTags, loadAlbums, loadCharacters, loadPlaces, loadObjects]);

	const handleToggleFavorite = useCallback(async () => {
		try {
			await toggleFavorite(file.id);
			contextMenuLogger.info('✅ Estado de favorito cambiado');
		} catch (error) {
			contextMenuLogger.error('❌ Error al cambiar estado de favorito:', error);
		}
	}, [file.id, toggleFavorite]);

	const isImage =
		file.type === 'image' ||
		(() => {
			try {
				const metadata = file.metadata ? JSON.parse(file.metadata) : null;
				return metadata?.mimeType?.startsWith('image/') || false;
			} catch {
				return false;
			}
		})();

	const handleDoubleClick = useCallback(
		(_event: MouseEvent) => {
			onAction('preview', file);
		},
		[file, onAction]
	);

	const _handleContextMenuAction = useCallback(
		async (action: ContextMenuAction, file: FileItem, data?: Record<string, unknown>) => {
			try {
				switch (action) {
					case 'mark-toggle':
						// Implementar marcado
						break;
					case 'favorite-toggle':
						await handleToggleFavorite();
						break;
					case 'collection-add':
						await addImageToCollection(data, file.id);
						break;
					case 'tag-add':
						await addTagToImage(data, file.id);
						break;
					case 'album-add':
						await addImageToAlbum(data, file.id);
						break;
					case 'character-add':
						await addImageToCharacter(data, file.id);
						break;
					case 'place-add':
						await addImageToPlace(data, file.id);
						break;
					case 'object-add':
						await addImageToObject(data, file.id);
						break;
					case 'preview':
						handleDoubleClick(
							new MouseEvent('doubleclick', {
								bubbles: true,
								cancelable: true,
							}) as MouseEvent
						);
						break;
					case 'open':
						// Implementar apertura de ubicación
						break;
					case 'download':
						// Implementar descarga
						break;
					case 'copy':
						// Implementar copiado
						break;
					case 'delete':
						// Implementar eliminación
						break;
					default:
						break;
				}
			} catch (error) {
				contextMenuLogger.error('❌ Error ejecutando acción:', error);
			}
		},
		[
			handleDoubleClick,
			handleToggleFavorite,
			addImageToCollection,
			addTagToImage,
			addImageToAlbum,
			addImageToCharacter,
			addImageToPlace,
			addImageToObject,
		]
	);

	return (
		<ContextMenu onOpenChange={setIsMenuOpen}>
			<ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
			{isMenuOpen && (
				<ContextMenuContent className="w-64">
					{isImage && (
						<>
							<ContextMenuItem onClick={() => onAction('mark-toggle', file)}>
								<Flag className="mr-2 h-4 w-4 text-warning" />
								Marcar/Desmarcar
								<ContextMenuShortcut>⌘M</ContextMenuShortcut>
							</ContextMenuItem>

							<ContextMenuItem onClick={handleToggleFavorite}>
								{isFavorited(file.id) ? (
									<>
										<HeartOff className="mr-2 h-4 w-4" />
										Quitar de favoritos
									</>
								) : (
									<>
										<Heart className="mr-2 h-4 w-4" />
										Agregar a favoritos
									</>
								)}
								<ContextMenuShortcut>⌘F</ContextMenuShortcut>
							</ContextMenuItem>

							<ContextMenuSeparator />

							{hasLoadedData && (
								<>
									<ContextMenuSub>
										<ContextMenuSubTrigger>
											<BookmarkPlus className="mr-2 h-4 w-4" />
											Agregar a colección
										</ContextMenuSubTrigger>
										<ContextMenuSubContent className="w-48">
											{collections && collections.length > 0 ? (
												collections.map((collection: Collection) => (
													<ContextMenuItem
														key={collection.id}
														onClick={() => onAction('collection-add', file, collection.id)}
													>
														<div className="flex items-center">
															{collection.emoji && <span className="mr-2">{collection.emoji}</span>}
															<span className="flex-1 truncate">{collection.name}</span>
															{collection.color && (
																<div
																	className="h-3 w-3 rounded-full"
																	style={{
																		backgroundColor: collection.color,
																	}}
																/>
															)}
														</div>
													</ContextMenuItem>
												))
											) : (
												<ContextMenuItem disabled>
													<span className="text-muted-foreground">No hay colecciones</span>
												</ContextMenuItem>
											)}
										</ContextMenuSubContent>
									</ContextMenuSub>

									<ContextMenuSub>
										<ContextMenuSubTrigger>
											<TagIcon className="mr-2 h-4 w-4" />
											Etiquetas
										</ContextMenuSubTrigger>
										<ContextMenuSubContent className="w-48">
											{tags && tags.length > 0 ? (
												tags.map((tag: Tag) => (
													<ContextMenuItem key={tag.id} onClick={() => onAction('tag-add', file, tag.id)}>
														<div className="flex items-center gap-2 w-full">
															<div className="w-3 h-3 rounded" style={{ backgroundColor: tag.color }} />
															<span className="flex-1">{tag.name}</span>
															{tag.shortcut && (
																<Badge variant="outline" className="text-[10px] h-4 px-1">
																	{tag.shortcut}
																</Badge>
															)}
														</div>
													</ContextMenuItem>
												))
											) : (
												<ContextMenuItem disabled>No hay etiquetas disponibles</ContextMenuItem>
											)}
										</ContextMenuSubContent>
									</ContextMenuSub>

									<ContextMenuSub>
										<ContextMenuSubTrigger>
											<ImageIcon className="mr-2 h-4 w-4" />
											Álbumes
										</ContextMenuSubTrigger>
										<ContextMenuSubContent className="w-48">
											{albums.length > 0 ? (
												albums.map((album: Album) => (
													<ContextMenuItem key={album.id} onClick={() => addImageToAlbum(album.id, file.id)}>
														<div className="flex items-center gap-2 w-full">
															<span className="mr-2">{album.emoji}</span>
															<span className="flex-1">{album.name}</span>
															<div className="w-3 h-3 rounded" style={{ backgroundColor: album.color }} />
														</div>
													</ContextMenuItem>
												))
											) : (
												<ContextMenuItem disabled>No hay álbumes disponibles</ContextMenuItem>
											)}
										</ContextMenuSubContent>
									</ContextMenuSub>

									<ContextMenuSub>
										<ContextMenuSubTrigger>
											<User className="mr-2 h-4 w-4" />
											Personajes
										</ContextMenuSubTrigger>
										<ContextMenuSubContent className="w-48">
											{characters.length > 0 ? (
												characters.map((character: Character) => (
													<ContextMenuItem
														key={character.id}
														onClick={() => addImageToCharacter(character.id, file.id)}
													>
														<div className="flex items-center gap-2 w-full">
															<span className="mr-2">{character.emoji}</span>
															<span className="flex-1">{character.name}</span>
															<div className="w-3 h-3 rounded" style={{ backgroundColor: character.color }} />
														</div>
													</ContextMenuItem>
												))
											) : (
												<ContextMenuItem disabled>No hay personajes disponibles</ContextMenuItem>
											)}
										</ContextMenuSubContent>
									</ContextMenuSub>

									<ContextMenuSub>
										<ContextMenuSubTrigger>
											<MapPin className="mr-2 h-4 w-4" />
											Lugares
										</ContextMenuSubTrigger>
										<ContextMenuSubContent className="w-48">
											{places.length > 0 ? (
												places.map((place: Place) => (
													<ContextMenuItem key={place.id} onClick={() => addImageToPlace(place.id, file.id)}>
														<div className="flex items-center gap-2 w-full">
															<span className="mr-2">{place.emoji}</span>
															<span className="flex-1">{place.name}</span>
															<div className="w-3 h-3 rounded" style={{ backgroundColor: place.color }} />
														</div>
													</ContextMenuItem>
												))
											) : (
												<ContextMenuItem disabled>No hay lugares disponibles</ContextMenuItem>
											)}
										</ContextMenuSubContent>
									</ContextMenuSub>

									<ContextMenuSub>
										<ContextMenuSubTrigger>
											<Box className="mr-2 h-4 w-4" />
											Objetos
										</ContextMenuSubTrigger>
										<ContextMenuSubContent className="w-48">
											{objects.length > 0 ? (
												objects.map((object: ObjectEntity) => (
													<ContextMenuItem key={object.id} onClick={() => addImageToObject(object.id, file.id)}>
														<div className="flex items-center gap-2 w-full">
															<span className="mr-2">{object.emoji}</span>
															<span className="flex-1">{object.name}</span>
															<div className="w-3 h-3 rounded" style={{ backgroundColor: object.color }} />
														</div>
													</ContextMenuItem>
												))
											) : (
												<ContextMenuItem disabled>No hay objetos disponibles</ContextMenuItem>
											)}
										</ContextMenuSubContent>
									</ContextMenuSub>

									<ContextMenuSeparator />

									<ContextMenuItem onClick={() => onAction('preview', file)}>
										<ImageIcon className="mr-2 h-4 w-4" />
										Ver imagen
										<ContextMenuShortcut>⏎</ContextMenuShortcut>
									</ContextMenuItem>

									<ContextMenuItem onClick={() => onAction('open', file)}>
										<FolderOpen className="mr-2 h-4 w-4" />
										Abrir ubicación
										<ContextMenuShortcut>⌘O</ContextMenuShortcut>
									</ContextMenuItem>

									<ContextMenuSeparator />

									<ContextMenuItem onClick={() => onAction('download', file)}>
										<Download className="mr-2 h-4 w-4" />
										Descargar
										<ContextMenuShortcut>⌘D</ContextMenuShortcut>
									</ContextMenuItem>

									<ContextMenuItem onClick={() => onAction('copy', file)}>
										<Copy className="mr-2 h-4 w-4" />
										Copiar
										<ContextMenuShortcut>⌘C</ContextMenuShortcut>
									</ContextMenuItem>

									<ContextMenuSeparator />

									<ContextMenuItem onClick={() => onAction('delete', file)} className="text-red-600">
										<Trash2 className="mr-2 h-4 w-4" />
										Eliminar
										<ContextMenuShortcut>⌘⌫</ContextMenuShortcut>
									</ContextMenuItem>
								</>
							)}
						</>
					)}
				</ContextMenuContent>
			)}
		</ContextMenu>
	);
}
