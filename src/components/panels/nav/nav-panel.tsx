"use client";

import type { NavigationData } from "@/app/actions/navigation/nav.actions";
import type { WorldItemWithStats } from "@/app/actions/world-items/world-item.actions";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProfileContext } from "@/lib/contexts";
import { cn } from "@/lib/utils/utils";
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
import type React from "react";
import { useCallback, useMemo, useState } from "react";
import {
	type CategoryChild,
	NavCategoryChildren,
} from "./nav-category-children";
import { NavCategoryItem } from "./nav-category-item";
import { NavMainNavigation } from "./nav-main-navigation";
import { NavPanelHeader } from "./nav-panel-header";

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
		id: "world-items" as ViewType,
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
	// Eliminada la variable settings no utilizada

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
		worldItems = [],
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
		setCurrentWorldItem,
		currentCollectionId,
		currentFolderId,
		currentTagId,
		currentAlbumId,
		currentCharacterId,
		currentPlaceId,
		currentWorldItemId,
		currentConceptId,
		currentPromptId,
		currentNoteId,
	} = useFileManager();

	const { toggleSettings } = useUIStore();

	// Función para verificar si una categoría está colapsada
	const isCategoryCollapsed = useCallback(
		(categoryId: ViewType) => !!collapsedCategories[categoryId],
		[collapsedCategories]
	);

	// Determinar si un hijo de una categoría está seleccionado
	const _hasCategoryChildSelected = useCallback(
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
				case "world-items":
					return currentView === "world-item-content";
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
				case "world-items":
					return currentWorldItemId;
				case "concepts":
					return currentConceptId;
				case "prompts":
					return currentPromptId;
				case "notes":
					return currentNoteId;
				default:
					return null;
			}
		},
		[
			currentAlbumId,
			currentCharacterId,
			currentCollectionId,
			currentFolderId,
			currentPlaceId,
			currentTagId,
			currentWorldItemId,
			currentConceptId,
			currentPromptId,
			currentNoteId,
		]
	);

	// Función para manejar el clic en una categoría - actualizada para mejorar la integración con breadcrumbs
	const handleCategoryClick = useCallback(
		(id: ViewType) => {
			// Limpiar selecciones anteriores para evitar estados huérfanos
			if (id !== "collection-content") {
				setCurrentCollection("");
			}
			if (id !== "folder-content") {
				setCurrentFolder("");
			}
			if (id !== "tag-content") {
				setCurrentTag("");
			}
			if (id !== "album-content") {
				setCurrentAlbum("");
			}
			if (id !== "character-content") {
				setCurrentCharacter("");
			}
			if (id !== "place-content") {
				setCurrentPlace("");
			}
			if (id !== "world-item-content") {
				setCurrentWorldItem("");
			}

			// Actualizar la vista actual
			setCurrentView(id);
		},
		[
			setCurrentView,
			setCurrentCollection,
			setCurrentFolder,
			setCurrentTag,
			setCurrentAlbum,
			setCurrentCharacter,
			setCurrentPlace,
			setCurrentWorldItem,
		]
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

	const handleOpenSettings = useCallback(() => {
		setCurrentView("settings");
		toggleSettings();
	}, [toggleSettings, setCurrentView]);

	const handleOpenDevelopment = useCallback(() => {
		setCurrentView("development");
	}, [setCurrentView]);

	const handleMainNavigate = useCallback(
		(id: ViewType) => {
			setCurrentView(id);
		},
		[setCurrentView]
	);

	// Función para manejar el clic en una colección
	const handleCollectionClick = useCallback(
		(collectionId: string) => {
			// Limpiar otras selecciones
			setCurrentFolder("");
			setCurrentTag("");
			setCurrentAlbum("");
			setCurrentCharacter("");
			setCurrentPlace("");
			setCurrentWorldItem("");

			// Establecer vista y colección actual
			setCurrentView("collection-content");
			setCurrentCollection(collectionId);
		},
		[
			setCurrentView,
			setCurrentCollection,
			setCurrentFolder,
			setCurrentTag,
			setCurrentAlbum,
			setCurrentCharacter,
			setCurrentPlace,
			setCurrentWorldItem,
		]
	);

	// Función para manejar el clic en una carpeta
	const handleFolderClick = useCallback(
		(folderId: string) => {
			// Limpiar otras selecciones
			setCurrentCollection("");
			setCurrentTag("");
			setCurrentAlbum("");
			setCurrentCharacter("");
			setCurrentPlace("");
			setCurrentWorldItem("");

			// Establecer vista y carpeta actual
			setCurrentView("folder-content");
			setCurrentFolder(folderId);
		},
		[
			setCurrentView,
			setCurrentCollection,
			setCurrentFolder,
			setCurrentTag,
			setCurrentAlbum,
			setCurrentCharacter,
			setCurrentPlace,
			setCurrentWorldItem,
		]
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

	const handleWorldItemClick = useCallback(
		(worldItemId: string) => {
			setCurrentView("world-item-content");
			setCurrentWorldItem(worldItemId);
		},
		[setCurrentView, setCurrentWorldItem]
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
				case "world-items":
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
	const getImagesForCategory = useCallback(
		(categoryId: ViewType): number => {
			switch (categoryId) {
				case "collections":
					return collections.reduce(
						(sum: number, collection: { _count?: { images: number } }) =>
							sum + (collection._count?.images || 0),
						0
					);
				case "folders":
					return folders.reduce(
						(sum: number, folder: { _count?: { images: number } }) =>
							sum + (folder._count?.images || 0),
						0
					);
				case "tags":
					return tags.reduce(
						(sum: number, tag: { _count?: { images: number } }) =>
							sum + (tag._count?.images || 0),
						0
					);
				case "albums":
					return albums.reduce(
						(sum: number, album: { _count?: { images: number } }) =>
							sum + (album._count?.images || 0),
						0
					);
				case "characters":
					return characters.reduce(
						(sum: number, character: { _count?: { images: number } }) =>
							sum + (character._count?.images || 0),
						0
					);
				case "places":
					return places.reduce(
						(sum: number, place: { _count?: { images: number } }) =>
							sum + (place._count?.images || 0),
						0
					);
				case "world-items":
					return worldItems.reduce(
						(sum: number, worldItem) => sum + (worldItem._count?.images || 0),
						0
					);
				default:
					return 0;
			}
		},
		[albums, characters, collections, folders, places, tags, worldItems]
	);

	// Función para obtener el manejador de clic adecuado para cada tipo de categoría
	const getItemClickHandler = useCallback(
		(categoryId: ViewType) => {
			switch (categoryId) {
				case "collections":
					return handleCollectionClick;
				case "folders":
					return handleFolderClick;
				case "tags":
					return handleTagClick;
				case "albums":
					return handleAlbumClick;
				case "characters":
					return handleCharacterClick;
				case "places":
					return handlePlaceClick;
				case "world-items":
					return handleWorldItemClick;
				default:
					return () => {};
			}
		},
		[
			handleAlbumClick,
			handleCharacterClick,
			handleCollectionClick,
			handleFolderClick,
			handlePlaceClick,
			handleTagClick,
			handleWorldItemClick,
		]
	);

	// Función para obtener los elementos hijos de cada categoría con corrección de tipos
	const getCategoryItems = useCallback(
		(categoryId: ViewType) => {
			switch (categoryId) {
				case "collections":
					return collections as unknown as CategoryChild[];
				case "folders":
					return folders as unknown as CategoryChild[];
				case "tags":
					return tags as unknown as CategoryChild[];
				case "albums":
					return albums as unknown as CategoryChild[];
				case "characters":
					return characters as unknown as CategoryChild[];
				case "places":
					return places as unknown as CategoryChild[];
				case "world-items":
					return worldItems as unknown as CategoryChild[];
				case "concepts":
					return concepts as unknown as CategoryChild[];
				case "prompts":
					return prompts as unknown as CategoryChild[];
				case "notes":
					return notes as unknown as CategoryChild[];
				default:
					return [] as CategoryChild[];
			}
		},
		[
			albums,
			characters,
			collections,
			concepts,
			folders,
			notes,
			places,
			prompts,
			tags,
			worldItems,
		]
	);

	return (
		<div className="flex flex-col h-full bg-background">
			<NavPanelHeader
				totalImages={stats.totalImages}
				onOpenSettings={handleOpenSettings}
				onOpenDevelopment={handleOpenDevelopment}
			/>

			<ScrollArea className="flex-1">
				<div className="p-1 space-y-0">
					{/* Navegación Principal */}
					<NavMainNavigation
						currentView={currentView}
						onNavigate={handleMainNavigate}
					/>

					{/* Categorías con Listas */}
					<div className="mt-0 space-y-0.5">
						{categories.map(({ id, icon, label, color }) => (
							<div key={id}>
								<NavCategoryItem
									id={id}
									label={label}
									color={color}
									icon={icon}
									isCollapsed={isCategoryCollapsed(id)}
									isCurrent={currentView === id}
									itemCount={getCategoryItemCount(id)}
									imageCount={getImagesForCategory(id)}
									onClick={() => handleCategoryClick(id)}
									onToggleCollapse={(e) => handleCollapseToggle(id, e)}
								/>

								<NavCategoryChildren
									categoryId={id}
									isCollapsed={isCategoryCollapsed(id)}
									selectedChildId={getSelectedChildId(id)}
									currentView={currentView}
									items={getCategoryItems(id)}
									onItemClick={getItemClickHandler(id)}
								/>
							</div>
						))}
					</div>
				</div>
			</ScrollArea>
		</div>
	);
}
