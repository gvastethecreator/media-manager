"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
	Trash2,
	Palette,
	PencilIcon,
	CheckIcon,
	XIcon,
	Loader2,
} from "lucide-react";
import { useTagsStore } from "@/store/tags.store";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CompactPicker } from "react-color";
import { motion } from "motion/react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { logger } from "@/lib/logger";
import type { TagCreate, TagUpdate } from "@/app/actions/tag.actions";

const tagsLogger = logger.withContext("TagsSection");

export function TagsSection() {
	const { tags, createTag, updateTag, deleteTag, loadTags } =
		useTagsStore();
	const [editingId, setEditingId] = React.useState<string | null>(null);
	const [editForm, setEditForm] = React.useState<TagUpdate | null>(null);
	const [newTag, setNewTag] = React.useState<TagCreate>({
		name: "",
		color: "#3b82f6",
		description: "",
		shortcut: "",
	});
	const { toast } = useToast();

	// Cargar tags al montar el componente
	React.useEffect(() => {
		loadTags();
	}, [loadTags]);

	const handleStartEdit = (tag: (typeof tags)[0]) => {
		setEditingId(tag.id);
		setEditForm({
			id: tag.id,
			name: tag.name,
			color: tag.color,
			description: tag.description || "",
			shortcut: tag.shortcut || "",
		});
	};

	const handleCancelEdit = () => {
		setEditingId(null);
		setEditForm(null);
	};

	const handleSaveEdit = async (id: string) => {
		if (!editForm) return;
		try {
			tagsLogger.info("💾 Guardando cambios en etiqueta:", {
				id,
				data: editForm,
			});
			await updateTag(id, editForm);
			handleCancelEdit();
			toast({
				title: "Éxito",
				description: "Etiqueta actualizada correctamente",
			});
		} catch (error) {
			tagsLogger.error("❌ Error al actualizar etiqueta:", error);
			toast({
				title: "Error",
				description: "No se pudo actualizar la etiqueta",
				variant: "destructive",
			});
		}
	};

	const handleColorChange = (color: { hex: string }) => {
		setNewTag({ ...newTag, color: color.hex });
	};

	const handleAddTag = async () => {
		if (!newTag.name) return;
		try {
			tagsLogger.info("➕ Creando nueva etiqueta:", newTag);
			await createTag(newTag);
			setNewTag({
				name: "",
				color: "#3b82f6",
				description: "",
				shortcut: "",
			});
			toast({
				title: "Éxito",
				description: "Etiqueta creada correctamente",
			});
		} catch (error) {
			tagsLogger.error("❌ Error al crear etiqueta:", error);
			toast({
				title: "Error",
				description: "No se pudo crear la etiqueta",
				variant: "destructive",
			});
		}
	};

	const handleDeleteTag = async (id: string) => {
		try {
			tagsLogger.info("🗑️ Eliminando etiqueta:", id);
			await deleteTag(id);
			toast({
				title: "Éxito",
				description: "Etiqueta eliminada correctamente",
			});
		} catch (error) {
			tagsLogger.error("❌ Error al eliminar etiqueta:", error);
			toast({
				title: "Error",
				description: "No se pudo eliminar la etiqueta",
				variant: "destructive",
			});
		}
	};

	return (
		<Card className="flex flex-col gap-2 bg-muted/30 rounded-sm">
			<CardHeader className="p-2 pb-0 bg-transparent">
				<CardTitle className="text-base text-muted-foreground font-semibold flex items-center justify-between pl-1">
					<span className="flex items-center gap-2 h-7">
						<Palette className="h-5 w-5" /> Etiquetas
					</span>
					{tags.length > 0 && (
						<span className="text-xs text-muted-foreground/75">
							{tags.length} {tags.length === 1 ? "etiqueta" : "etiquetas"}
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
							style={{ backgroundColor: newTag.color }}
						>
							<Palette className="h-4 w-4 text-white/90" />
						</div>
						<div className="flex-1 min-w-0 space-y-1">
							<Input
								value={newTag.name}
								onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
								className="h-8 text-base border-none p-3"
								placeholder="Nombre de la etiqueta"
							/>
							<div className="flex gap-2">
								<Input
									value={newTag.description || ""}
									onChange={(e) =>
										setNewTag({ ...newTag, description: e.target.value })
									}
									className="h-6 text-xs border-none p-2"
									placeholder="Descripción (opcional)"
								/>
								<Input
									value={newTag.shortcut || ""}
									onChange={(e) =>
										setNewTag({ ...newTag, shortcut: e.target.value })
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
										style={{ backgroundColor: newTag.color }}
									/>
								</Button>
							</PopoverTrigger>
							<PopoverContent
								className="w-auto p-0 bg-transparent border-none"
								align="end"
							>
								<CompactPicker
									color={newTag.color}
									className="bg-black/90 text-white overflow-hidden"
									onChange={(color) => handleColorChange(color)}
								/>
							</PopoverContent>
						</Popover>
						<Button
							size="sm"
							className="h-8 text-xs px-3"
							onClick={handleAddTag}
							disabled={!newTag.name.trim()}
						>
							Crear
						</Button>
					</div>

					<Separator className="my-0" />

					<div className="grid grid-cols-2 gap-2">
						{tags && tags.length > 0 ? (
							tags.map((tag, index) => (
								<motion.div
									key={tag.id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.1 }}
									className={cn(
										"bg-muted/30 group rounded-sm relative",
										editingId === tag.id && "ring-1 ring-primary"
									)}
								>
									<CardContent className="p-2">
										{editingId === tag.id ? (
											<div className="space-y-2">
												<div className="flex items-center gap-2">
													<div
														className="h-8 w-8 rounded-full flex items-center justify-center shadow-sm"
														style={{ backgroundColor: editForm?.color }}
													>
														<Palette className="h-4 w-4 text-white/90" />
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
															placeholder="Nombre de la etiqueta"
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
														onClick={() => handleSaveEdit(tag.id)}
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
														style={{ backgroundColor: tag.color }}
													>
														<Palette className="h-4 w-4 text-white/90" />
													</div>
													<div className="flex-1 min-w-0">
														<span className="text-xs font-semibold truncate pl-1">
															{tag.name}
														</span>
														{tag.description && (
															<p className="text-[10px] text-muted-foreground truncate pl-1">
																{tag.description}
															</p>
														)}
													</div>
												</div>
												<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-0 top-8 shadow-lg">
													<Button
														variant="outline"
														onClick={() => handleStartEdit(tag)}
														className="h-4 text-xs gap-1 text-[9px] rounded-sm p-2"
													>
														<PencilIcon className="h-3 w-3" />
														Editar
													</Button>
													<Button
														variant="ghost"
														onClick={() => handleDeleteTag(tag.id)}
														className="h-4 text-red-500 hover:text-red-500/90 text-[9px] rounded-sm p-1 py-2"
													>
														<Trash2 className="h-2 w-2" />
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
								<Palette className="h-6 w-6 mx-auto mb-2 text-muted-foreground/50" />
								<p className="text-xs text-muted-foreground">
									No hay etiquetas creadas
								</p>
								<p className="text-[10px] mt-1 text-muted-foreground/75">
									Crea una etiqueta para clasificar tus imágenes
								</p>
							</motion.div>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
