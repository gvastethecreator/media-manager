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
import { useCollectionTagContext } from "@/context/settings-context";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { GithubPicker } from "react-color";
import { Badge } from "@/components/ui/badge";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useFavoritesStore } from "@/store/favorites.store";
import { useCollectionsStore } from "@/store/collections.store";
import { useTagsStore } from "@/store/tags.store";
import { logger } from "@/lib/logger";
import { statsService } from "@/services/stats.service";
import { useAlbumsStore } from "@/store/albums.store";
import { useCharactersStore } from "@/store/characters.store";
import { usePlacesStore } from "@/store/places.store";
import { useObjectsStore } from "@/store/objects.store";

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
	const { collections, createCollection, addImageToCollection } =
		useCollectionsStore();
	const { tags, createTag, addImageToTag } = useTagsStore();
	const { albums, createAlbum, addImageToAlbum, loadAlbums } = useAlbumsStore();
	const { characters, createCharacter, addImageToCharacter, loadCharacters } =
		useCharactersStore();
	const { places, createPlace, addImageToPlace, loadPlaces } = usePlacesStore();
	const { objects, createObject, addImageToObject, loadObjects } =
		useObjectsStore();

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

	// Estados para nueva colección
	const [isCollectionDialogOpen, setIsCollectionDialogOpen] = useState(false);
	const [newCollection, setNewCollection] = useState<NewCollectionData>({
		name: "",
		emoji: "📁",
		color: "#3b82f6",
	});

	// Estados para nueva etiqueta
	const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
	const [newTag, setNewTag] = useState({
		name: "",
		color: "#3b82f6",
		description: "",
	});

	// Estados para nuevo álbum
	const [isAlbumDialogOpen, setIsAlbumDialogOpen] = useState(false);
	const [newAlbum, setNewAlbum] = useState({
		name: "",
		emoji: "📸",
		color: "#3b82f6",
		description: "",
	});

	// Estados para nuevo personaje
	const [isCharacterDialogOpen, setIsCharacterDialogOpen] = useState(false);
	const [newCharacter, setNewCharacter] = useState({
		name: "",
		emoji: "👤",
		color: "#3b82f6",
		description: "",
	});

	// Estados para nuevo lugar
	const [isPlaceDialogOpen, setIsPlaceDialogOpen] = useState(false);
	const [newPlace, setNewPlace] = useState({
		name: "",
		emoji: "📍",
		color: "#3b82f6",
		description: "",
	});

	// Estados para nuevo objeto
	const [isObjectDialogOpen, setIsObjectDialogOpen] = useState(false);
	const [newObject, setNewObject] = useState({
		name: "",
		emoji: "🎯",
		color: "#3b82f6",
		description: "",
	});

	const handleCreateCollection = useCallback(async () => {
		try {
			await createCollection({
				name: newCollection.name,
				emoji: newCollection.emoji,
				color: newCollection.color,
			});
			setIsCollectionDialogOpen(false);
			setNewCollection({ name: "", emoji: "📁", color: "#3b82f6" });
			contextMenuLogger.info("✨ Nueva colección creada:", newCollection);
			statsService.emitCollectionChange(file.id);
		} catch (error) {
			contextMenuLogger.error("❌ Error al crear colección:", { error });
		}
	}, [newCollection, createCollection, file.id]);

	const handleCreateTag = async () => {
		try {
			await createTag({
				name: newTag.name,
				color: newTag.color,
				description: newTag.description,
			});

			const createdTag = tags.find((t) => t.name === newTag.name);

			if (createdTag) {
				await addImageToTag(createdTag.id, file.id);
				contextMenuLogger.info("✨ Tag creado y archivo agregado:", {
					tag: createdTag.name,
					fileId: file.id,
				});
				statsService.emitTagChange(file.id);
			}

			setNewTag({
				name: "",
				color: "#3b82f6",
				description: "",
			});
			setIsTagDialogOpen(false);
		} catch (error) {
			contextMenuLogger.error("❌ Error al crear tag:", { error });
		}
	};

	const handleToggleFavorite = async () => {
		try {
			await toggleFavorite(file.id);
			contextMenuLogger.info("💫 Estado de favorito cambiado:", {
				fileId: file.id,
			});
			statsService.emitFavoriteChange(file.id);
		} catch (error) {
			contextMenuLogger.error("❌ Error al cambiar estado de favorito:", {
				error,
			});
		}
	};

	const handleCreateAlbum = useCallback(async () => {
		try {
			await createAlbum({
				name: newAlbum.name,
				emoji: newAlbum.emoji,
				color: newAlbum.color,
				description: newAlbum.description,
				sortBy: "name",
				filters: "[]",
			});
			setIsAlbumDialogOpen(false);
			setNewAlbum({ name: "", emoji: "📸", color: "#3b82f6", description: "" });
			contextMenuLogger.info("✨ Nuevo álbum creado:", newAlbum);
			statsService.emitAlbumChange(file.id);
		} catch (error) {
			contextMenuLogger.error("❌ Error al crear álbum:", { error });
		}
	}, [newAlbum, createAlbum, file.id]);

	const handleCreateCharacter = useCallback(async () => {
		try {
			await createCharacter({
				name: newCharacter.name,
				emoji: newCharacter.emoji,
				color: newCharacter.color,
				description: newCharacter.description,
				level: 1,
				class: "unknown",
				race: "unknown",
				alignment: "neutral",
				backstory: "",
				stats: "{}",
				sortBy: "name",
				filters: "[]",
			});
			setIsCharacterDialogOpen(false);
			setNewCharacter({
				name: "",
				emoji: "👤",
				color: "#3b82f6",
				description: "",
			});
			contextMenuLogger.info("✨ Nuevo personaje creado:", newCharacter);
			statsService.emitCharacterChange(file.id);
		} catch (error) {
			contextMenuLogger.error("❌ Error al crear personaje:", { error });
		}
	}, [newCharacter, createCharacter, file.id]);

	const handleCreatePlace = useCallback(async () => {
		try {
			await createPlace({
				name: newPlace.name,
				emoji: newPlace.emoji,
				color: newPlace.color,
				description: newPlace.description,
				region: "unknown",
				type: "unknown",
				climate: "temperate",
				population: 0,
				government: "unknown",
				dangers: "[]",
				resources: "[]",
				lore: "",
				history: "",
				stats: "{}",
				sortBy: "name",
				filters: "[]",
			});
			setIsPlaceDialogOpen(false);
			setNewPlace({ name: "", emoji: "📍", color: "#3b82f6", description: "" });
			contextMenuLogger.info("✨ Nuevo lugar creado:", newPlace);
			statsService.emitPlaceChange(file.id);
		} catch (error) {
			contextMenuLogger.error("❌ Error al crear lugar:", { error });
		}
	}, [newPlace, createPlace, file.id]);

	const handleCreateObject = useCallback(async () => {
		try {
			await createObject({
				name: newObject.name,
				emoji: newObject.emoji,
				color: newObject.color,
				description: newObject.description,
				type: "misc",
				rarity: "common",
				properties: "[]",
				requirements: "{}",
				origin: "",
				stats: "{}",
				sortBy: "name",
				filters: "[]",
			});
			setIsObjectDialogOpen(false);
			setNewObject({
				name: "",
				emoji: "🎯",
				color: "#3b82f6",
				description: "",
			});
			contextMenuLogger.info("✨ Nuevo objeto creado:", newObject);
			statsService.emitObjectChange(file.id);
		} catch (error) {
			contextMenuLogger.error("❌ Error al crear objeto:", { error });
		}
	}, [newObject, createObject, file.id]);

	const isImage = file.type === "image" || file.mimeType?.startsWith("image/");

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

				<ContextMenuSub>
					<ContextMenuSubTrigger>
						<BookmarkPlus className="mr-2 h-4 w-4" />
						Agregar a colección
					</ContextMenuSubTrigger>
					<ContextMenuSubContent className="w-48">
						<Dialog
							open={isCollectionDialogOpen}
							onOpenChange={setIsCollectionDialogOpen}
						>
							<DialogTrigger asChild>
								<ContextMenuItem onSelect={(e) => e.preventDefault()}>
									<BookmarkPlus className="mr-2 h-4 w-4" />
									Nueva colección...
								</ContextMenuItem>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Crear nueva colección</DialogTitle>
								</DialogHeader>
								<div className="grid gap-4 py-4">
									<div className="flex items-center gap-4">
										<EmojiPicker
											onEmojiSelect={(emoji: string) =>
												setNewCollection({
													...newCollection,
													emoji,
												})
											}
										/>
										<Input
											placeholder="Nombre de la colección"
											value={newCollection.name}
											onChange={(e) =>
												setNewCollection({
													...newCollection,
													name: e.target.value,
												})
											}
										/>
									</div>
									<div>
										<Popover>
											<PopoverTrigger asChild>
												<Button variant="outline" className="w-full">
													<div
														className="w-4 h-4 rounded mr-2"
														style={{
															backgroundColor: newCollection.color,
														}}
													/>
													Color
												</Button>
											</PopoverTrigger>
											<PopoverContent className="w-auto p-0" align="start">
												<GithubPicker
													color={newCollection.color}
													onChange={(color) =>
														setNewCollection({
															...newCollection,
															color: color.hex,
														})
													}
												/>
											</PopoverContent>
										</Popover>
									</div>
									<Button
										onClick={handleCreateCollection}
										disabled={!newCollection.name.trim()}
									>
										Crear colección
									</Button>
								</div>
							</DialogContent>
						</Dialog>
						<ContextMenuSeparator />
						{collections.length > 0 ? (
							collections.map((collection) => (
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
						) : (
							<ContextMenuItem disabled>
								No hay colecciones disponibles
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
						<Dialog open={isTagDialogOpen} onOpenChange={setIsTagDialogOpen}>
							<DialogTrigger asChild>
								<ContextMenuItem onSelect={(e) => e.preventDefault()}>
									<TagIcon className="mr-2 h-4 w-4" />
									Nueva etiqueta...
								</ContextMenuItem>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Crear nueva etiqueta</DialogTitle>
								</DialogHeader>
								<div className="grid gap-4 py-4">
									<div className="flex items-center gap-4">
										<Input
											placeholder="Nombre de la etiqueta"
											value={newTag.name}
											onChange={(e) =>
												setNewTag({
													...newTag,
													name: e.target.value,
												})
											}
										/>
									</div>
									<div>
										<Popover>
											<PopoverTrigger asChild>
												<Button variant="outline" className="w-full">
													<div
														className="w-4 h-4 rounded mr-2"
														style={{
															backgroundColor: newTag.color,
														}}
													/>
													Color
												</Button>
											</PopoverTrigger>
											<PopoverContent className="w-auto p-0" align="start">
												<GithubPicker
													color={newTag.color}
													onChange={(color) =>
														setNewTag({
															...newTag,
															color: color.hex,
														})
													}
												/>
											</PopoverContent>
										</Popover>
									</div>
									<Button
										onClick={handleCreateTag}
										disabled={!newTag.name.trim()}
									>
										Crear etiqueta
									</Button>
								</div>
							</DialogContent>
						</Dialog>
						<ContextMenuSeparator />
						{tags.length > 0 ? (
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
						) : (
							<ContextMenuItem disabled>
								No hay etiquetas disponibles
							</ContextMenuItem>
						)}
					</ContextMenuSubContent>
				</ContextMenuSub>

				<ContextMenuSub>
					<ContextMenuSubTrigger>
						<ImageIcon className="mr-2 h-4 w-4" />
						Álbumes
					</ContextMenuSubTrigger>
					<ContextMenuSubContent className="w-48">
						<Dialog
							open={isAlbumDialogOpen}
							onOpenChange={setIsAlbumDialogOpen}
						>
							<DialogTrigger asChild>
								<ContextMenuItem onSelect={(e) => e.preventDefault()}>
									<ImageIcon className="mr-2 h-4 w-4" />
									Nuevo álbum...
								</ContextMenuItem>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Crear nuevo álbum</DialogTitle>
								</DialogHeader>
								<div className="grid gap-4 py-4">
									<div className="flex items-center gap-4">
										<EmojiPicker
											onEmojiSelect={(emoji: string) =>
												setNewAlbum({
													...newAlbum,
													emoji,
												})
											}
										/>
										<Input
											placeholder="Nombre del álbum"
											value={newAlbum.name}
											onChange={(e) =>
												setNewAlbum({
													...newAlbum,
													name: e.target.value,
												})
											}
										/>
									</div>
									<div>
										<Popover>
											<PopoverTrigger asChild>
												<Button variant="outline" className="w-full">
													<div
														className="w-4 h-4 rounded mr-2"
														style={{
															backgroundColor: newAlbum.color,
														}}
													/>
													Color
												</Button>
											</PopoverTrigger>
											<PopoverContent className="w-auto p-0" align="start">
												<GithubPicker
													color={newAlbum.color}
													onChange={(color) =>
														setNewAlbum({
															...newAlbum,
															color: color.hex,
														})
													}
												/>
											</PopoverContent>
										</Popover>
									</div>
									<Button
										onClick={handleCreateAlbum}
										disabled={!newAlbum.name.trim()}
									>
										Crear álbum
									</Button>
								</div>
							</DialogContent>
						</Dialog>
						<ContextMenuSeparator />
						{albums.length > 0 ? (
							albums.map((album) => (
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
						) : (
							<ContextMenuItem disabled>
								No hay álbumes disponibles
							</ContextMenuItem>
						)}
					</ContextMenuSubContent>
				</ContextMenuSub>

				<ContextMenuSub>
					<ContextMenuSubTrigger>
						<User className="mr-2 h-4 w-4" />
						Personajes
					</ContextMenuSubTrigger>
					<ContextMenuSubContent className="w-48">
						<Dialog
							open={isCharacterDialogOpen}
							onOpenChange={setIsCharacterDialogOpen}
						>
							<DialogTrigger asChild>
								<ContextMenuItem onSelect={(e) => e.preventDefault()}>
									<User className="mr-2 h-4 w-4" />
									Nuevo personaje...
								</ContextMenuItem>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Crear nuevo personaje</DialogTitle>
								</DialogHeader>
								<div className="grid gap-4 py-4">
									<div className="flex items-center gap-4">
										<EmojiPicker
											onEmojiSelect={(emoji: string) =>
												setNewCharacter({
													...newCharacter,
													emoji,
												})
											}
										/>
										<Input
											placeholder="Nombre del personaje"
											value={newCharacter.name}
											onChange={(e) =>
												setNewCharacter({
													...newCharacter,
													name: e.target.value,
												})
											}
										/>
									</div>
									<div>
										<Popover>
											<PopoverTrigger asChild>
												<Button variant="outline" className="w-full">
													<div
														className="w-4 h-4 rounded mr-2"
														style={{
															backgroundColor: newCharacter.color,
														}}
													/>
													Color
												</Button>
											</PopoverTrigger>
											<PopoverContent className="w-auto p-0" align="start">
												<GithubPicker
													color={newCharacter.color}
													onChange={(color) =>
														setNewCharacter({
															...newCharacter,
															color: color.hex,
														})
													}
												/>
											</PopoverContent>
										</Popover>
									</div>
									<Button
										onClick={handleCreateCharacter}
										disabled={!newCharacter.name.trim()}
									>
										Crear personaje
									</Button>
								</div>
							</DialogContent>
						</Dialog>
						<ContextMenuSeparator />
						{characters.length > 0 ? (
							characters.map((character) => (
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
						) : (
							<ContextMenuItem disabled>
								No hay personajes disponibles
							</ContextMenuItem>
						)}
					</ContextMenuSubContent>
				</ContextMenuSub>

				<ContextMenuSub>
					<ContextMenuSubTrigger>
						<MapPin className="mr-2 h-4 w-4" />
						Lugares
					</ContextMenuSubTrigger>
					<ContextMenuSubContent className="w-48">
						<Dialog
							open={isPlaceDialogOpen}
							onOpenChange={setIsPlaceDialogOpen}
						>
							<DialogTrigger asChild>
								<ContextMenuItem onSelect={(e) => e.preventDefault()}>
									<MapPin className="mr-2 h-4 w-4" />
									Nuevo lugar...
								</ContextMenuItem>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Crear nuevo lugar</DialogTitle>
								</DialogHeader>
								<div className="grid gap-4 py-4">
									<div className="flex items-center gap-4">
										<EmojiPicker
											onEmojiSelect={(emoji: string) =>
												setNewPlace({
													...newPlace,
													emoji,
												})
											}
										/>
										<Input
											placeholder="Nombre del lugar"
											value={newPlace.name}
											onChange={(e) =>
												setNewPlace({
													...newPlace,
													name: e.target.value,
												})
											}
										/>
									</div>
									<div>
										<Popover>
											<PopoverTrigger asChild>
												<Button variant="outline" className="w-full">
													<div
														className="w-4 h-4 rounded mr-2"
														style={{
															backgroundColor: newPlace.color,
														}}
													/>
													Color
												</Button>
											</PopoverTrigger>
											<PopoverContent className="w-auto p-0" align="start">
												<GithubPicker
													color={newPlace.color}
													onChange={(color) =>
														setNewPlace({
															...newPlace,
															color: color.hex,
														})
													}
												/>
											</PopoverContent>
										</Popover>
									</div>
									<Button
										onClick={handleCreatePlace}
										disabled={!newPlace.name.trim()}
									>
										Crear lugar
									</Button>
								</div>
							</DialogContent>
						</Dialog>
						<ContextMenuSeparator />
						{places.length > 0 ? (
							places.map((place) => (
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
						) : (
							<ContextMenuItem disabled>
								No hay lugares disponibles
							</ContextMenuItem>
						)}
					</ContextMenuSubContent>
				</ContextMenuSub>

				<ContextMenuSub>
					<ContextMenuSubTrigger>
						<Box className="mr-2 h-4 w-4" />
						Objetos
					</ContextMenuSubTrigger>
					<ContextMenuSubContent className="w-48">
						<Dialog
							open={isObjectDialogOpen}
							onOpenChange={setIsObjectDialogOpen}
						>
							<DialogTrigger asChild>
								<ContextMenuItem onSelect={(e) => e.preventDefault()}>
									<Box className="mr-2 h-4 w-4" />
									Nuevo objeto...
								</ContextMenuItem>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Crear nuevo objeto</DialogTitle>
								</DialogHeader>
								<div className="grid gap-4 py-4">
									<div className="flex items-center gap-4">
										<EmojiPicker
											onEmojiSelect={(emoji: string) =>
												setNewObject({
													...newObject,
													emoji,
												})
											}
										/>
										<Input
											placeholder="Nombre del objeto"
											value={newObject.name}
											onChange={(e) =>
												setNewObject({
													...newObject,
													name: e.target.value,
												})
											}
										/>
									</div>
									<div>
										<Popover>
											<PopoverTrigger asChild>
												<Button variant="outline" className="w-full">
													<div
														className="w-4 h-4 rounded mr-2"
														style={{
															backgroundColor: newObject.color,
														}}
													/>
													Color
												</Button>
											</PopoverTrigger>
											<PopoverContent className="w-auto p-0" align="start">
												<GithubPicker
													color={newObject.color}
													onChange={(color) =>
														setNewObject({
															...newObject,
															color: color.hex,
														})
													}
												/>
											</PopoverContent>
										</Popover>
									</div>
									<Button
										onClick={handleCreateObject}
										disabled={!newObject.name.trim()}
									>
										Crear objeto
									</Button>
								</div>
							</DialogContent>
						</Dialog>
						<ContextMenuSeparator />
						{objects.length > 0 ? (
							objects.map((object) => (
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
						) : (
							<ContextMenuItem disabled>
								No hay objetos disponibles
							</ContextMenuItem>
						)}
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
