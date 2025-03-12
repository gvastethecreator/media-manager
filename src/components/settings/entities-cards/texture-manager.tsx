"use client";

import {
	type TextureSystem,
	getEntityTextureSystem,
	saveEntityTextureSystem,
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
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
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
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toastService } from "@/lib/services/toast.service";
import {
	AlertTriangle,
	Edit,
	ImagePlus,
	Palette,
	Plus,
	Save,
	Trash,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import * as React from "react";

interface TextureManagerProps {
	entityType: string;
	onTexturesChange?: (textures: TextureSystem) => void;
}

// Interfaz para una textura
interface TextureItem {
	id: string;
	name: string;
	imageUrl?: string;
	patternType?: string;
	color: string;
	opacity: number;
	description?: string;
}

export function TextureManager({
	entityType,
	onTexturesChange,
}: TextureManagerProps) {
	// Estado para el sistema de texturas
	const [textureSystem, setTextureSystem] = useState<TextureSystem>({
		enabled: false,
		textures: [],
	});

	// Estado para indicar si está guardando
	const [isSaving, setIsSaving] = useState(false);

	// Estado para el diálogo de edición
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [currentTexture, setCurrentTexture] = useState<TextureItem | null>(
		null
	);

	// Cargar el sistema de texturas
	const loadTextureSystem = useCallback(async () => {
		try {
			const response = await getEntityTextureSystem(entityType);

			if (response.success && response.data) {
				setTextureSystem(response.data as TextureSystem);
				onTexturesChange?.(response.data as TextureSystem);
			} else {
				toastService.error(response.message);
			}
		} catch (error) {
			console.error("Error al cargar el sistema de texturas:", error);
			toastService.error("No se pudo cargar el sistema de texturas");
		}
	}, [entityType, onTexturesChange]);

	// Efecto para cargar las texturas al montar el componente
	useEffect(() => {
		loadTextureSystem();
	}, [loadTextureSystem]);

	// Función para guardar el sistema de texturas
	const handleSaveTextureSystem = async () => {
		try {
			setIsSaving(true);
			const response = await saveEntityTextureSystem(entityType, textureSystem);

			if (response.success) {
				toastService.success(response.message);
				onTexturesChange?.(textureSystem);
			} else {
				toastService.error(response.message);
			}
		} catch (error) {
			console.error("Error al guardar el sistema de texturas:", error);
			toastService.error("No se pudo guardar el sistema de texturas");
		} finally {
			setIsSaving(false);
		}
	};

	// Función para manejar el cambio en enabled
	const handleEnabledChange = (enabled: boolean) => {
		setTextureSystem((prev) => ({
			...prev,
			enabled,
		}));
	};

	// Función para agregar una nueva textura
	const handleAddTexture = () => {
		// Generar un ID único
		const id = `texture_${Date.now()}`;

		// Crear un objeto de textura predeterminado
		const newTexture: TextureItem = {
			id,
			name: "Nueva Textura",
			color: "#3b82f6",
			opacity: 0.5,
			patternType: "dots",
		};

		// Actualizar el estado
		setTextureSystem((prev) => ({
			...prev,
			textures: [...prev.textures, newTexture],
		}));

		// Abrir el diálogo de edición
		setCurrentTexture(newTexture);
		setEditDialogOpen(true);
	};

	// Función para editar una textura
	const handleEditTexture = (texture: TextureItem) => {
		setCurrentTexture(texture);
		setEditDialogOpen(true);
	};

	// Manejador para eliminar una textura
	const handleDeleteTexture = (textureId: string) => {
		setTextureSystem((prev) => {
			return {
				...prev,
				textures: prev.textures.filter((t) => t.id !== textureId),
			};
		});
	};

	// Función para guardar los cambios en una textura
	const handleSaveTexture = () => {
		if (!currentTexture) {
			return;
		}

		setTextureSystem((prev) => ({
			...prev,
			textures: prev.textures.map((t) =>
				t.id === currentTexture.id ? { ...currentTexture } : t
			),
		}));

		setEditDialogOpen(false);
		setCurrentTexture(null);
	};

	// Función para agregar presets de texturas
	const handleAddPresets = () => {
		const presets = [
			{
				id: "none",
				name: "Ninguna",
				color: "#ffffff",
				opacity: 0,
				patternType: "none",
			},
			{
				id: "dots",
				name: "Puntos",
				color: "#3b82f6",
				opacity: 0.2,
				patternType: "dots",
			},
			{
				id: "lines",
				name: "Líneas",
				color: "#8b5cf6",
				opacity: 0.2,
				patternType: "lines",
			},
			{
				id: "grid",
				name: "Cuadrícula",
				color: "#f59e0b",
				opacity: 0.15,
				patternType: "grid",
			},
			{
				id: "waves",
				name: "Ondas",
				color: "#06b6d4",
				opacity: 0.25,
				patternType: "waves",
			},
			{
				id: "noise",
				name: "Ruido",
				color: "#9ca3af",
				opacity: 0.3,
				patternType: "noise",
			},
			{
				id: "circles",
				name: "Círculos",
				color: "#ec4899",
				opacity: 0.2,
				patternType: "circles",
			},
			{
				id: "squares",
				name: "Cuadrados",
				color: "#10b981",
				opacity: 0.2,
				patternType: "squares",
			},
			{
				id: "diagonal",
				name: "Diagonal",
				color: "#ef4444",
				opacity: 0.18,
				patternType: "diagonal",
			},
			{
				id: "chevron",
				name: "Chevron",
				color: "#eab308",
				opacity: 0.22,
				patternType: "chevron",
			},
		];

		// Verificar si ya existen presets para no duplicarlos
		const existingIds = new Set(textureSystem.textures.map((t) => t.id));
		const newPresets = presets.filter((p) => !existingIds.has(p.id));

		if (newPresets.length === 0) {
			toastService.info("Los presets ya están agregados");
			return;
		}

		setTextureSystem((prev) => ({
			...prev,
			textures: [...prev.textures, ...newPresets],
		}));

		toastService.success(
			`Se agregaron ${newPresets.length} presets de texturas`
		);
	};

	// Obtener el color con opacidad para la vista previa
	const getColorWithOpacity = (color: string, opacity: number) => {
		// Si el color es en formato hex (#RRGGBB), convertirlo a rgba
		if (color.startsWith("#")) {
			const r = Number.parseInt(color.slice(1, 3), 16);
			const g = Number.parseInt(color.slice(3, 5), 16);
			const b = Number.parseInt(color.slice(5, 7), 16);
			return `rgba(${r}, ${g}, ${b}, ${opacity})`;
		}
		return color;
	};

	// Obtener estilo del patrón para la vista previa
	const getPatternStyle = (
		patternType?: string,
		color?: string,
		opacity = 0.5
	) => {
		const colorWithOpacity = color
			? getColorWithOpacity(color, opacity)
			: "rgba(59, 130, 246, 0.5)";

		switch (patternType) {
			case "dots":
				return {
					backgroundImage: `radial-gradient(${colorWithOpacity} 1px, transparent 1px)`,
					backgroundSize: "8px 8px",
				};
			case "lines":
				return {
					backgroundImage: `linear-gradient(0deg, transparent 9px, ${colorWithOpacity} 10px, transparent 11px)`,
					backgroundSize: "10px 10px",
				};
			case "grid":
				return {
					backgroundImage: `linear-gradient(0deg, transparent 9px, ${colorWithOpacity} 10px, transparent 11px),
                             linear-gradient(90deg, transparent 9px, ${colorWithOpacity} 10px, transparent 11px)`,
					backgroundSize: "10px 10px",
				};
			case "waves":
				return {
					background: `repeating-linear-gradient(45deg, transparent, transparent 5px, ${colorWithOpacity} 6px, transparent 10px)`,
				};
			case "noise":
				return {
					backgroundColor: colorWithOpacity,
					backgroundImage:
						"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
					backgroundBlendMode: "overlay",
				};
			case "circles":
				return {
					backgroundImage: `radial-gradient(circle at 50% 50%, ${colorWithOpacity} 20%, transparent 25%)`,
					backgroundSize: "20px 20px",
				};
			case "squares":
				return {
					backgroundImage: `linear-gradient(0deg, transparent 4px, ${colorWithOpacity} 5px, ${colorWithOpacity} 6px, transparent 7px),
                             linear-gradient(90deg, transparent 4px, ${colorWithOpacity} 5px, ${colorWithOpacity} 6px, transparent 7px)`,
					backgroundSize: "15px 15px",
				};
			case "diagonal":
				return {
					backgroundImage: `repeating-linear-gradient(45deg, ${colorWithOpacity}, ${colorWithOpacity} 1px, transparent 1px, transparent 10px)`,
				};
			case "chevron":
				return {
					backgroundImage: `
            linear-gradient(135deg, ${colorWithOpacity} 25%, transparent 25%),
            linear-gradient(225deg, ${colorWithOpacity} 25%, transparent 25%)
          `,
					backgroundSize: "20px 20px",
				};
			default:
				return {
					backgroundColor: opacity > 0 ? colorWithOpacity : "transparent",
				};
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Palette className="h-4 w-4 text-primary" />
					<h3 className="text-sm font-medium">Sistema de texturas</h3>
				</div>
				<Switch
					checked={textureSystem.enabled}
					onCheckedChange={handleEnabledChange}
				/>
			</div>

			<div
				className={
					textureSystem.enabled
						? "opacity-100"
						: "opacity-50 pointer-events-none"
				}
			>
				<div className="flex justify-between mb-2">
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							className="text-xs h-7"
							onClick={handleAddTexture}
						>
							<Plus className="h-3.5 w-3.5 mr-1" /> Agregar
						</Button>

						<Button
							variant="outline"
							size="sm"
							className="text-xs h-7"
							onClick={handleAddPresets}
						>
							<Palette className="h-3.5 w-3.5 mr-1" /> Presets
						</Button>
					</div>

					<Button
						variant="default"
						size="sm"
						className="text-xs h-7"
						onClick={handleSaveTextureSystem}
						disabled={isSaving}
					>
						<Save className="h-3.5 w-3.5 mr-1" />{" "}
						{isSaving ? "Guardando..." : "Guardar"}
					</Button>
				</div>

				<div className="bg-card border rounded-md">
					{textureSystem.textures.length === 0 ? (
						<div className="p-8 text-center text-muted-foreground">
							<AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
							<p className="text-sm">No hay texturas definidas</p>
							<p className="text-xs mt-1">
								Agrega texturas o usa los presets predefinidos
							</p>
						</div>
					) : (
						<ScrollArea className="h-64">
							<div className="divide-y">
								{textureSystem.textures.map((texture) => (
									<div
										key={texture.id}
										className="p-2 flex items-center justify-between gap-2"
									>
										<div className="flex items-center gap-2 flex-1">
											<div
												className="w-6 h-6 rounded border"
												style={getPatternStyle(
													texture.patternType,
													texture.color,
													texture.opacity
												)}
											/>
											<span className="text-sm">{texture.name}</span>
										</div>

										<div className="flex gap-1 items-center">
											<Button
												variant="ghost"
												size="icon"
												className="h-6 w-6"
												onClick={() => handleEditTexture(texture)}
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
															Eliminar textura
														</AlertDialogTitle>
														<AlertDialogDescription>
															¿Estás seguro de que deseas eliminar esta textura?
															Esta acción no se puede deshacer.
														</AlertDialogDescription>
													</AlertDialogHeader>
													<AlertDialogFooter>
														<AlertDialogCancel>Cancelar</AlertDialogCancel>
														<AlertDialogAction
															onClick={() => handleDeleteTexture(texture.id)}
														>
															Eliminar
														</AlertDialogAction>
													</AlertDialogFooter>
												</AlertDialogContent>
											</AlertDialog>
										</div>
									</div>
								))}
							</div>
						</ScrollArea>
					)}
				</div>

				<div className="mt-2 text-xs text-muted-foreground">
					<p className="italic">
						Las texturas pueden aplicarse a las entidades para darles un aspecto
						único.
					</p>
				</div>
			</div>

			{/* Diálogo de edición de textura */}
			<Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Editar textura</DialogTitle>
						<DialogDescription>
							Personaliza los detalles de la textura.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="name">Nombre</Label>
							<Input
								id="name"
								value={currentTexture?.name || ""}
								onChange={(e) =>
									setCurrentTexture((prev) =>
										prev ? { ...prev, name: e.target.value } : null
									)
								}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="patternType">Tipo de patrón</Label>
							<Select
								value={currentTexture?.patternType || "none"}
								onValueChange={(value: string) =>
									setCurrentTexture((prev) =>
										prev
											? {
													...prev,
													patternType: value === "none" ? undefined : value,
												}
											: null
									)
								}
							>
								<SelectTrigger id="patternType" className="w-full">
									<SelectValue placeholder="Seleccionar patrón" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">Ninguno</SelectItem>
									<SelectItem value="dots">Puntos</SelectItem>
									<SelectItem value="lines">Líneas</SelectItem>
									<SelectItem value="grid">Cuadrícula</SelectItem>
									<SelectItem value="waves">Ondas</SelectItem>
									<SelectItem value="noise">Ruido</SelectItem>
									<SelectItem value="circles">Círculos</SelectItem>
									<SelectItem value="squares">Cuadrados</SelectItem>
									<SelectItem value="diagonal">Diagonal</SelectItem>
									<SelectItem value="chevron">Chevron</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="color">Color</Label>
							<div className="flex gap-2">
								<div
									className="w-8 h-8 rounded border"
									style={{ backgroundColor: currentTexture?.color }}
								/>
								<Input
									id="color"
									value={currentTexture?.color || ""}
									onChange={(e) =>
										setCurrentTexture((prev) =>
											prev ? { ...prev, color: e.target.value } : null
										)
									}
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="opacity">
								Opacidad: {Math.round((currentTexture?.opacity || 0) * 100)}%
							</Label>
							<Slider
								id="opacity"
								min={0}
								max={1}
								step={0.01}
								value={[currentTexture?.opacity || 0]}
								onValueChange={(value) =>
									setCurrentTexture((prev) =>
										prev ? { ...prev, opacity: value[0] } : null
									)
								}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="imageUrl">URL de imagen (opcional)</Label>
							<div className="flex gap-2">
								<Input
									id="imageUrl"
									value={currentTexture?.imageUrl || ""}
									onChange={(e) =>
										setCurrentTexture((prev) =>
											prev ? { ...prev, imageUrl: e.target.value } : null
										)
									}
									placeholder="https://ejemplo.com/textura.png"
								/>
								<Button variant="outline" size="icon" className="shrink-0">
									<ImagePlus className="h-4 w-4" />
								</Button>
							</div>
							<p className="text-xs text-muted-foreground">
								Las imágenes deben ser patrones que se puedan repetir
								(tileables)
							</p>
						</div>

						<div className="space-y-2">
							<Label htmlFor="description">Descripción (opcional)</Label>
							<Input
								id="description"
								value={currentTexture?.description || ""}
								onChange={(e) =>
									setCurrentTexture((prev) =>
										prev ? { ...prev, description: e.target.value } : null
									)
								}
								placeholder="Descripción corta de esta textura"
							/>
						</div>

						<div className="mt-4 p-2 border rounded-md">
							<p className="text-xs font-medium mb-2">Vista previa:</p>
							<div
								className="w-full h-20 rounded-md border"
								style={
									currentTexture
										? getPatternStyle(
												currentTexture.patternType,
												currentTexture.color,
												currentTexture.opacity
											)
										: {}
								}
							/>
						</div>
					</div>

					<DialogFooter>
						<Button variant="outline" onClick={() => setEditDialogOpen(false)}>
							Cancelar
						</Button>
						<Button onClick={handleSaveTexture}>Guardar</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
