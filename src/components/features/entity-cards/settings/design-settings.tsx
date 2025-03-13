"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils/utils";
import {
	Box,
	Info,
	LayoutGrid,
	PaintBucket,
	Palette,
	Ruler,
	Square,
} from "lucide-react";
import type { CardOptions, CardSettingsProps } from "./card-settings-types";

// Esquema de colores para el componente de diseño
const designColors = {
	bg: "bg-emerald-500/5",
	border: "border-emerald-500/20",
	text: "text-emerald-600",
	highlight: "bg-emerald-500/10",
};

export function DesignSettings({
	cardOptions,
	onCardOptionsChange,
}: CardSettingsProps) {
	// Manejador para cambios en opciones individuales
	const handleOptionChange = (key: keyof CardOptions, value: unknown) => {
		onCardOptionsChange({
			...cardOptions,
			[key]: value,
		});
	};

	// Manejador para cambios en el sistema de diseño
	const handleDesignSystemChange = (key: string, value: unknown) => {
		onCardOptionsChange({
			...cardOptions,
			designSystem: {
				...cardOptions.designSystem,
				[key]: value,
			},
		});
	};

	return (
		<Card className={cn("border shadow-sm", designColors.border)}>
			<CardHeader className="p-2.5 pb-1.5">
				<CardTitle className="text-xs font-medium flex items-center gap-1.5">
					<Palette className={cn("h-3.5 w-3.5", designColors.text)} />
					Configuración de Diseño
				</CardTitle>
			</CardHeader>
			<CardContent className="p-2.5 space-y-3">
				{/* Diseño del Sistema */}
				<div className="space-y-3">
					<div className="space-y-1.5">
						<Label className="text-[11px] flex items-center gap-1.5">
							<Box className="h-3 w-3 text-emerald-500" />
							Preset de Diseño
						</Label>
						<Select
							value={cardOptions.designSystem?.preset}
							onValueChange={(value) =>
								handleDesignSystemChange("preset", value)
							}
						>
							<SelectTrigger className="w-full h-7 text-xs">
								<SelectValue placeholder="Selecciona un preset" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="default">Por defecto</SelectItem>
								<SelectItem value="album">Álbum</SelectItem>
								<SelectItem value="folder">Carpeta</SelectItem>
								<SelectItem value="character">Personaje</SelectItem>
								<SelectItem value="image">Imagen</SelectItem>
								<SelectItem value="gallery">Galería</SelectItem>
								<SelectItem value="stats">Estadísticas</SelectItem>
								<SelectItem value="profile">Perfil</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-1.5">
						<Label className="text-[11px] flex items-center gap-1.5">
							<LayoutGrid className="h-3 w-3 text-emerald-500" />
							Variante
						</Label>
						<Select
							value={cardOptions.designSystem?.variant}
							onValueChange={(value) =>
								handleDesignSystemChange("variant", value)
							}
						>
							<SelectTrigger className="w-full h-7 text-xs">
								<SelectValue placeholder="Selecciona una variante" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="default">Por defecto</SelectItem>
								<SelectItem value="compact">Compacto</SelectItem>
								<SelectItem value="expanded">Expandido</SelectItem>
								<SelectItem value="grid">Cuadrícula</SelectItem>
								<SelectItem value="list">Lista</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-1.5">
						<Label className="text-[11px] flex items-center gap-1.5">
							<Square className="h-3 w-3 text-emerald-500" />
							Proporción
						</Label>
						<Select
							value={cardOptions.designSystem?.aspectRatio}
							onValueChange={(value) =>
								handleDesignSystemChange("aspectRatio", value)
							}
						>
							<SelectTrigger className="w-full h-7 text-xs">
								<SelectValue placeholder="Selecciona una proporción" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="1/1">Cuadrado (1:1)</SelectItem>
								<SelectItem value="4/3">4:3</SelectItem>
								<SelectItem value="16/9">16:9</SelectItem>
								<SelectItem value="7/10">7:10</SelectItem>
								<SelectItem value="auto">Automático</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="grid grid-cols-2 gap-2">
						<div className="space-y-1.5">
							<Label className="text-[11px] flex items-center gap-1.5">
								<Square className="h-3 w-3 text-emerald-500" />
								Estilo de Esquinas
							</Label>
							<Select
								value={cardOptions.designSystem?.cornerStyle}
								onValueChange={(value) =>
									handleDesignSystemChange("cornerStyle", value)
								}
							>
								<SelectTrigger className="w-full h-7 text-xs">
									<SelectValue placeholder="Selecciona un estilo" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="rounded">Redondeado</SelectItem>
									<SelectItem value="sharp">Afilado</SelectItem>
									<SelectItem value="circular">Circular</SelectItem>
									<SelectItem value="custom">Personalizado</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1.5">
							<div className="flex items-center justify-between">
								<Label
									htmlFor="cornerRadius"
									className="text-[11px] flex items-center gap-1.5"
								>
									<Ruler className="h-3 w-3 text-emerald-500" />
									Radio de Esquinas
								</Label>
								<span className="text-[10px] font-mono text-muted-foreground">
									{cardOptions.designSystem?.cornerRadius || 12}px
								</span>
							</div>
							<Slider
								id="cornerRadius"
								min={0}
								max={24}
								step={1}
								value={[cardOptions.designSystem?.cornerRadius || 12]}
								onValueChange={(value) =>
									handleDesignSystemChange("cornerRadius", value[0])
								}
								className="cursor-pointer"
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-2">
						<div className="space-y-1.5">
							<Label className="text-[11px] flex items-center gap-1.5">
								<Ruler className="h-3 w-3 text-emerald-500" />
								Elevación
							</Label>
							<Select
								value={String(cardOptions.designSystem?.elevation)}
								onValueChange={(value) =>
									handleDesignSystemChange("elevation", Number(value))
								}
							>
								<SelectTrigger className="w-full h-7 text-xs">
									<SelectValue placeholder="Selecciona una elevación" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="0">Plano</SelectItem>
									<SelectItem value="1">Bajo</SelectItem>
									<SelectItem value="2">Medio</SelectItem>
									<SelectItem value="3">Alto</SelectItem>
									<SelectItem value="4">Muy Alto</SelectItem>
									<SelectItem value="5">Máximo</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1.5">
							<Label className="text-[11px] flex items-center gap-1.5">
								<PaintBucket className="h-3 w-3 text-emerald-500" />
								Estilo de Sombra
							</Label>
							<Select
								value={cardOptions.designSystem?.shadowStyle}
								onValueChange={(value) =>
									handleDesignSystemChange("shadowStyle", value)
								}
							>
								<SelectTrigger className="w-full h-7 text-xs">
									<SelectValue placeholder="Selecciona un estilo" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">Sin sombra</SelectItem>
									<SelectItem value="soft">Suave</SelectItem>
									<SelectItem value="hard">Dura</SelectItem>
									<SelectItem value="glow">Brillo</SelectItem>
									<SelectItem value="ambient">Ambiental</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</div>

				<Separator className="my-2" />

				{/* Diseño del Contenido */}
				<div className="space-y-3">
					<Label className="text-[11px] font-medium flex items-center gap-1.5">
						<LayoutGrid className="h-3 w-3 text-emerald-500" />
						Diseño del Contenido
					</Label>

					<div className="grid grid-cols-2 gap-2">
						<div className="space-y-1.5">
							<Label className="text-[11px]">Disposición</Label>
							<Select
								value={cardOptions.contentLayout}
								onValueChange={(value) =>
									handleOptionChange("contentLayout", value)
								}
							>
								<SelectTrigger className="w-full h-7 text-xs">
									<SelectValue placeholder="Selecciona una disposición" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="default">Por defecto</SelectItem>
									<SelectItem value="metadata-heavy">
										Metadata Extendida
									</SelectItem>
									<SelectItem value="image-focus">Enfoque en Imagen</SelectItem>
									<SelectItem value="stats-focus">
										Enfoque en Estadísticas
									</SelectItem>
									<SelectItem value="minimal">Minimalista</SelectItem>
									<SelectItem value="grid">Cuadrícula</SelectItem>
									<SelectItem value="masonry">Mosaico</SelectItem>
									<SelectItem value="carousel">Carrusel</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1.5">
							<Label className="text-[11px]">Alineación</Label>
							<Select
								value={cardOptions.contentAlignment}
								onValueChange={(value) =>
									handleOptionChange("contentAlignment", value)
								}
							>
								<SelectTrigger className="w-full h-7 text-xs">
									<SelectValue placeholder="Selecciona una alineación" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="start">Inicio</SelectItem>
									<SelectItem value="center">Centro</SelectItem>
									<SelectItem value="end">Final</SelectItem>
									<SelectItem value="stretch">Estirado</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-2">
						<div className="space-y-1.5">
							<Label className="text-[11px]">Estilo de Imagen</Label>
							<Select
								value={cardOptions.imageStyle}
								onValueChange={(value) =>
									handleOptionChange("imageStyle", value)
								}
							>
								<SelectTrigger className="w-full h-7 text-xs">
									<SelectValue placeholder="Selecciona un estilo" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="contain">Contener</SelectItem>
									<SelectItem value="cover">Cubrir</SelectItem>
									<SelectItem value="fill">Llenar</SelectItem>
									<SelectItem value="grid">Cuadrícula</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1.5">
							<div className="flex items-center justify-between">
								<Label
									htmlFor="imageOverlay"
									className="text-[11px] flex items-center gap-1.5 cursor-pointer"
								>
									Superposición
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger asChild>
												<Info className="h-3 w-3 text-muted-foreground" />
											</TooltipTrigger>
											<TooltipContent className="text-[10px] max-w-[180px]">
												Añade una capa de superposición sobre la imagen
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								</Label>
								<Switch
									id="imageOverlay"
									checked={cardOptions.imageOverlay}
									onCheckedChange={(checked) =>
										handleOptionChange("imageOverlay", checked)
									}
								/>
							</div>

							{cardOptions.imageOverlay && (
								<div className="pt-1.5">
									<div className="flex items-center justify-between">
										<Label
											htmlFor="imageOverlayOpacity"
											className="text-[11px]"
										>
											Opacidad
										</Label>
										<span className="text-[10px] font-mono text-muted-foreground">
											{cardOptions.imageOverlayOpacity || 0.3}
										</span>
									</div>
									<Slider
										id="imageOverlayOpacity"
										min={0}
										max={1}
										step={0.1}
										value={[cardOptions.imageOverlayOpacity || 0.3]}
										onValueChange={(value) =>
											handleOptionChange("imageOverlayOpacity", value[0])
										}
										className="cursor-pointer"
									/>
								</div>
							)}
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
