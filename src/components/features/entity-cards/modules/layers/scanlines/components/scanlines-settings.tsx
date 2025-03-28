'use client';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useCallback } from 'react';
import type { LayerSettingsProps } from '../../types';
import { BLEND_MODES, LINE_DIRECTIONS, PRESET_COLORS, type ScanlinesConfig } from '../scanlines-config-types';

/**
 * 📺 Componente de configuración para la capa de líneas de escaneo
 * @param config - Configuración actual
 * @param onConfigChange - Función para actualizar la configuración
 */
export const ScanlinesSettings: React.FC<LayerSettingsProps<ScanlinesConfig>> = ({ config, onConfigChange }) => {
	// 🔄 Manejador genérico de cambios
	const handleChange = useCallback(
		(changes: Partial<ScanlinesConfig>) => {
			onConfigChange({ ...config, ...changes });
		},
		[config, onConfigChange]
	);

	// 🎨 Renderizar los controles
	return (
		<TooltipProvider>
			<Card className="p-4 space-y-4" role="region" aria-label="Configuración de líneas de escaneo">
				{/* 🔧 Controles básicos */}
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<Tooltip>
							<TooltipTrigger asChild>
								<Label htmlFor="enabled" className="cursor-help">
									Activar capa
								</Label>
							</TooltipTrigger>
							<TooltipContent>
								<p>Activa o desactiva el efecto de líneas de escaneo</p>
							</TooltipContent>
						</Tooltip>
						<Switch
							id="enabled"
							checked={config.enabled}
							onCheckedChange={(checked) => handleChange({ enabled: checked })}
							aria-label="Activar capa de líneas de escaneo"
						/>
					</div>

					<div className="flex items-center justify-between">
						<Tooltip>
							<TooltipTrigger asChild>
								<Label htmlFor="visibleOnHover" className="cursor-help">
									Visible en hover
								</Label>
							</TooltipTrigger>
							<TooltipContent>
								<p>Muestra el efecto solo al pasar el cursor sobre la tarjeta</p>
							</TooltipContent>
						</Tooltip>
						<Switch
							id="visibleOnHover"
							checked={config.visibleOnHover}
							onCheckedChange={(checked) => handleChange({ visibleOnHover: checked })}
							aria-label="Mostrar efecto al pasar el cursor"
						/>
					</div>

					<div className="space-y-2">
						<Tooltip>
							<TooltipTrigger asChild>
								<Label htmlFor="layerIndex" className="cursor-help">
									Orden de capa
								</Label>
							</TooltipTrigger>
							<TooltipContent>
								<p>Determina la posición de la capa en el stack visual</p>
							</TooltipContent>
						</Tooltip>
						<Input
							id="layerIndex"
							type="number"
							value={config.layerIndex}
							onChange={(e) => handleChange({ layerIndex: Number.parseInt(e.target.value) })}
							min={0}
							aria-label="Orden de la capa"
						/>
					</div>
				</div>

				{/* 📑 Pestañas de configuración */}
				<Tabs defaultValue="lines" className="w-full">
					<TabsList className="w-full" aria-label="Opciones de configuración">
						<TabsTrigger value="lines" className="flex-1">
							Líneas
						</TabsTrigger>
						<TabsTrigger value="appearance" className="flex-1">
							Apariencia
						</TabsTrigger>
						<TabsTrigger value="animation" className="flex-1">
							Animación
						</TabsTrigger>
					</TabsList>

					{/* 📏 Configuración de líneas */}
					<TabsContent value="lines" className="space-y-4">
						<div className="space-y-2">
							<Tooltip>
								<TooltipTrigger asChild>
									<Label className="cursor-help">Dirección</Label>
								</TooltipTrigger>
								<TooltipContent>
									<p>Orientación de las líneas de escaneo</p>
								</TooltipContent>
							</Tooltip>
							<Select
								value={config.direction}
								onValueChange={(value) => handleChange({ direction: value as ScanlinesConfig['direction'] })}
								aria-label="Dirección de las líneas"
							>
								<SelectTrigger>
									<SelectValue placeholder="Seleccionar dirección" />
								</SelectTrigger>
								<SelectContent>
									{LINE_DIRECTIONS.map((direction) => (
										<SelectItem key={direction} value={direction}>
											{direction === 'horizontal' ? 'Horizontal' : 'Vertical'}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Tooltip>
								<TooltipTrigger asChild>
									<Label className="cursor-help">Grosor de línea</Label>
								</TooltipTrigger>
								<TooltipContent>
									<p>Ancho de las líneas de escaneo en píxeles</p>
								</TooltipContent>
							</Tooltip>
							<Slider
								value={[config.lineWidth]}
								onValueChange={([value]) => handleChange({ lineWidth: value })}
								min={0.5}
								max={5}
								step={0.5}
								aria-label="Grosor de línea"
							/>
						</div>

						<div className="space-y-2">
							<Tooltip>
								<TooltipTrigger asChild>
									<Label className="cursor-help">Espaciado</Label>
								</TooltipTrigger>
								<TooltipContent>
									<p>Distancia entre líneas de escaneo</p>
								</TooltipContent>
							</Tooltip>
							<Slider
								value={[config.lineSpacing]}
								onValueChange={([value]) => handleChange({ lineSpacing: value })}
								min={1}
								max={20}
								step={1}
								aria-label="Espaciado entre líneas"
							/>
						</div>

						<div className="space-y-2">
							<Tooltip>
								<TooltipTrigger asChild>
									<Label className="cursor-help">Desplazamiento</Label>
								</TooltipTrigger>
								<TooltipContent>
									<p>Ajusta la posición inicial de las líneas</p>
								</TooltipContent>
							</Tooltip>
							<Slider
								value={[config.offset]}
								onValueChange={([value]) => handleChange({ offset: value })}
								min={-20}
								max={20}
								step={1}
								aria-label="Desplazamiento de líneas"
							/>
						</div>
					</TabsContent>

					{/* 🎨 Configuración de apariencia */}
					<TabsContent value="appearance" className="space-y-4">
						<div className="space-y-2">
							<Tooltip>
								<TooltipTrigger asChild>
									<Label className="cursor-help">Color</Label>
								</TooltipTrigger>
								<TooltipContent>
									<p>Color de las líneas de escaneo</p>
								</TooltipContent>
							</Tooltip>
							<Select
								value={config.color}
								onValueChange={(value) => handleChange({ color: value })}
								aria-label="Color de las líneas"
							>
								<SelectTrigger>
									<SelectValue placeholder="Seleccionar color" />
								</SelectTrigger>
								<SelectContent>
									{Object.entries(PRESET_COLORS).map(([key, color]) => (
										<SelectItem key={key} value={color}>
											{key.toLowerCase()}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Tooltip>
								<TooltipTrigger asChild>
									<Label className="cursor-help">Opacidad</Label>
								</TooltipTrigger>
								<TooltipContent>
									<p>Transparencia de las líneas de escaneo</p>
								</TooltipContent>
							</Tooltip>
							<Slider
								value={[config.opacity]}
								onValueChange={([value]) => handleChange({ opacity: value })}
								min={0}
								max={1}
								step={0.01}
								aria-label="Opacidad de las líneas"
							/>
						</div>

						<div className="space-y-2">
							<Tooltip>
								<TooltipTrigger asChild>
									<Label className="cursor-help">Modo de fusión</Label>
								</TooltipTrigger>
								<TooltipContent>
									<p>Determina cómo se mezclan las líneas con el fondo</p>
								</TooltipContent>
							</Tooltip>
							<Select
								value={config.blendMode}
								onValueChange={(value) => handleChange({ blendMode: value })}
								aria-label="Modo de fusión"
							>
								<SelectTrigger>
									<SelectValue placeholder="Seleccionar modo" />
								</SelectTrigger>
								<SelectContent>
									{BLEND_MODES.map((mode) => (
										<SelectItem key={mode} value={mode}>
											{mode}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</TabsContent>

					{/* 🎬 Configuración de animación */}
					<TabsContent value="animation" className="space-y-4">
						<div className="flex items-center justify-between">
							<Tooltip>
								<TooltipTrigger asChild>
									<Label htmlFor="animated" className="cursor-help">
										Animación
									</Label>
								</TooltipTrigger>
								<TooltipContent>
									<p>Activa el movimiento de las líneas</p>
								</TooltipContent>
							</Tooltip>
							<Switch
								id="animated"
								checked={config.animated}
								onCheckedChange={(checked) => handleChange({ animated: checked })}
								aria-label="Activar animación"
							/>
						</div>

						<div className="space-y-2">
							<Tooltip>
								<TooltipTrigger asChild>
									<Label className="cursor-help">Velocidad</Label>
								</TooltipTrigger>
								<TooltipContent>
									<p>Velocidad de movimiento de las líneas</p>
								</TooltipContent>
							</Tooltip>
							<Slider
								value={[config.speed]}
								onValueChange={([value]) => handleChange({ speed: value })}
								min={0}
								max={10}
								step={0.1}
								disabled={!config.animated}
								aria-label="Velocidad de animación"
							/>
						</div>
					</TabsContent>
				</Tabs>
			</Card>
		</TooltipProvider>
	);
};
