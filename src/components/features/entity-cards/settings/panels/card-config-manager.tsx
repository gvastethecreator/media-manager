'use client';

import type { CardOptions } from '@/components/features/entity-cards/types/base-card-types';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

interface CardConfigManagerProps {
	options: CardOptions;
	onOptionsChange: (options: CardOptions) => void;
}

export function CardConfigManager({ options, onOptionsChange }: CardConfigManagerProps) {
	// Manejadores para cambios específicos
	const handle3DEffectChange = (checked: boolean) => {
		onOptionsChange({
			...options,
			enable3DEffect: checked,
		});
	};

	const handleHolographicEffectChange = (checked: boolean) => {
		onOptionsChange({
			...options,
			enableHolographicEffect: checked,
		});
	};

	const handleScanlinesChange = (checked: boolean) => {
		onOptionsChange({
			...options,
			enableScanlines: checked,
		});
	};

	const handleGlowEffectChange = (checked: boolean) => {
		onOptionsChange({
			...options,
			enableGlowEffect: checked,
		});
	};

	const handleGrainEffectChange = (checked: boolean) => {
		onOptionsChange({
			...options,
			enableGrainEffect: checked,
		});
	};

	const handleHoverLiftChange = (value: number[]) => {
		onOptionsChange({
			...options,
			hoverLiftHeight: value[0],
		});
	};

	const handleMaxRotationChange = (value: number[]) => {
		onOptionsChange({
			...options,
			maxRotation: value[0],
		});
	};

	return (
		<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
			{/* Efectos básicos */}
			<div className="space-y-2">
				<h4 className="text-sm font-medium">Efectos Básicos</h4>
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<Label htmlFor="3d-effect" className="text-xs">
							Efecto 3D
						</Label>
						<Switch id="3d-effect" checked={options.enable3DEffect} onCheckedChange={handle3DEffectChange} />
					</div>
					<div className="flex items-center justify-between">
						<Label htmlFor="holographic-effect" className="text-xs">
							Efecto Holográfico
						</Label>
						<Switch
							id="holographic-effect"
							checked={options.enableHolographicEffect}
							onCheckedChange={handleHolographicEffectChange}
						/>
					</div>
					<div className="flex items-center justify-between">
						<Label htmlFor="scanlines-effect" className="text-xs">
							Efecto Scanlines
						</Label>
						<Switch id="scanlines-effect" checked={options.enableScanlines} onCheckedChange={handleScanlinesChange} />
					</div>
					<div className="flex items-center justify-between">
						<Label htmlFor="glow-effect" className="text-xs">
							Efecto de Brillo
						</Label>
						<Switch id="glow-effect" checked={options.enableGlowEffect} onCheckedChange={handleGlowEffectChange} />
					</div>
					<div className="flex items-center justify-between">
						<Label htmlFor="grain-effect" className="text-xs">
							Efecto de Grano
						</Label>
						<Switch id="grain-effect" checked={options.enableGrainEffect} onCheckedChange={handleGrainEffectChange} />
					</div>
				</div>
			</div>

			{/* Configuración de movimiento */}
			<div className="space-y-2">
				<h4 className="text-sm font-medium">Movimiento</h4>
				<div className="space-y-3">
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label htmlFor="hover-lift" className="text-xs">
								Elevación al Hover
							</Label>
							<span className="text-xs text-muted-foreground">{options.hoverLiftHeight || 0}px</span>
						</div>
						<Slider
							id="hover-lift"
							min={0}
							max={20}
							step={1}
							value={[options.hoverLiftHeight || 0]}
							onValueChange={handleHoverLiftChange}
							className={cn('w-full', options.enable3DEffect ? 'opacity-100' : 'opacity-50')}
							disabled={!options.enable3DEffect}
						/>
					</div>
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label htmlFor="max-rotation" className="text-xs">
								Rotación Máxima
							</Label>
							<span className="text-xs text-muted-foreground">{options.maxRotation || 0}°</span>
						</div>
						<Slider
							id="max-rotation"
							min={0}
							max={30}
							step={1}
							value={[options.maxRotation || 0]}
							onValueChange={handleMaxRotationChange}
							className={cn('w-full', options.enable3DEffect ? 'opacity-100' : 'opacity-50')}
							disabled={!options.enable3DEffect}
						/>
					</div>
				</div>
			</div>
		</motion.div>
	);
}
