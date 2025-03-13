"use client";

import type {
	BorderOptions,
	GlowEffectOptions,
	GrainEffectOptions,
	HolographicEffectOptions,
	ScanlinesOptions,
} from "@/components/features/entity-cards/base/base-card-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils/utils";
import {
	Braces,
	Fingerprint,
	FlameKindling,
	GanttChartSquare,
	Brain as GrainIcon,
	Lightbulb,
	MousePointerClick,
	Palette,
	Sparkles,
	Waves,
	ZoomIn,
} from "lucide-react";
import * as React from "react";

interface VisualEffectsManagerProps {
	holographicOptions?: HolographicEffectOptions;
	scanlinesOptions?: ScanlinesOptions;
	glowOptions?: GlowEffectOptions;
	borderOptions?: BorderOptions;
	grainOptions?: GrainEffectOptions;
	onHolographicOptionsChange?: (options: HolographicEffectOptions) => void;
	onScanlinesOptionsChange?: (options: ScanlinesOptions) => void;
	onGlowOptionsChange?: (options: GlowEffectOptions) => void;
	onBorderOptionsChange?: (options: BorderOptions) => void;
	onGrainOptionsChange?: (options: GrainEffectOptions) => void;
}

// Definición de esquemas de colores para cada tipo de efecto
const effectColors = {
	holographic: {
		bg: "bg-indigo-500/5",
		border: "border-indigo-500/20",
		text: "text-indigo-600",
		highlight: "bg-indigo-500/10",
	},
	scanlines: {
		bg: "bg-purple-500/5",
		border: "border-purple-500/20",
		text: "text-purple-600",
		highlight: "bg-purple-500/10",
	},
	glow: {
		bg: "bg-cyan-500/5",
		border: "border-cyan-500/20",
		text: "text-cyan-600",
		highlight: "bg-cyan-500/10",
	},
	border: {
		bg: "bg-emerald-500/5",
		border: "border-emerald-500/20",
		text: "text-emerald-600",
		highlight: "bg-emerald-500/10",
	},
	grain: {
		bg: "bg-amber-500/5",
		border: "border-amber-500/20",
		text: "text-amber-600",
		highlight: "bg-amber-500/10",
	},
};

