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

interface FileContextMenuProps {
	file: FileItem;
	children: React.ReactNode;
	onAction: (action: string, file: FileItem) => void;
}

export function FileContextMenu({
	file,
	children,
	onAction,
}: FileContextMenuProps) {
	const isImage = file.type === "image" || file.mimeType?.startsWith("image/");

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
			<ContextMenuContent className="w-64">
				<ContextMenuItem onClick={() => onAction("favorite-toggle", file)}>
					{file.isFavorite ? (
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
						<ContextMenuItem onClick={() => onAction("collection-new", file)}>
							<BookmarkPlus className="mr-2 h-4 w-4" />
							Nueva colección...
						</ContextMenuItem>
						<ContextMenuSeparator />
						{/* Aquí irían las colecciones existentes */}
					</ContextMenuSubContent>
				</ContextMenuSub>

				<ContextMenuSub>
					<ContextMenuSubTrigger>
						<TagIcon className="mr-2 h-4 w-4" />
						Etiquetas
					</ContextMenuSubTrigger>
					<ContextMenuSubContent className="w-48">
						<ContextMenuItem onClick={() => onAction("tag-new", file)}>
							<TagIcon className="mr-2 h-4 w-4" />
							Nueva etiqueta...
						</ContextMenuItem>
						<ContextMenuSeparator />
						{/* Aquí irían las etiquetas existentes */}
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
