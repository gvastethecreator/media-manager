'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Box, Info } from 'lucide-react';
import type { CardOptions, CardSettingsProps } from './card-settings-types';

export function DesignSettings({ cardOptions, onCardOptionsChange }: CardSettingsProps) {
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
		<Card className="border border-border/40 shadow-sm">
			<CardHeader className="p-3 pb-2">
				<CardTitle className="text-sm font-medium flex items-center gap-1.5">
					<Box className="h-4 w-4 text-primary" />
					Configuración de Diseño
				</CardTitle>
			</CardHeader>
			<CardContent className="p-3 space-y-4">
				{/* Diseño del Sistema */}
				<div className="space-y-4">
					<div className="space-y-2">
						<Label className="text-sm">Preset de Diseño</Label>
						<Select
							value={cardOptions.designSystem?.preset}
							onValueChange={(value) => handleDesignSystemChange('preset', value)}
						>
							<SelectTrigger className="w-full">
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

					<div className="space-y-2">
						<Label className="text-sm">Variante</Label>
						<Select
							value={cardOptions.designSystem?.variant}
							onValueChange={(value) => handleDesignSystemChange('variant', value)}
						>
							<SelectTrigger className="w-full">
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

					<div className="space-y-2">
						<Label className="text-sm">Proporción</Label>
						<Select
							value={cardOptions.designSystem?.aspectRatio}
							onValueChange={(value) => handleDesignSystemChange('aspectRatio', value)}
						>
							<SelectTrigger className="w-full">
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

					<div className="space-y-2">
						<Label className="text-sm">Estilo de Esquinas</Label>
						<Select
							value={cardOptions.designSystem?.cornerStyle}
							onValueChange={(value) => handleDesignSystemChange('cornerStyle', value)}
						>
							<SelectTrigger className="w-full">
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

					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label htmlFor="cornerRadius" className="text-sm">
								Radio de Esquinas
							</Label>
							<span className="text-xs font-mono text-muted-foreground">
								{cardOptions.designSystem?.cornerRadius || 12}px
							</span>
						</div>
						<Slider
							id="cornerRadius"
							min={0}
							max={24}
							step={1}
							value={[cardOptions.designSystem?.cornerRadius || 12]}
							onValueChange={(value) => handleDesignSystemChange('cornerRadius', value[0])}
							className="cursor-pointer"
						/>
					</div>

					<div className="space-y-2">
						<Label className="text-sm">Elevación</Label>
						<Select
							value={String(cardOptions.designSystem?.elevation)}
							onValueChange={(value) => handleDesignSystemChange('elevation', Number(value))}
						>
							<SelectTrigger className="w-full">
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

					<div className="space-y-2">
						<Label className="text-sm">Estilo de Sombra</Label>
						<Select
							value={cardOptions.designSystem?.shadowStyle}
							onValueChange={(value) => handleDesignSystemChange('shadowStyle', value)}
						>
							<SelectTrigger className="w-full">
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

				<Separator />

				{/* Diseño del Contenido */}
				<div className="space-y-4">
					<Label className="text-sm font-medium">Diseño del Contenido</Label>

					<div className="space-y-2">
						<Label className="text-sm">Disposición</Label>
						<Select
							value={cardOptions.contentLayout}
							onValueChange={(value) => handleOptionChange('contentLayout', value)}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Selecciona una disposición" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="default">Por defecto</SelectItem>
								<SelectItem value="metadata-heavy">Metadata Extendida</SelectItem>
								<SelectItem value="image-focus">Enfoque en Imagen</SelectItem>
								<SelectItem value="stats-focus">Enfoque en Estadísticas</SelectItem>
								<SelectItem value="minimal">Minimalista</SelectItem>
								<SelectItem value="grid">Cuadrícula</SelectItem>
								<SelectItem value="masonry">Mosaico</SelectItem>
								<SelectItem value="carousel">Carrusel</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label className="text-sm">Alineación del Contenido</Label>
						<Select
							value={cardOptions.contentAlignment}
							onValueChange={(value) => handleOptionChange('contentAlignment', value)}
						>
							<SelectTrigger className="w-full">
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

					<div className="space-y-2">
						<Label className="text-sm">Estilo de Imagen</Label>
						<Select value={cardOptions.imageStyle} onValueChange={(value) => handleOptionChange('imageStyle', value)}>
							<SelectTrigger className="w-full">
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

					<div className="flex items-center justify-between space-x-3">
						<Label htmlFor="imageOverlay" className="text-sm flex items-center cursor-pointer gap-2">
							Superposición de Imagen
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<Info className="h-3 w-3 text-muted-foreground" />
									</TooltipTrigger>
									<TooltipContent className="text-xs max-w-xs">
										Añade una capa de superposición sobre la imagen
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</Label>
						<Switch
							id="imageOverlay"
							checked={cardOptions.imageOverlay}
							onCheckedChange={(checked) => handleOptionChange('imageOverlay', checked)}
						/>
					</div>

					{cardOptions.imageOverlay && (
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="imageOverlayOpacity" className="text-sm">
									Opacidad de Superposición
								</Label>
								<span className="text-xs font-mono text-muted-foreground">
									{cardOptions.imageOverlayOpacity || 0.3}
								</span>
							</div>
							<Slider
								id="imageOverlayOpacity"
								min={0}
								max={1}
								step={0.1}
								value={[cardOptions.imageOverlayOpacity || 0.3]}
								onValueChange={(value) => handleOptionChange('imageOverlayOpacity', value[0])}
								className="cursor-pointer"
							/>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
