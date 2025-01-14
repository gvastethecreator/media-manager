"use client";

import {
	Copy,
	Download,
	Info,
	Pencil,
	Share2,
	Trash2,
	Heart,
	HeartOff,
	BookmarkPlus,
	Tag as TagIcon,
	FolderOpen,
	ImageIcon,
	Palette,
	Flag,
	User,
	MapPin,
	Box,
} from "lucide-react";
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
} from "@/components/ui/context-menu";
import type { FileItem } from "@/types/file-item";
import { useEffect, useState, useCallback } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useFavoritesStore } from "@/store/favorites.store";
import { useCollectionStore } from "@/store/collections.store";
import { useTagsStore } from "@/store/tags.store";
import { logger } from "@/lib/logger";
import { statsService } from "@/services/stats.service";
import { useAlbumStore } from "@/store/albums.store";
import { useCharacterStore } from "@/store/characters.store";
import { usePlaceStore } from "@/store/places.store";
import { useObjectStore } from "@/store/objects.store";
import type { Collection } from "@prisma/client";
import type { Album } from "@prisma/client";
import type { Character } from "@prisma/client";
import type { Place } from "@prisma/client";
import type { Object } from "@prisma/client";

const contextMenuLogger = logger.withContext("ContextMenu");

// Tipos de acciones del menú contextual
export type ContextMenuAction =
	| "mark-toggle"
	| "favorite-toggle"
	| "collection-add"
	| "tag-add"
	| "album-add"
	| "character-add"
	| "place-add"
	| "object-add"
	| "preview"
	| "open"
	| "download"
	| "copy"
	| "delete";

interface FileContextMenuProps {
	file: FileItem;
	children: React.ReactNode;
	onAction: (action: ContextMenuAction, file: FileItem, data?: any) => void;
}

interface NewCollectionData {
	name: string;
	emoji: string;
	color: string;
}

