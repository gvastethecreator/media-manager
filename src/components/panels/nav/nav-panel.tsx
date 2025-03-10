"use client";

import type { NavigationData } from "@/app/actions/nav.actions";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProfileContext } from "@/lib/contexts";
import { cn } from "@/lib/utils";
import { useFileManager } from "@/store/file-manager.store";
import { useNavigationStore } from "@/store/navigation.store";
import { useStatsBaseStore } from "@/store/stats.store";
import { useUIStore } from "@/store/ui.store";
import type { ViewType } from "@/types/file-item";
import {
	BookImage,
	Box,
	Bug,
	Camera,
	ChevronDown,
	ChevronRight,
	CornerDownRight,
	FolderIcon,
	Hash,
	Image as ImageIcon,
	Lightbulb,
	MapPin,
	Moon,
	RefreshCcw,
	Search,
	Settings2,
	Star,
	StickyNote,
	Sun,
	TagIcon,
	Terminal,
	UploadCloud,
	User2,
} from "lucide-react";
import { useTheme } from "next-themes";
import type React from "react";
import { useCallback, useMemo, useState } from "react";

const navigationItems = [
	{ id: "all-images" as ViewType, label: "Galería", icon: ImageIcon },
	{
		id: "uploaded-images" as ViewType,
		label: "Imágenes Subidas",
		icon: UploadCloud,
	},
	{ id: "favorites" as ViewType, label: "Favoritos", icon: Star },
	{ id: "search" as ViewType, label: "Buscar", icon: Search },
];

const categories = [
	{
		id: "folders" as ViewType,
		icon: FolderIcon,
		label: "Carpetas",
		color: "#22c55e",
	},
	{
		id: "collections" as ViewType,
		icon: BookImage,
		label: "Colecciones",
		color: "#ef4444",
	},
	{
		id: "albums" as ViewType,
		icon: Camera,
		label: "Álbumes",
		color: "#8b5cf6",
	},
	{
		id: "characters" as ViewType,
		icon: User2,
		label: "Personajes",
		color: "#ec4899",
	},
	{
		id: "places" as ViewType,
		icon: MapPin,
		label: "Lugares",
		color: "#14b8a6",
	},
	{
		id: "objects" as ViewType,
		icon: Box,
		label: "Objetos",
		color: "#f59e0b",
	},
	{
		id: "concepts" as ViewType,
		icon: Lightbulb,
		label: "Conceptos",
		color: "#3b82f6",
	},
	{
		id: "prompts" as ViewType,
		icon: Terminal,
		label: "Prompts",
		color: "#10b981",
	},
	{
		id: "notes" as ViewType,
		icon: StickyNote,
		label: "Notas",
		color: "#a855f7",
	},
	{
		id: "tags" as ViewType,
		icon: TagIcon,
		label: "Etiquetas",
		color: "#f59e0b",
	},
];

interface NavPanelProps {
	initialData: NavigationData;
}

