'use client';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCallback } from 'react';
import type { AnimatedBorderConfig } from '../actions/animated-border-config.action';

// Definir los modos de mezcla disponibles
const BLEND_MODES = [
	'normal',
	'multiply',
	'screen',
	'overlay',
	'darken',
	'lighten',
];

interface AnimatedBorderSettingsProps {
	config: AnimatedBorderConfig;
	onConfigChange: (config: Partial<AnimatedBorderConfig>) => void;
}

export function AnimatedBorderSettings({ config, onConfigChange }: AnimatedBorderSettingsProps) {
	// Manejador genérico de cambios
	const handleChange = useCallback(
		(key: keyof AnimatedBorderConfig, value: any) => {
			onConfigChange({ [key]: value });
		},
		[onConfigChange]
	);

	return (
		<Card className="p-4 space-y-4">
			{/* Controles básicos */}
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<Label htmlFor="enabled">Activar Borde Animado</Label>
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
						checked={config.visibleOnHover}
						onCheckedChange={(checked) => handleChange('visibleOnHover', checked)}
					/>
				</div>

				<div className="flex items-center justify-between">
					<Label htmlFor="layerIndex">Índice de Capa</Label>
					<Input
						id="layerIndex"
						type="number"
						value={config.layerIndex}
						onChange={(e) => handleChange('layerIndex', Number.parseInt(e.target.value))}
						className="w-20"
					/>
				</div>
			</div>

			{/* Pestañas de configuración */}
			<Tabs defaultValue="animation" className="w-full">
				<TabsList className="w-full">
					<TabsTrigger value="animation" className="flex-1">Animación</TabsTrigger>
					<TabsTrigger value="appearance" className="flex-1">Apariencia</TabsTrigger>
					<TabsTrigger value="advanced" className="flex-1">Avanzado</TabsTrigger>
				</TabsList>

				{/* Configuración de Animación */}
				<TabsContent value="animation" className="space-y-4">
					<div className="space-y-4">
						<div className="space-y-2">
							<Label>Velocidad</Label>
							<Slider
								value={[config.animationSpeed || 1]}
								onValueChange={([value]) => handleChange('animationSpeed', value)}
								min={0.1}
								max={10}
								step={0.1}
							/>
						</div>

						<div className="space-y-2">
							<Label>Segmentos</Label>
							<Slider
								value={[config.segments || 4]}
								onValueChange={([value]) => handleChange('segments', value)}
								min={3}
								max={12}
								step={1}
							/>
						</div>
					</div>
				</TabsContent>

				{/* Configuración de Apariencia */}
				<TabsContent value="appearance" className="space-y-4">
					<div className="space-y-4">
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
								value={[config.width || 2]}
								onValueChange={([value]) => handleChange('width', value)}
								min={1}
								max={10}
								step={0.5}
							/>
						</div>

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
					</div>
				</TabsContent>

				{/* Configuración Avanzada */}
				<TabsContent value="advanced" className="space-y-4">
					<div className="space-y-4">
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
									{BLEND_MODES.map((mode: string) => (
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