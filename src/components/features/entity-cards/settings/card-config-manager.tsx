"use client";

import type { CardOptions } from "@/components/features/entity-cards/base/base-card-types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils/utils";
import {
	Check,
	FlameKindling,
	GanttChartSquare,
	Info,
	Layers,
	Palette,
	Rotate3d,
	Save,
	Sparkles,
	XCircle,
} from "lucide-react";
import * as React from "react";

// Esquemas de colores para diferentes secciones
const configColors = {
	effects: {
		bg: "bg-violet-500/5",
		border: "border-violet-500/20",
		text: "text-violet-600",
		highlight: "bg-violet-500/10",
	},
	colors: {
		bg: "bg-rose-500/5",
		border: "border-rose-500/20",
		text: "text-rose-600",
		highlight: "bg-rose-500/10",
	},
};

interface CardConfigManagerProps {
	options: CardOptions;
	onOptionsChange: (options: CardOptions) => void;
	onClose?: () => void;
}

export function CardConfigManager({
	options,
	onOptionsChange,
	onClose,
}: CardConfigManagerProps) {
	// Estado local para controlar los valores de opciones antes de aplicarlos
	const [localOptions, setLocalOptions] = React.useState<CardOptions>(options);

	// Función para actualizar una opción específica
	const updateOption = React.useCallback(
		<K extends keyof CardOptions>(key: K, value: CardOptions[K]) => {
			setLocalOptions((prev) => ({
				...prev,
				[key]: value,
			}));
		},
		[]
	);

	// Manejador especial para compatibilidad con nombres duplicados
	const handleScanLinesChange = (checked: boolean) => {
		setLocalOptions((prev) => ({
			...prev,
			enableScanlines: checked,
			enableScanlinesEffect: checked, // Mantener sincronizado para compatibilidad
		}));
	};

	// Aplicar cambios al componente padre
	const applyChanges = () => {
		onOptionsChange(localOptions);
	};

	// Asegurarnos de que los valores sean válidos y tengan defaults
	React.useEffect(() => {
		// Establecer valores por defecto para MaxRotation si no está definido
		if (localOptions.maxRotation === undefined) {
			updateOption("maxRotation", 15);
		}

		// Asegurar que hoverLiftHeight tenga un valor por defecto
		if (localOptions.hoverLiftHeight === undefined) {
			updateOption("hoverLiftHeight", 5);
		}

		// Inicializar sistema de rareza si no existe
		if (localOptions.raritySystem === undefined) {
			updateOption("raritySystem", {
				enabled: true,
				defaultRarity: "common",
				rarities: {},
			});
		}
	}, [
		localOptions.maxRotation,
		localOptions.hoverLiftHeight,
		localOptions.raritySystem,
		updateOption,
	]);

	return (
		<div className="w-full space-y-3">
			<Tabs defaultValue="effects" className="w-full">
				<TabsList className="grid grid-cols-2 mb-3 h-8">
					<TabsTrigger
						value="effects"
						className="text-xs flex items-center gap-1.5 h-full"
					>
						<Sparkles className="h-3 w-3" />
						Efectos
					</TabsTrigger>
					<TabsTrigger
						value="colors"
						className="text-xs flex items-center gap-1.5 h-full"
					>
						<Palette className="h-3 w-3" />
						Colores
					</TabsTrigger>
				</TabsList>

				<TabsContent value="effects" className="space-y-3">
					<div
						className={cn(
							"rounded-md border p-2.5 space-y-2",
							configColors.effects.border,
							configColors.effects.bg
						)}
					>
						<div className="flex items-center justify-between mb-1">
							<Label className="text-[11px] font-medium flex items-center gap-1.5">
								<Sparkles
									className={cn("h-3 w-3", configColors.effects.text)}
								/>
								Efectos Visuales
							</Label>
						</div>

						<div className="grid grid-cols-2 gap-2">
							<div className="space-y-1.5">
								<div className="flex items-center space-x-2">
									<Checkbox
										id="enable3DEffect"
										checked={localOptions.enable3DEffect}
										onCheckedChange={(checked) =>
											updateOption("enable3DEffect", checked === true)
										}
									/>
									<Label
										htmlFor="enable3DEffect"
										className="text-[11px] flex items-center gap-1.5"
									>
										<Rotate3d className="h-3 w-3 text-violet-500" />
										Efecto 3D
									</Label>
								</div>

								<div className="flex items-center space-x-2">
									<Checkbox
										id="enableHolographicEffect"
										checked={localOptions.enableHolographicEffect}
										onCheckedChange={(checked) =>
											updateOption("enableHolographicEffect", checked === true)
										}
									/>
									<Label
										htmlFor="enableHolographicEffect"
										className="text-[11px] flex items-center gap-1.5"
									>
										<Sparkles className="h-3 w-3 text-violet-500" />
										Efecto Holográfico
									</Label>
								</div>

								<div className="flex items-center space-x-2">
									<Checkbox
										id="enableScanlines"
										checked={
											localOptions.enableScanlines ||
											localOptions.enableScanlinesEffect
										}
										onCheckedChange={(checked) =>
											handleScanLinesChange(checked === true)
										}
									/>
									<Label
										htmlFor="enableScanlines"
										className="text-[11px] flex items-center gap-1.5"
									>
										<GanttChartSquare className="h-3 w-3 text-violet-500" />
										Líneas de Escaneo
									</Label>
								</div>
							</div>

							<div className="space-y-1.5">
								<div className="flex items-center space-x-2">
									<Checkbox
										id="enableBorderEffect"
										checked={localOptions.enableBorderEffect}
										onCheckedChange={(checked) =>
											updateOption("enableBorderEffect", checked === true)
										}
									/>
									<Label
										htmlFor="enableBorderEffect"
										className="text-[11px] flex items-center gap-1.5"
									>
										<Layers className="h-3 w-3 text-violet-500" />
										Borde Personalizado
									</Label>
								</div>

								<div className="flex items-center space-x-2">
									<Checkbox
										id="enableAnimatedBorder"
										checked={localOptions.enableAnimatedBorder}
										onCheckedChange={(checked) =>
											updateOption("enableAnimatedBorder", checked === true)
										}
									/>
									<Label
										htmlFor="enableAnimatedBorder"
										className="text-[11px] flex items-center gap-1.5"
									>
										<Layers className="h-3 w-3 text-violet-500" />
										Borde Animado
									</Label>
								</div>

								<div className="flex items-center space-x-2">
									<Checkbox
										id="enableGlowEffect"
										checked={localOptions.enableGlowEffect}
										onCheckedChange={(checked) =>
											updateOption("enableGlowEffect", checked === true)
										}
									/>
									<Label
										htmlFor="enableGlowEffect"
										className="text-[11px] flex items-center gap-1.5"
									>
										<FlameKindling className="h-3 w-3 text-violet-500" />
										Efecto Resplandor
									</Label>
								</div>

								<div className="flex items-center space-x-2">
									<Checkbox
										id="enableGrainEffect"
										checked={localOptions.enableGrainEffect}
										onCheckedChange={(checked) =>
											updateOption("enableGrainEffect", checked === true)
										}
									/>
									<Label
										htmlFor="enableGrainEffect"
										className="text-[11px] flex items-center gap-1.5"
									>
										<Layers className="h-3 w-3 text-violet-500" />
										Efecto Grano
									</Label>
								</div>
							</div>
						</div>
					</div>

					{/* Controles de intensidad */}
					<div
						className={cn(
							"rounded-md border p-2.5 space-y-2",
							configColors.effects.border,
							configColors.effects.bg
						)}
					>
						<div className="flex items-center justify-between mb-1">
							<Label className="text-[11px] font-medium flex items-center gap-1.5">
								<Rotate3d
									className={cn("h-3 w-3", configColors.effects.text)}
								/>
								Ajustes de Profundidad
							</Label>
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<Info className="h-3 w-3 text-muted-foreground" />
									</TooltipTrigger>
									<TooltipContent
										className="text-[10px] max-w-[180px]"
										side="top"
									>
										Estos ajustes controlan la percepción de profundidad y
										movimiento de la tarjeta.
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</div>

						<div className="grid grid-cols-2 gap-2">
							<div className="space-y-1.5">
								<div className="flex items-center justify-between">
									<Label htmlFor="hoverLiftHeight" className="text-[11px]">
										Altura de Elevación
									</Label>
									<span className="text-[10px] font-mono text-muted-foreground">
										{localOptions.hoverLiftHeight ?? 5}px
									</span>
								</div>
								<Slider
									id="hoverLiftHeight"
									value={[localOptions.hoverLiftHeight ?? 5]}
									min={0}
									max={20}
									step={1}
									onValueChange={(value) =>
										updateOption("hoverLiftHeight", value[0])
									}
									className="cursor-pointer"
								/>
							</div>

							<div className="space-y-1.5">
								<div className="flex items-center justify-between">
									<Label htmlFor="maxRotation" className="text-[11px]">
										Rotación Máxima
									</Label>
									<span className="text-[10px] font-mono text-muted-foreground">
										{localOptions.maxRotation ?? 15}°
									</span>
								</div>
								<Slider
									id="maxRotation"
									value={[localOptions.maxRotation ?? 15]}
									min={0}
									max={30}
									step={1}
									onValueChange={(value) =>
										updateOption("maxRotation", value[0])
									}
									className="cursor-pointer"
								/>
							</div>
						</div>
					</div>
				</TabsContent>

				<TabsContent value="colors" className="space-y-3">
					<div
						className={cn(
							"rounded-md border p-2.5 space-y-2",
							configColors.colors.border,
							configColors.colors.bg
						)}
					>
						<div className="flex items-center justify-between mb-1">
							<Label className="text-[11px] font-medium flex items-center gap-1.5">
								<Palette className={cn("h-3 w-3", configColors.colors.text)} />
								Personalización de Colores
							</Label>
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<Info className="h-3 w-3 text-muted-foreground" />
									</TooltipTrigger>
									<TooltipContent
										className="text-[10px] max-w-[180px]"
										side="top"
									>
										Los colores deben ingresarse en formato RGB separados por
										comas (ej. 255, 0, 128).
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</div>

						<div className="space-y-2">
							<div className="space-y-1.5">
								<Label
									htmlFor="primaryColor"
									className="text-[11px] flex items-center gap-1.5"
								>
									Color Primario
								</Label>
								<div className="flex gap-2 items-center">
									<Input
										id="primaryColor"
										value={localOptions.primaryColor}
										onChange={(e) =>
											updateOption("primaryColor", e.target.value)
										}
										placeholder="ej. 255, 0, 128"
										className="h-7 text-xs"
									/>
									<div
										className="w-8 h-8 rounded border flex-shrink-0"
										style={{
											backgroundColor: `rgba(${localOptions.primaryColor}, 1)`,
										}}
									/>
								</div>
							</div>

							<div className="space-y-1.5">
								<Label
									htmlFor="secondaryColor"
									className="text-[11px] flex items-center gap-1.5"
								>
									Color Secundario
								</Label>
								<div className="flex gap-2 items-center">
									<Input
										id="secondaryColor"
										value={localOptions.secondaryColor}
										onChange={(e) =>
											updateOption("secondaryColor", e.target.value)
										}
										placeholder="ej. 0, 128, 255"
										className="h-7 text-xs"
									/>
									<div
										className="w-8 h-8 rounded border flex-shrink-0"
										style={{
											backgroundColor: `rgba(${localOptions.secondaryColor}, 1)`,
										}}
									/>
								</div>
							</div>
						</div>
					</div>
				</TabsContent>
			</Tabs>

			<div className="flex justify-end gap-1.5 mt-3">
				{onClose && (
					<Button
						variant="outline"
						size="sm"
						onClick={onClose}
						className="h-7 text-xs px-2 flex items-center gap-1"
					>
						<XCircle className="h-3 w-3" />
						Cancelar
					</Button>
				)}
				<Button
					size="sm"
					onClick={applyChanges}
					className="h-7 text-xs px-3 flex items-center gap-1"
				>
					<Save className="h-3 w-3" />
					Aplicar
				</Button>
			</div>
		</div>
	);
}