export function VisualEffectsManager({
	holographicOptions = {},
	scanlinesOptions = {},
	glowOptions = {},
	borderOptions = {
		width: 2,
		pattern: "solid",
		animationType: "none",
		animation: {
			type: "none",
			duration: 3000,
			timing: "linear",
			iteration: "infinite",
		},
	},
	grainOptions = {},
	onHolographicOptionsChange,
	onScanlinesOptionsChange,
	onGlowOptionsChange,
	onBorderOptionsChange,
	onGrainOptionsChange,
}: VisualEffectsManagerProps) {
	// Estado local para cada tipo de efecto
	const [localHolographicOptions, setLocalHolographicOptions] =
		React.useState<HolographicEffectOptions>(holographicOptions);
	const [localScanlinesOptions, setLocalScanlinesOptions] =
		React.useState<ScanlinesOptions>(scanlinesOptions);
	const [localGlowOptions, setLocalGlowOptions] =
		React.useState<GlowEffectOptions>(glowOptions);
	const [localBorderOptions, setLocalBorderOptions] =
		React.useState<BorderOptions>(borderOptions);
	const [localGrainOptions, setLocalGrainOptions] =
		React.useState<GrainEffectOptions>(grainOptions);

	// Funciones para actualizar opciones
	const updateHolographicOption = <K extends keyof HolographicEffectOptions>(
		key: K,
		value: HolographicEffectOptions[K]
	) => {
		setLocalHolographicOptions((prev) => {
			const updated = { ...prev, [key]: value };
			onHolographicOptionsChange?.(updated);
			return updated;
		});
	};

	const updateScanlinesOption = <K extends keyof ScanlinesOptions>(
		key: K,
		value: ScanlinesOptions[K]
	) => {
		setLocalScanlinesOptions((prev) => {
			const updated = { ...prev, [key]: value };
			onScanlinesOptionsChange?.(updated);
			return updated;
		});
	};

	const updateGlowOption = <K extends keyof GlowEffectOptions>(
		key: K,
		value: GlowEffectOptions[K]
	) => {
		setLocalGlowOptions((prev) => {
			const updated = { ...prev, [key]: value };
			onGlowOptionsChange?.(updated);
			return updated;
		});
	};

	const updateBorderOption = <K extends keyof BorderOptions>(
		key: K,
		value: BorderOptions[K]
	) => {
		setLocalBorderOptions((prev) => {
			const updated = { ...prev, [key]: value };
			onBorderOptionsChange?.(updated);
			return updated;
		});
	};

	const updateGrainOption = <K extends keyof GrainEffectOptions>(
		key: K,
		value: GrainEffectOptions[K]
	) => {
		setLocalGrainOptions((prev) => {
			const updated = { ...prev, [key]: value };
			onGrainOptionsChange?.(updated);
			return updated;
		});
	};

	return (
		<div className="w-full space-y-3">
			<Tabs defaultValue="holographic" className="w-full">
				<TabsList className="flex flex-wrap w-full h-8 gap-1 p-0.5">
					<TabsTrigger
						value="holographic"
						className="text-[10px] h-full flex items-center gap-1"
					>
						<Waves className="h-3 w-3" />
						Holográfico
					</TabsTrigger>
					<TabsTrigger
						value="scanlines"
						className="text-[10px] h-full flex items-center gap-1"
					>
						<GanttChartSquare className="h-3 w-3" />
						Líneas
					</TabsTrigger>
					<TabsTrigger
						value="glow"
						className="text-[10px] h-full flex items-center gap-1"
					>
						<FlameKindling className="h-3 w-3" />
						Resplandor
					</TabsTrigger>
					<TabsTrigger
						value="border"
						className="text-[10px] h-full flex items-center gap-1"
					>
						<Braces className="h-3 w-3" />
						Borde
					</TabsTrigger>
					<TabsTrigger
						value="grain"
						className="text-[10px] h-full flex items-center gap-1"
					>
						<GrainIcon className="h-3 w-3" />
						Grano
					</TabsTrigger>
				</TabsList>

				{/* Configuración de efecto holográfico */}
				<TabsContent value="holographic" className="space-y-3 mt-2">
					<div
						className={cn(
							"border rounded-md p-2.5 space-y-2.5",
							effectColors.holographic.border,
							effectColors.holographic.bg
						)}
					>
						<div className="grid grid-cols-2 gap-2">
							<div className="space-y-1.5">
								<Label
									htmlFor="holographic-pattern"
									className="text-[11px] flex items-center gap-1.5"
								>
									<Waves
										className={cn("h-3 w-3", effectColors.holographic.text)}
									/>
									Tipo de Patrón
								</Label>
								<Select
									value={localHolographicOptions.patternType || "rainbow"}
									onValueChange={(value) =>
										updateHolographicOption(
											"patternType",
											value as HolographicEffectOptions["patternType"]
										)
									}
								>
									<SelectTrigger className="h-7 text-xs">
										<SelectValue placeholder="Selecciona un patrón" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="rainbow">Arcoíris</SelectItem>
										<SelectItem value="linear">Lineal</SelectItem>
										<SelectItem value="radial">Radial</SelectItem>
										<SelectItem value="diagonal">Diagonal</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-1.5">
								<div className="flex items-center justify-between">
									<Label
										htmlFor="holographic-intensity"
										className="text-[11px]"
									>
										Intensidad
									</Label>
									<span className="text-[10px] font-mono text-muted-foreground">
										{localHolographicOptions.intensity?.toFixed(1) || "1.0"}
									</span>
								</div>
								<Slider
									id="holographic-intensity"
									value={[localHolographicOptions.intensity || 1]}
									min={0}
									max={2}
									step={0.1}
									onValueChange={(value) =>
										updateHolographicOption("intensity", value[0])
									}
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-2">
							<div className="space-y-1.5">
								<div className="flex items-center justify-between">
									<Label htmlFor="holographic-speed" className="text-[11px]">
										Velocidad
									</Label>
									<span className="text-[10px] font-mono text-muted-foreground">
										{localHolographicOptions.animationSpeed?.toFixed(1) ||
											"1.0"}
									</span>
								</div>
								<Slider
									id="holographic-speed"
									value={[localHolographicOptions.animationSpeed || 1]}
									min={0}
									max={3}
									step={0.1}
									onValueChange={(value) =>
										updateHolographicOption("animationSpeed", value[0])
									}
								/>
							</div>

							<div className="space-y-1.5">
								<div className="flex items-center justify-between">
									<Label
										htmlFor="holographic-visible-hover"
										className="text-[11px]"
									>
										Solo al pasar
									</Label>
									<Switch
										id="holographic-visible-hover"
										checked={localHolographicOptions.visibleOnHover}
										onCheckedChange={(checked) =>
											updateHolographicOption("visibleOnHover", checked)
										}
									/>
								</div>
							</div>
						</div>
					</div>
				</TabsContent>

				{/* Configuración de líneas de escaneo */}
				<TabsContent value="scanlines" className="space-y-3 mt-2">
					<div
						className={cn(
							"border rounded-md p-2.5 space-y-2.5",
							effectColors.scanlines.border,
							effectColors.scanlines.bg
						)}
					>
						<div className="grid grid-cols-2 gap-2">
							<div className="space-y-1.5">
								<div className="flex items-center justify-between">
									<Label htmlFor="scanlines-opacity" className="text-[11px]">
										Opacidad
									</Label>
									<span className="text-[10px] font-mono text-muted-foreground">
										{localScanlinesOptions.opacity?.toFixed(2) || "0.20"}
									</span>
								</div>
								<Slider
									id="scanlines-opacity"
									value={[localScanlinesOptions.opacity || 0.2]}
									min={0}
									max={1}
									step={0.05}
									onValueChange={(value) =>
										updateScanlinesOption("opacity", value[0])
									}
								/>
							</div>

							<div className="space-y-1.5">
								<div className="flex items-center justify-between">
									<Label htmlFor="scanlines-spacing" className="text-[11px]">
										Espaciado
									</Label>
									<span className="text-[10px] font-mono text-muted-foreground">
										{localScanlinesOptions.spacing || "4"}px
									</span>
								</div>
								<Slider
									id="scanlines-spacing"
									value={[localScanlinesOptions.spacing || 4]}
									min={1}
									max={10}
									step={1}
									onValueChange={(value) =>
										updateScanlinesOption("spacing", value[0])
									}
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-2">
							<div className="space-y-1.5">
								<Label
									htmlFor="scanlines-direction"
									className="text-[11px] flex items-center gap-1.5"
								>
									<GanttChartSquare
										className={cn("h-3 w-3", effectColors.scanlines.text)}
									/>
									Dirección
								</Label>
								<Select
									value={localScanlinesOptions.direction || "horizontal"}
									onValueChange={(value) =>
										updateScanlinesOption(
											"direction",
											value as ScanlinesOptions["direction"]
										)
									}
								>
									<SelectTrigger className="h-7 text-xs">
										<SelectValue placeholder="Selecciona una dirección" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="horizontal">Horizontal</SelectItem>
										<SelectItem value="vertical">Vertical</SelectItem>
										<SelectItem value="diagonal">Diagonal</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-1.5">
								<div className="flex items-center justify-between">
									<Label htmlFor="scanlines-animate" className="text-[11px]">
										Animar
									</Label>
									<Switch
										id="scanlines-animate"
										checked={localScanlinesOptions.animate}
										onCheckedChange={(checked) =>
											updateScanlinesOption("animate", checked)
										}
									/>
								</div>
							</div>
						</div>
					</div>
				</TabsContent>

				{/* Configuración de resplandor */}
				<TabsContent value="glow" className="space-y-3 mt-2">
					<div
						className={cn(
							"border rounded-md p-2.5 space-y-2.5",
							effectColors.glow.border,
							effectColors.glow.bg
						)}
					>
						<div className="grid grid-cols-2 gap-2">
							<div className="space-y-1.5">
								<div className="flex items-center justify-between">
									<Label htmlFor="glow-size" className="text-[11px]">
										Tamaño
									</Label>
									<span className="text-[10px] font-mono text-muted-foreground">
										{localGlowOptions.size || "10"}px
									</span>
								</div>
								<Slider
									id="glow-size"
									value={[localGlowOptions.size || 10]}
									min={0}
									max={30}
									step={1}
									onValueChange={(value) => updateGlowOption("size", value[0])}
								/>
							</div>

							<div className="space-y-1.5">
								<div className="flex items-center justify-between">
									<Label htmlFor="glow-intensity" className="text-[11px]">
										Intensidad
									</Label>
									<span className="text-[10px] font-mono text-muted-foreground">
										{localGlowOptions.intensity?.toFixed(2) || "0.50"}
									</span>
								</div>
								<Slider
									id="glow-intensity"
									value={[localGlowOptions.intensity || 0.5]}
									min={0}
									max={1}
									step={0.05}
									onValueChange={(value) =>
										updateGlowOption("intensity", value[0])
									}
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-2">
							<div className="space-y-1.5">
								<Label
									htmlFor="glow-color"
									className="text-[11px] flex items-center gap-1.5"
								>
									<FlameKindling
										className={cn("h-3 w-3", effectColors.glow.text)}
									/>
									Color
								</Label>
								<div className="flex items-center gap-2">
									<input
										type="color"
										id="glow-color"
										value={localGlowOptions.color || "#00a0ff"}
										onChange={(e) => updateGlowOption("color", e.target.value)}
										className="h-7 w-10 rounded border cursor-pointer"
									/>
									<Input
										value={localGlowOptions.color || "#00a0ff"}
										onChange={(e) => updateGlowOption("color", e.target.value)}
										className="h-7 text-xs"
									/>
								</div>
							</div>

							<div className="space-y-1.5">
								<div className="flex items-center justify-between">
									<Label htmlFor="glow-animation-type" className="text-[11px]">
										Animación
									</Label>
									<Switch
										id="glow-animation-type"
										checked={localGlowOptions.animationType === "pulse"}
										onCheckedChange={(checked) =>
											updateGlowOption(
												"animationType",
												checked ? "pulse" : "static"
											)
										}
									/>
								</div>
								{localGlowOptions.animationType === "pulse" && (
									<div className="flex items-center gap-2">
										<Label
											htmlFor="glow-animation-speed"
											className="text-[11px] whitespace-nowrap"
										>
											Velocidad
										</Label>
										<Slider
											id="glow-animation-speed"
											value={[1]}
											min={0.1}
											max={3}
											step={0.1}
											className="cursor-pointer"
										/>
										<span className="text-[10px] font-mono text-muted-foreground w-6 text-center">
											1.0
										</span>
									</div>
								)}
							</div>
						</div>
					</div>
				</TabsContent>

				{/* Configuración de borde */}
				<TabsContent value="border" className="space-y-3 mt-2">
					<div
						className={cn(
							"border rounded-md p-2.5 space-y-2.5",
							effectColors.border.border,
							effectColors.border.bg
						)}
					>
						<div className="grid grid-cols-2 gap-2">
							<div className="space-y-1.5">
								<div className="flex items-center justify-between">
									<Label htmlFor="border-width" className="text-[11px]">
										Ancho
									</Label>
									<span className="text-[10px] font-mono text-muted-foreground">
										{localBorderOptions.width || "2"}px
									</span>
								</div>
								<Slider
									id="border-width"
									value={[localBorderOptions.width || 2]}
									min={1}
									max={10}
									step={1}
									onValueChange={(value) =>
										updateBorderOption("width", value[0])
									}
								/>
							</div>

							<div className="space-y-1.5">
								<Label
									htmlFor="border-pattern"
									className="text-[11px] flex items-center gap-1.5"
								>
									<Braces className={cn("h-3 w-3", effectColors.border.text)} />
									Patrón
								</Label>
								<Select
									value={localBorderOptions.pattern || "solid"}
									onValueChange={(value) =>
										updateBorderOption(
											"pattern",
											value as BorderOptions["pattern"]
										)
									}
								>
									<SelectTrigger className="h-7 text-xs">
										<SelectValue placeholder="Selecciona un patrón" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="solid">Sólido</SelectItem>
										<SelectItem value="dashed">Discontinuo</SelectItem>
										<SelectItem value="dotted">Punteado</SelectItem>
										<SelectItem value="double">Doble</SelectItem>
										<SelectItem value="gradient">Degradado</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-2">
							<div className="space-y-1.5">
								<Label htmlFor="border-color" className="text-[11px]">
									Color
								</Label>
								<div className="flex items-center gap-2">
									<input
										type="color"
										id="border-color"
										value={localBorderOptions.color || "#00a0ff"}
										onChange={(e) =>
											updateBorderOption("color", e.target.value)
										}
										className="h-7 w-10 rounded border cursor-pointer"
									/>
									<Input
										value={localBorderOptions.color || "#00a0ff"}
										onChange={(e) =>
											updateBorderOption("color", e.target.value)
										}
										className="h-7 text-xs"
									/>
								</div>
							</div>

							<div className="space-y-1.5">
								<Label htmlFor="border-animation" className="text-[11px]">
									Animación
								</Label>
								<Select
									value={localBorderOptions.animationType || "none"}
									onValueChange={(value) =>
										updateBorderOption(
											"animationType",
											value as BorderOptions["animationType"]
										)
									}
								>
									<SelectTrigger className="h-7 text-xs">
										<SelectValue placeholder="Selecciona una animación" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="none">Ninguna</SelectItem>
										<SelectItem value="pulse">Pulso</SelectItem>
										<SelectItem value="flow">Flujo</SelectItem>
										<SelectItem value="rainbow">Arcoíris</SelectItem>
										<SelectItem value="shimmer">Destello</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>
				</TabsContent>

				{/* Configuración de grano */}
				<TabsContent value="grain" className="space-y-3 mt-2">
					<div
						className={cn(
							"border rounded-md p-2.5 space-y-2.5",
							effectColors.grain.border,
							effectColors.grain.bg
						)}
					>
						<div className="grid grid-cols-2 gap-2">
							<div className="space-y-1.5">
								<div className="flex items-center justify-between">
									<Label htmlFor="grain-intensity" className="text-[11px]">
										Intensidad
									</Label>
									<span className="text-[10px] font-mono text-muted-foreground">
										{(localGrainOptions.intensity || 0.2).toFixed(2)}
									</span>
								</div>
								<Slider
									id="grain-intensity"
									value={[localGrainOptions.intensity || 0.2]}
									min={0}
									max={1}
									step={0.05}
									onValueChange={(value) =>
										updateGrainOption("intensity", value[0])
									}
								/>
							</div>

							<div className="space-y-1.5">
								<div className="flex items-center justify-between">
									<Label htmlFor="grain-density" className="text-[11px]">
										Densidad
									</Label>
									<span className="text-[10px] font-mono text-muted-foreground">
										{(localGrainOptions.density || 0.5).toFixed(2)}
									</span>
								</div>
								<Slider
									id="grain-density"
									value={[localGrainOptions.density || 0.5]}
									min={0.1}
									max={1}
									step={0.05}
									onValueChange={(value) =>
										updateGrainOption("density", value[0])
									}
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-2">
							<div className="space-y-1.5">
								<Label
									htmlFor="grain-noise"
									className="text-[11px] flex items-center gap-1.5"
								>
									<GrainIcon
										className={cn("h-3 w-3", effectColors.grain.text)}
									/>
									Tipo de Ruido
								</Label>
								<Select
									value={localGrainOptions.noise || "light"}
									onValueChange={(value) =>
										updateGrainOption(
											"noise",
											value as GrainEffectOptions["noise"]
										)
									}
								>
									<SelectTrigger className="h-7 text-xs">
										<SelectValue placeholder="Selecciona un tipo" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="light">Ligero</SelectItem>
										<SelectItem value="digital">Digital</SelectItem>
										<SelectItem value="film">Película</SelectItem>
										<SelectItem value="heavy">Intenso</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-1.5">
								<div className="flex items-center justify-between">
									<Label htmlFor="grain-animated" className="text-[11px]">
										Animar
									</Label>
									<Switch
										id="grain-animated"
										checked={localGrainOptions.animated}
										onCheckedChange={(checked) =>
											updateGrainOption("animated", checked)
										}
									/>
								</div>
								{localGrainOptions.animated && (
									<div className="flex items-center gap-2">
										<Label
											htmlFor="grain-anime-speed"
											className="text-[11px] whitespace-nowrap"
										>
											Velocidad
										</Label>
										<Slider
											id="grain-anime-speed"
											value={[localGrainOptions.animationSpeed || 1]}
											min={0.1}
											max={3}
											step={0.1}
											onValueChange={(value) =>
												updateGrainOption("animationSpeed", value[0])
											}
										/>
										<span className="text-[10px] font-mono text-muted-foreground w-6 text-center">
											{localGrainOptions.animationSpeed?.toFixed(1) || "1.0"}
										</span>
									</div>
								)}
							</div>
						</div>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}
