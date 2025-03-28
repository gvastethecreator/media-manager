'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCallback } from 'react';
import type { LayerSettingsProps } from '../../types';
import { BLEND_MODES, TEXTURE_PRESETS, TILE_MODES, type TextureConfig } from '../texture-config-types';

export const TextureSettings: React.FC<LayerSettingsProps<TextureConfig>> = ({ config, onConfigChange }) => {
	// 🔄 Manejador genérico de cambios
	const handleChange = useCallback(
		(changes: Partial<TextureConfig>) => {
			onConfigChange({ ...config, ...changes });
		},
		[config, onConfigChange]
	);

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
			<Tabs defaultValue="texture" className="w-full">
				<TabsList className="w-full">
					<TabsTrigger value="texture" className="flex-1">
						Textura
					</TabsTrigger>
					<TabsTrigger value="transform" className="flex-1">
						Transformación
					</TabsTrigger>
					<TabsTrigger value="filters" className="flex-1">
						Filtros
					</TabsTrigger>
				</TabsList>

				{/* 🖼️ Configuración de textura */}
				<TabsContent value="texture" className="space-y-4">
					<div className="space-y-2">
						<Label>Textura predefinida</Label>
						<Select value={config.textureUrl} onValueChange={(value) => handleChange({ textureUrl: value })}>
							<SelectTrigger>
								<SelectValue placeholder="Seleccionar textura" />
							</SelectTrigger>
							<SelectContent>
								{Object.entries(TEXTURE_PRESETS).map(([key, preset]) => (
									<SelectItem key={key} value={preset.url}>
										{preset.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label>Modo de mosaico</Label>
						<Select
							value={config.tileMode}
							onValueChange={(value) => handleChange({ tileMode: value as TextureConfig['tileMode'] })}
						>
							<SelectTrigger>
								<SelectValue placeholder="Seleccionar modo" />
							</SelectTrigger>
							<SelectContent>
								{TILE_MODES.map((mode) => (
									<SelectItem key={mode} value={mode}>
										{mode}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label>Modo de fusión</Label>
						<Select value={config.blendMode} onValueChange={(value) => handleChange({ blendMode: value })}>
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

				{/* 🔄 Configuración de transformación */}
				<TabsContent value="transform" className="space-y-4">
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
						<Label>Escala</Label>
						<Slider
							value={[config.scale]}
							onValueChange={([value]) => handleChange({ scale: value })}
							min={0.1}
							max={5}
							step={0.1}
						/>
					</div>

					<div className="space-y-2">
						<Label>Rotación</Label>
						<Slider
							value={[config.rotation]}
							onValueChange={([value]) => handleChange({ rotation: value })}
							min={0}
							max={360}
							step={1}
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Offset X</Label>
							<Input
								type="number"
								value={config.offsetX}
								onChange={(e) => handleChange({ offsetX: Number.parseInt(e.target.value) })}
							/>
						</div>
						<div className="space-y-2">
							<Label>Offset Y</Label>
							<Input
								type="number"
								value={config.offsetY}
								onChange={(e) => handleChange({ offsetY: Number.parseInt(e.target.value) })}
							/>
						</div>
					</div>
				</TabsContent>

				{/* 🎨 Configuración de filtros */}
				<TabsContent value="filters" className="space-y-4">
					<div className="space-y-2">
						<Label>Brillo</Label>
						<Slider
							value={[config.filters?.brightness ?? 100]}
							onValueChange={([value]) =>
								handleChange({
									filters: { ...config.filters, brightness: value },
								})
							}
							min={0}
							max={200}
							step={1}
						/>
					</div>

					<div className="space-y-2">
						<Label>Contraste</Label>
						<Slider
							value={[config.filters?.contrast ?? 100]}
							onValueChange={([value]) =>
								handleChange({
									filters: { ...config.filters, contrast: value },
								})
							}
							min={0}
							max={200}
							step={1}
						/>
					</div>

					<div className="space-y-2">
						<Label>Saturación</Label>
						<Slider
							value={[config.filters?.saturation ?? 100]}
							onValueChange={([value]) =>
								handleChange({
									filters: { ...config.filters, saturation: value },
								})
							}
							min={0}
							max={200}
							step={1}
						/>
					</div>

					<div className="space-y-2">
						<Label>Desenfoque</Label>
						<Slider
							value={[config.filters?.blur ?? 0]}
							onValueChange={([value]) =>
								handleChange({
									filters: { ...config.filters, blur: value },
								})
							}
							min={0}
							max={20}
							step={0.1}
						/>
					</div>

					<Button variant="outline" onClick={() => handleChange({ filters: undefined })} className="w-full">
						Restablecer filtros
					</Button>
				</TabsContent>
			</Tabs>
		</Card>
	);
};
