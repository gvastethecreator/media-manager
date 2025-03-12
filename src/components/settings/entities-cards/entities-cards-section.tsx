"use client";

import {
	getEntityCardConfig,
	saveEntityCardConfig,
} from "@/app/actions/entities-cards/entities-cards.actions";
// Importación separada para tipos
import type {
	CardOptions,
	RaritySystem,
	TextureSystem,
} from "@/app/actions/entities-cards/entities-cards.actions";
import { BaseCard } from "@/components/features/entity-cards/base/base-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toastService } from "@/lib/services/toast.service";
import {
	BadgeCheck,
	Box,
	Circle,
	Grid2X2,
	Info,
	Layers,
	PaintBucket,
	Palette,
	RotateCcw,
	Save,
	Settings,
	Settings2,
	Sliders,
	Sparkles,
} from "lucide-react";
import type * as React from "react";
import { useCallback, useEffect, useState } from "react";
import { EntityCardPreview } from "./entity-card-preview";
import { RarityManager } from "./rarity-manager";
import { TextureManager } from "./texture-manager";

// Tipo para entidades disponibles
interface Entity {
	id: string;
	name: string;
	icon: React.ReactNode;
}

// Tipo para las pestañas
type TabValue = "effects" | "rarity" | "texture";

// Funciones para conversión de colores
const hexToRgb = (hex: string) => {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result
		? {
				r: Number.parseInt(result[1], 16),
				g: Number.parseInt(result[2], 16),
				b: Number.parseInt(result[3], 16),
			}
		: null;
};

