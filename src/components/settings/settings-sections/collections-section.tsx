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
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { cn, formatBytes } from "@/lib/utils";
import { CompactPicker } from "react-color";
import { motion } from "motion/react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { logger } from "@/lib/logger";
import {
	getCollections,
	createCollection,
	updateCollection,
	deleteCollection,
} from "@/app/actions/collection.actions";
import type {
	CollectionCreate,
	CollectionUpdate,
	CollectionWithStats,
} from "@/app/actions/collection.actions";

const collectionLogger = logger.withContext("CollectionsSection");

interface EditForm extends Omit<CollectionUpdate, "description" | "filters"> {
	description: string;
	filters: string;
}

export function CollectionsSection() {
	const [collections, setCollections] = React.useState<CollectionWithStats[]>(
		[]
	);
	const [isLoading, setIsLoading] = React.useState(false);
	const [error, setError] = React.useState<Error | null>(null);
	const [editingId, setEditingId] = React.useState<string | null>(null);
	const [editForm, setEditForm] = React.useState<EditForm | null>(null);
	const [newCollection, setNewCollection] = React.useState<CollectionCreate>({
		name: "",
		emoji: "🌟",
		description: "",
		color: "#3b82f6",
		filters: "[]",
		sortBy: "name",
	});
	const { toast } = useToast();

	const loadCollections = React.useCallback(async () => {
		setIsLoading(true);
		try {
			collectionLogger.info("📚 Obteniendo lista de colecciones");
			const data = await getCollections();
			setCollections(data);
			setError(null);
		} catch (error) {
			setError(error as Error);
			toast({
				title: "Error al cargar colecciones",
				description: "No se pudieron cargar las colecciones.",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	}, [toast]);

	React.useEffect(() => {
		loadCollections();
	}, [loadCollections]);

	const handleStartEdit = (collection: CollectionWithStats) => {
		setEditingId(collection.id);
		setEditForm({
			id: collection.id,
			name: collection.name,
			emoji: collection.emoji,
			description: collection.description || "",
			color: collection.color,
			filters: collection.filters || "[]",
			sortBy: collection.sortBy,
		});
	};

	const handleCancelEdit = () => {
		setEditingId(null);
		setEditForm(null);
	};

	const handleSubmitEdit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!editForm) return;

		setIsLoading(true);
		try {
			collectionLogger.info("💾 Guardando cambios en colección:", {
				id: editForm.id,
				data: editForm,
			});
			await updateCollection(editForm.id, {
				...editForm,
				description: editForm.description || undefined,
			});
			await loadCollections();
			handleCancelEdit();
			toast({
				title: "✅ Colección actualizada",
				description: "La colección se ha actualizado correctamente.",
			});
		} catch (error) {
			collectionLogger.error("❌ Error al actualizar colección:", error);
			toast({
				title: "Error al actualizar colección",
				description: "No se pudo actualizar la colección.",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleSubmitCreate = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newCollection.name) return;

		setIsLoading(true);
		try {
			collectionLogger.info("📝 Creando nueva colección:", newCollection);
			await createCollection(newCollection);
			await loadCollections();
			setNewCollection({
				name: "",
				emoji: "🌟",
				description: "",
				color: "#3b82f6",
				filters: "[]",
				sortBy: "name",
			});
			toast({
				title: "✅ Colección creada",
				description: "La colección se ha creado correctamente.",
			});
		} catch (error) {
			collectionLogger.error("❌ Error al crear colección:", error);
			toast({
				title: "Error al crear colección",
				description: "No se pudo crear la colección.",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleDeleteCollection = async (id: string) => {
		setIsLoading(true);
		try {
			collectionLogger.info("🗑️ Eliminando colección...", id);
			await deleteCollection(id);
			await loadCollections();
			toast({
				title: "✅ Colección eliminada",
				description: "La colección se ha eliminado correctamente.",
			});
		} catch (error) {
			collectionLogger.error("❌ Error al eliminar colección:", error);
			toast({
				title: "Error al eliminar colección",
				description: "No se pudo eliminar la colección.",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleColorChange = (color: { hex: string }) => {
		setNewCollection((prev) => ({ ...prev, color: color.hex }));
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="text-lg font-semibold">Colecciones</h2>
				<Button
					variant="outline"
					size="sm"
					onClick={() => loadCollections()}
					disabled={isLoading}
				>
					{isLoading ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<span>Recargar</span>
					)}
				</Button>
			</div>

			<Card>
				<CardContent className="p-4">
					<form onSubmit={handleSubmitCreate} className="space-y-4">
						<div className="grid gap-2">
							<div className="flex items-center gap-2">
								<Popover>
									<PopoverTrigger asChild>
										<Button
											variant="outline"
											size="icon"
											className="h-8 w-8"
											style={{
												backgroundColor: newCollection.color,
											}}
										>
											<span className="text-lg">{newCollection.emoji}</span>
										</Button>
									</PopoverTrigger>
									<PopoverContent
										className="w-full p-0"
										side="right"
										align="start"
									>
										<EmojiPicker
											onEmojiSelect={(emoji: string) =>
												setNewCollection((prev) => ({
													...prev,
													emoji,
												}))
											}
										/>
										<Separator className="my-2" />
										<div className="p-2">
											<CompactPicker
												color={newCollection.color}
												onChange={handleColorChange}
											/>
										</div>
									</PopoverContent>
								</Popover>
								<Input
									placeholder="Nombre de la colección"
									value={newCollection.name}
									onChange={(e) =>
										setNewCollection((prev) => ({
											...prev,
											name: e.target.value,
										}))
									}
									className="h-8"
								/>
							</div>
							<Input
								placeholder="Descripción"
								value={newCollection.description || ""}
								onChange={(e) =>
									setNewCollection((prev) => ({
										...prev,
										description: e.target.value,
									}))
								}
								className="h-8"
							/>
						</div>
						<div className="flex items-center justify-end">
							<Button
								type="submit"
								size="sm"
								disabled={isLoading || !newCollection.name.trim()}
							>
								{isLoading ? (
									<Loader2 className="h-4 w-4 animate-spin mr-2" />
								) : null}
								Crear colección
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			<div className="grid gap-4">
				{error && (
					<div className="text-sm text-red-500 p-2 bg-red-50 rounded-md">
						{error.message}
					</div>
				)}
				{collections.length === 0 && !isLoading ? (
					<div className="text-sm text-muted-foreground text-center py-4">
						No hay colecciones creadas
					</div>
				) : (
					collections.map((collection) => (
						<motion.div
							key={collection.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3 }}
						>
							<Card className="group relative overflow-hidden">
								<CardContent className="p-4">
									{editingId === collection.id ? (
										<form onSubmit={handleSubmitEdit} className="space-y-4">
											<div className="grid gap-2">
												<div className="flex items-center gap-2">
													<Popover>
														<PopoverTrigger asChild>
															<Button
																variant="outline"
																size="icon"
																className="h-8 w-8"
																style={{
																	backgroundColor: editForm?.color,
																}}
															>
																<span className="text-lg">
																	{editForm?.emoji}
																</span>
															</Button>
														</PopoverTrigger>
														<PopoverContent
															className="w-full p-0"
															side="right"
															align="start"
														>
															<EmojiPicker
																onEmojiSelect={(emoji: string) =>
																	setEditForm((prev) => ({
																		...prev!,
																		emoji,
																	}))
																}
															/>
															<Separator className="my-2" />
															<div className="p-2">
																<CompactPicker
																	color={editForm?.color}
																	onChange={(color) =>
																		setEditForm((prev) => ({
																			...prev!,
																			color: color.hex,
																		}))
																	}
																/>
															</div>
														</PopoverContent>
													</Popover>
													<Input
														placeholder="Nombre de la colección"
														value={editForm?.name}
														onChange={(e) =>
															setEditForm((prev) => ({
																...prev!,
																name: e.target.value,
															}))
														}
														className="h-8"
													/>
												</div>
												<Input
													placeholder="Descripción"
													value={editForm?.description}
													onChange={(e) =>
														setEditForm((prev) => ({
															...prev!,
															description: e.target.value,
														}))
													}
													className="h-8"
												/>
											</div>
											<div className="flex items-center justify-end gap-2">
												<Button
													type="button"
													variant="ghost"
													size="sm"
													onClick={handleCancelEdit}
													className="h-7 text-xs text-destructive hover:text-destructive/90"
												>
													<XIcon className="h-3.5 w-3.5 mr-1" />
													Cancelar
												</Button>
												<Button
													type="submit"
													variant="ghost"
													size="sm"
													disabled={isLoading}
													className="h-7 text-xs text-green-500 hover:text-green-600"
												>
													{isLoading ? (
														<Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
													) : (
														<CheckIcon className="h-3.5 w-3.5 mr-1" />
													)}
													Guardar
												</Button>
											</div>
										</form>
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
													{collection._count?.images > 0 && (
														<p className="text-[10px] text-muted-foreground/75 truncate pl-1">
															{collection._count.images}{" "}
															{collection._count.images === 1
																? "imagen"
																: "imágenes"}{" "}
															• {formatBytes(collection.totalSize)}
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
													onClick={() => handleDeleteCollection(collection.id)}
													className="h-6 w-6 text-red-500 hover:text-red-500/90"
												>
													<Trash2 className="h-3 w-3" />
												</Button>
											</div>
										</div>
									)}
								</CardContent>
							</Card>
						</motion.div>
					))
				)}
			</div>
		</div>
	);
}
