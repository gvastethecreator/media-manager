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
import { useEffect, useState } from "react";
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
import { useFavoritesStore } from "@/store/favorites";
import { useCollectionsStore } from "@/store/collections";
import { useTagsStore } from "@/store/tags";
import { logger } from "@/lib/logger";

const contextMenuLogger = logger.withContext("ContextMenu");

interface FileContextMenuProps {
	file: FileItem;
	children: React.ReactNode;
	onAction: (action: string, file: FileItem, data?: any) => void;
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

	// Estados para nueva colección
	const [isCollectionDialogOpen, setIsCollectionDialogOpen] = useState(false);
	const [newCollection, setNewCollection] = useState({
		name: "",
		emoji: "📁",
		description: "",
		color: "#3b82f6",
	});

	// Estados para nueva etiqueta
	const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
	const [newTag, setNewTag] = useState({
		name: "",
		color: "#3b82f6",
		description: "",
	});

	const handleCreateCollection = async () => {
		try {
			await createCollection({
				name: newCollection.name,
				emoji: newCollection.emoji,
				description: newCollection.description,
				color: newCollection.color,
			});

			// Una vez creada la colección, agregamos el archivo
			const createdCollection = collections.find(
				(c) => c.name === newCollection.name
			);

			if (createdCollection) {
				await addImageToCollection(createdCollection.id, file.id);
				contextMenuLogger.info("✨ Colección creada y archivo agregado:", {
					collection: createdCollection.name,
					fileId: file.id,
				});
			}

			setNewCollection({
				name: "",
				emoji: "📁",
				description: "",
				color: "#3b82f6",
			});
			setIsCollectionDialogOpen(false);
		} catch (error) {
			contextMenuLogger.error("❌ Error al crear colección:", { error });
		}
	};

	const handleCreateTag = async () => {
		try {
			await createTag({
				name: newTag.name,
				color: newTag.color,
				description: newTag.description,
			});

			// Una vez creado el tag, agregamos el archivo
			const createdTag = tags.find((t) => t.name === newTag.name);

			if (createdTag) {
				await addImageToTag(createdTag.id, file.id);
				contextMenuLogger.info("✨ Tag creado y archivo agregado:", {
					tag: createdTag.name,
					fileId: file.id,
				});
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
		} catch (error) {
			contextMenuLogger.error("❌ Error al cambiar estado de favorito:", {
				error,
			});
		}
	};

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
												setNewCollection({ ...newCollection, emoji })
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