const rgbToHex = (rgb: string) => {
	if (!rgb) return "#000000";
	const [r, g, b] = rgb.split(",").map((x) => Number.parseInt(x.trim(), 10));
	if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return "#000000";
	return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

export function EntitiesCardsSection() {
	// Lista de entidades disponibles
	const entities: Entity[] = [
		{ id: "album", name: "Álbumes", icon: <Grid2X2 className="h-4 w-4" /> },
		{ id: "tag", name: "Etiquetas", icon: <Box className="h-4 w-4" /> },
		{
			id: "collection",
			name: "Colecciones",
			icon: <Grid2X2 className="h-4 w-4" />,
		},
		{ id: "character", name: "Personajes", icon: <Box className="h-4 w-4" /> },
		{ id: "place", name: "Lugares", icon: <Box className="h-4 w-4" /> },
		{ id: "worldItem", name: "Objetos", icon: <Box className="h-4 w-4" /> },
		{ id: "concept", name: "Conceptos", icon: <Box className="h-4 w-4" /> },
		{ id: "prompt", name: "Prompts", icon: <Box className="h-4 w-4" /> },
		{ id: "note", name: "Notas", icon: <Box className="h-4 w-4" /> },
	];

	// Estado para la entidad seleccionada
	const [selectedEntity, setSelectedEntity] = useState(entities[0].id);

	// Estado para la tab activa
	const [activeTab, setActiveTab] = useState("effects");

	// Estado para la configuración de tarjeta
	const [cardConfig, setCardConfig] = useState<CardOptions>({
		enable3DEffect: true,
		enableHolographicEffect: true,
		enableScanlines: true,
		enableLightHalo: true,
		enableAnimatedBorder: true,
		enableGlowEffect: true,
		enableGrainEffect: true,
		hoverLiftHeight: 10,
		maxRotation: 15,
		primaryColor: "#3b82f6",
		secondaryColor: "#8b5cf6",
		raritySystem: false,
		categorySystem: true,
		textureSystem: false,
	});

	// Estado para guardar el sistema de rarezas y texturas
	const [raritySystem, setRaritySystem] = useState<RaritySystem | null>(null);
	const [textureSystem, setTextureSystem] = useState<TextureSystem | null>(
		null
	);

	// Estado para indicar si está cargando
	const [isSaving, setIsSaving] = useState(false);

	// Función para cargar la configuración de tarjetas
	const loadCardConfiguration = useCallback(async (entityType: string) => {
		try {
			// Cargar configuración desde el servidor
			const response = await getEntityCardConfig(entityType);

			if (response.success && response.data) {
				setCardConfig(response.data as CardOptions);
			} else {
				toastService.error(response.message);
			}
		} catch (error) {
			console.error("Error al cargar la configuración de tarjetas:", error);
			toastService.error("No se pudo cargar la configuración de tarjetas");
		}
	}, []);

	// Efecto para cargar la configuración al cambiar de entidad
	useEffect(() => {
		loadCardConfiguration(selectedEntity);
	}, [selectedEntity, loadCardConfiguration]);

	// Manejador para guardar la configuración
	const handleSaveConfig = async () => {
		try {
			setIsSaving(true);

			// Guardar configuración en el servidor
			const response = await saveEntityCardConfig(selectedEntity, cardConfig);

			if (response.success) {
				toastService.success(response.message);

				// Si hay sistemas de rareza o textura activos, mostrar mensaje adicional
				if (raritySystem && cardConfig.raritySystem) {
					toastService.info(
						"Recuerda configurar el sistema de rarezas en la pestaña correspondiente"
					);
				}

				if (textureSystem && cardConfig.textureSystem) {
					toastService.info(
						"Recuerda configurar el sistema de texturas en la pestaña correspondiente"
					);
				}
			} else {
				toastService.error(response.message);
			}
		} catch (error) {
			console.error("Error al guardar la configuración:", error);
			toastService.error("No se pudo guardar la configuración");
		} finally {
			setIsSaving(false);
		}
	};

	// Manejador para cambios en la configuración
	const handleConfigChange = (key: keyof CardOptions, value: unknown) => {
		setCardConfig((prev) => ({
			...prev,
			[key]: value,
		}));
	};

	// Manejador para cambios en el sistema de rarezas
	const handleRaritySystemChange = (newRaritySystem: RaritySystem) => {
		setRaritySystem(newRaritySystem);
		setCardConfig((prev) => ({
			...prev,
			raritySystem: newRaritySystem.enabled,
		}));
	};

	// Manejador para cambios en el sistema de texturas
	const handleTextureSystemChange = (newTextureSystem: TextureSystem) => {
		setTextureSystem(newTextureSystem);
		setCardConfig((prev) => ({
			...prev,
			textureSystem: newTextureSystem.enabled,
		}));
	};

	// Manejador para resetear la configuración a valores predeterminados
	const handleResetConfig = () => {
		const defaultConfig: CardOptions = {
			enable3DEffect: true,
			enableHolographicEffect: true,
			enableScanlines: true,
			enableLightHalo: true,
			enableAnimatedBorder: true,
			enableGlowEffect: true,
			enableGrainEffect: true,
			hoverLiftHeight: 10,
			maxRotation: 15,
			primaryColor: "#3b82f6",
			secondaryColor: "#8b5cf6",
			raritySystem: false,
			categorySystem: true,
			textureSystem: false,
		};

		setCardConfig(defaultConfig);
		toastService.info("Configuración restablecida a valores predeterminados");
	};

	return (
		<Card className="flex flex-col gap-2 bg-muted/30 rounded-lg shadow-sm border-muted/60">
			<CardHeader className="p-4 pb-0 bg-transparent">
				<CardTitle className="text-lg text-foreground font-semibold flex items-center justify-between">
					<span className="flex items-center gap-2">
						<Layers className="h-5 w-5 text-primary" />
						Configuración de Tarjetas de Entidades
					</span>

					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={handleResetConfig}
							className="gap-1 h-8"
						>
							<RotateCcw className="h-3.5 w-3.5" />
							<span className="text-xs">Restaurar</span>
						</Button>

						<Button
							variant="default"
							size="sm"
							className="gap-1.5 h-8"
							onClick={handleSaveConfig}
							disabled={isSaving}
						>
							<Save className={`h-4 w-4 ${isSaving ? "animate-spin" : ""}`} />
							<span className="text-xs">
								{isSaving ? "Guardando..." : "Guardar"}
							</span>
						</Button>
					</div>
				</CardTitle>
			</CardHeader>

			<Separator className="my-2" />

			<CardContent className="p-4 pt-2">
				<div className="space-y-4">
					{/* Selector de entidad y colores principales */}
					<div className="flex flex-col md:flex-row gap-4 bg-background/50 p-3 rounded-lg border border-border/50">
						<div className="w-full md:w-2/5">
							<Label className="text-sm mb-1.5 block text-muted-foreground font-medium">
								Entidad a Configurar
							</Label>
							<Select value={selectedEntity} onValueChange={setSelectedEntity}>
								<SelectTrigger className="h-9">
									<SelectValue placeholder="Seleccionar entidad" />
								</SelectTrigger>
								<SelectContent>
									{entities.map((entity) => (
										<SelectItem
											key={entity.id}
											value={entity.id}
											className="text-sm"
										>
											<div className="flex items-center gap-2">
												{entity.icon}
												<span>{entity.name}</span>
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="w-full md:w-3/5 grid grid-cols-1 sm:grid-cols-2 gap-3">
							<div>
								<Label className="text-sm mb-1.5 block text-muted-foreground font-medium">
									Color Primario
								</Label>
								<div className="flex items-center gap-2">
									<div className="flex-shrink-0">
										<input
											type="color"
											value={cardConfig.primaryColor}
											onChange={(e) => {
												const color = e.target.value;
												// Convertir HEX a RGB para el formato que espera la configuración
												const rgbColor = hexToRgb(color);
												if (rgbColor) {
													handleConfigChange(
														"primaryColor",
														`${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}`
													);
												}
											}}
											className="block h-9 w-9 rounded-md overflow-hidden cursor-pointer border border-input"
										/>
									</div>
									<Input
										value={rgbToHex(cardConfig.primaryColor) || "#3b82f6"}
										onChange={(e) => {
											const color = e.target.value;
											const rgbColor = hexToRgb(color);
											if (rgbColor) {
												handleConfigChange(
													"primaryColor",
													`${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}`
												);
											}
										}}
										className="h-9"
									/>
								</div>
							</div>

							<div>
								<Label className="text-sm mb-1.5 block text-muted-foreground font-medium">
									Color Secundario
								</Label>
								<div className="flex items-center gap-2">
									<div className="flex-shrink-0">
										<input
											type="color"
											value={cardConfig.secondaryColor}
											onChange={(e) => {
												const color = e.target.value;
												// Convertir HEX a RGB para el formato que espera la configuración
												const rgbColor = hexToRgb(color);
												if (rgbColor) {
													handleConfigChange(
														"secondaryColor",
														`${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}`
													);
												}
											}}
											className="block h-9 w-9 rounded-md overflow-hidden cursor-pointer border border-input"
										/>
									</div>
									<Input
										value={rgbToHex(cardConfig.secondaryColor) || "#8b5cf6"}
										onChange={(e) => {
											const color = e.target.value;
											const rgbColor = hexToRgb(color);
											if (rgbColor) {
												handleConfigChange(
													"secondaryColor",
													`${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}`
												);
											}
										}}
										className="h-9"
									/>
								</div>
							</div>
						</div>
					</div>

					<div className="flex flex-col lg:flex-row gap-6">
						{/* Columna principal de configuración */}
						<div className="w-full lg:w-2/3">
							<Tabs defaultValue="visualEffects" className="w-full">
								<TabsList className="w-full grid grid-cols-4 mb-4">
									<TabsTrigger value="visualEffects" className="text-sm">
										<span className="flex items-center gap-1.5">
											<Sparkles className="h-4 w-4" />
											<span className="hidden sm:inline">Efectos</span> Visuales
										</span>
									</TabsTrigger>
									<TabsTrigger value="options3d" className="text-sm">
										<span className="flex items-center gap-1.5">
											<Box className="h-4 w-4" />
											Efectos <span className="hidden sm:inline">3D</span>
										</span>
									</TabsTrigger>
									<TabsTrigger value="layers" className="text-sm">
										<span className="flex items-center gap-1.5">
											<Layers className="h-4 w-4" />
											<span className="hidden sm:inline">Opciones</span> Capas
										</span>
									</TabsTrigger>
									<TabsTrigger value="systems" className="text-sm">
										<span className="flex items-center gap-1.5">
											<BadgeCheck className="h-4 w-4" />
											Sistemas
										</span>
									</TabsTrigger>
								</TabsList>

								{/* Pestaña para efectos visuales */}
								<TabsContent value="visualEffects" className="space-y-6">
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										<div className="p-4 bg-background/50 rounded-lg border border-border/50">
											<h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-4">
												<Sparkles className="h-4 w-4 text-primary" />
												Efectos Visuales Generales
											</h3>
											<div className="grid grid-cols-1 gap-3">
												<div className="flex items-center justify-between space-x-3">
													<Label
														htmlFor="enableHolographicEffect"
														className="text-sm flex items-center cursor-pointer"
													>
														Efecto Holográfico
													</Label>
													<Switch
														id="enableHolographicEffect"
														checked={cardConfig.enableHolographicEffect}
														onCheckedChange={(checked) =>
															handleConfigChange(
																"enableHolographicEffect",
																checked
															)
														}
													/>
												</div>

												<div className="flex items-center justify-between space-x-3">
													<Label
														htmlFor="enableScanlines"
														className="text-sm flex items-center cursor-pointer"
													>
														Líneas de Escaneo
													</Label>
													<Switch
														id="enableScanlines"
														checked={cardConfig.enableScanlines}
														onCheckedChange={(checked) =>
															handleConfigChange("enableScanlines", checked)
														}
													/>
												</div>

												<div className="flex items-center justify-between space-x-3">
													<Label
														htmlFor="enableLightHalo"
														className="text-sm flex items-center cursor-pointer"
													>
														Halo de Luz
													</Label>
													<Switch
														id="enableLightHalo"
														checked={cardConfig.enableLightHalo}
														onCheckedChange={(checked) =>
															handleConfigChange("enableLightHalo", checked)
														}
													/>
												</div>

												<div className="flex items-center justify-between space-x-3">
													<Label
														htmlFor="enableAnimatedBorder"
														className="text-sm flex items-center cursor-pointer"
													>
														Borde Animado
													</Label>
													<Switch
														id="enableAnimatedBorder"
														checked={cardConfig.enableAnimatedBorder}
														onCheckedChange={(checked) =>
															handleConfigChange(
																"enableAnimatedBorder",
																checked
															)
														}
													/>
												</div>

												<div className="flex items-center justify-between space-x-3">
													<Label
														htmlFor="enableGlowEffect"
														className="text-sm flex items-center cursor-pointer"
													>
														Efecto de Brillo
													</Label>
													<Switch
														id="enableGlowEffect"
														checked={cardConfig.enableGlowEffect}
														onCheckedChange={(checked) =>
															handleConfigChange("enableGlowEffect", checked)
														}
													/>
												</div>

												<div className="flex items-center justify-between space-x-3">
													<Label
														htmlFor="enableGrainEffect"
														className="text-sm flex items-center cursor-pointer"
													>
														Efecto de Grano
													</Label>
													<Switch
														id="enableGrainEffect"
														checked={cardConfig.enableGrainEffect}
														onCheckedChange={(checked) =>
															handleConfigChange("enableGrainEffect", checked)
														}
													/>
												</div>
											</div>
										</div>

										<div className="p-4 bg-background/50 rounded-lg border border-border/50">
											<h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-4">
												<Settings2 className="h-4 w-4 text-primary" />
												Sistemas Adicionales
											</h3>
											<div className="grid grid-cols-1 gap-3">
												<div className="flex items-center justify-between space-x-3">
													<Label
														htmlFor="raritySystem"
														className="text-sm flex items-center cursor-pointer"
													>
														Sistema de Rarezas
													</Label>
													<Switch
														id="raritySystem"
														checked={cardConfig.raritySystem}
														onCheckedChange={(checked) => {
															handleConfigChange("raritySystem", checked);
															if (checked) {
																setActiveTab("rarity");
															}
														}}
													/>
												</div>

												<div className="flex items-center justify-between space-x-3">
													<Label
														htmlFor="textureSystem"
														className="text-sm flex items-center cursor-pointer"
													>
														Sistema de Texturas
													</Label>
													<Switch
														id="textureSystem"
														checked={cardConfig.textureSystem}
														onCheckedChange={(checked) => {
															handleConfigChange("textureSystem", checked);
															if (checked) {
																setActiveTab("texture");
															}
														}}
													/>
												</div>

												<div className="flex items-center justify-between space-x-3">
													<Label
														htmlFor="categorySystem"
														className="text-sm flex items-center cursor-pointer"
													>
														Sistema de Categorías
													</Label>
													<Switch
														id="categorySystem"
														checked={cardConfig.categorySystem}
														onCheckedChange={(checked) =>
															handleConfigChange("categorySystem", checked)
														}
													/>
												</div>
											</div>
										</div>
									</div>
								</TabsContent>

								{/* Pestaña para efectos 3D */}
								<TabsContent value="options3d" className="space-y-4">
									<div className="p-4 bg-background/50 rounded-lg border border-border/50">
										<h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-4">
											<Box className="h-4 w-4 text-primary" />
											Configuración de Efectos 3D
										</h3>

										<div className="space-y-4">
											<div className="flex items-center justify-between space-x-3 mb-3">
												<Label
													htmlFor="enable3DEffect"
													className="text-sm flex items-center cursor-pointer"
												>
													Efecto 3D
												</Label>
												<Switch
													id="enable3DEffect"
													checked={cardConfig.enable3DEffect}
													onCheckedChange={(checked) =>
														handleConfigChange("enable3DEffect", checked)
													}
												/>
											</div>

											<div className="space-y-5">
												<div className="space-y-2">
													<div className="flex items-center justify-between">
														<Label htmlFor="maxRotation" className="text-sm">
															Rotación Máxima
														</Label>
														<span className="text-xs font-mono text-muted-foreground">
															{cardConfig.maxRotation}°
														</span>
													</div>
													<Slider
														id="maxRotation"
														min={5}
														max={25}
														step={1}
														value={[cardConfig.maxRotation]}
														onValueChange={(value) =>
															handleConfigChange("maxRotation", value[0])
														}
													/>
												</div>

												<div className="space-y-2">
													<div className="flex items-center justify-between">
														<Label
															htmlFor="hoverLiftHeight"
															className="text-sm"
														>
															Altura de Elevación
														</Label>
														<span className="text-xs font-mono text-muted-foreground">
															{cardConfig.hoverLiftHeight}px
														</span>
													</div>
													<Slider
														id="hoverLiftHeight"
														min={0}
														max={30}
														step={1}
														value={[cardConfig.hoverLiftHeight]}
														onValueChange={(value) =>
															handleConfigChange("hoverLiftHeight", value[0])
														}
													/>
												</div>
											</div>
										</div>
									</div>
								</TabsContent>

								{/* Pestaña para opciones de capas */}
								<TabsContent value="layers" className="space-y-4">
									<div className="bg-background/50 rounded-lg border border-border/50">
										<Tabs defaultValue="holographic" className="w-full">
											<div className="p-4 pb-0">
												<h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-4">
													<Layers className="h-4 w-4 text-primary" />
													Opciones Avanzadas por Capa
												</h3>

												<TabsList className="w-full grid grid-cols-5 h-9 bg-muted/70 p-1">
													<TabsTrigger
														value="holographic"
														className="text-xs py-1 rounded-md"
													>
														Holográfico
													</TabsTrigger>
													<TabsTrigger
														value="scanlines"
														className="text-xs py-1 rounded-md"
													>
														Escaneo
													</TabsTrigger>
													<TabsTrigger
														value="glow"
														className="text-xs py-1 rounded-md"
													>
														Brillo
													</TabsTrigger>
													<TabsTrigger
														value="border"
														className="text-xs py-1 rounded-md"
													>
														Borde
													</TabsTrigger>
													<TabsTrigger
														value="grain"
														className="text-xs py-1 rounded-md"
													>
														Grano
													</TabsTrigger>
												</TabsList>
											</div>

											{/* Opciones para efecto holográfico */}
											<TabsContent value="holographic" className="p-4 pt-3">
												<div className="bg-background/50 p-3 rounded-lg border border-border/50 space-y-3">
													<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
														<div className="space-y-1.5">
															<Label className="text-xs">Tipo de patrón</Label>
															<Select
																value={
																	cardConfig.holographicOptions?.patternType ||
																	"rainbow"
																}
																onValueChange={(value) => {
																	const options = {
																		...cardConfig.holographicOptions,
																		patternType: value,
																	};
																	handleConfigChange(
																		"holographicOptions",
																		options
																	);
																}}
															>
																<SelectTrigger className="h-8 text-xs">
																	<SelectValue placeholder="Seleccionar patrón" />
																</SelectTrigger>
																<SelectContent>
																	<SelectItem value="rainbow">
																		Arcoiris
																	</SelectItem>
																	<SelectItem value="linear">Lineal</SelectItem>
																	<SelectItem value="radial">Radial</SelectItem>
																	<SelectItem value="diagonal">
																		Diagonal
																	</SelectItem>
																</SelectContent>
															</Select>
														</div>

														<div className="space-y-1.5">
															<Label className="text-xs">Intensidad</Label>
															<div className="flex gap-2 items-center">
																<Slider
																	value={[
																		cardConfig.holographicOptions?.intensity ||
																			1,
																	]}
																	min={0.1}
																	max={2}
																	step={0.1}
																	className="flex-1"
																	onValueChange={(value) => {
																		const options = {
																			...cardConfig.holographicOptions,
																			intensity: value[0],
																		};
																		handleConfigChange(
																			"holographicOptions",
																			options
																		);
																	}}
																/>
																<span className="text-xs min-w-[30px] text-right">
																	{cardConfig.holographicOptions?.intensity ||
																		1}
																</span>
															</div>
														</div>

														<div className="space-y-1.5">
															<Label className="text-xs">
																Velocidad de animación
															</Label>
															<div className="flex gap-2 items-center">
																<Slider
																	value={[
																		cardConfig.holographicOptions
																			?.animationSpeed || 1,
																	]}
																	min={0.1}
																	max={3}
																	step={0.1}
																	className="flex-1"
																	onValueChange={(value) => {
																		const options = {
																			...cardConfig.holographicOptions,
																			animationSpeed: value[0],
																		};
																		handleConfigChange(
																			"holographicOptions",
																			options
																		);
																	}}
																/>
																<span className="text-xs min-w-[30px] text-right">
																	{cardConfig.holographicOptions
																		?.animationSpeed || 1}
																</span>
															</div>
														</div>

														<div className="flex items-center justify-between space-x-3">
															<Label
																htmlFor="visibleOnHoverHolo"
																className="text-xs flex items-center cursor-pointer"
															>
																Visible solo en hover
															</Label>
															<Switch
																id="visibleOnHoverHolo"
																checked={
																	cardConfig.holographicOptions
																		?.visibleOnHover ?? true
																}
																onCheckedChange={(checked) => {
																	const options = {
																		...cardConfig.holographicOptions,
																		visibleOnHover: checked,
																	};
																	handleConfigChange(
																		"holographicOptions",
																		options
																	);
																}}
															/>
														</div>
													</div>
												</div>
											</TabsContent>

											{/* Resto de las opciones de capas... (mantener igual) */}
										</Tabs>
									</div>
								</TabsContent>

								{/* Pestaña para sistemas */}
								<TabsContent value="systems" className="space-y-4">
									<Tabs
										defaultValue={activeTab || "rarity"}
										onValueChange={(value) => setActiveTab(value as TabValue)}
									>
										<TabsList className="w-full grid grid-cols-2 mb-4">
											<TabsTrigger value="rarity" className="text-sm">
												<span className="flex items-center gap-1.5">
													<BadgeCheck className="h-4 w-4" />
													Sistema de Rarezas
												</span>
											</TabsTrigger>
											<TabsTrigger value="texture" className="text-sm">
												<span className="flex items-center gap-1.5">
													<PaintBucket className="h-4 w-4" />
													Sistema de Texturas
												</span>
											</TabsTrigger>
										</TabsList>

										{/* Contenido para Sistema de Rarezas y Texturas (mantener el mismo) */}
									</Tabs>
								</TabsContent>
							</Tabs>
						</div>

						{/* Panel de vista previa (fijo en posición a la derecha) */}
						<div className="w-full lg:w-1/3 lg:sticky lg:top-4 self-start">
							<div className="bg-background/20 p-4 rounded-lg border border-border/50 shadow-inner">
								<h3 className="text-base font-medium mb-4 text-center flex items-center gap-2 justify-center text-muted-foreground">
									<Grid2X2 className="h-4 w-4" />
									Vista Previa
								</h3>

								<div className="w-full mx-auto">
									<EntityCardPreview
										entityType={selectedEntity}
										entityName={
											entities.find((e) => e.id === selectedEntity)?.name ||
											"Entidad"
										}
										cardOptions={cardConfig}
										showVisualConfig={true}
										onVisualConfigClick={() => {}}
									/>
								</div>

								<div className="mt-4 px-3 py-2 bg-muted/30 rounded-lg border border-border/50 text-sm text-muted-foreground">
									<p className="text-xs mb-2 font-medium text-center">
										Interacción
									</p>
									<ul className="text-xs space-y-1.5">
										<li className="flex items-center gap-1">
											<Circle className="h-1.5 w-1.5 text-primary" />
											<span>
												Pasa el cursor sobre la tarjeta para ver los efectos 3D
											</span>
										</li>
										<li className="flex items-center gap-1">
											<Circle className="h-1.5 w-1.5 text-primary" />
											<span>
												Las tarjetas se pueden personalizar con diferentes
												rarezas y texturas
											</span>
										</li>
									</ul>
								</div>
							</div>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
