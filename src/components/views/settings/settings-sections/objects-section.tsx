"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
	Trash2,
	PencilIcon,
	CheckIcon,
	XIcon,
	Loader2,
	Target,
	Sparkles,
	Gem,
	ScrollText,
	Swords,
	Shield,
	Crown,
	Scroll,
} from "lucide-react";
import { CardContent } from "@/components/ui/card";
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
	getObjects,
	createObject,
	updateObject,
	deleteObject,
	type ObjectCreate,
	type ObjectUpdate,
	type ObjectWithStats,
} from "@/app/actions/object.actions";
import type { Object } from "@prisma/client";

const objectLogger = logger.withContext("ObjectsSection");

interface EditForm extends Omit<ObjectUpdate, "description"> {
	description: string;
}

export function ObjectsSection() {
	const [objects, setObjects] = React.useState<ObjectWithStats[]>([]);
	const [isLoading, setIsLoading] = React.useState(false);
	const [error, setError] = React.useState<Error | null>(null);
	const [editingId, setEditingId] = React.useState<string | null>(null);
	const [editForm, setEditForm] = React.useState<EditForm | null>(null);
	const [newObject, setNewObject] = React.useState<ObjectCreate>({
		name: "",
		emoji: "🎯",
		description: "",
		color: "#3b82f6",
		type: "",
		rarity: "",
		properties: "[]",
		requirements: "{}",
		origin: "",
		stats: "{}",
		filters: "[]",
		sortBy: "name",
	});
	const { toast } = useToast();

	const loadObjects = React.useCallback(async () => {
		setIsLoading(true);
		try {
			objectLogger.info("🎯 Obteniendo lista de objetos");
			const data = await getObjects();
			setObjects(data);
			setError(null);
		} catch (error) {
			setError(error as Error);
			toast({
				title: "Error al cargar objetos",
				description: "No se pudieron cargar los objetos.",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	}, [toast]);

	React.useEffect(() => {
		loadObjects();
	}, [loadObjects]);

	const handleStartEdit = (object: ObjectWithStats) => {
		setEditingId(object.id);
		setEditForm({
			id: object.id,
			name: object.name,
			emoji: object.emoji,
			description: object.description || "",
			color: object.color,
			type: object.type,
			rarity: object.rarity,
			properties: object.properties,
			requirements: object.requirements,
			origin: object.origin,
			stats: object.stats,
			filters: object.filters,
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
			objectLogger.info("💾 Guardando cambios en objeto:", {
				id: editForm.id,
				data: editForm,
			});
			await updateObject(editForm.id, {
				...editForm,
				description: editForm.description || undefined,
				sortBy: editForm.sortBy || "name",
			});
			await loadObjects();
			handleCancelEdit();
			toast({
				title: "✅ Objeto actualizado",
				description: "El objeto se ha actualizado correctamente.",
			});
		} catch (error) {
			objectLogger.error("❌ Error al actualizar objeto:", error);
			toast({
				title: "Error al actualizar objeto",
				description: "No se pudo actualizar el objeto.",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleSubmitCreate = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newObject.name) return;

		setIsLoading(true);
		try {
			objectLogger.info("📝 Creando nuevo objeto:", newObject);
			await createObject(newObject);
			await loadObjects();
			setNewObject({
				name: "",
				emoji: "🎯",
				description: "",
				color: "#3b82f6",
				type: "",
				rarity: "",
				properties: "[]",
				requirements: "{}",
				origin: "",
				stats: "{}",
				filters: "[]",
				sortBy: "name",
			});
			toast({
				title: "✅ Objeto creado",
				description: "El objeto se ha creado correctamente.",
			});
		} catch (error) {
			objectLogger.error("❌ Error al crear objeto:", error);
			toast({
				title: "Error al crear objeto",
				description: "No se pudo crear el objeto.",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleDeleteObject = async (id: string) => {
		setIsLoading(true);
		try {
			objectLogger.info("🗑️ Eliminando objeto...", id);
			await deleteObject(id);
			await loadObjects();
			toast({
				title: "✅ Objeto eliminado",
				description: "El objeto se ha eliminado correctamente.",
			});
		} catch (error) {
			objectLogger.error("❌ Error al eliminar objeto:", error);
			toast({
				title: "Error al eliminar objeto",
				description: "No se pudo eliminar el objeto.",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleColorChange = (color: { hex: string }) => {
		setNewObject((prev) => ({ ...prev, color: color.hex }));
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="text-lg font-semibold">Objetos</h2>
				<Button
					variant="outline"
					size="sm"
					onClick={() => loadObjects()}
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
												backgroundColor: newObject.color,
											}}
										>
											<span className="text-lg">{newObject.emoji}</span>
										</Button>
									</PopoverTrigger>
									<PopoverContent
										className="w-full p-0"
										side="right"
										align="start"
									>
										<EmojiPicker
											onEmojiSelect={(emoji: string) =>
												setNewObject((prev) => ({
													...prev,
													emoji,
												}))
											}
										/>
										<Separator className="my-2" />
										<div className="p-2">
											<CompactPicker
												color={newObject.color}
												onChange={handleColorChange}
											/>
										</div>
									</PopoverContent>
								</Popover>
								<Input
									placeholder="Nombre del objeto"
									value={newObject.name}
									onChange={(e) =>
										setNewObject((prev) => ({
											...prev,
											name: e.target.value,
										}))
									}
									className="h-8"
								/>
							</div>
							<Input
								placeholder="Descripción"
								value={newObject.description || ""}
								onChange={(e) =>
									setNewObject((prev) => ({
										...prev,
										description: e.target.value,
									}))
								}
								className="h-8"
							/>
							<div className="grid grid-cols-2 gap-2">
								<Input
									placeholder="Tipo"
									value={newObject.type}
									onChange={(e) =>
										setNewObject((prev) => ({
											...prev,
											type: e.target.value,
										}))
									}
									className="h-8"
								/>
								<Input
									placeholder="Rareza"
									value={newObject.rarity}
									onChange={(e) =>
										setNewObject((prev) => ({
											...prev,
											rarity: e.target.value,
										}))
									}
									className="h-8"
								/>
							</div>
							<div className="grid grid-cols-2 gap-2">
								<Input
									placeholder="Propiedades (JSON)"
									value={newObject.properties}
									onChange={(e) =>
										setNewObject((prev) => ({
											...prev,
											properties: e.target.value,
										}))
									}
									className="h-8"
								/>
								<Input
									placeholder="Requisitos (JSON)"
									value={newObject.requirements}
									onChange={(e) =>
										setNewObject((prev) => ({
											...prev,
											requirements: e.target.value,
										}))
									}
									className="h-8"
								/>
							</div>
							<Input
								placeholder="Origen"
								value={newObject.origin}
								onChange={(e) =>
									setNewObject((prev) => ({
										...prev,
										origin: e.target.value,
									}))
								}
								className="h-8"
							/>
						</div>
						<div className="flex items-center justify-end">
							<Button
								type="submit"
								size="sm"
								disabled={isLoading || !newObject.name.trim()}
							>
								{isLoading ? (
									<Loader2 className="h-4 w-4 animate-spin mr-2" />
								) : null}
								Crear objeto
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
				{objects.length === 0 && !isLoading ? (
					<div className="text-sm text-muted-foreground text-center py-4">
						No hay objetos creados
					</div>
				) : (
					objects.map((object) => (
						<motion.div
							key={object.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3 }}
						>
							<Card className="group relative overflow-hidden">
								<CardContent className="p-4">
									{editingId === object.id ? (
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
														placeholder="Nombre del objeto"
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
												<div className="grid grid-cols-2 gap-2">
													<Input
														placeholder="Tipo"
														value={editForm?.type}
														onChange={(e) =>
															setEditForm((prev) => ({
																...prev!,
																type: e.target.value,
															}))
														}
														className="h-8"
													/>
													<Input
														placeholder="Rareza"
														value={editForm?.rarity}
														onChange={(e) =>
															setEditForm((prev) => ({
																...prev!,
																rarity: e.target.value,
															}))
														}
														className="h-8"
													/>
												</div>
												<div className="grid grid-cols-2 gap-2">
													<Input
														placeholder="Propiedades (JSON)"
														value={editForm?.properties}
														onChange={(e) =>
															setEditForm((prev) => ({
																...prev!,
																properties: e.target.value,
															}))
														}
														className="h-8"
													/>
													<Input
														placeholder="Requisitos (JSON)"
														value={editForm?.requirements}
														onChange={(e) =>
															setEditForm((prev) => ({
																...prev!,
																requirements: e.target.value,
															}))
														}
														className="h-8"
													/>
												</div>
												<Input
													placeholder="Origen"
													value={editForm?.origin}
													onChange={(e) =>
														setEditForm((prev) => ({
															...prev!,
															origin: e.target.value,
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
													style={{ backgroundColor: object.color }}
												>
													<span className="text-lg">{object.emoji}</span>
												</div>
												<div className="flex-1 min-w-0">
													<span className="text-xs font-semibold truncate pl-1">
														{object.name}
													</span>
													{object.description && (
														<p className="text-[10px] text-muted-foreground truncate pl-1">
															{object.description}
														</p>
													)}
													<div className="flex items-center gap-2 text-[10px] text-muted-foreground/75 truncate pl-1">
														<span className="flex items-center gap-1">
															<Target className="h-3 w-3" />{" "}
															{object.type || "Sin tipo"}
														</span>
														<span className="flex items-center gap-1">
															<Sparkles className="h-3 w-3" />{" "}
															{object.rarity || "Sin rareza"}
														</span>
														<span className="flex items-center gap-1">
															<Scroll className="h-3 w-3" />{" "}
															{object.origin || "Sin origen"}
														</span>
													</div>
													{object._count?.images > 0 && (
														<p className="text-[10px] text-muted-foreground/75 truncate pl-1">
															{object._count.images}{" "}
															{object._count.images === 1
																? "imagen"
																: "imágenes"}{" "}
															• {formatBytes(object.totalSize)}
														</p>
													)}
												</div>
											</div>
											<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-0 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm shadow-lg rounded-l-sm px-1">
												<Button
													variant="ghost"
													size="icon"
													onClick={() => handleStartEdit(object)}
													className="h-6 w-6"
												>
													<PencilIcon className="h-3 w-3" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													onClick={() => handleDeleteObject(object.id)}
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
