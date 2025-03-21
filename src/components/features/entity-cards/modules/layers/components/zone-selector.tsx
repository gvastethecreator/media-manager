'use client';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useCallback } from 'react';

/**
 * Tipo para zonas de efecto
 */
export interface Zone {
	enabled: boolean;
	centerX?: number;
	centerY?: number;
	radius?: number;
	feather?: number;
	type?: string;
}

interface ZoneSelectorProps {
	zone: Zone;
	onChange: (zone: Zone) => void;
}

/**
 * 🎯 Selector de zona para efectos
 * Permite configurar una zona específica para aplicar efectos
 */
export function ZoneSelector({ zone, onChange }: ZoneSelectorProps) {
	// Manejador de cambios
	const handleChange = useCallback(
		(key: keyof Zone, value: any) => {
			onChange({ ...zone, [key]: value });
		},
		[zone, onChange]
	);

	return (
		<div className="space-y-4">
			{/* Activar zona */}
			<div className="flex items-center justify-between">
				<Label htmlFor="zone-enabled">Activar zona</Label>
				<Switch
					id="zone-enabled"
					checked={zone.enabled}
					onCheckedChange={(checked) => handleChange('enabled', checked)}
				/>
			</div>

			{zone.enabled && (
				<>
					{/* Tipo de zona */}
					<div className="space-y-2">
						<Label>Tipo de zona</Label>
						<Select
							value={zone.type || 'circle'}
							onValueChange={(value) => handleChange('type', value)}
						>
							<SelectTrigger>
								<SelectValue placeholder="Seleccionar tipo" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="circle">Círculo</SelectItem>
								<SelectItem value="rectangle">Rectángulo</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Posición X */}
					<div className="space-y-2">
						<Label>Posición X</Label>
						<Slider
							value={[zone.centerX || 0.5]}
							onValueChange={([value]) => handleChange('centerX', value)}
							min={0}
							max={1}
							step={0.01}
							className="w-full"
						/>
					</div>

					{/* Posición Y */}
					<div className="space-y-2">
						<Label>Posición Y</Label>
						<Slider
							value={[zone.centerY || 0.5]}
							onValueChange={([value]) => handleChange('centerY', value)}
							min={0}
							max={1}
							step={0.01}
							className="w-full"
						/>
					</div>

					{/* Radio (para círculo) */}
					<div className="space-y-2">
						<Label>Radio</Label>
						<Slider
							value={[zone.radius || 0.5]}
							onValueChange={([value]) => handleChange('radius', value)}
							min={0}
							max={1}
							step={0.01}
							className="w-full"
						/>
					</div>

					{/* Suavizado de bordes */}
					<div className="space-y-2">
						<Label>Suavizado de bordes</Label>
						<Slider
							value={[zone.feather || 0.2]}
							onValueChange={([value]) => handleChange('feather', value)}
							min={0}
							max={0.5}
							step={0.01}
							className="w-full"
						/>
					</div>
				</>
			)}
		</div>
	);
}