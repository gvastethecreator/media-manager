'use client';

import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useCallback } from 'react';

/**
 * Tipo para configuración de movimiento
 */
export interface Motion {
	angle: number;
	distance: number;
}

interface MotionControlsProps {
	motion: Motion;
	onChange: (motion: Motion) => void;
}

/**
 * 🏃‍♂️ Controles de movimiento para efectos
 */
export function MotionControls({ motion, onChange }: MotionControlsProps) {
	// Manejador de cambios
	const handleChange = useCallback(
		(key: keyof Motion, value: any) => {
			onChange({ ...motion, [key]: value });
		},
		[motion, onChange]
	);

	return (
		<div className="space-y-4">
			{/* Ángulo de movimiento */}
			<div className="space-y-2">
				<Label>Ángulo (grados)</Label>
				<Slider
					value={[motion.angle]}
					onValueChange={([value]) => handleChange('angle', value)}
					min={0}
					max={360}
					step={5}
					className="w-full"
				/>
				<div className="text-xs text-right text-gray-500">{motion.angle}°</div>
			</div>

			{/* Distancia de movimiento */}
			<div className="space-y-2">
				<Label>Distancia</Label>
				<Slider
					value={[motion.distance]}
					onValueChange={([value]) => handleChange('distance', value)}
					min={0}
					max={100}
					step={1}
					className="w-full"
				/>
				<div className="text-xs text-right text-gray-500">{motion.distance}px</div>
			</div>
		</div>
	);
}