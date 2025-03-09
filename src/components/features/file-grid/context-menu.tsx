"use client";

import { Badge } from "@/components/ui/badge";
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
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { logger } from "@/lib/logger";
import { toastService } from "@/lib/toast";
import { useAlbumsStore } from "@/store/entities/albums.store";
import { useCharactersStore } from "@/store/entities/characters.store";
import { useCollectionsStore } from "@/store/entities/collections.store";
import { useConceptStore } from "@/store/entities/concept.store";
import { useNoteStore } from "@/store/entities/note.store";
import { useTagsStore } from "@/store/entities/tags.store";
import { useFavoritesStore } from "@/store/favorites.store";
import { useObjectsStore } from "@/store/objects.store";
import { usePlacesStore } from "@/store/places.store";
import { usePromptStore } from "@/store/prompt.store";
import type { FileItem } from "@/types/file-item";
import type {
	Album,
	Character,
	Collection,
	Object as ObjectEntity,
	Place,
	Tag,
} from "@prisma/client";
import {
	BookmarkPlus,
	Box,
	Copy,
	Download,
	FileText,
	Flag,
	FolderOpen,
	Heart,
	HeartOff,
	ImageIcon,
	Info,
	Lightbulb,
	MapPin,
	MessageSquare,
	Palette,
	Pencil,
	Plus,
	Share2,
	Tag as TagIcon,
	Trash2,
	User,
} from "lucide-react";
import type * as React from "react";
import { useCallback, useEffect, useState } from "react";

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
	| "collection-create"
	| "tag-create"
	| "album-create"
	| "character-create"
	| "place-create"
	| "object-create"
	| "prompt-add"
	| "note-add"
	| "concept-add"
	| "prompt-create"
	| "note-create"
	| "concept-create"
	| "preview"
	| "open"
	| "download"
	| "copy"
	| "copy-path"
	| "delete";

