'use client';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCallback } from 'react';
import type { LayerSettingsProps } from '../../types';
import { BLEND_MODES, LINE_DIRECTIONS, PRESET_COLORS, type ScanlinesConfig } from '../actions/scanlines-config.action';

export const ScanlinesSettings: React.FC<LayerSettingsProps<ScanlinesConfig>> = ({
	config,
	onConfigChange,
}) => {
	// 🔄 Manejador genérico de cambios
	const handleChange = useCallback((changes: Partial<ScanlinesConfig>) => {
		onConfigChange({ ...config, ...changes });
	}, [config, onConfigChange]);

	// 🎨 Renderizar los controles
	return (
		<Card className="p-4 space-y-4">
			{/* 🔧 Controles básicos */}
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<Label htmlFor="enabled">Activar capa</Label>
					<Switch
						id="enabled"
						checked={config.enabled}
						onCheckedChange={(checked) => handleChange({ enabled: checked })}
					/>
				</div>

				<div className="flex items-center justify-between">
					<Label htmlFor="visibleOnHover">Visible en hover</Label>
					<Switch
						id="visibleOnHover"
						checked={config.visibleOnHover}
						onCheckedChange={(checked) => handleChange({ visibleOnHover: checked })}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="layerIndex">Orden de capa</Label>
					<Input
						id="layerIndex"
						type="number"
						value={config.layerIndex}
						onChange={(e) => handleChange({ layerIndex: Number.parseInt(e.target.value) })}
						min={0}
					/>
				</div>
			</div>

			{/* 📑 Pestañas de configuración */}
			<Tabs defaultValue="lines" className="w-full">
				<TabsList className="w-full">
					<TabsTrigger value="lines" className="flex-1">Líneas</TabsTrigger>
					<TabsTrigger value="appearance" className="flex-1">Apariencia</TabsTrigger>
					<TabsTrigger value="animation" className="flex-1">Animación</TabsTrigger>
				</TabsList>

				{/* 📏 Configuración de líneas */}
				<TabsContent value="lines" className="space-y-4">
					<div className="space-y-2">
						<Label>Dirección</Label>
						<Select
							value={config.direction}
							onValueChange={(value) => handleChange({ direction: value as ScanlinesConfig['direction'] })}
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
						<Label>Grosor de línea</Label>
						<Slider
							value={[config.lineWidth]}
							onValueChange={([value]) => handleChange({ lineWidth: value })}
							min={0.5}
							max={5}
							step={0.5}
						/>
					</div>

					<div className="space-y-2">
						<Label>Espaciado</Label>
						<Slider
							value={[config.lineSpacing]}
							onValueChange={([value]) => handleChange({ lineSpacing: value })}
							min={1}
							max={20}
							step={1}
						/>
					</div>

					<div className="space-y-2">
						<Label>Desplazamiento</Label>
						<Slider
							value={[config.offset]}
							onValueChange={([value]) => handleChange({ offset: value })}
							min={-20}
							max={20}
							step={1}
						/>
					</div>
				</TabsContent>

				{/* 🎨 Configuración de apariencia */}
				<TabsContent value="appearance" className="space-y-4">
					<div className="space-y-2">
						<Label>Color</Label>
						<Select
							value={config.color}
							onValueChange={(value) => handleChange({ color: value })}
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
						<Label>Opacidad</Label>
						<Slider
							value={[config.opacity]}
							onValueChange={([value]) => handleChange({ opacity: value })}
							min={0}
							max={1}
							step={0.01}
						/>
					</div>

					<div className="space-y-2">
						<Label>Modo de fusión</Label>
						<Select
							value={config.blendMode}
							onValueChange={(value) => handleChange({ blendMode: value })}
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
						<Label htmlFor="animated">Animación</Label>
						<Switch
							id="animated"
							checked={config.animated}
							onCheckedChange={(checked) => handleChange({ animated: checked })}
						/>
					</div>

					<div className="space-y-2">
						<Label>Velocidad</Label>
						<Slider
							value={[config.speed]}
							onValueChange={([value]) => handleChange({ speed: value })}
							min={0}
							max={10}
							step={0.1}
							disabled={!config.animated}
						/>
					</div>
				</TabsContent>
			</Tabs>
		</Card>
	);
};