export function NavPanel({ initialData }: NavPanelProps) {
	const { settings } = useProfileContext();
	const { profiles = [], activeProfile } = settings;
	const activeProfileData = profiles.find((p) => p.id === activeProfile) ||
		profiles[0] || {
			name: "Default",
			emoji: "👤",
			color: "#3b82f6",
		};

	// Desestructurar initialData con valores por defecto
	const {
		stats = {
			totalImages: 0,
			totalFolders: 0,
			totalCollections: 0,
			totalTags: 0,
			totalAlbums: 0,
			totalCharacters: 0,
			totalPlaces: 0,
			totalObjects: 0,
			totalViews: 0,
			totalDownloads: 0,
			totalFavorites: 0,
			totalActivities: 0,
			totalSize: 0,
			popularImages: [],
			topTags: [],
			recentActivity: [],
		},
		folders = [],
		collections = [],
		tags = [],
		albums = [],
		characters = [],
		places = [],
		objects = [],
	} = initialData || {};

	// Estado para controlar el colapso de categorías
	const [collapsedCategories, setCollapsedCategories] = useState<
		Record<string, boolean>
	>({});

	// Datos simulados para las nuevas entidades
	const concepts = useMemo(() => [], []);
	const prompts = useMemo(() => [], []);
	const notes = useMemo(() => [], []);

	const { currentView, setCurrentView } = useNavigationStore();
	const {
		setCurrentCollection,
		setCurrentFolder,
		setCurrentTag,
		setCurrentAlbum,
		setCurrentCharacter,
		setCurrentPlace,
		setCurrentObject,
		currentCollectionId,
		currentFolderId,
		currentTagId,
		currentAlbumId,
		currentCharacterId,
		currentPlaceId,
		currentObjectId,
	} = useFileManager();

	const { toggleSettings } = useUIStore();
	const { theme, setTheme } = useTheme();

	// Función para verificar si una categoría está colapsada
	const isCategoryCollapsed = useCallback(
		(categoryId: ViewType) => !!collapsedCategories[categoryId],
		[collapsedCategories]
	);

	// Determinar si un hijo de una categoría está seleccionado
	const hasCategoryChildSelected = useCallback(
		(categoryId: ViewType): boolean => {
			switch (categoryId) {
				case "collections":
					return currentView === "collection-content";
				case "folders":
					return currentView === "folder-content";
				case "tags":
					return currentView === "tag-content";
				case "albums":
					return currentView === "album-content";
				case "characters":
					return currentView === "character-content";
				case "places":
					return currentView === "place-content";
				case "objects":
					return currentView === "object-content";
				case "concepts":
					return currentView === "concept-content";
				case "prompts":
					return currentView === "prompt-content";
				case "notes":
					return currentView === "note-content";
				default:
					return false;
			}
		},
		[currentView]
	);

	// Función para verificar qué elemento hijo está seleccionado
	const getSelectedChildId = useCallback(
		(categoryId: ViewType): string | null => {
			switch (categoryId) {
				case "collections":
					return currentCollectionId;
				case "folders":
					return currentFolderId;
				case "tags":
					return currentTagId;
				case "albums":
					return currentAlbumId;
				case "characters":
					return currentCharacterId;
				case "places":
					return currentPlaceId;
				case "objects":
					return currentObjectId;
				// Las nuevas categorías no tienen IDs seleccionados aún
				default:
					return null;
			}
		},
		[
			currentAlbumId,
			currentCharacterId,
			currentCollectionId,
			currentFolderId,
			currentObjectId,
			currentPlaceId,
			currentTagId,
		]
	);

	// Función para manejar el clic en una categoría
	const handleCategoryClick = useCallback(
		(id: ViewType) => {
			setCurrentView(id);
		},
		[setCurrentView]
	);

	// Agregar una nueva función para manejar el colapso/expansión
	const handleCollapseToggle = useCallback(
		(id: ViewType, event: React.MouseEvent | React.KeyboardEvent) => {
			event.stopPropagation();
			setCollapsedCategories((prev) => ({
				...prev,
				[id]: !prev[id],
			}));
		},
		[]
	);

	const handleThemeToggle = useCallback(() => {
		setTheme(theme === "light" ? "dark" : "light");
	}, [theme, setTheme]);

	const handleOpenSettings = useCallback(() => {
		setCurrentView("settings");
		toggleSettings();
	}, [toggleSettings, setCurrentView]);

	const handleOpenDevelopment = useCallback(() => {
		setCurrentView("development");
	}, [setCurrentView]);

	const handleItemClick = useCallback(
		(id: ViewType) => {
			setCurrentView(id as ViewType);
		},
		[setCurrentView]
	);

	const handleCollectionClick = useCallback(
		(collectionId: string) => {
			setCurrentView("collection-content");
			setCurrentCollection(collectionId);
		},
		[setCurrentView, setCurrentCollection]
	);

	const handleFolderClick = useCallback(
		(folderId: string) => {
			setCurrentView("folder-content");
			setCurrentFolder(folderId);
		},
		[setCurrentView, setCurrentFolder]
	);

	const handleTagClick = useCallback(
		(tagName: string) => {
			setCurrentView("tag-content");
			setCurrentTag(tagName);
		},
		[setCurrentView, setCurrentTag]
	);

	const handleAlbumClick = useCallback(
		(albumId: string) => {
			setCurrentView("album-content");
			setCurrentAlbum(albumId);
		},
		[setCurrentView, setCurrentAlbum]
	);

	const handleCharacterClick = useCallback(
		(characterId: string) => {
			setCurrentView("character-content");
			setCurrentCharacter(characterId);
		},
		[setCurrentView, setCurrentCharacter]
	);

	const handlePlaceClick = useCallback(
		(placeId: string) => {
			setCurrentView("place-content");
			setCurrentPlace(placeId);
		},
		[setCurrentView, setCurrentPlace]
	);

	const handleObjectClick = useCallback(
		(objectId: string) => {
			setCurrentView("object-content");
			setCurrentObject(objectId);
		},
		[setCurrentView, setCurrentObject]
	);

	// Función auxiliar para obtener la cantidad de ítems para cada categoría
	const getCategoryItemCount = useCallback(
		(categoryId: ViewType): number => {
			switch (categoryId) {
				case "collections":
					return stats?.totalCollections || 0;
				case "folders":
					return stats?.totalFolders || 0;
				case "tags":
					return stats?.totalTags || 0;
				case "albums":
					return stats?.totalAlbums || 0;
				case "characters":
					return stats?.totalCharacters || 0;
				case "places":
					return stats?.totalPlaces || 0;
				case "objects":
					return stats?.totalObjects || 0;
				case "concepts":
					return concepts.length;
				case "prompts":
					return prompts.length;
				case "notes":
					return notes.length;
				default:
					return 0;
			}
		},
		[concepts, notes, prompts, stats]
	);

	// Calcula y devuelve el número de imágenes para una categoría
	const getImagesForCategory = (categoryId: ViewType): number => {
		switch (categoryId) {
			case "collections":
				return collections.reduce(
					(sum, collection) => sum + (collection._count?.images || 0),
					0
				);
			case "folders":
				return folders.reduce(
					(sum, folder) => sum + (folder._count?.images || 0),
					0
				);
			case "tags":
				return tags.reduce((sum, tag) => sum + (tag._count?.images || 0), 0);
			case "albums":
				return albums.reduce(
					(sum, album) => sum + (album._count?.images || 0),
					0
				);
			case "characters":
				return characters.reduce(
					(sum, character) => sum + (character._count?.images || 0),
					0
				);
			case "places":
				return places.reduce(
					(sum, place) => sum + (place._count?.images || 0),
					0
				);
			case "objects":
				return objects.reduce(
					(sum, object) => sum + (object._count?.images || 0),
					0
				);
			default:
				return 0;
		}
	};

	// Renderizar elementos hijos de una categoría
	const renderCategoryItems = useCallback(
		(categoryId: ViewType) => {
			// Si la categoría está colapsada y no tiene un hijo seleccionado, no mostrar nada
			const isCollapsed = isCategoryCollapsed(categoryId);
			const childSelected = hasCategoryChildSelected(categoryId);
			const selectedChildId = getSelectedChildId(categoryId);

			if (isCollapsed && !childSelected) {
				return null;
			}

			switch (categoryId) {
				case "collections":
					return collections?.map((collection) => {
						// Si la categoría está colapsada, solo mostrar el ítem seleccionado
						if (isCollapsed && collection.id !== selectedChildId) {
							return null;
						}
						return (
							<Button
								key={collection.id}
								variant="ghost"
								className={cn(
									"justify-start gap-2 h-6 px-2 text-sm transition-colors text-xs rounded-sm text-left",
									currentView === "collection-content" &&
										currentCollectionId === collection.id &&
										"bg-linear-to-r from-white/10 to-white/15",
									"cursor-pointer"
								)}
								onClick={() => handleCollectionClick(collection.id)}
							>
								<CornerDownRight className="h-2 w-2 text-white/20" />
								<span className="text-base">{collection.emoji}</span>
								<span className="flex-1 text-left truncate">
									{collection.name}
								</span>
								<div className="flex items-center space-x-1 text-white/50 text-[10px]">
									<BookImage className="h-3 w-3" />
									<span>{collection._count?.images || 0}</span>
								</div>
							</Button>
						);
					});
				case "folders":
					return folders?.map((folder) => {
						if (isCollapsed && folder.id !== selectedChildId) {
							return null;
						}
						return (
							<Button
								key={folder.id}
								variant="ghost"
								className={cn(
									"w-full justify-start gap-2 h-6 px-2 text-sm transition-colors text-xs",
									currentView === "folder-content" &&
										currentFolderId === folder.id &&
										"bg-linear-to-r from-white/10 to-white/15",
									"cursor-pointer"
								)}
								onClick={() => handleFolderClick(folder.id)}
							>
								<CornerDownRight className="h-2 w-2 text-white/20" />
								<FolderIcon className="h-4 w-4" />
								<span className="flex-1 text-left truncate">{folder.name}</span>
								<div className="flex items-center space-x-1 text-white/50 text-[10px]">
									<ImageIcon className="h-3 w-3" />
									<span>{folder._count?.images || 0}</span>
								</div>
							</Button>
						);
					});
				case "albums":
					return albums?.map((album) => {
						if (isCollapsed && album.id !== selectedChildId) {
							return null;
						}
						return (
							<Button
								key={album.id}
								variant="ghost"
								className={cn(
									"justify-start gap-2 h-6 px-2 text-sm transition-colors text-xs rounded-sm text-left",
									currentView === "album-content" &&
										currentAlbumId === album.id &&
										"bg-linear-to-r from-white/10 to-white/15",
									"cursor-pointer"
								)}
								onClick={() => handleAlbumClick(album.id)}
							>
								<CornerDownRight className="h-2 w-2 text-white/20" />
								<span className="text-base">{album.emoji}</span>
								<span className="flex-1 text-left truncate">{album.name}</span>
								<div className="flex items-center space-x-1 text-white/50 text-[10px]">
									<Camera className="h-3 w-3" />
									<span>{album._count?.images || 0}</span>
								</div>
							</Button>
						);
					});
				case "characters":
					return characters?.map((character) => {
						if (isCollapsed && character.id !== selectedChildId) {
							return null;
						}
						return (
							<Button
								key={character.id}
								variant="ghost"
								className={cn(
									"justify-start gap-2 h-6 px-2 text-sm transition-colors text-xs rounded-sm text-left",
									currentView === "character-content" &&
										currentCharacterId === character.id &&
										"bg-linear-to-r from-white/10 to-white/15",
									"cursor-pointer"
								)}
								onClick={() => handleCharacterClick(character.id)}
							>
								<CornerDownRight className="h-2 w-2 text-white/20" />
								<span className="text-base">{character.emoji}</span>
								<span className="flex-1 text-left truncate">
									{character.name}
								</span>
								<div className="flex items-center space-x-1 text-white/50 text-[10px]">
									<User2 className="h-3 w-3" />
									<span>{character._count?.images || 0}</span>
								</div>
							</Button>
						);
					});
				case "places":
					return places?.map((place) => {
						if (isCollapsed && place.id !== selectedChildId) {
							return null;
						}
						return (
							<Button
								key={place.id}
								variant="ghost"
								className={cn(
									"justify-start gap-2 h-6 px-2 text-sm transition-colors text-xs rounded-sm text-left",
									currentView === "place-content" &&
										currentPlaceId === place.id &&
										"bg-linear-to-r from-white/10 to-white/15",
									"cursor-pointer"
								)}
								onClick={() => handlePlaceClick(place.id)}
							>
								<CornerDownRight className="h-2 w-2 text-white/20" />
								<span className="text-base">{place.emoji}</span>
								<span className="flex-1 text-left truncate">{place.name}</span>
								<div className="flex items-center space-x-1 text-white/50 text-[10px]">
									<MapPin className="h-3 w-3" />
									<span>{place._count?.images || 0}</span>
								</div>
							</Button>
						);
					});
				case "objects":
					return objects?.map((object) => {
						if (isCollapsed && object.id !== selectedChildId) {
							return null;
						}
						return (
							<Button
								key={object.id}
								variant="ghost"
								className={cn(
									"justify-start gap-2 h-6 px-2 text-sm transition-colors text-xs rounded-sm text-left",
									currentView === "object-content" &&
										currentObjectId === object.id &&
										"bg-linear-to-r from-white/10 to-white/15",
									"cursor-pointer"
								)}
								onClick={() => handleObjectClick(object.id)}
							>
								<CornerDownRight className="h-2 w-2 text-white/20" />
								<span className="text-base">{object.emoji}</span>
								<span className="flex-1 text-left truncate">{object.name}</span>
								<div className="flex items-center space-x-1 text-white/50 text-[10px]">
									<Box className="h-3 w-3" />
									<span>{object._count?.images || 0}</span>
								</div>
							</Button>
						);
					});
				case "tags":
					if (isCollapsed) {
						return null; // Las etiquetas son especiales, no mostramos ninguna si está colapsado
					}
					return (
						<div className="flex w-full flex-wrap gap-2 mt-1">
							{tags?.map((tag) => (
								<Button
									variant="ghost"
									key={tag.id}
									style={{ backgroundColor: tag.color }}
									className={cn(
										"justify-start gap-2 h-5 px-3 text-[10px] transition-colors rounded-xl text-black/90 font-bold",
										currentView === "tag-content" &&
											currentTagId === tag.name &&
											"bg-linear-to-r from-black/30 to-black/35",
										"cursor-pointer"
									)}
									onClick={() => handleTagClick(tag.name)}
								>
									<span className="flex-1 text-left text-[10px] truncate shadow-xs">
										{tag.name}
									</span>
									<div className="flex items-center space-x-1 text-black/70 text-[10px]">
										<TagIcon className="h-3 w-3" />
										<span>{tag._count?.images || 0}</span>
									</div>
								</Button>
							))}
						</div>
					);
				// Para las nuevas categorías, de momento no mostramos nada
				default:
					return null;
			}
		},
		[
			albums,
			characters,
			collections,
			currentAlbumId,
			currentCharacterId,
			currentCollectionId,
			currentFolderId,
			currentObjectId,
			currentPlaceId,
			currentTagId,
			currentView,
			folders,
			getSelectedChildId,
			handleAlbumClick,
			handleCharacterClick,
			handleCollectionClick,
			handleFolderClick,
			handleObjectClick,
			handlePlaceClick,
			handleTagClick,
			hasCategoryChildSelected,
			isCategoryCollapsed,
			objects,
			places,
			tags,
		]
	);

	return (
		<div className="flex flex-col h-full">
			<div className="flex flex-col bg-primary/10 py-2">
				<div className="flex items-center justify-between gap-2">
					<div className="flex gap-2 items-center px-2">
						<div
							className="flex items-center justify-center h-8 w-8 rounded-sm"
							style={{ backgroundColor: activeProfileData?.color }}
						>
							<span className="text-xs font-medium">
								{activeProfileData?.emoji}
							</span>
						</div>
						<div className="flex flex-col">
							<span className="text-xs font-medium truncate">
								{activeProfileData?.name}
							</span>
							<span className="text-[9px] text-muted-foreground">
								{stats?.totalImages || 0} imágenes
							</span>
						</div>
					</div>
					<div className="gap-8 pr-2">
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8"
							onClick={handleOpenDevelopment}
						>
							<Bug className="h-4 w-4" />
						</Button>

						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8"
							onClick={handleThemeToggle}
						>
							{theme === "light" ? (
								<Moon className="h-4 w-4" />
							) : (
								<Sun className="h-4 w-4" />
							)}
						</Button>

						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8"
							onClick={handleOpenSettings}
						>
							<Settings2 className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</div>
			<ScrollArea className="flex-1">
				<div className="p-2">
					{/* Navegación Principal */}
					<div className="flex justify-between gap-1">
						{navigationItems.map(({ id, icon: Icon, label }) => (
							<Button
								key={id}
								variant="outline"
								className={cn(
									"gap-2 h-7 px-3 transition-colors rounded-sm flex-1 text-center",
									currentView === id &&
										"bg-linear-to-r from-white/10 to-white/15"
								)}
								onClick={() => handleItemClick(id)}
							>
								<span className="truncate flex items-center justify-center">
									<Icon className="h-4 w-4 mr-1 mb-0.5" /> {label}
								</span>
							</Button>
						))}
					</div>

					{/* Categorías con Listas */}
					<div className="mt-1">
						{categories.map(({ id, icon: Icon, label, color }) => (
							<div key={id} className="mt-1">
								<div className="flex items-center w-full h-8 bg-white/5 rounded-sm mt-2 group">
									{/* Botón específico para colapsar/expandir */}
									<button
										type="button"
										className="flex h-4 w-4 shrink-0 items-center justify-center rounded-sm hover:bg-gray-100/10 border-0 bg-transparent p-0"
										onClick={(e) => {
											e.stopPropagation();
											handleCollapseToggle(id, e);
										}}
										aria-label={
											isCategoryCollapsed(id)
												? "Expandir categoría"
												: "Colapsar categoría"
										}
									>
										{isCategoryCollapsed(id) ? (
											<ChevronRight className="h-3 w-3 text-white/60" />
										) : (
											<ChevronDown className="h-3 w-3 text-white/60" />
										)}
									</button>

									{/* Botón de categoría */}
									<Button
										variant="ghost"
										className={cn(
											"flex-1 justify-start gap-2 h-8 px-2 text-sm transition-colors text-xs rounded-sm cursor-pointer",
											currentView === id &&
												"bg-linear-to-r from-white/10 to-white/15"
										)}
										onClick={() => handleCategoryClick(id)}
									>
										<Icon className="h-4 w-4" style={{ color }} />
										<span className="flex-1 text-left truncate">{label}</span>
										<div className="flex items-center space-x-2">
											<div className="flex items-center space-x-1 text-white/70 text-[10px]">
												{id === "folders" ? (
													<FolderIcon className="h-3 w-3" />
												) : id === "collections" ? (
													<BookImage className="h-3 w-3" />
												) : id === "tags" ? (
													<TagIcon className="h-3 w-3" />
												) : id === "albums" ? (
													<Camera className="h-3 w-3" />
												) : id === "characters" ? (
													<User2 className="h-3 w-3" />
												) : id === "places" ? (
													<MapPin className="h-3 w-3" />
												) : id === "objects" ? (
													<Box className="h-3 w-3" />
												) : id === "concepts" ? (
													<Lightbulb className="h-3 w-3" />
												) : id === "prompts" ? (
													<Terminal className="h-3 w-3" />
												) : id === "notes" ? (
													<StickyNote className="h-3 w-3" />
												) : (
													<Hash className="h-3 w-3" />
												)}
												<span>{getCategoryItemCount(id)}</span>
											</div>
											<div className="flex items-center space-x-1 text-white/50 text-[10px]">
												<ImageIcon className="h-3 w-3" />
												<span>{getImagesForCategory(id)}</span>
											</div>
										</div>
									</Button>
								</div>

								<div className="mt-1 flex flex-col gap-1">
									{renderCategoryItems(id)}
								</div>
							</div>
						))}
					</div>
				</div>
			</ScrollArea>
		</div>
	);
}