interface FileContextMenuProps {
	file: FileItem;
	children: React.ReactNode;
	onAction: (
		action: ContextMenuAction,
		file: FileItem,
		data?: Record<string, unknown>
	) => void;
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

// Interfaces para los estados de carga
interface EntityLoadingState {
	loading: boolean;
	open: boolean;
	loaded: boolean;
}

// Componente de submenú genérico
interface SubMenuProps<T> {
	title: string;
	icon: React.ReactNode;
	entityName: string;
	entities: T[];
	isLoading: boolean;
	onSelect: (entity: T) => void;
	onCreate: () => void;
	renderItem: (entity: T) => React.ReactNode;
}

function EntitySubMenu<T>({
	title,
	icon,
	entityName,
	entities,
	isLoading,
	onSelect,
	onCreate,
	renderItem,
}: SubMenuProps<T>) {
	return (
		<ContextMenuSub>
			<ContextMenuSubTrigger>
				{icon}
				{title}
			</ContextMenuSubTrigger>
			<ContextMenuSubContent className="w-56">
				{isLoading ? (
					<div className="flex justify-center items-center py-2">
						<LoadingSpinner size={16} />
						<span className="ml-2 text-sm">Cargando {entityName}...</span>
					</div>
				) : (
					<>
						<ContextMenuItem onClick={onCreate} className="text-primary">
							<Plus className="mr-2 h-4 w-4" />
							<span>Nuevo {entityName}</span>
						</ContextMenuItem>

						<ContextMenuSeparator />

						{entities && entities.length > 0 ? (
							<ScrollArea className={entities.length > 10 ? "h-[300px]" : ""}>
								{entities.map((entity, index) => (
									<ContextMenuItem
										key={`entity-${index}`}
										onClick={() => onSelect(entity)}
									>
										{renderItem(entity)}
									</ContextMenuItem>
								))}
							</ScrollArea>
						) : (
							<ContextMenuItem disabled>
								<span className="text-muted-foreground">
									No hay {entityName}s disponibles
								</span>
							</ContextMenuItem>
						)}
					</>
				)}
			</ContextMenuSubContent>
		</ContextMenuSub>
	);
}

export function FileContextMenu({
	file,
	children,
	onAction,
}: FileContextMenuProps) {
	// Stores con tipos correctos y valores por defecto
	const { toggleFavorite, isFavorited } = useFavoritesStore();
	const {
		collections,
		addImageToCollection,
		loadCollections,
		createCollection,
	} = useCollectionsStore();
	const { tags, addTagToImage, loadTags, createTag } = useTagsStore();
	const { albums, addImageToAlbum, loadAlbums, createAlbum } = useAlbumsStore();
	const { characters, addImageToCharacter, loadCharacters, createCharacter } =
		useCharactersStore();
	const { places, addImageToPlace, loadPlaces, createPlace } = usePlacesStore();
	const { objects, addImageToObject, loadObjects, createObject } =
		useObjectsStore();
	const { prompts, loadPrompts } = usePromptStore();
	const { notes, loadNotes } = useNoteStore();
	const { concepts, loadConcepts } = useConceptStore();

	// Estado para controlar si el menú está abierto
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	// Estados de carga para cada tipo de entidad
	const [loadingStates, setLoadingStates] = useState({
		collections: { loading: false, open: false, loaded: false },
		tags: { loading: false, open: false, loaded: false },
		albums: { loading: false, open: false, loaded: false },
		characters: { loading: false, open: false, loaded: false },
		places: { loading: false, open: false, loaded: false },
		objects: { loading: false, open: false, loaded: false },
		prompts: { loading: false, open: false, loaded: false },
		notes: { loading: false, open: false, loaded: false },
		concepts: { loading: false, open: false, loaded: false },
	});

	// Función para cargar datos cuando se abre un submenú
	const handleOpenChange = (
		entity: keyof typeof loadingStates,
		isOpen: boolean
	) => {
		setLoadingStates((prev) => ({
			...prev,
			[entity]: { ...prev[entity], open: isOpen },
		}));

		if (isOpen && !loadingStates[entity].loaded) {
			loadEntityData(entity);
		}
	};

	// Función para cargar datos de una entidad específica
	const loadEntityData = async (entity: keyof typeof loadingStates) => {
		if (loadingStates[entity].loading || loadingStates[entity].loaded) {
			return;
		}

		setLoadingStates((prev) => ({
			...prev,
			[entity]: { ...prev[entity], loading: true },
		}));

		try {
			contextMenuLogger.info(`🔄 Cargando ${entity}...`);

			switch (entity) {
				case "collections":
					await loadCollections();
					break;
				case "tags":
					await loadTags();
					break;
				case "albums":
					await loadAlbums();
					break;
				case "characters":
					await loadCharacters();
					break;
				case "places":
					await loadPlaces();
					break;
				case "objects":
					await loadObjects();
					break;
				case "prompts":
					await loadPrompts();
					break;
				case "notes":
					await loadNotes();
					break;
				case "concepts":
					await loadConcepts();
					break;
				default:
					contextMenuLogger.warn(`⚠️ Tipo de entidad desconocido: ${entity}`);
					break;
			}

			setLoadingStates((prev) => ({
				...prev,
				[entity]: { loading: false, open: prev[entity].open, loaded: true },
			}));

			contextMenuLogger.info(`✅ ${entity} cargados`);
		} catch (error) {
			contextMenuLogger.error(`❌ Error al cargar ${entity}:`, error);

			setLoadingStates((prev) => ({
				...prev,
				[entity]: { loading: false, open: prev[entity].open, loaded: false },
			}));
		}
	};

	const handleToggleFavorite = useCallback(async () => {
		try {
			await toggleFavorite(file.id);
			contextMenuLogger.info("✅ Estado de favorito cambiado");
			if (isFavorited(file.id)) {
				toastService.favorite.removed();
			} else {
				toastService.favorite.added();
			}
		} catch (error) {
			contextMenuLogger.error("❌ Error al cambiar estado de favorito:", error);
			toastService.system.error("Error al cambiar estado de favorito");
		}
	}, [file.id, toggleFavorite, isFavorited]);

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

	const _handleDoubleClick = useCallback(
		(_event: MouseEvent) => {
			onAction("preview", file);
		},
		[file, onAction]
	);

	// Manejadores para crear nuevas entidades
	const handleCreateCollection = useCallback(() => {
		onAction("collection-create", file);
	}, [file, onAction]);

	const handleCreateTag = useCallback(() => {
		onAction("tag-create", file);
	}, [file, onAction]);

	const handleCreateAlbum = useCallback(() => {
		onAction("album-create", file);
	}, [file, onAction]);

	const handleCreateCharacter = useCallback(() => {
		onAction("character-create", file);
	}, [file, onAction]);

	const handleCreatePlace = useCallback(() => {
		onAction("place-create", file);
	}, [file, onAction]);

	const handleCreateObject = useCallback(() => {
		onAction("object-create", file);
	}, [file, onAction]);

	const handleCreatePrompt = useCallback(() => {
		onAction("prompt-create", file);
	}, [file, onAction]);

	const handleCreateNote = useCallback(() => {
		onAction("note-create", file);
	}, [file, onAction]);

	const handleCreateConcept = useCallback(() => {
		onAction("concept-create", file);
	}, [file, onAction]);

	// Función para manejar acciones con notificaciones
	const handleActionWithToast = useCallback(
		(action: ContextMenuAction, data?: Record<string, unknown>) => {
			// Primero ejecutamos la acción
			onAction(action, file, data);

			// Luego, dependiendo de la acción, mostramos una notificación
			switch (action) {
				case "mark-toggle":
					toastService.system.info("Estado de selección cambiado");
					break;
				case "preview":
					// No necesita toast (es una acción visual)
					break;
				case "open":
					// No necesita toast (abre el archivo)
					break;
				case "download":
					toastService.system.success("Descarga iniciada");
					break;
				case "copy":
					toastService.system.success("Imagen copiada al portapapeles");
					break;
				case "copy-path":
					toastService.system.success("Ruta copiada al portapapeles");
					break;
				case "delete":
					toastService.system.info("Archivo enviado a la papelera");
					break;
				default:
					// Para acciones relacionadas con entidades, las notificaciones
					// se manejan en sus respectivas funciones handler
					break;
			}
		},
		[file, onAction]
	);

	return (
		<ContextMenu onOpenChange={setIsMenuOpen}>
			<ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
			{isMenuOpen && (
				<ContextMenuContent className="w-64">
					{isImage && (
						<>
							<ContextMenuItem
								onClick={() => handleActionWithToast("mark-toggle")}
							>
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

							<ContextMenuSub
								onOpenChange={(open) => handleOpenChange("collections", open)}
							>
								<ContextMenuSubTrigger>
									<BookmarkPlus className="mr-2 h-4 w-4" />
									Agregar a colección
								</ContextMenuSubTrigger>
								<ContextMenuSubContent className="w-56">
									{loadingStates.collections.loading ? (
										<div className="flex justify-center items-center py-2">
											<LoadingSpinner size={16} />
											<span className="ml-2 text-sm">
												Cargando colecciones...
											</span>
										</div>
									) : (
										<>
											<ContextMenuItem
												onClick={handleCreateCollection}
												className="text-primary"
											>
												<Plus className="mr-2 h-4 w-4" />
												<span>Nueva colección</span>
											</ContextMenuItem>

											<ContextMenuSeparator />

											{collections && collections.length > 0 ? (
												<ScrollArea
													className={collections.length > 10 ? "h-[300px]" : ""}
												>
													{collections.map((collection: Collection) => (
														<ContextMenuItem
															key={collection.id}
															onClick={() =>
																onAction("collection-add", file, {
																	id: collection.id,
																})
															}
														>
															<div className="flex items-center w-full">
																{collection.emoji && (
																	<span className="mr-2">
																		{collection.emoji}
																	</span>
																)}
																<span className="flex-1 truncate">
																	{collection.name}
																</span>
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
													))}
												</ScrollArea>
											) : (
												<ContextMenuItem disabled>
													<span className="text-muted-foreground">
														No hay colecciones
													</span>
												</ContextMenuItem>
											)}
										</>
									)}
								</ContextMenuSubContent>
							</ContextMenuSub>

							<ContextMenuSub
								onOpenChange={(open) => handleOpenChange("tags", open)}
							>
								<ContextMenuSubTrigger>
									<TagIcon className="mr-2 h-4 w-4" />
									Etiquetas
								</ContextMenuSubTrigger>
								<ContextMenuSubContent className="w-56">
									{loadingStates.tags.loading ? (
										<div className="flex justify-center items-center py-2">
											<LoadingSpinner size={16} />
											<span className="ml-2 text-sm">
												Cargando etiquetas...
											</span>
										</div>
									) : (
										<>
											<ContextMenuItem
												onClick={handleCreateTag}
												className="text-primary"
											>
												<Plus className="mr-2 h-4 w-4" />
												<span>Nueva etiqueta</span>
											</ContextMenuItem>

											<ContextMenuSeparator />

											{tags && tags.length > 0 ? (
												<ScrollArea
													className={tags.length > 10 ? "h-[300px]" : ""}
												>
													{tags.map((tag: Tag) => (
														<ContextMenuItem
															key={tag.id}
															onClick={() =>
																onAction("tag-add", file, { id: tag.id })
															}
														>
															<div className="flex items-center gap-2 w-full">
																<div
																	className="w-3 h-3 rounded"
																	style={{ backgroundColor: tag.color }}
																/>
																<span className="flex-1">{tag.name}</span>
																{tag.shortcut && (
																	<Badge
																		variant="outline"
																		className="text-[10px] h-4 px-1"
																	>
																		{tag.shortcut}
																	</Badge>
																)}
															</div>
														</ContextMenuItem>
													))}
												</ScrollArea>
											) : (
												<ContextMenuItem disabled>
													No hay etiquetas disponibles
												</ContextMenuItem>
											)}
										</>
									)}
								</ContextMenuSubContent>
							</ContextMenuSub>

							<ContextMenuSub
								onOpenChange={(open) => handleOpenChange("albums", open)}
							>
								<ContextMenuSubTrigger>
									<ImageIcon className="mr-2 h-4 w-4" />
									Álbumes
								</ContextMenuSubTrigger>
								<ContextMenuSubContent className="w-56">
									{loadingStates.albums.loading ? (
										<div className="flex justify-center items-center py-2">
											<LoadingSpinner size={16} />
											<span className="ml-2 text-sm">Cargando álbumes...</span>
										</div>
									) : (
										<>
											<ContextMenuItem
												onClick={handleCreateAlbum}
												className="text-primary"
											>
												<Plus className="mr-2 h-4 w-4" />
												<span>Nuevo álbum</span>
											</ContextMenuItem>

											<ContextMenuSeparator />

											{albums.length > 0 ? (
												<ScrollArea
													className={albums.length > 10 ? "h-[300px]" : ""}
												>
													{albums.map((album: Album) => (
														<ContextMenuItem
															key={album.id}
															onClick={() =>
																onAction("album-add", file, { id: album.id })
															}
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
													))}
												</ScrollArea>
											) : (
												<ContextMenuItem disabled>
													No hay álbumes disponibles
												</ContextMenuItem>
											)}
										</>
									)}
								</ContextMenuSubContent>
							</ContextMenuSub>

							<ContextMenuSub
								onOpenChange={(open) => handleOpenChange("characters", open)}
							>
								<ContextMenuSubTrigger>
									<User className="mr-2 h-4 w-4" />
									Personajes
								</ContextMenuSubTrigger>
								<ContextMenuSubContent className="w-56">
									{loadingStates.characters.loading ? (
										<div className="flex justify-center items-center py-2">
											<LoadingSpinner size={16} />
											<span className="ml-2 text-sm">
												Cargando personajes...
											</span>
										</div>
									) : (
										<>
											<ContextMenuItem
												onClick={handleCreateCharacter}
												className="text-primary"
											>
												<Plus className="mr-2 h-4 w-4" />
												<span>Nuevo personaje</span>
											</ContextMenuItem>

											<ContextMenuSeparator />

											{characters.length > 0 ? (
												<ScrollArea
													className={characters.length > 10 ? "h-[300px]" : ""}
												>
													{characters.map((character: Character) => (
														<ContextMenuItem
															key={character.id}
															onClick={() =>
																onAction("character-add", file, {
																	id: character.id,
																})
															}
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
													))}
												</ScrollArea>
											) : (
												<ContextMenuItem disabled>
													No hay personajes disponibles
												</ContextMenuItem>
											)}
										</>
									)}
								</ContextMenuSubContent>
							</ContextMenuSub>

							<ContextMenuSub
								onOpenChange={(open) => handleOpenChange("places", open)}
							>
								<ContextMenuSubTrigger>
									<MapPin className="mr-2 h-4 w-4" />
									Lugares
								</ContextMenuSubTrigger>
								<ContextMenuSubContent className="w-56">
									{loadingStates.places.loading ? (
										<div className="flex justify-center items-center py-2">
											<LoadingSpinner size={16} />
											<span className="ml-2 text-sm">Cargando lugares...</span>
										</div>
									) : (
										<>
											<ContextMenuItem
												onClick={handleCreatePlace}
												className="text-primary"
											>
												<Plus className="mr-2 h-4 w-4" />
												<span>Nuevo lugar</span>
											</ContextMenuItem>

											<ContextMenuSeparator />

											{places.length > 0 ? (
												<ScrollArea
													className={places.length > 10 ? "h-[300px]" : ""}
												>
													{places.map((place: Place) => (
														<ContextMenuItem
															key={place.id}
															onClick={() =>
																onAction("place-add", file, { id: place.id })
															}
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
													))}
												</ScrollArea>
											) : (
												<ContextMenuItem disabled>
													No hay lugares disponibles
												</ContextMenuItem>
											)}
										</>
									)}
								</ContextMenuSubContent>
							</ContextMenuSub>

							<ContextMenuSub
								onOpenChange={(open) => handleOpenChange("objects", open)}
							>
								<ContextMenuSubTrigger>
									<Box className="mr-2 h-4 w-4" />
									Objetos
								</ContextMenuSubTrigger>
								<ContextMenuSubContent className="w-56">
									{loadingStates.objects.loading ? (
										<div className="flex justify-center items-center py-2">
											<LoadingSpinner size={16} />
											<span className="ml-2 text-sm">Cargando objetos...</span>
										</div>
									) : (
										<>
											<ContextMenuItem
												onClick={handleCreateObject}
												className="text-primary"
											>
												<Plus className="mr-2 h-4 w-4" />
												<span>Nuevo objeto</span>
											</ContextMenuItem>

											<ContextMenuSeparator />

											{objects.length > 0 ? (
												<ScrollArea
													className={objects.length > 10 ? "h-[300px]" : ""}
												>
													{objects.map((object: ObjectEntity) => (
														<ContextMenuItem
															key={object.id}
															onClick={() =>
																onAction("object-add", file, { id: object.id })
															}
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
													))}
												</ScrollArea>
											) : (
												<ContextMenuItem disabled>
													No hay objetos disponibles
												</ContextMenuItem>
											)}
										</>
									)}
								</ContextMenuSubContent>
							</ContextMenuSub>

							<ContextMenuSub
								onOpenChange={(open) => handleOpenChange("prompts", open)}
							>
								<ContextMenuSubTrigger>
									<MessageSquare className="mr-2 h-4 w-4" />
									Prompts
								</ContextMenuSubTrigger>
								<ContextMenuSubContent className="w-56">
									{loadingStates.prompts.loading ? (
										<div className="flex justify-center items-center py-2">
											<LoadingSpinner size={16} />
											<span className="ml-2 text-sm">Cargando prompts...</span>
										</div>
									) : (
										<>
											<ContextMenuItem
												onClick={handleCreatePrompt}
												className="text-primary"
											>
												<Plus className="mr-2 h-4 w-4" />
												<span>Nuevo prompt</span>
											</ContextMenuItem>

											<ContextMenuSeparator />

											{prompts.length > 0 ? (
												<ScrollArea
													className={prompts.length > 10 ? "h-[300px]" : ""}
												>
													{prompts.map((prompt) => (
														<ContextMenuItem
															key={prompt.id}
															onClick={() =>
																onAction("prompt-add", file, { id: prompt.id })
															}
														>
															<div className="flex items-center gap-2 w-full">
																<span className="flex-1">{prompt.name}</span>
															</div>
														</ContextMenuItem>
													))}
												</ScrollArea>
											) : (
												<ContextMenuItem disabled>
													No hay prompts disponibles
												</ContextMenuItem>
											)}
										</>
									)}
								</ContextMenuSubContent>
							</ContextMenuSub>

							<ContextMenuSub
								onOpenChange={(open) => handleOpenChange("notes", open)}
							>
								<ContextMenuSubTrigger>
									<FileText className="mr-2 h-4 w-4" />
									Notas
								</ContextMenuSubTrigger>
								<ContextMenuSubContent className="w-56">
									{loadingStates.notes.loading ? (
										<div className="flex justify-center items-center py-2">
											<LoadingSpinner size={16} />
											<span className="ml-2 text-sm">Cargando notas...</span>
										</div>
									) : (
										<>
											<ContextMenuItem
												onClick={handleCreateNote}
												className="text-primary"
											>
												<Plus className="mr-2 h-4 w-4" />
												<span>Nueva nota</span>
											</ContextMenuItem>

											<ContextMenuSeparator />

											{notes.length > 0 ? (
												<ScrollArea
													className={notes.length > 10 ? "h-[300px]" : ""}
												>
													{notes.map((note) => (
														<ContextMenuItem
															key={note.id}
															onClick={() =>
																onAction("note-add", file, { id: note.id })
															}
														>
															<div className="flex items-center gap-2 w-full">
																<span className="flex-1">{note.name}</span>
															</div>
														</ContextMenuItem>
													))}
												</ScrollArea>
											) : (
												<ContextMenuItem disabled>
													No hay notas disponibles
												</ContextMenuItem>
											)}
										</>
									)}
								</ContextMenuSubContent>
							</ContextMenuSub>

							<ContextMenuSub
								onOpenChange={(open) => handleOpenChange("concepts", open)}
							>
								<ContextMenuSubTrigger>
									<Lightbulb className="mr-2 h-4 w-4" />
									Conceptos
								</ContextMenuSubTrigger>
								<ContextMenuSubContent className="w-56">
									{loadingStates.concepts.loading ? (
										<div className="flex justify-center items-center py-2">
											<LoadingSpinner size={16} />
											<span className="ml-2 text-sm">
												Cargando conceptos...
											</span>
										</div>
									) : (
										<>
											<ContextMenuItem
												onClick={handleCreateConcept}
												className="text-primary"
											>
												<Plus className="mr-2 h-4 w-4" />
												<span>Nuevo concepto</span>
											</ContextMenuItem>

											<ContextMenuSeparator />

											{concepts.length > 0 ? (
												<ScrollArea
													className={concepts.length > 10 ? "h-[300px]" : ""}
												>
													{concepts.map((concept) => (
														<ContextMenuItem
															key={concept.id}
															onClick={() =>
																onAction("concept-add", file, {
																	id: concept.id,
																})
															}
														>
															<div className="flex items-center gap-2 w-full">
																<span className="flex-1">{concept.name}</span>
															</div>
														</ContextMenuItem>
													))}
												</ScrollArea>
											) : (
												<ContextMenuItem disabled>
													No hay conceptos disponibles
												</ContextMenuItem>
											)}
										</>
									)}
								</ContextMenuSubContent>
							</ContextMenuSub>

							<ContextMenuSeparator />

							<ContextMenuItem onClick={() => handleActionWithToast("preview")}>
								<ImageIcon className="mr-2 h-4 w-4" />
								Ver imagen
								<ContextMenuShortcut>⏎</ContextMenuShortcut>
							</ContextMenuItem>

							<ContextMenuItem onClick={() => handleActionWithToast("open")}>
								<FolderOpen className="mr-2 h-4 w-4" />
								Abrir ubicación
								<ContextMenuShortcut>⌘O</ContextMenuShortcut>
							</ContextMenuItem>

							<ContextMenuSeparator />

							<ContextMenuItem
								onClick={() => handleActionWithToast("download")}
							>
								<Download className="mr-2 h-4 w-4" />
								Descargar
								<ContextMenuShortcut>⌘D</ContextMenuShortcut>
							</ContextMenuItem>

							<ContextMenuItem onClick={() => handleActionWithToast("copy")}>
								<Copy className="mr-2 h-4 w-4" />
								Copiar
								<ContextMenuShortcut>⌘C</ContextMenuShortcut>
							</ContextMenuItem>

							<ContextMenuItem
								onClick={() => handleActionWithToast("copy-path")}
							>
								<Pencil className="mr-2 h-4 w-4" />
								Copiar ruta
								<ContextMenuShortcut>⌘⇧C</ContextMenuShortcut>
							</ContextMenuItem>

							<ContextMenuItem onClick={() => handleActionWithToast("delete")}>
								<Trash2 className="mr-2 h-4 w-4" />
								Eliminar
								<ContextMenuShortcut>⌘⌫</ContextMenuShortcut>
							</ContextMenuItem>
						</>
					)}
				</ContextMenuContent>
			)}
		</ContextMenu>
	);
}
