"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
	Trash2,
	Box,
	PencilIcon,
	CheckIcon,
	XIcon,
	Loader2,
} from "lucide-react";
import { useObjectsStore } from "@/store/objects";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { logger } from "@/lib/logger";
import type { ObjectCreate, ObjectUpdate } from "@/services/object.service";

const objectsLogger = logger.withContext("ObjectsSection");

export function ObjectsSection() {
	const {
		objects,
		isLoading,
		createObject,
		updateObject,
		deleteObject,
		loadObjects,
	} = useObjectsStore();
	const [editingId, setEditingId] = React.useState<string | null>(null);
	const [editForm, setEditForm] = React.useState<ObjectUpdate | null>(null);
	const [newObject, setNewObject] = React.useState<ObjectCreate>({
		name: "",
		description: "",
	});
	const { toast } = useToast();

	// Cargar objetos al montar el componente
	React.useEffect(() => {
		loadObjects();
	}, [loadObjects]);

	const handleStartEdit = (object: (typeof objects)[0]) => {
		setEditingId(object.id);
		setEditForm({
			id: object.id,
			name: object.name,
			description: object.description || "",
		});
	};

	const handleCancelEdit = () => {
		setEditingId(null);
		setEditForm(null);
	};

	const handleSaveEdit = async (id: string) => {
		if (!editForm) return;
		try {
			objectsLogger.info("💾 Guardando cambios en objeto:", {
				id,
				data: editForm,
			});
			await updateObject(id, editForm);
			handleCancelEdit();
			toast({
				title: "Éxito",
				description: "Objeto actualizado correctamente",
			});
		} catch (error) {
			objectsLogger.error("❌ Error al actualizar objeto:", error);
			toast({
				title: "Error",
				description: "No se pudo actualizar el objeto",
				variant: "destructive",
			});
		}
	};

	const handleAddObject = async () => {
		if (!newObject.name) return;

		try {
			objectsLogger.info("➕ Creando nuevo objeto:", newObject);
			await createObject(newObject);
			setNewObject({
				name: "",
				description: "",
			});
			toast({
				title: "Éxito",
				description: "Objeto creado correctamente",
			});
		} catch (error) {
			objectsLogger.error("❌ Error al crear objeto:", error);
			toast({
				title: "Error",
				description: "No se pudo crear el objeto",
				variant: "destructive",
			});
		}
	};

	const handleDeleteObject = async (id: string) => {
		try {
			objectsLogger.info("🗑️ Eliminando objeto:", id);
			await deleteObject(id);
			toast({
				title: "Éxito",
				description: "Objeto eliminado correctamente",
			});
		} catch (error) {
			objectsLogger.error("❌ Error al eliminar objeto:", error);
			toast({
				title: "Error",
				description: "No se pudo eliminar el objeto",
				variant: "destructive",
			});
		}
	};

	return (
		<Card className="flex flex-col gap-2 bg-muted/30 rounded-sm">
			<CardHeader className="p-2 pb-0 bg-transparent">
				<CardTitle className="text-base text-muted-foreground font-semibold flex items-center justify-between pl-1">
					<span className="flex items-center gap-2 h-7">
						<Box className="h-5 w-5" /> Objetos
					</span>
					{objects.length > 0 && (
						<span className="text-xs text-muted-foreground/75">
							{objects.length} {objects.length === 1 ? "objeto" : "objetos"}
						</span>
					)}
				</CardTitle>
			</CardHeader>
			<Separator className="my-0" />
			<CardContent className="p-2">
				<div className="space-y-3">
					<div className="flex items-center gap-2">
						<div className="flex-1 min-w-0 space-y-1">
							<Input
								value={newObject.name}
								onChange={(e) =>
									setNewObject({ ...newObject, name: e.target.value })
								}
								className="h-8 text-base border-none p-3"
								placeholder="Nombre del objeto"
							/>
							<Input
								value={newObject.description || ""}
								onChange={(e) =>
									setNewObject({
										...newObject,
										description: e.target.value,
									})
								}
								className="h-6 text-xs border-none p-2"
								placeholder="Descripción (opcional)"
							/>
						</div>
						<Button
							size="sm"
							className="h-8 text-xs px-3"
							onClick={handleAddObject}
							disabled={!newObject.name.trim()}
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
									Cargando objetos...
								</p>
							</div>
						) : objects && objects.length > 0 ? (
							objects.map((object, index) => (
								<motion.div
									key={object.id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.1 }}
									className={cn(
										"bg-muted/30 group rounded-sm relative",
										editingId === object.id && "ring-1 ring-primary"
									)}
								>
									<CardContent className="p-2">
										{editingId === object.id ? (
											<div className="space-y-2">
												<div className="flex items-center gap-2">
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
															placeholder="Nombre del objeto"
														/>
														<Input
															value={editForm?.description || ""}
															onChange={(e) =>
																setEditForm((prev) =>
																	prev
																		? {
																				...prev,
																				description: e.target.value,
																		  }
																		: null
																)
															}
															className="h-6 text-xs border-none p-2"
															placeholder="Descripción (opcional)"
														/>
													</div>
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
														onClick={() => handleSaveEdit(object.id)}
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
													<div className="flex-1 min-w-0">
														<span className="text-xs font-semibold truncate pl-1">
															{object.name}
														</span>
														{object.description && (
															<p className="text-[10px] text-muted-foreground truncate pl-1">
																{object.description}
															</p>
														)}
														{object.count > 0 && (
															<p className="text-[10px] text-muted-foreground/75 truncate pl-1">
																{object.count}{" "}
																{object.count === 1 ? "imagen" : "imágenes"}
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
								</motion.div>
							))
						) : (
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								className="py-4 text-center col-span-2"
							>
								<Box className="h-6 w-6 mx-auto mb-2 text-muted-foreground/50" />
								<p className="text-xs text-muted-foreground">
									No hay objetos creados
								</p>
								<p className="text-[10px] mt-1 text-muted-foreground/75">
									Crea un objeto para organizar tus imágenes
								</p>
							</motion.div>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
