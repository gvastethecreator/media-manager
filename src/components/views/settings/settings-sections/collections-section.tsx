"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
	Trash2,
	Smile,
	PencilIcon,
	CheckIcon,
	XIcon,
	Loader2,
} from "lucide-react";
import { useCollectionsStore } from "@/store/collections";
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
import type {
	CollectionCreate,
	CollectionUpdate,
} from "@/services/collection.service";
import type { EmojiClickData } from "emoji-picker-react";

const collectionLogger = logger.withContext("CollectionsSection");

export function CollectionsSection() {
	const {
		collections,
		isLoading,
		createCollection,
		updateCollection,
		deleteCollection,
		loadCollections,
	} = useCollectionsStore();
	const [editingId, setEditingId] = React.useState<string | null>(null);
	const [editForm, setEditForm] = React.useState<CollectionUpdate | null>(null);
	const [newCollection, setNewCollection] = React.useState<CollectionCreate>({
		name: "",
		emoji: "🌟",
		description: "",
		color: "#3b82f6",
	});
	const { toast } = useToast();

	// Cargar colecciones al montar el componente
	React.useEffect(() => {
		loadCollections();
	}, [loadCollections]);

	const handleStartEdit = (collection: (typeof collections)[0]) => {
		setEditingId(collection.id);
		setEditForm({
			id: collection.id,
			name: collection.name,
			emoji: collection.emoji,
			description: collection.description || "",
			color: collection.color,
		});
	};

	const handleCancelEdit = () => {
		setEditingId(null);
		setEditForm(null);
	};

	const handleSaveEdit = async (id: string) => {
		if (!editForm) return;
		try {
			collectionLogger.info("💾 Guardando cambios en colección:", {
				id,
				data: editForm,
			});
			await updateCollection(id, editForm);
			handleCancelEdit();
			toast({
				title: "Éxito",
				description: "Colección actualizada correctamente",
			});
		} catch (error) {
			collectionLogger.error("❌ Error al actualizar colección:", error);
			toast({
				title: "Error",
				description: "No se pudo actualizar la colección",
				variant: "destructive",
			});
		}
	};

	const handleEmojiSelect = (emojiData: EmojiClickData) => {
		setNewCollection({ ...newCollection, emoji: emojiData.emoji });
	};

	const handleColorChange = (color: { hex: string }) => {
		setNewCollection({ ...newCollection, color: color.hex });
	};

	const handleAddCollection = async () => {
		if (!newCollection.name) return;

		try {
			collectionLogger.info("➕ Creando nueva colección:", newCollection);
			const newCollectionData = {
				...newCollection,
				sortBy: "name" as const,
				filters: [] as any[],
			};

			await createCollection(newCollectionData);
			setNewCollection({
				name: "",
				emoji: "🌟",
				description: "",
				color: "#3b82f6",
			});
			toast({
				title: "Éxito",
				description: "Colección creada correctamente",
			});
		} catch (error) {
			collectionLogger.error("❌ Error al crear colección:", error);
			toast({
				title: "Error",
				description: "No se pudo crear la colección",
				variant: "destructive",
			});
		}
	};

	const handleDeleteCollection = async (id: string) => {
		try {
			collectionLogger.info("🗑️ Eliminando colección:", id);
			await deleteCollection(id);
			toast({
				title: "Éxito",
				description: "Colección eliminada correctamente",
			});
		} catch (error) {
			collectionLogger.error("❌ Error al eliminar colección:", error);
			toast({
				title: "Error",
				description: "No se pudo eliminar la colección",
				variant: "destructive",
			});
		}
	};

	return (
		<Card className="flex flex-col gap-2 bg-muted/30 rounded-sm">
			<CardHeader className="p-2 pb-0 bg-transparent">
				<CardTitle className="text-base text-muted-foreground font-semibold flex items-center justify-between pl-1">
					<span className="flex items-center gap-2 h-7">
						<Smile className="h-5 w-5" /> Colecciones
					</span>
					{collections.length > 0 && (
						<span className="text-xs text-muted-foreground/75">
							{collections.length}{" "}
							{collections.length === 1 ? "colección" : "colecciones"}
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
							style={{ backgroundColor: newCollection.color }}
						>
							<Popover>
								<PopoverTrigger asChild>
									<Button variant="ghost" size="icon" className="h-8 w-8 p-0">
										<span className="text-lg">{newCollection.emoji}</span>
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-[320px] p-0" align="start">
									<EmojiPicker onEmojiSelect={(emoji: string) =>
										setNewCollection({ ...newCollection, emoji: emoji })
									} />
								</PopoverContent>
							</Popover>
						</div>
						<div className="flex-1 min-w-0 space-y-1">
							<Input
								value={newCollection.name}
								onChange={(e) =>
									setNewCollection({ ...newCollection, name: e.target.value })
								}
								className="h-8 text-base border-none p-3"
								placeholder="Nombre de la colección"
							/>
							<div className="flex gap-2">
								<Input
									value={newCollection.description || ""}
									onChange={(e) =>
										setNewCollection({
											...newCollection,
											description: e.target.value,
										})
									}
									className="h-6 text-xs border-none p-2"
									placeholder="Descripción (opcional)"
								/>
								<Input
									value={newCollection.shortcut || ""}
									onChange={(e) =>
										setNewCollection({
											...newCollection,
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
										style={{ backgroundColor: newCollection.color }}
									/>
								</Button>
							</PopoverTrigger>
							<PopoverContent
								className="w-auto p-0 bg-transparent border-none"
								align="end"
							>
								<CompactPicker
									color={newCollection.color}
									className="bg-black/90 text-white overflow-hidden"
									onChange={(color) => handleColorChange(color)}
								/>
							</PopoverContent>
						</Popover>
						<Button
							size="sm"
							className="h-8 text-xs px-3"
							onClick={handleAddCollection}
							disabled={!newCollection.name.trim()}
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
									Cargando colecciones...
								</p>
							</div>
						) : collections && collections.length > 0 ? (
							collections.map((collection, index) => (
								<motion.div
									key={collection.id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.1 }}
									className={cn(
										"bg-muted/30 group rounded-sm relative",
										editingId === collection.id && "ring-1 ring-primary"
									)}
								>
									<CardContent className="p-2">
										{editingId === collection.id ? (
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
																	onEmojiSelect={(emoji: string) =>
																		setEditForm((prev) =>
																			prev
																				? { ...prev, emoji: emoji }
																				: null
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
															placeholder="Nombre de la colección"
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
														onClick={() => handleSaveEdit(collection.id)}
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
														style={{ backgroundColor: collection.color }}
													>
														<span className="text-lg">{collection.emoji}</span>
													</div>
													<div className="flex-1 min-w-0">
														<span className="text-xs font-semibold truncate pl-1">
															{collection.name}
														</span>
														{collection.description && (
															<p className="text-[10px] text-muted-foreground truncate pl-1">
																{collection.description}
															</p>
														)}
														{collection.count > 0 && (
															<p className="text-[10px] text-muted-foreground/75 truncate pl-1">
																{collection.count}{" "}
																{collection.count === 1 ? "imagen" : "imágenes"}{" "}
																• {collection.size}
															</p>
														)}
													</div>
												</div>
												<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-0 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm shadow-lg rounded-l-sm px-1">
													<Button
														variant="ghost"
														size="icon"
														onClick={() => handleStartEdit(collection)}
														className="h-6 w-6"
													>
														<PencilIcon className="h-3 w-3" />
													</Button>
													<Button
														variant="ghost"
														size="icon"
														onClick={() =>
															handleDeleteCollection(collection.id)
														}
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
								<Smile className="h-6 w-6 mx-auto mb-2 text-muted-foreground/50" />
								<p className="text-xs text-muted-foreground">
									No hay colecciones creadas
								</p>
								<p className="text-[10px] mt-1 text-muted-foreground/75">
									Crea una colección para organizar tus imágenes
								</p>
							</motion.div>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
