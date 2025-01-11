"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
	Trash2,
	Album,
	PencilIcon,
	CheckIcon,
	XIcon,
	Loader2,
} from "lucide-react";
import { useAlbumsStore } from "@/store/albums";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { cn } from "@/lib/utils";
import { CompactPicker } from "react-color";
import { motion } from "motion/react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { logger } from "@/lib/logger";
import type { AlbumCreate, AlbumUpdate } from "@/services/album.service";

const albumsLogger = logger.withContext("AlbumsSection");

export function AlbumsSection() {
	const {
		albums,
		isLoading,
		createAlbum,
		updateAlbum,
		deleteAlbum,
		loadAlbums,
	} = useAlbumsStore();
	const [editingId, setEditingId] = React.useState<string | null>(null);
	const [editForm, setEditForm] = React.useState<AlbumUpdate | null>(null);
	const [newAlbum, setNewAlbum] = React.useState<AlbumCreate>({
		name: "",
		emoji: "📸",
		description: "",
		color: "#3b82f6",
	});
	const { toast } = useToast();

	// Cargar álbumes al montar el componente
	React.useEffect(() => {
		loadAlbums();
	}, [loadAlbums]);

	const handleStartEdit = (album: (typeof albums)[0]) => {
		setEditingId(album.id);
		setEditForm({
			id: album.id,
			name: album.name,
			emoji: album.emoji,
			description: album.description || "",
			color: album.color,
		});
	};

	const handleCancelEdit = () => {
		setEditingId(null);
		setEditForm(null);
	};

	const handleSaveEdit = async (id: string) => {
		if (!editForm) return;
		try {
			albumsLogger.info("💾 Guardando cambios en álbum:", {
				id,
				data: editForm,
			});
			await updateAlbum(id, editForm);
			handleCancelEdit();
			toast({
				title: "Éxito",
				description: "Álbum actualizado correctamente",
			});
		} catch (error) {
			albumsLogger.error("❌ Error al actualizar álbum:", error);
			toast({
				title: "Error",
				description: "No se pudo actualizar el álbum",
				variant: "destructive",
			});
		}
	};

	const handleEmojiSelect = (emoji: string) => {
		setNewAlbum({ ...newAlbum, emoji });
	};

	const handleColorChange = (color: { hex: string }) => {
		setNewAlbum({ ...newAlbum, color: color.hex });
	};

	const handleAddAlbum = async () => {
		if (!newAlbum.name) return;

		try {
			albumsLogger.info("➕ Creando nuevo álbum:", newAlbum);
			const newAlbumData = {
				...newAlbum,
				sortBy: "name" as const,
				filters: [],
			};

			await createAlbum(newAlbumData);
			setNewAlbum({
				name: "",
				emoji: "📸",
				description: "",
				color: "#3b82f6",
			});
			toast({
				title: "Éxito",
				description: "Álbum creado correctamente",
			});
		} catch (error) {
			albumsLogger.error("❌ Error al crear álbum:", error);
			toast({
				title: "Error",
				description: "No se pudo crear el álbum",
				variant: "destructive",
			});
		}
	};

	const handleDeleteAlbum = async (id: string) => {
		try {
			albumsLogger.info("🗑️ Eliminando álbum:", id);
			await deleteAlbum(id);
			toast({
				title: "Éxito",
				description: "Álbum eliminado correctamente",
			});
		} catch (error) {
			albumsLogger.error("❌ Error al eliminar álbum:", error);
			toast({
				title: "Error",
				description: "No se pudo eliminar el álbum",
				variant: "destructive",
			});
		}
	};

	return (
		<Card className="flex flex-col gap-2 bg-muted/30 rounded-sm">
			<CardHeader className="p-2 pb-0 bg-transparent">
				<CardTitle className="text-base text-muted-foreground font-semibold flex items-center justify-between pl-1">
					<span className="flex items-center gap-2 h-7">
						<Album className="h-5 w-5" /> Álbumes
					</span>
					{albums.length > 0 && (
						<span className="text-xs text-muted-foreground/75">
							{albums.length} {albums.length === 1 ? "álbum" : "álbumes"}
						</span>
					)}
				</CardTitle>
			</CardHeader>
			<Separator className="my-0" />
			<CardContent className="p-2">
				<div className="space-y-3">
					<div className="flex items-center gap-2">
						<div
							className="h-8 w-8 rounded-full flex items-center justify-center shadow-sm"
							style={{ backgroundColor: newAlbum.color }}
						>
							<Popover>
								<PopoverTrigger asChild>
									<Button variant="ghost" size="icon" className="h-8 w-8 p-0">
										<span className="text-lg">{newAlbum.emoji}</span>
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-[320px] p-0" align="start">
									<EmojiPicker onEmojiSelect={handleEmojiSelect} />
								</PopoverContent>
							</Popover>
						</div>
						<div className="flex-1 min-w-0 space-y-1">
							<Input
								value={newAlbum.name}
								onChange={(e) =>
									setNewAlbum({ ...newAlbum, name: e.target.value })
								}
								className="h-8 text-base border-none p-3"
								placeholder="Nombre del álbum"
							/>
							<div className="flex gap-2">
								<Input
									value={newAlbum.description || ""}
									onChange={(e) =>
										setNewAlbum({
											...newAlbum,
											description: e.target.value,
										})
									}
									className="h-6 text-xs border-none p-2"
									placeholder="Descripción (opcional)"
								/>
								<Input
									value={newAlbum.shortcut || ""}
									onChange={(e) =>
										setNewAlbum({
											...newAlbum,
											shortcut: e.target.value,
										})
									}
									className="h-6 text-xs border-none p-2 w-24"
									placeholder="Atajo"
								/>
							</div>
						</div>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8 rounded-full"
								>
									<div
										className="h-4 w-4 rounded-full"
										style={{ backgroundColor: newAlbum.color }}
									/>
								</Button>
							</PopoverTrigger>
							<PopoverContent
								className="w-auto p-0 bg-transparent border-none"
								align="end"
							>
								<CompactPicker
									color={newAlbum.color}
									className="bg-black/90 text-white overflow-hidden"
									onChange={(color) => handleColorChange(color)}
								/>
							</PopoverContent>
						</Popover>
						<Button
							size="sm"
							className="h-8 text-xs px-3"
							onClick={handleAddAlbum}
							disabled={!newAlbum.name.trim()}
						>
							Crear
						</Button>
					</div>

					<Separator className="my-0" />

					<div className="grid grid-cols-2 gap-2">
						{isLoading ? (
							<div className="col-span-2 py-8 text-center">
								<Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground/50" />
								<p className="text-xs text-muted-foreground">
									Cargando álbumes...
								</p>
							</div>
						) : albums && albums.length > 0 ? (
							albums.map((album, index) => (
								<motion.div
									key={album.id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.1 }}
									className={cn(
										"bg-muted/30 group rounded-sm relative",
										editingId === album.id && "ring-1 ring-primary"
									)}
								>
									<CardContent className="p-2">
										{editingId === album.id ? (
											<div className="space-y-2">
												<div className="flex items-center gap-2">
													<div
														className="h-8 w-8 rounded-full flex items-center justify-center shadow-sm"
														style={{ backgroundColor: editForm?.color }}
													>
														<Popover>
															<PopoverTrigger asChild>
																<Button
																	variant="ghost"
																	size="icon"
																	className="h-8 w-8 p-0"
																>
																	<span className="text-lg">
																		{editForm?.emoji}
																	</span>
																</Button>
															</PopoverTrigger>
															<PopoverContent
																className="w-[320px] p-0"
																align="start"
															>
																<EmojiPicker
																	onEmojiSelect={(emoji) =>
																		setEditForm((prev) =>
																			prev ? { ...prev, emoji } : null
																		)
																	}
																/>
															</PopoverContent>
														</Popover>
													</div>
													<div className="flex-1 min-w-0 space-y-1">
														<Input
															value={editForm?.name}
															onChange={(e) =>
																setEditForm((prev) =>
																	prev
																		? { ...prev, name: e.target.value }
																		: null
																)
															}
															className="h-8 text-base border-none p-3"
															placeholder="Nombre del álbum"
														/>
														<div className="flex gap-2">
															<Input
																value={editForm?.description || ""}
																onChange={(e) =>
																	setEditForm((prev) =>
																		prev
																			? { ...prev, description: e.target.value }
																			: null
																	)
																}
																className="h-6 text-xs border-none p-2"
																placeholder="Descripción (opcional)"
															/>
															<Input
																value={editForm?.shortcut || ""}
																onChange={(e) =>
																	setEditForm((prev) =>
																		prev
																			? { ...prev, shortcut: e.target.value }
																			: null
																	)
																}
																className="h-6 text-xs border-none p-2 w-24"
																placeholder="Atajo"
															/>
														</div>
													</div>
													<Popover>
														<PopoverTrigger asChild>
															<Button
																variant="ghost"
																size="icon"
																className="h-8 w-8 rounded-full"
															>
																<div
																	className="h-4 w-4 rounded-full"
																	style={{ backgroundColor: editForm?.color }}
																/>
															</Button>
														</PopoverTrigger>
														<PopoverContent
															className="w-auto p-0 bg-transparent border-none"
															align="end"
														>
															<CompactPicker
																color={editForm?.color}
																className="bg-black/90 text-white overflow-hidden"
																onChange={(color) =>
																	setEditForm((prev) =>
																		prev ? { ...prev, color: color.hex } : null
																	)
																}
															/>
														</PopoverContent>
													</Popover>
												</div>
												<div className="flex justify-end gap-1">
													<Button
														variant="ghost"
														size="sm"
														onClick={handleCancelEdit}
														className="h-7 text-xs text-destructive hover:text-destructive/90"
													>
														<XIcon className="h-3.5 w-3.5 mr-1" />
														Cancelar
													</Button>
													<Button
														variant="ghost"
														size="sm"
														onClick={() => handleSaveEdit(album.id)}
														className="h-7 text-xs text-green-500 hover:text-green-600"
													>
														<CheckIcon className="h-3.5 w-3.5 mr-1" />
														Guardar
													</Button>
												</div>
											</div>
										) : (
											<div className="flex items-center gap-2 relative">
												<div className="flex items-center gap-2 min-w-0">
													<div
														className="h-8 w-8 rounded-full flex items-center justify-center shadow-sm"
														style={{ backgroundColor: album.color }}
													>
														<span className="text-lg">{album.emoji}</span>
													</div>
													<div className="flex-1 min-w-0">
														<span className="text-xs font-semibold truncate pl-1">
															{album.name}
														</span>
														{album.description && (
															<p className="text-[10px] text-muted-foreground truncate pl-1">
																{album.description}
															</p>
														)}
														{album.count > 0 && (
															<p className="text-[10px] text-muted-foreground/75 truncate pl-1">
																{album.count}{" "}
																{album.count === 1 ? "imagen" : "imágenes"} •{" "}
																{album.size}
															</p>
														)}
													</div>
												</div>
												<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-0 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm shadow-lg rounded-l-sm px-1">
													<Button
														variant="ghost"
														size="icon"
														onClick={() => handleStartEdit(album)}
														className="h-6 w-6"
													>
														<PencilIcon className="h-3 w-3" />
													</Button>
													<Button
														variant="ghost"
														size="icon"
														onClick={() => handleDeleteAlbum(album.id)}
														className="h-6 w-6 text-red-500 hover:text-red-500/90"
													>
														<Trash2 className="h-3 w-3" />
													</Button>
												</div>
											</div>
										)}
									</CardContent>
								</motion.div>
							))
						) : (
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								className="py-4 text-center col-span-2"
							>
								<Album className="h-6 w-6 mx-auto mb-2 text-muted-foreground/50" />
								<p className="text-xs text-muted-foreground">
									No hay álbumes creados
								</p>
								<p className="text-[10px] mt-1 text-muted-foreground/75">
									Crea un álbum para organizar tus imágenes
								</p>
							</motion.div>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
