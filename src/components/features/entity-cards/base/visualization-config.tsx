"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X } from "lucide-react";
import { useState } from "react";
import type { BaseCardProps } from "./base-card";

interface VisualizationConfigProps {
	options: NonNullable<BaseCardProps["options"]>;
	onOptionsChange: (options: NonNullable<BaseCardProps["options"]>) => void;
	onClose?: () => void;
}

export function VisualizationConfig({
	options,
	onOptionsChange,
	onClose,
}: VisualizationConfigProps) {
	// Estado local para controlar los valores de opciones antes de aplicarlos
	const [localOptions, setLocalOptions] = useState(options);

	// Función para actualizar una opción específica
	const updateOption = <K extends keyof typeof localOptions>(
		key: K,
		value: (typeof localOptions)[K]
	) => {
		setLocalOptions((prev) => ({
			...prev,
			[key]: value,
		}));
	};

	// Aplicar cambios al componente padre
	const applyChanges = () => {
		onOptionsChange(localOptions);
	};

	return (
		<div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
			<div className="bg-card border rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto p-4">
				<div className="flex justify-between items-center mb-4">
					<h3 className="text-lg font-medium">Configuración Visual</h3>
					<Button variant="ghost" size="icon" onClick={onClose} title="Cerrar">
						<X size={18} />
					</Button>
				</div>

				<Tabs defaultValue="effects" className="w-full">
					<TabsList className="grid grid-cols-2 mb-4">
						<TabsTrigger value="effects">Efectos</TabsTrigger>
						<TabsTrigger value="colors">Colores</TabsTrigger>
					</TabsList>

					<TabsContent value="effects" className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<div className="flex items-center space-x-2">
									<Checkbox
										id="enable3DEffect"
										checked={localOptions.enable3DEffect}
										onCheckedChange={(checked) =>
											updateOption("enable3DEffect", checked === true)
										}
									/>
									<Label htmlFor="enable3DEffect">Efecto 3D</Label>
								</div>

								<div className="flex items-center space-x-2">
									<Checkbox
										id="enableHolographicEffect"
										checked={localOptions.enableHolographicEffect}
										onCheckedChange={(checked) =>
											updateOption("enableHolographicEffect", checked === true)
										}
									/>
									<Label htmlFor="enableHolographicEffect">
										Efecto Holográfico
									</Label>
								</div>

								<div className="flex items-center space-x-2">
									<Checkbox
										id="enableScanlines"
										checked={localOptions.enableScanlines}
										onCheckedChange={(checked) =>
											updateOption("enableScanlines", checked === true)
										}
									/>
									<Label htmlFor="enableScanlines">Líneas de Escaneo</Label>
								</div>
							</div>

							<div className="space-y-2">
								<div className="flex items-center space-x-2">
									<Checkbox
										id="enableLightHalo"
										checked={localOptions.enableLightHalo}
										onCheckedChange={(checked) =>
											updateOption("enableLightHalo", checked === true)
										}
									/>
									<Label htmlFor="enableLightHalo">Halo de Luz</Label>
								</div>

								<div className="flex items-center space-x-2">
									<Checkbox
										id="enableAnimatedBorder"
										checked={localOptions.enableAnimatedBorder}
										onCheckedChange={(checked) =>
											updateOption("enableAnimatedBorder", checked === true)
										}
									/>
									<Label htmlFor="enableAnimatedBorder">Borde Animado</Label>
								</div>

								<div className="flex items-center space-x-2">
									<Checkbox
										id="enableGlowEffect"
										checked={localOptions.enableGlowEffect}
										onCheckedChange={(checked) =>
											updateOption("enableGlowEffect", checked === true)
										}
									/>
									<Label htmlFor="enableGlowEffect">Efecto Resplandor</Label>
								</div>

								<div className="flex items-center space-x-2">
									<Checkbox
										id="enableGrainEffect"
										checked={localOptions.enableGrainEffect}
										onCheckedChange={(checked) =>
											updateOption("enableGrainEffect", checked === true)
										}
									/>
									<Label htmlFor="enableGrainEffect">Efecto Grano</Label>
								</div>
							</div>
						</div>

						{/* Controles de intensidad */}
						<div className="space-y-4 pt-2">
							<div className="space-y-2">
								<Label htmlFor="hoverLiftHeight">Altura de Levitación</Label>
								<div className="flex items-center gap-4">
									<Slider
										id="hoverLiftHeight"
										value={[localOptions.hoverLiftHeight || 10]}
										min={0}
										max={20}
										step={1}
										onValueChange={(value) =>
											updateOption("hoverLiftHeight", value[0])
										}
									/>
									<span className="w-8 text-center text-muted-foreground">
										{localOptions.hoverLiftHeight || 10}px
									</span>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="maxRotation">Rotación Máxima</Label>
								<div className="flex items-center gap-4">
									<Slider
										id="maxRotation"
										value={[localOptions.maxRotation || 15]}
										min={0}
										max={30}
										step={1}
										onValueChange={(value) =>
											updateOption("maxRotation", value[0])
										}
									/>
									<span className="w-8 text-center text-muted-foreground">
										{localOptions.maxRotation || 15}°
									</span>
								</div>
							</div>
						</div>
					</TabsContent>

					<TabsContent value="colors" className="space-y-4">
						<div className="grid grid-cols-1 gap-4">
							<div className="space-y-2">
								<Label htmlFor="primaryColor">Color Primario</Label>
								<div className="flex gap-2">
									<Input
										id="primaryColor"
										value={localOptions.primaryColor || ""}
										onChange={(e) =>
											updateOption("primaryColor", e.target.value)
										}
										placeholder="ej. 255, 0, 128"
									/>
									<div
										className="w-10 h-10 rounded border"
										style={{
											backgroundColor: `rgba(${localOptions.primaryColor || "0, 0, 0"}, 1)`,
										}}
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="secondaryColor">Color Secundario</Label>
								<div className="flex gap-2">
									<Input
										id="secondaryColor"
										value={localOptions.secondaryColor || ""}
										onChange={(e) =>
											updateOption("secondaryColor", e.target.value)
										}
										placeholder="ej. 0, 128, 255"
									/>
									<div
										className="w-10 h-10 rounded border"
										style={{
											backgroundColor: `rgba(${localOptions.secondaryColor || "0, 0, 0"}, 1)`,
										}}
									/>
								</div>
							</div>
						</div>

						<div className="bg-muted p-3 rounded-md text-sm text-muted-foreground">
							<p>
								Los colores deben ingresarse en formato RGB separados por comas.
							</p>
							<p>
								Ejemplo: <span className="font-mono">255, 0, 128</span>
							</p>
						</div>
					</TabsContent>
				</Tabs>

				<div className="flex justify-end gap-2 mt-6">
					<Button variant="outline" onClick={onClose}>
						Cancelar
					</Button>
					<Button
						onClick={() => {
							applyChanges();
							onClose?.();
						}}
					>
						Aplicar
					</Button>
				</div>
			</div>
		</div>
	);
}
