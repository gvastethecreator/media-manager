"use client";

import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { logger } from "@/lib/logger/logger";
import { useFavoritesStore } from "@/store/entities/favorites.store";
import { useFileManager } from "@/store/file-manager.store";
import {
	Copy,
	Download,
	Flag,
	FolderOpen,
	Heart,
	HeartOff,
	ImageIcon,
	Info,
	Share2,
	Trash2,
} from "lucide-react";
import { useCallback, useState } from "react";

import {
	AlbumsSubmenu,
	CharactersSubmenu,
	CollectionsSubmenu,
	ConceptsSubmenu,
	NotesSubmenu,
	PlacesSubmenu,
	PromptsSubmenu,
	TagsSubmenu,
	WorldItemsSubmenu,
} from "./components/submenus";
import { useEntityLoader } from "./hooks/use-entity-loader";
import type { FileContextMenuProps } from "./types";

export function FileContextMenu({
	file,
	children,
	onAction,
}: FileContextMenuProps) {
	// Estado para controlar si el menú está abierto (necesario para ContextMenu)
	// eslint-disable-next-line no-unused-vars
	const [, setIsMenuOpen] = useState(false);
	const { toggleFavorite, isFavorited } = useFavoritesStore();
	const { loadingStates, handleOpenChange } = useEntityLoader();
	const { selectedItems } = useFileManager();

	const handleFavoriteToggle = useCallback(() => {
		toggleFavorite(file.id);
		onAction("favorite-toggle", file);
	}, [file, toggleFavorite, onAction]);

	// Determinar si el archivo está seleccionado
	const getMarkToggleText = useCallback(() => {
		const isSelected = selectedItems.some((item) => item.id === file.id);
		return isSelected ? "Desmarcar" : "Marcar";
	}, [selectedItems, file.id]);

	return (
		<ContextMenu onOpenChange={setIsMenuOpen}>
			<ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
			<ContextMenuContent className="w-64">
				{/* Acciones principales */}
				<ContextMenuItem onClick={() => onAction("preview", file)}>
					<ImageIcon className="mr-2 h-4 w-4" />
					Ver imagen
				</ContextMenuItem>

				<ContextMenuItem onClick={() => onAction("mark-toggle", file)}>
					<Flag className="mr-2 h-4 w-4" />
					{getMarkToggleText()}
				</ContextMenuItem>

				<ContextMenuItem onClick={handleFavoriteToggle}>
					{isFavorited(file.id) ? (
						<>
							<HeartOff className="mr-2 h-4 w-4" />
							Quitar de favoritos
						</>
					) : (
						<>
							<Heart className="mr-2 h-4 w-4" />
							Añadir a favoritos
						</>
					)}
				</ContextMenuItem>

				<ContextMenuSeparator />

				{/* Submenús para entidades */}
				<CollectionsSubmenu
					file={file}
					onAction={onAction}
					loadingStates={loadingStates}
					onOpenChange={handleOpenChange}
				/>

				<TagsSubmenu
					file={file}
					onAction={onAction}
					loadingStates={loadingStates}
					onOpenChange={handleOpenChange}
				/>

				<AlbumsSubmenu
					file={file}
					onAction={onAction}
					loadingStates={loadingStates}
					onOpenChange={handleOpenChange}
				/>

				<CharactersSubmenu
					file={file}
					onAction={onAction}
					loadingStates={loadingStates}
					onOpenChange={handleOpenChange}
				/>

				<PlacesSubmenu
					file={file}
					onAction={onAction}
					loadingStates={loadingStates}
					onOpenChange={handleOpenChange}
				/>

				<WorldItemsSubmenu
					file={file}
					onAction={onAction}
					loadingStates={loadingStates}
					onOpenChange={handleOpenChange}
				/>

				<PromptsSubmenu
					file={file}
					onAction={onAction}
					loadingStates={loadingStates}
					onOpenChange={handleOpenChange}
				/>

				<NotesSubmenu
					file={file}
					onAction={onAction}
					loadingStates={loadingStates}
					onOpenChange={handleOpenChange}
				/>

				<ConceptsSubmenu
					file={file}
					onAction={onAction}
					loadingStates={loadingStates}
					onOpenChange={handleOpenChange}
				/>

				<ContextMenuSeparator />

				{/* Acciones de archivo */}
				<ContextMenuItem onClick={() => onAction("open", file)}>
					<FolderOpen className="mr-2 h-4 w-4" />
					Abrir ubicación
				</ContextMenuItem>

				<ContextMenuItem onClick={() => onAction("download", file)}>
					<Download className="mr-2 h-4 w-4" />
					Descargar
				</ContextMenuItem>

				<ContextMenuItem onClick={() => onAction("copy", file)}>
					<Copy className="mr-2 h-4 w-4" />
					Copiar al portapapeles
				</ContextMenuItem>

				<ContextMenuItem onClick={() => onAction("copy-path", file)}>
					<Share2 className="mr-2 h-4 w-4" />
					Copiar ruta
				</ContextMenuItem>

				<ContextMenuSeparator />

				{/* Información y acciones de borrado */}
				<ContextMenuItem
					onClick={() =>
						window.dispatchEvent(
							new CustomEvent("show-file-details", {
								detail: { fileId: file.id },
							})
						)
					}
				>
					<Info className="mr-2 h-4 w-4" />
					Propiedades
				</ContextMenuItem>

				<ContextMenuItem
					className="text-red-500"
					onClick={() => onAction("delete", file)}
				>
					<Trash2 className="mr-2 h-4 w-4" />
					Eliminar
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
}

// Exportar también las acciones desde types.ts
export type { ContextMenuAction } from "./types";