export function FileContextMenu({
	file,
	children,
	onAction,
}: FileContextMenuProps) {
	// Stores
	const { toggleFavorite, isFavorited } = useFavoritesStore();
	const { collections,addImageToCollection } =
		useCollectionStore() as any;
	const { tags, addImageToTag } = useTagsStore();
	const { albums, addImageToAlbum, loadAlbums } =
		useAlbumStore() as any;
	const { characters, addImageToCharacter, loadCharacters } =
		useCharacterStore() as any;
	const { places, addImageToPlace, loadPlaces } =
		usePlaceStore() as any;
	const { objects, addImageToObject, loadObjects } =
		useObjectStore() as any;

	// Cargar datos iniciales
	useEffect(() => {
		const loadInitialData = async () => {
			try {
				contextMenuLogger.info("🔄 Cargando datos iniciales...");
				await Promise.all([
					loadAlbums(),
					loadCharacters(),
					loadPlaces(),
					loadObjects(),
				]);
				contextMenuLogger.info("✅ Datos iniciales cargados");
			} catch (error) {
				contextMenuLogger.error("❌ Error al cargar datos iniciales:", error);
			}
		};

		loadInitialData();
	}, [loadAlbums, loadCharacters, loadPlaces, loadObjects]);

	const isImage =
		file.type === "image" ||
		(() => {
			try {
				const metadata = file.metadata ? JSON.parse(file.metadata) : null;
				return metadata?.mimeType?.startsWith("image/") || false;
			} catch {
				return false;
			}
		})();

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
			<ContextMenuContent className="w-64">
				<ContextMenuItem onClick={() => onAction("mark-toggle", file)}>
					<Flag className="mr-2 h-4 w-4 text-warning" />
					Marcar/Desmarcar
					<ContextMenuShortcut>⌘M</ContextMenuShortcut>
				</ContextMenuItem>

				<ContextMenuItem onClick={handleToggleFavorite}>
					{isFavorited(file.id) ?
						<>
							<HeartOff className="mr-2 h-4 w-4" />
							Quitar de favoritos
						</>
					:	<>
							<Heart className="mr-2 h-4 w-4" />
							Agregar a favoritos
						</>
					}
					<ContextMenuShortcut>⌘F</ContextMenuShortcut>
				</ContextMenuItem>

				<ContextMenuSub>
					<ContextMenuSubTrigger>
						<BookmarkPlus className="mr-2 h-4 w-4" />
						Agregar a colección
					</ContextMenuSubTrigger>
					<ContextMenuSubContent className="w-48">
						{collections.length > 0 ?
							collections.map((collection: Collection) => (
								<ContextMenuItem
									key={collection.id}
									onClick={() => addImageToCollection(collection.id, file.id)}
								>
									<div className="flex items-center gap-2 w-full">
										<span className="mr-2">{collection.emoji}</span>
										<span className="flex-1">{collection.name}</span>
										<div
											className="w-3 h-3 rounded"
											style={{ backgroundColor: collection.color }}
										/>
									</div>
								</ContextMenuItem>
							))
						:	<ContextMenuItem disabled>
								No hay colecciones disponibles
							</ContextMenuItem>
						}
					</ContextMenuSubContent>
				</ContextMenuSub>

				<ContextMenuSub>
					<ContextMenuSubTrigger>
						<TagIcon className="mr-2 h-4 w-4" />
						Etiquetas
					</ContextMenuSubTrigger>
					<ContextMenuSubContent className="w-48">
						{tags.length > 0 ?
							tags.map((tag) => (
								<ContextMenuItem
									key={tag.id}
									onClick={() => addImageToTag(tag.id, file.id)}
								>
									<div className="flex items-center gap-2 w-full">
										<div
											className="w-3 h-3 rounded"
											style={{ backgroundColor: tag.color }}
										/>
										<span className="flex-1">{tag.name}</span>
										{tag.shortcut && (
											<Badge variant="outline" className="text-[10px] h-4 px-1">
												{tag.shortcut}
											</Badge>
										)}
									</div>
								</ContextMenuItem>
							))
						:	<ContextMenuItem disabled>
								No hay etiquetas disponibles
							</ContextMenuItem>
						}
					</ContextMenuSubContent>
				</ContextMenuSub>

				<ContextMenuSub>
					<ContextMenuSubTrigger>
						<ImageIcon className="mr-2 h-4 w-4" />
						Álbumes
					</ContextMenuSubTrigger>
					<ContextMenuSubContent className="w-48">
						{albums.length > 0 ?
							albums.map((album: Album) => (
								<ContextMenuItem
									key={album.id}
									onClick={() => addImageToAlbum(album.id, file.id)}
								>
									<div className="flex items-center gap-2 w-full">
										<span className="mr-2">{album.emoji}</span>
										<span className="flex-1">{album.name}</span>
										<div
											className="w-3 h-3 rounded"
											style={{ backgroundColor: album.color }}
										/>
									</div>
								</ContextMenuItem>
							))
						:	<ContextMenuItem disabled>
								No hay álbumes disponibles
							</ContextMenuItem>
						}
					</ContextMenuSubContent>
				</ContextMenuSub>

				<ContextMenuSub>
					<ContextMenuSubTrigger>
						<User className="mr-2 h-4 w-4" />
						Personajes
					</ContextMenuSubTrigger>
					<ContextMenuSubContent className="w-48">
						{characters.length > 0 ?
							characters.map((character: Character) => (
								<ContextMenuItem
									key={character.id}
									onClick={() => addImageToCharacter(character.id, file.id)}
								>
									<div className="flex items-center gap-2 w-full">
										<span className="mr-2">{character.emoji}</span>
										<span className="flex-1">{character.name}</span>
										<div
											className="w-3 h-3 rounded"
											style={{ backgroundColor: character.color }}
										/>
									</div>
								</ContextMenuItem>
							))
						:	<ContextMenuItem disabled>
								No hay personajes disponibles
							</ContextMenuItem>
						}
					</ContextMenuSubContent>
				</ContextMenuSub>

				<ContextMenuSub>
					<ContextMenuSubTrigger>
						<MapPin className="mr-2 h-4 w-4" />
						Lugares
					</ContextMenuSubTrigger>
					<ContextMenuSubContent className="w-48">
						{places.length > 0 ?
							places.map((place: Place) => (
								<ContextMenuItem
									key={place.id}
									onClick={() => addImageToPlace(place.id, file.id)}
								>
									<div className="flex items-center gap-2 w-full">
										<span className="mr-2">{place.emoji}</span>
										<span className="flex-1">{place.name}</span>
										<div
											className="w-3 h-3 rounded"
											style={{ backgroundColor: place.color }}
										/>
									</div>
								</ContextMenuItem>
							))
						:	<ContextMenuItem disabled>
								No hay lugares disponibles
							</ContextMenuItem>
						}
					</ContextMenuSubContent>
				</ContextMenuSub>

				<ContextMenuSub>
					<ContextMenuSubTrigger>
						<Box className="mr-2 h-4 w-4" />
						Objetos
					</ContextMenuSubTrigger>
					<ContextMenuSubContent className="w-48">
						{objects.length > 0 ?
							objects.map((object: Object) => (
								<ContextMenuItem
									key={object.id}
									onClick={() => addImageToObject(object.id, file.id)}
								>
									<div className="flex items-center gap-2 w-full">
										<span className="mr-2">{object.emoji}</span>
										<span className="flex-1">{object.name}</span>
										<div
											className="w-3 h-3 rounded"
											style={{ backgroundColor: object.color }}
										/>
									</div>
								</ContextMenuItem>
							))
						:	<ContextMenuItem disabled>
								No hay objetos disponibles
							</ContextMenuItem>
						}
					</ContextMenuSubContent>
				</ContextMenuSub>

				<ContextMenuSeparator />

				{isImage && (
					<ContextMenuItem onClick={() => onAction("preview", file)}>
						<ImageIcon className="mr-2 h-4 w-4" />
						Ver imagen
						<ContextMenuShortcut>⏎</ContextMenuShortcut>
					</ContextMenuItem>
				)}

				<ContextMenuItem onClick={() => onAction("open", file)}>
					<FolderOpen className="mr-2 h-4 w-4" />
					Abrir ubicación
					<ContextMenuShortcut>⌘O</ContextMenuShortcut>
				</ContextMenuItem>

				<ContextMenuSeparator />

				<ContextMenuItem onClick={() => onAction("download", file)}>
					<Download className="mr-2 h-4 w-4" />
					Descargar
					<ContextMenuShortcut>⌘D</ContextMenuShortcut>
				</ContextMenuItem>

				<ContextMenuItem onClick={() => onAction("copy", file)}>
					<Copy className="mr-2 h-4 w-4" />
					Copiar
					<ContextMenuShortcut>⌘C</ContextMenuShortcut>
				</ContextMenuItem>

				<ContextMenuSeparator />

				<ContextMenuItem
					onClick={() => onAction("delete", file)}
					className="text-red-600"
				>
					<Trash2 className="mr-2 h-4 w-4" />
					Eliminar
					<ContextMenuShortcut>⌘⌫</ContextMenuShortcut>
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
}
