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
	MapPin,
	Castle,
	Users,
	Cloud,
	ScrollText,
	Building2,
	Mountain,
	TreePine,
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
import { getPlaces, createPlace, updatePlace, deletePlace } from "@/app/actions/place.actions";
import type { Place } from "@prisma/client";

const placeLogger = logger.withContext("PlacesSection");

interface EditForm extends Partial<Place> {
	id: string;
}

export function PlacesSection() {
	const [places, setPlaces] = React.useState<Place[]>([]);
	const [isLoading, setIsLoading] = React.useState(false);
	const [error, setError] = React.useState<Error | null>(null);
	const [editingId, setEditingId] = React.useState<string | null>(null);
	const [editForm, setEditForm] = React.useState<EditForm | null>(null);
	const [newPlace, setNewPlace] = React.useState<Partial<Place>>({
		name: "",
		emoji: "📍",
		description: "",
		color: "#3b82f6",
		type: "",
		climate: "",
		population: 0,
		government: "",
		history: "",
		stats: "{}",
	});
	const { toast } = useToast();

	const loadPlaces = React.useCallback(async () => {
		setIsLoading(true);
		try {
			const data = await getPlaces();
			setPlaces(data);
			setError(null);
		} catch (error) {
			setError(error as Error);
			toast({
				title: "Error al cargar lugares",
				description: "No se pudieron cargar los lugares.",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	}, [toast]);

	React.useEffect(() => {
		loadPlaces();
	}, [loadPlaces]);

	const handleStartEdit = (place: Place) => {
		setEditingId(place.id);
		setEditForm({
			id: place.id,
			name: place.name,
			emoji: place.emoji,
			description: place.description || "",
			color: place.color,
			type: place.type,
			climate: place.climate,
			population: place.population,
			government: place.government,
			history: place.history,
			stats: place.stats,
		});
	};

	const handleSubmitEdit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!editForm) return;

		setIsLoading(true);
		try {
			placeLogger.info("📝 Actualizando lugar...", editForm);
			const { id, ...data } = editForm;
			await updatePlace(id, data);
			await loadPlaces();
			setEditingId(null);
			setEditForm(null);
			toast({
				title: "✅ Lugar actualizado",
				description: "El lugar se ha actualizado correctamente.",
			});
		} catch (error) {
			placeLogger.error("❌ Error al actualizar lugar:", error);
			toast({
				title: "❌ Error al actualizar lugar",
				description: "No se pudo actualizar el lugar.",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleSubmitCreate = async (e: React.FormEvent) => {
		e.preventDefault();

		setIsLoading(true);
		try {
			placeLogger.info("✨ Creando lugar...", newPlace);
			await createPlace(newPlace);
			await loadPlaces();
			setNewPlace({
				name: "",
				emoji: "📍",
				description: "",
				color: "#3b82f6",
				type: "",
				climate: "",
				population: 0,
				government: "",
				history: "",
				stats: "{}",
			});
			toast({
				title: "✅ Lugar creado",
				description: "El lugar se ha creado correctamente.",
			});
		} catch (error) {
			placeLogger.error("❌ Error al crear lugar:", error);
			toast({
				title: "❌ Error al crear lugar",
				description: "No se pudo crear el lugar.",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleDeletePlace = async (id: string) => {
		setIsLoading(true);
		try {
			placeLogger.info("🗑️ Eliminando lugar...", id);
			await deletePlace(id);
			await loadPlaces();
			toast({
				title: "✅ Lugar eliminado",
				description: "El lugar se ha eliminado correctamente.",
			});
		} catch (error) {
			placeLogger.error("❌ Error al eliminar lugar:", error);
			toast({
				title: "❌ Error al eliminar lugar",
				description: "No se pudo eliminar el lugar.",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="text-lg font-semibold">Lugares</h2>
				<Button
					variant="outline"
					size="sm"
					onClick={() => loadPlaces()}
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
												backgroundColor: newPlace.color,
											}}
										>
											<span className="text-lg">{newPlace.emoji}</span>
										</Button>
									</PopoverTrigger>
									<PopoverContent
										className="w-full p-0"
										side="right"
										align="start"
									>
										<EmojiPicker
											onEmojiSelect={(emoji: string) =>
												setNewPlace((prev) => ({
													...prev,
													emoji: emoji,
												}))
											}
										/>
										<Separator className="my-2" />
										<div className="p-2">
											<CompactPicker
												color={newPlace.color}
												onChange={(color) =>
													setNewPlace((prev) => ({
														...prev,
														color: color.hex,
													}))
												}
											/>
										</div>
									</PopoverContent>
								</Popover>
								<Input
									placeholder="Nombre del lugar"
									value={newPlace.name}
									onChange={(e) =>
										setNewPlace((prev) => ({
											...prev,
											name: e.target.value,
										}))
									}
									className="h-8"
								/>
							</div>
							<Input
								placeholder="Descripción"
								value={newPlace.description}
								onChange={(e) =>
									setNewPlace((prev) => ({
										...prev,
										description: e.target.value,
									}))
								}
								className="h-8"
							/>
							<div className="grid grid-cols-2 gap-2">
								<Input
									placeholder="Tipo"
									value={newPlace.type}
									onChange={(e) =>
										setNewPlace((prev) => ({
											...prev,
											type: e.target.value,
										}))
									}
									className="h-8"
								/>
								<Input
									placeholder="Clima"
									value={newPlace.climate}
									onChange={(e) =>
										setNewPlace((prev) => ({
											...prev,
											climate: e.target.value,
										}))
									}
									className="h-8"
								/>
							</div>
							<div className="grid grid-cols-2 gap-2">
								<Input
									placeholder="Población"
									type="number"
									value={newPlace.population}
									onChange={(e) =>
										setNewPlace((prev) => ({
											...prev,
											population: parseInt(e.target.value),
										}))
									}
									className="h-8"
								/>
								<Input
									placeholder="Gobierno"
									value={newPlace.government}
									onChange={(e) =>
										setNewPlace((prev) => ({
											...prev,
											government: e.target.value,
										}))
									}
									className="h-8"
								/>
							</div>
							<Input
								placeholder="Historia"
								value={newPlace.history}
								onChange={(e) =>
									setNewPlace((prev) => ({
										...prev,
										history: e.target.value,
									}))
								}
								className="h-8"
							/>
						</div>
						<div className="flex items-center justify-end">
							<Button type="submit" size="sm" disabled={isLoading}>
								{isLoading ? (
									<Loader2 className="h-4 w-4 animate-spin mr-2" />
								) : null}
								Crear lugar
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
				{places.length === 0 && !isLoading ? (
					<div className="text-sm text-muted-foreground text-center py-4">
						No hay lugares creados
					</div>
				) : (
					places.map((place) => (
						<motion.div
							key={place.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3 }}
						>
							<Card className="group relative overflow-hidden">
								<CardContent className="p-4">
									{!editingId && (
										<div className="flex items-center gap-2 relative">
											<div className="flex items-center gap-2 min-w-0">
												<div
													className="h-8 w-8 rounded-full flex items-center justify-center shadow-sm"
													style={{ backgroundColor: place.color }}
												>
													<span className="text-lg">{place.emoji}</span>
												</div>
												<div className="flex-1 min-w-0">
													<span className="text-xs font-semibold truncate pl-1">
														{place.name}
													</span>
													{place.description && (
														<p className="text-[10px] text-muted-foreground truncate pl-1">
															{place.description}
														</p>
													)}
													<div className="flex items-center gap-2 text-[10px] text-muted-foreground/75 truncate pl-1">
														<span className="flex items-center gap-1">
															<MapPin className="h-3 w-3" />{" "}
															{place.type || "Sin tipo"}
														</span>
														<span className="flex items-center gap-1">
															<Cloud className="h-3 w-3" />{" "}
															{place.climate || "Sin clima"}
														</span>
														<span className="flex items-center gap-1">
															<Users className="h-3 w-3" />{" "}
															{place.population || 0} habitantes
														</span>
														<span className="flex items-center gap-1">
															<Building2 className="h-3 w-3" />{" "}
															{place.government || "Sin gobierno"}
														</span>
													</div>
													{place._count?.images > 0 && (
														<p className="text-[10px] text-muted-foreground/75 truncate pl-1">
															{place._count.images}{" "}
															{place._count.images === 1
																? "imagen"
																: "imágenes"}{" "}
															• {formatBytes(place.totalSize)}
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
									{editingId === place.id && (
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
																		emoji: emoji,
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
														placeholder="Nombre del lugar"
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
														placeholder="Clima"
														value={editForm?.climate}
														onChange={(e) =>
															setEditForm((prev) => ({
																...prev!,
																climate: e.target.value,
															}))
														}
														className="h-8"
													/>
												</div>
												<div className="grid grid-cols-2 gap-2">
													<Input
														placeholder="Población"
														type="number"
														value={editForm?.population}
														onChange={(e) =>
															setEditForm((prev) => ({
																...prev!,
																population: parseInt(e.target.value),
															}))
														}
														className="h-8"
													/>
													<Input
														placeholder="Gobierno"
														value={editForm?.government}
														onChange={(e) =>
															setEditForm((prev) => ({
																...prev!,
																government: e.target.value,
															}))
														}
														className="h-8"
													/>
												</div>
												<Input
													placeholder="Historia"
													value={editForm?.history}
													onChange={(e) =>
														setEditForm((prev) => ({
															...prev!,
															history: e.target.value,
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
													onClick={() => {
														setEditingId(null);
														setEditForm(null);
													}}
												>
													<XIcon className="h-4 w-4" />
												</Button>
												<Button type="submit" size="sm" disabled={isLoading}>
													{isLoading ? (
														<Loader2 className="h-4 w-4 animate-spin mr-2" />
													) : (
														<CheckIcon className="h-4 w-4" />
													)}
												</Button>
											</div>
										</form>
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
