"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
	Trash2,
	MapPin,
	PencilIcon,
	CheckIcon,
	XIcon,
	Loader2,
} from "lucide-react";
import { usePlacesStore } from "@/store/places";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { logger } from "@/lib/logger";
import type { PlaceCreate, PlaceUpdate } from "@/services/place.service";

const placesLogger = logger.withContext("PlacesSection");

export function PlacesSection() {
	const {
		places,
		isLoading,
		createPlace,
		updatePlace,
		deletePlace,
		loadPlaces,
	} = usePlacesStore();
	const [editingId, setEditingId] = React.useState<string | null>(null);
	const [editForm, setEditForm] = React.useState<PlaceUpdate | null>(null);
	const [newPlace, setNewPlace] = React.useState<PlaceCreate>({
		name: "",
		description: "",
	});
	const { toast } = useToast();

	// Cargar lugares al montar el componente
	React.useEffect(() => {
		loadPlaces();
	}, [loadPlaces]);

	const handleStartEdit = (place: (typeof places)[0]) => {
		setEditingId(place.id);
		setEditForm({
			id: place.id,
			name: place.name,
			description: place.description || "",
		});
	};

	const handleCancelEdit = () => {
		setEditingId(null);
		setEditForm(null);
	};

	const handleSaveEdit = async (id: string) => {
		if (!editForm) return;
		try {
			placesLogger.info("💾 Guardando cambios en lugar:", {
				id,
				data: editForm,
			});
			await updatePlace(id, editForm);
			handleCancelEdit();
			toast({
				title: "Éxito",
				description: "Lugar actualizado correctamente",
			});
		} catch (error) {
			placesLogger.error("❌ Error al actualizar lugar:", error);
			toast({
				title: "Error",
				description: "No se pudo actualizar el lugar",
				variant: "destructive",
			});
		}
	};

	const handleAddPlace = async () => {
		if (!newPlace.name) return;

		try {
			placesLogger.info("➕ Creando nuevo lugar:", newPlace);
			await createPlace(newPlace);
			setNewPlace({
				name: "",
				description: "",
			});
			toast({
				title: "Éxito",
				description: "Lugar creado correctamente",
			});
		} catch (error) {
			placesLogger.error("❌ Error al crear lugar:", error);
			toast({
				title: "Error",
				description: "No se pudo crear el lugar",
				variant: "destructive",
			});
		}
	};

	const handleDeletePlace = async (id: string) => {
		try {
			placesLogger.info("🗑️ Eliminando lugar:", id);
			await deletePlace(id);
			toast({
				title: "Éxito",
				description: "Lugar eliminado correctamente",
			});
		} catch (error) {
			placesLogger.error("❌ Error al eliminar lugar:", error);
			toast({
				title: "Error",
				description: "No se pudo eliminar el lugar",
				variant: "destructive",
			});
		}
	};

	return (
		<Card className="flex flex-col gap-2 bg-muted/30 rounded-sm">
			<CardHeader className="p-2 pb-0 bg-transparent">
				<CardTitle className="text-base text-muted-foreground font-semibold flex items-center justify-between pl-1">
					<span className="flex items-center gap-2 h-7">
						<MapPin className="h-5 w-5" /> Lugares
					</span>
					{places.length > 0 && (
						<span className="text-xs text-muted-foreground/75">
							{places.length} {places.length === 1 ? "lugar" : "lugares"}
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
								value={newPlace.name}
								onChange={(e) =>
									setNewPlace({ ...newPlace, name: e.target.value })
								}
								className="h-8 text-base border-none p-3"
								placeholder="Nombre del lugar"
							/>
							<Input
								value={newPlace.description || ""}
								onChange={(e) =>
									setNewPlace({
										...newPlace,
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
							onClick={handleAddPlace}
							disabled={!newPlace.name.trim()}
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
									Cargando lugares...
								</p>
							</div>
						) : places && places.length > 0 ? (
							places.map((place, index) => (
								<motion.div
									key={place.id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.1 }}
									className={cn(
										"bg-muted/30 group rounded-sm relative",
										editingId === place.id && "ring-1 ring-primary"
									)}
								>
									<CardContent className="p-2">
										{editingId === place.id ? (
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
															placeholder="Nombre del lugar"
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
														onClick={() => handleSaveEdit(place.id)}
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
															{place.name}
														</span>
														{place.description && (
															<p className="text-[10px] text-muted-foreground truncate pl-1">
																{place.description}
															</p>
														)}
														{place.count > 0 && (
															<p className="text-[10px] text-muted-foreground/75 truncate pl-1">
																{place.count}{" "}
																{place.count === 1 ? "imagen" : "imágenes"}
															</p>
														)}
													</div>
												</div>
												<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-0 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm shadow-lg rounded-l-sm px-1">
													<Button
														variant="ghost"
														size="icon"
														onClick={() => handleStartEdit(place)}
														className="h-6 w-6"
													>
														<PencilIcon className="h-3 w-3" />
													</Button>
													<Button
														variant="ghost"
														size="icon"
														onClick={() => handleDeletePlace(place.id)}
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
								<MapPin className="h-6 w-6 mx-auto mb-2 text-muted-foreground/50" />
								<p className="text-xs text-muted-foreground">
									No hay lugares creados
								</p>
								<p className="text-[10px] mt-1 text-muted-foreground/75">
									Crea un lugar para organizar tus imágenes
								</p>
							</motion.div>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
