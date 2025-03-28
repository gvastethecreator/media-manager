'use client';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useCallback } from 'react';
import type { BorderConfig } from './border-effect-layer';

interface BorderSettingsProps {
	config: BorderConfig;
	onChange: (config: Partial<BorderConfig>) => void;
}

/**
 * 🔲 Configuración para la capa de borde
 */
export function BorderSettings({ config, onChange }: BorderSettingsProps) {
	// Manejador de cambios genérico
	const handleChange = useCallback(
		(key: keyof BorderConfig, value: any) => {
			onChange({ [key]: value });
		},
		[onChange]
	);

	return (
		<div className="space-y-6">
			{/* Activación del borde */}
			<div className="flex items-center justify-between">
				<Label htmlFor="enabled">Activar Borde</Label>
				<Switch id="enabled" checked={config.enabled} onCheckedChange={(checked) => handleChange('enabled', checked)} />
			</div>

			{/* Control de ancho */}
			<div className="space-y-2">
				<Label>Ancho del borde</Label>
				<Slider
					value={[config.width]}
					onValueChange={([value]) => handleChange('width', value)}
					min={0}
					max={10}
					step={0.5}
					className="w-full"
				/>
			</div>

			{/* Estilo del borde */}
			<div className="space-y-2">
				<Label>Estilo del borde</Label>
				<Select value={config.style} onValueChange={(value) => handleChange('style', value)}>
					<SelectTrigger>
						<SelectValue placeholder="Seleccionar estilo" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="solid">Sólido</SelectItem>
						<SelectItem value="dashed">Discontinuo</SelectItem>
						<SelectItem value="dotted">Punteado</SelectItem>
						<SelectItem value="double">Doble</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Color del borde */}
			<div className="space-y-2">
				<Label>Color</Label>
				<div className="flex gap-2 items-center">
					<input
						type="color"
						value={config.color}
						onChange={(e) => handleChange('color', e.target.value)}
						className="w-10 h-10 rounded cursor-pointer"
					/>
					<span className="text-sm text-gray-500">{config.color}</span>
				</div>
			</div>

			{/* Radio de esquinas */}
			<div className="space-y-2">
				<Label>Radio de esquinas</Label>
				<Slider
					value={[config.radius || 0]}
					onValueChange={([value]) => handleChange('radius', value)}
					min={0}
					max={50}
					step={1}
					className="w-full"
				/>
			</div>

			{/* Activación de animación */}
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<Label htmlFor="animated">Animación</Label>
					<Switch
						id="animated"
						checked={config.animated || false}
						onCheckedChange={(checked) => handleChange('animated', checked)}
					/>
				</div>

				{config.animated && (
					<>
						<div className="space-y-2">
							<Label>Tipo de animación</Label>
							<Select
								value={config.animationType || 'none'}
								onValueChange={(value) => handleChange('animationType', value)}
							>
								<SelectTrigger>
									<SelectValue placeholder="Seleccionar tipo" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">Ninguna</SelectItem>
									<SelectItem value="pulse">Pulso</SelectItem>
									<SelectItem value="flow">Flujo</SelectItem>
									<SelectItem value="rainbow">Arcoíris</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label>Velocidad de animación</Label>
							<Slider
								value={[config.animationSpeed || 1]}
								onValueChange={([value]) => handleChange('animationSpeed', value)}
								min={0.1}
								max={5}
								step={0.1}
								className="w-full"
							/>
						</div>
					</>
				)}
			</div>

			{/* Control de brillo */}
			<div className="space-y-2">
				<Label>Cantidad de brillo</Label>
				<Slider
					value={[config.glowAmount || 0]}
					onValueChange={([value]) => handleChange('glowAmount', value)}
					min={0}
					max={20}
					step={1}
					className="w-full"
				/>
			</div>

			{/* Control de opacidad */}
			<div className="space-y-2">
				<Label>Opacidad</Label>
				<Slider
					value={[config.opacity || 1]}
					onValueChange={([value]) => handleChange('opacity', value)}
					min={0}
					max={1}
					step={0.05}
					className="w-full"
				/>
			</div>

			{/* Visible en hover */}
			<div className="flex items-center justify-between">
				<Label htmlFor="visibleOnHover">Visible en hover</Label>
				<Switch
					id="visibleOnHover"
					checked={config.visibleOnHover || false}
					onCheckedChange={(checked) => handleChange('visibleOnHover', checked)}
				/>
			</div>
		</div>
	);
}
