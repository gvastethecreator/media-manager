'use client';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCallback } from 'react';
import type { BorderConfig } from '../actions/border-config.action';

// Constantes para opciones de selección
const BORDER_STYLES = ['solid', 'dashed', 'dotted', 'double'];
const BLEND_MODES = ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion'];

// Extender la interfaz BorderConfig para incluir propiedades adicionales
interface ExtendedBorderConfig extends BorderConfig {
	visibleOnHover?: boolean;
	layerIndex?: number;
	glow?: boolean;
	glowColor?: string;
	glowRadius?: number;
	gradient?: boolean;
	gradientAngle?: number;
	gradientColors?: string[];
	blendMode?: string;
}

interface BorderSettingsProps {
	config: ExtendedBorderConfig;
	onConfigChange: (config: Partial<ExtendedBorderConfig>) => void;
}

export function BorderSettings({ config, onConfigChange }: BorderSettingsProps) {
	// Manejador genérico de cambios
	const handleChange = useCallback(
		(key: keyof ExtendedBorderConfig, value: any) => {
			onConfigChange({ [key]: value });
		},
		[onConfigChange]
	);

	return (
		<Card className="p-4 space-y-4">
			{/* Controles básicos */}
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<Label htmlFor="enabled">Activar Borde</Label>
					<Switch
						id="enabled"
						checked={config.enabled}
						onCheckedChange={(checked) => handleChange('enabled', checked)}
					/>
				</div>

				<div className="flex items-center justify-between">
					<Label htmlFor="visibleOnHover">Visible en Hover</Label>
					<Switch
						id="visibleOnHover"
						checked={config.visibleOnHover || false}
						onCheckedChange={(checked) => handleChange('visibleOnHover', checked)}
					/>
				</div>

				<div className="flex items-center justify-between">
					<Label htmlFor="layerIndex">Índice de Capa</Label>
					<Input
						id="layerIndex"
						type="number"
						value={config.layerIndex || 1}
						onChange={(e) => handleChange('layerIndex', Number.parseInt(e.target.value))}
						className="w-20"
					/>
				</div>
			</div>

			{/* Pestañas de configuración */}
			<Tabs defaultValue="style" className="w-full">
				<TabsList className="w-full">
					<TabsTrigger value="style" className="flex-1">Estilo</TabsTrigger>
					<TabsTrigger value="effects" className="flex-1">Efectos</TabsTrigger>
					<TabsTrigger value="advanced" className="flex-1">Avanzado</TabsTrigger>
				</TabsList>

				{/* Configuración de Estilo */}
				<TabsContent value="style" className="space-y-4">
					<div className="space-y-4">
						<div className="space-y-2">
							<Label>Estilo de Borde</Label>
							<Select
								value={config.style || 'solid'}
								onValueChange={(value) => handleChange('style', value)}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{BORDER_STYLES.map((style) => (
										<SelectItem key={style} value={style}>
											{style}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label>Color</Label>
							<Input
								type="color"
								value={config.color || '#ffffff'}
								onChange={(e) => handleChange('color', e.target.value)}
							/>
						</div>

						<div className="space-y-2">
							<Label>Ancho</Label>
							<Slider
								value={[config.width || 1]}
								onValueChange={([value]) => handleChange('width', value)}
								min={0}
								max={10}
								step={0.5}
							/>
						</div>

						<div className="space-y-2">
							<Label>Radio de Esquinas</Label>
							<Slider
								value={[config.radius || 0]}
								onValueChange={([value]) => handleChange('radius', value)}
								min={0}
								max={50}
								step={1}
							/>
						</div>
					</div>
				</TabsContent>

				{/* Configuración de Efectos */}
				<TabsContent value="effects" className="space-y-4">
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<Label htmlFor="glow">Efecto Brillo</Label>
							<Switch
								id="glow"
								checked={config.glow || false}
								onCheckedChange={(checked) => handleChange('glow', checked)}
							/>
						</div>

						{config.glow && (
							<>
								<div className="space-y-2">
									<Label>Color de Brillo</Label>
									<Input
										type="color"
										value={config.glowColor || config.color || '#ffffff'}
										onChange={(e) => handleChange('glowColor', e.target.value)}
									/>
								</div>

								<div className="space-y-2">
									<Label>Radio de Brillo</Label>
									<Slider
										value={[config.glowRadius || 10]}
										onValueChange={([value]) => handleChange('glowRadius', value)}
										min={0}
										max={50}
										step={1}
									/>
								</div>
							</>
						)}

						<div className="flex items-center justify-between">
							<Label htmlFor="gradient">Gradiente</Label>
							<Switch
								id="gradient"
								checked={config.gradient || false}
								onCheckedChange={(checked) => handleChange('gradient', checked)}
							/>
						</div>

						{config.gradient && (
							<>
								<div className="space-y-2">
									<Label>Ángulo del Gradiente</Label>
									<Slider
										value={[config.gradientAngle || 45]}
										onValueChange={([value]) => handleChange('gradientAngle', value)}
										min={0}
										max={360}
										step={15}
									/>
								</div>

								<div className="space-y-2">
									<Label>Colores del Gradiente</Label>
									<div className="flex gap-2">
										{(config.gradientColors || ['#ffffff', '#000000']).map((color, index) => (
											<Input
												key={index}
												type="color"
												value={color}
												onChange={(e) => {
													const newColors = [...(config.gradientColors || ['#ffffff', '#000000'])];
													newColors[index] = e.target.value;
													handleChange('gradientColors', newColors);
												}}
											/>
										))}
									</div>
								</div>
							</>
						)}
					</div>
				</TabsContent>

				{/* Configuración Avanzada */}
				<TabsContent value="advanced" className="space-y-4">
					<div className="space-y-4">
						<div className="space-y-2">
							<Label>Opacidad</Label>
							<Slider
								value={[config.opacity || 1]}
								onValueChange={([value]) => handleChange('opacity', value)}
								min={0}
								max={1}
								step={0.1}
							/>
						</div>

						<div className="space-y-2">
							<Label>Modo de Mezcla</Label>
							<Select
								value={config.blendMode || 'normal'}
								onValueChange={(value) => handleChange('blendMode', value)}
							>
								<SelectTrigger>
									<SelectValue />
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
					</div>
				</TabsContent>
			</Tabs>
		</Card>
	);
}