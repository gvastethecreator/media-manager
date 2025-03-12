"use client";

import {
	type RarityItem,
	type RaritySystem,
	getEntityRaritySystem,
	saveEntityRaritySystem,
} from "@/app/actions/entities-cards/entities-cards.actions";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toastService } from "@/lib/services/toast.service";
import {
	AlertTriangle,
	Award,
	Edit,
	MoveVertical,
	Plus,
	Save,
	Trash,
} from "lucide-react";
import { Reorder, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import * as React from "react";

interface RarityManagerProps {
	entityType: string;
	onRaritiesChange?: (rarities: RaritySystem) => void;
}

// Interfaz para el tipo de rareza actual en edición
interface CurrentRarityItem {
	id: string;
	name: string;
	color: string;
	borderEffect?: string;
	glowColor?: string;
	description?: string;
	position?: number;
	chance?: number;
}

export function RarityManager({
	entityType,
	onRaritiesChange,
}: RarityManagerProps) {
	// Estado para el sistema de rarezas
	const [raritySystem, setRaritySystem] = useState<RaritySystem>({
		enabled: false,
		rarities: [],
	});

	// Estado para indicar si está guardando
	const [isSaving, setIsSaving] = useState(false);

	// Estado para el diálogo de edición
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [currentRarity, setCurrentRarity] = useState<CurrentRarityItem | null>(
		null
	);

	// Cargar el sistema de rarezas
	const loadRaritySystem = useCallback(async () => {
		try {
			const response = await getEntityRaritySystem(entityType);

			if (response.success && response.data) {
				setRaritySystem(response.data as RaritySystem);
				onRaritiesChange?.(response.data as RaritySystem);
			} else {
				toastService.error(response.message);
			}
		} catch (error) {
			console.error("Error al cargar el sistema de rarezas:", error);
			toastService.error("No se pudo cargar el sistema de rarezas");
		}
	}, [entityType, onRaritiesChange]);

	// Efecto para cargar las rarezas al montar el componente
	useEffect(() => {
		loadRaritySystem();
	}, [loadRaritySystem]);

	// Función para guardar el sistema de rarezas
	const handleSaveRaritySystem = async () => {
		try {
			setIsSaving(true);
			const response = await saveEntityRaritySystem(entityType, raritySystem);

			if (response.success) {
				toastService.success(response.message);
				onRaritiesChange?.(raritySystem);
			} else {
				toastService.error(response.message);
			}
		} catch (error) {
			console.error("Error al guardar el sistema de rarezas:", error);
			toastService.error("No se pudo guardar el sistema de rarezas");
		} finally {
			setIsSaving(false);
		}
	};

	// Función para manejar el cambio en enabled
	const handleEnabledChange = (enabled: boolean) => {
		setRaritySystem((prev) => ({
			...prev,
			enabled,
		}));
	};

	// Función para agregar una nueva rareza
	const handleAddRarity = () => {
		// Generar un ID único
		const id = `rarity_${Date.now()}`;
		const position = raritySystem.rarities.length;

		// Crear un objeto de rareza predeterminado
		const newRarity: CurrentRarityItem = {
			id,
			name: `Rareza ${position + 1}`,
			color: "#3b82f6",
			position,
			chance: 10, // Valor por defecto para la propiedad chance
		};

		// Actualizar el estado
		setRaritySystem((prev) => ({
			...prev,
			rarities: [...prev.rarities, newRarity as unknown as RarityItem],
		}));

		// Abrir el diálogo de edición
		setCurrentRarity(newRarity);
		setEditDialogOpen(true);
	};

	// Función para editar una rareza
	const handleEditRarity = (rarity: RarityItem) => {
		setCurrentRarity(rarity as unknown as CurrentRarityItem);
		setEditDialogOpen(true);
	};

	// Función para eliminar una rareza
	const handleDeleteRarity = (id: string) => {
		setRaritySystem((prev) => ({
			...prev,
			rarities: prev.rarities
				.filter((r) => r.id !== id)
				.map((r, index) => ({
					...r,
					position: index,
				})),
		}));
	};

	// Función para guardar los cambios en una rareza
	const handleSaveRarity = () => {
		if (!currentRarity) {
			return;
		}

		// Validación
		if (!currentRarity.name.trim()) {
			toastService.error("El nombre de la rareza es obligatorio");
			return;
		}

		setRaritySystem((prev) => {
			const exists = prev.rarities.some((r) => r.id === currentRarity.id);
			let newRarities: RarityItem[] = [];

			if (exists) {
				// Actualizar rareza existente
				newRarities = prev.rarities.map((r) => {
					if (r.id === currentRarity.id) {
						return {
							...currentRarity,
							chance: currentRarity.chance || 10, // Asegurar que chance esté presente
						} as unknown as RarityItem;
					}
					return r;
				});
			} else {
				// Agregar nueva rareza
				newRarities = [
					...prev.rarities,
					{
						...currentRarity,
						chance: currentRarity.chance || 10, // Asegurar que chance esté presente
					} as unknown as RarityItem,
				];
			}

			// Ordenar rarezas por el campo position
			newRarities.sort((a, b) => {
				const posA = a.position || 0;
				const posB = b.position || 0;
				return posA - posB;
			});

			return {
				...prev,
				rarities: newRarities,
			};
		});

		setEditDialogOpen(false);
		setCurrentRarity(null);
	};

	// Función para manejar el reordenamiento de las rarezas
	const handleReorder = (reorderedItems: RarityItem[]) => {
		setRaritySystem((prev) => ({
			...prev,
			rarities: reorderedItems.map((item, index) => ({
				...item,
				position: index,
			})),
		}));
	};

	// Función para distribuir las rarezas uniformemente
	const handleDistributeRarities = () => {
		const count = raritySystem.rarities.length;

		if (count < 2) {
			toastService.warning("Se necesitan al menos 2 rarezas para distribuir");
			return;
		}

		// Actualizar colores creando un degradado
		const updatedRarities = raritySystem.rarities.map((rarity, index) => {
			// Desde gris (común) hasta naranja/dorado (legendario)
			let color = "#9ca3af"; // gris para común

			if (count > 1) {
				if (index === 0) {
					color = "#9ca3af"; // común - gris
				} else if (index === count - 1) {
					color = "#f59e0b"; // legendario - naranja/dorado
				} else if (index === 1 && count > 2) {
					color = "#10b981"; // poco común - verde
				} else if (index === 2 && count > 3) {
					color = "#3b82f6"; // raro - azul
				} else if (index === 3 && count > 4) {
					color = "#8b5cf6"; // épico - morado
				} else {
					// Interpolar colores para rarezas intermedias
					const t = index / (count - 1);
					const r = Math.round(155 + t * 100);
					const g = Math.round(150 - t * 50);
					const b = Math.round(246 - t * 100);
					color = `#${r.toString(16)}${g.toString(16)}${b.toString(16)}`;
				}
			}

			return {
				...rarity,
				position: index,
				color,
				// Agregar efecto especial para rarezas altas
				borderEffect: index >= count - 2 ? "animated" : undefined,
				glowColor: index === count - 1 ? "#f97316" : undefined,
			};
		});

		setRaritySystem((prev) => ({
			...prev,
			rarities: updatedRarities,
		}));
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Award className="h-4 w-4 text-primary" />
					<h3 className="text-sm font-medium">Sistema de rarezas</h3>
				</div>
				<Switch
					checked={raritySystem.enabled}
					onCheckedChange={handleEnabledChange}
				/>
			</div>

			<div
				className={
					raritySystem.enabled
						? "opacity-100"
						: "opacity-50 pointer-events-none"
				}
			>
				<div className="flex justify-between mb-2">
					<Button
						variant="outline"
						size="sm"
						className="text-xs h-7"
						onClick={handleAddRarity}
					>
						<Plus className="h-3.5 w-3.5 mr-1" /> Agregar Rareza
					</Button>

					<div className="flex gap-2">
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button variant="outline" size="sm" className="text-xs h-7">
									<MoveVertical className="h-3.5 w-3.5 mr-1" /> Distribuir
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>Distribuir rarezas</AlertDialogTitle>
									<AlertDialogDescription>
										Esto distribuirá las rarezas uniformemente y asignará
										colores adecuados para cada nivel. Los cambios no guardados
										se perderán.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>Cancelar</AlertDialogCancel>
									<AlertDialogAction onClick={handleDistributeRarities}>
										Distribuir
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>

						<Button
							variant="default"
							size="sm"
							className="text-xs h-7"
							onClick={handleSaveRaritySystem}
							disabled={isSaving}
						>
							<Save className="h-3.5 w-3.5 mr-1" />{" "}
							{isSaving ? "Guardando..." : "Guardar"}
						</Button>
					</div>
				</div>

				<div className="bg-card border rounded-md">
					{raritySystem.rarities.length === 0 ? (
						<div className="p-8 text-center text-muted-foreground">
							<AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
							<p className="text-sm">No hay rarezas definidas</p>
							<p className="text-xs mt-1">
								Agrega rarezas para categorizar elementos
							</p>
						</div>
					) : (
						<ScrollArea className="h-64">
							<Reorder.Group
								axis="y"
								values={raritySystem.rarities}
								onReorder={handleReorder}
								className="divide-y"
							>
								{raritySystem.rarities.map((rarity) => (
									<Reorder.Item key={rarity.id} value={rarity} className="p-2">
										<div className="flex items-center justify-between gap-2">
											<div className="flex items-center gap-2 flex-1">
												<div
													className="w-4 h-4 rounded-full border"
													style={{ backgroundColor: rarity.color }}
												/>
												<span className="text-sm">{rarity.name}</span>
											</div>

											<div className="flex gap-1 items-center">
												<Button
													variant="ghost"
													size="icon"
													className="h-6 w-6"
													onClick={() => handleEditRarity(rarity)}
												>
													<Edit className="h-3.5 w-3.5" />
												</Button>

												<AlertDialog>
													<AlertDialogTrigger asChild>
														<Button
															variant="ghost"
															size="icon"
															className="h-6 w-6 text-destructive"
														>
															<Trash className="h-3.5 w-3.5" />
														</Button>
													</AlertDialogTrigger>
													<AlertDialogContent>
														<AlertDialogHeader>
															<AlertDialogTitle>
																Eliminar rareza
															</AlertDialogTitle>
															<AlertDialogDescription>
																¿Estás seguro de que deseas eliminar esta
																rareza? Esta acción no se puede deshacer.
															</AlertDialogDescription>
														</AlertDialogHeader>
														<AlertDialogFooter>
															<AlertDialogCancel>Cancelar</AlertDialogCancel>
															<AlertDialogAction
																onClick={() => handleDeleteRarity(rarity.id)}
															>
																Eliminar
															</AlertDialogAction>
														</AlertDialogFooter>
													</AlertDialogContent>
												</AlertDialog>
											</div>
										</div>
									</Reorder.Item>
								))}
							</Reorder.Group>
						</ScrollArea>
					)}
				</div>

				<div className="mt-2 text-xs text-muted-foreground">
					<p className="italic">
						Las rarezas se distribuirán automáticamente entre tus elementos.
					</p>
					<p className="mt-1">
						Consejo: Ordena las rarezas de menor a mayor importancia (de arriba
						a abajo).
					</p>
				</div>
			</div>

			{/* Diálogo de edición de rareza */}
			<Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{currentRarity?.id ? "Editar Rareza" : "Nueva Rareza"}
						</DialogTitle>
					</DialogHeader>

					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="name">Nombre</Label>
							<Input
								id="name"
								value={currentRarity?.name || ""}
								onChange={(e) =>
									setCurrentRarity((prev) =>
										prev ? { ...prev, name: e.target.value } : null
									)
								}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="color">Color</Label>
							<div className="flex gap-2">
								<div
									className="w-8 h-8 rounded border"
									style={{ backgroundColor: currentRarity?.color }}
								/>
								<Input
									id="color"
									value={currentRarity?.color || ""}
									onChange={(e) =>
										setCurrentRarity((prev) =>
											prev ? { ...prev, color: e.target.value } : null
										)
									}
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="glowColor">Color de brillo (opcional)</Label>
							<div className="flex gap-2">
								<div
									className="w-8 h-8 rounded border"
									style={{
										backgroundColor: currentRarity?.glowColor || "transparent",
									}}
								/>
								<Input
									id="glowColor"
									value={currentRarity?.glowColor || ""}
									onChange={(e) =>
										setCurrentRarity((prev) =>
											prev ? { ...prev, glowColor: e.target.value } : null
										)
									}
									placeholder="ej. #f97316"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="borderEffect">Efecto de borde</Label>
							<Select
								value={currentRarity?.borderEffect || "none"}
								onValueChange={(value: string) =>
									setCurrentRarity((prev) =>
										prev
											? {
													...prev,
													borderEffect: value === "none" ? undefined : value,
												}
											: null
									)
								}
							>
								<SelectTrigger id="borderEffect" className="w-full">
									<SelectValue placeholder="Seleccionar efecto" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">Ninguno</SelectItem>
									<SelectItem value="animated">Animado</SelectItem>
									<SelectItem value="glow">Brillo</SelectItem>
									<SelectItem value="pulse">Pulso</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="chance">Probabilidad (%)</Label>
							<Input
								id="chance"
								type="number"
								min="1"
								max="100"
								value={currentRarity?.chance?.toString() || "10"}
								onChange={(e) =>
									setCurrentRarity((prev) =>
										prev ? { ...prev, chance: Number(e.target.value) } : null
									)
								}
							/>
							<p className="text-xs text-muted-foreground">
								Probabilidad de aparición relativa de esta rareza
							</p>
						</div>

						<div className="space-y-2">
							<Label htmlFor="description">Descripción (opcional)</Label>
							<Input
								id="description"
								value={currentRarity?.description || ""}
								onChange={(e) =>
									setCurrentRarity((prev) =>
										prev ? { ...prev, description: e.target.value } : null
									)
								}
								placeholder="Descripción corta de esta rareza"
							/>
						</div>
					</div>

					<DialogFooter>
						<Button variant="outline" onClick={() => setEditDialogOpen(false)}>
							Cancelar
						</Button>
						<Button onClick={handleSaveRarity}>Guardar</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
