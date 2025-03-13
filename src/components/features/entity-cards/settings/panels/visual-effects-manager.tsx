'use client';

import type { CardOptions } from '@/components/features/entity-cards/types/base-card-types';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

interface VisualEffectsManagerProps {
	holographicOptions?: CardOptions['holographicOptions'];
	scanlinesOptions?: CardOptions['scanlinesOptions'];
	glowOptions?: CardOptions['glowOptions'];
	borderOptions?: CardOptions['borderOptions'];
	grainOptions?: CardOptions['grainOptions'];
	onHolographicOptionsChange: (options: CardOptions['holographicOptions']) => void;
	onScanlinesOptionsChange: (options: CardOptions['scanlinesOptions']) => void;
	onGlowOptionsChange: (options: CardOptions['glowOptions']) => void;
	onBorderOptionsChange: (options: CardOptions['borderOptions']) => void;
	onGrainOptionsChange: (options: CardOptions['grainOptions']) => void;
}

export function VisualEffectsManager({
	holographicOptions,
	scanlinesOptions,
	glowOptions,
	borderOptions,
	grainOptions,
	onHolographicOptionsChange,
	onScanlinesOptionsChange,
	onGlowOptionsChange,
	onBorderOptionsChange,
	onGrainOptionsChange,
}: VisualEffectsManagerProps) {
	return (
		<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
			{/* Opciones Holográficas */}
			<div className="space-y-3">
				<h4 className="text-sm font-medium">Efecto Holográfico</h4>
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<Label htmlFor="holographic-intensity" className="text-xs">
							Intensidad
						</Label>
						<span className="text-xs text-muted-foreground">
							{Math.round((holographicOptions?.intensity || 0) * 100)}%
						</span>
					</div>
					<Slider
						id="holographic-intensity"
						min={0}
						max={1}
						step={0.01}
						value={[holographicOptions?.intensity || 0]}
						onValueChange={(value) =>
							onHolographicOptionsChange({
								...holographicOptions,
								intensity: value[0],
							})
						}
						className="w-full"
					/>
					<div className="flex items-center justify-between">
						<Label htmlFor="holographic-speed" className="text-xs">
							Velocidad de Animación
						</Label>
						<span className="text-xs text-muted-foreground">{holographicOptions?.animationSpeed || 1}x</span>
					</div>
					<Slider
						id="holographic-speed"
						min={0.5}
						max={2}
						step={0.1}
						value={[holographicOptions?.animationSpeed || 1]}
						onValueChange={(value) =>
							onHolographicOptionsChange({
								...holographicOptions,
								animationSpeed: value[0],
							})
						}
						className="w-full"
					/>
				</div>
			</div>

			{/* Opciones de Scanlines */}
			<div className="space-y-3">
				<h4 className="text-sm font-medium">Efecto Scanlines</h4>
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<Label htmlFor="scanlines-intensity" className="text-xs">
							Intensidad
						</Label>
						<span className="text-xs text-muted-foreground">
							{Math.round((scanlinesOptions?.intensity || 0) * 100)}%
						</span>
					</div>
					<Slider
						id="scanlines-intensity"
						min={0}
						max={1}
						step={0.01}
						value={[scanlinesOptions?.intensity || 0]}
						onValueChange={(value) =>
							onScanlinesOptionsChange({
								...scanlinesOptions,
								intensity: value[0],
							})
						}
						className="w-full"
					/>
					<div className="flex items-center justify-between">
						<Label htmlFor="scanlines-density" className="text-xs">
							Densidad
						</Label>
						<span className="text-xs text-muted-foreground">{Math.round((scanlinesOptions?.density || 0) * 100)}%</span>
					</div>
					<Slider
						id="scanlines-density"
						min={0}
						max={1}
						step={0.01}
						value={[scanlinesOptions?.density || 0]}
						onValueChange={(value) =>
							onScanlinesOptionsChange({
								...scanlinesOptions,
								density: value[0],
							})
						}
						className="w-full"
					/>
				</div>
			</div>

			{/* Opciones de Brillo */}
			<div className="space-y-3">
				<h4 className="text-sm font-medium">Efecto de Brillo</h4>
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<Label htmlFor="glow-intensity" className="text-xs">
							Intensidad
						</Label>
						<span className="text-xs text-muted-foreground">{Math.round((glowOptions?.intensity || 0) * 100)}%</span>
					</div>
					<Slider
						id="glow-intensity"
						min={0}
						max={1}
						step={0.01}
						value={[glowOptions?.intensity || 0]}
						onValueChange={(value) =>
							onGlowOptionsChange({
								...glowOptions,
								intensity: value[0],
							})
						}
						className="w-full"
					/>
					<div className="flex items-center justify-between">
						<Label htmlFor="glow-size" className="text-xs">
							Tamaño
						</Label>
						<span className="text-xs text-muted-foreground">{glowOptions?.size || 20}px</span>
					</div>
					<Slider
						id="glow-size"
						min={0}
						max={50}
						step={1}
						value={[glowOptions?.size || 20]}
						onValueChange={(value) =>
							onGlowOptionsChange({
								...glowOptions,
								size: value[0],
							})
						}
						className="w-full"
					/>
				</div>
			</div>

			{/* Opciones de Borde */}
			<div className="space-y-3">
				<h4 className="text-sm font-medium">Efecto de Borde</h4>
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<Label htmlFor="border-width" className="text-xs">
							Ancho del Borde
						</Label>
						<span className="text-xs text-muted-foreground">{borderOptions?.width || 1}px</span>
					</div>
					<Slider
						id="border-width"
						min={0}
						max={5}
						step={0.5}
						value={[borderOptions?.width || 1]}
						onValueChange={(value) =>
							onBorderOptionsChange({
								...borderOptions,
								width: value[0],
							})
						}
						className="w-full"
					/>
					<div className="flex items-center justify-between">
						<Label htmlFor="border-opacity" className="text-xs">
							Opacidad
						</Label>
						<span className="text-xs text-muted-foreground">{Math.round((borderOptions?.opacity || 1) * 100)}%</span>
					</div>
					<Slider
						id="border-opacity"
						min={0}
						max={1}
						step={0.01}
						value={[borderOptions?.opacity || 1]}
						onValueChange={(value) =>
							onBorderOptionsChange({
								...borderOptions,
								opacity: value[0],
							})
						}
						className="w-full"
					/>
				</div>
			</div>

			{/* Opciones de Grano */}
			<div className="space-y-3">
				<h4 className="text-sm font-medium">Efecto de Grano</h4>
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<Label htmlFor="grain-intensity" className="text-xs">
							Intensidad
						</Label>
						<span className="text-xs text-muted-foreground">{Math.round((grainOptions?.intensity || 0) * 100)}%</span>
					</div>
					<Slider
						id="grain-intensity"
						min={0}
						max={1}
						step={0.01}
						value={[grainOptions?.intensity || 0]}
						onValueChange={(value) =>
							onGrainOptionsChange({
								...grainOptions,
								intensity: value[0],
							})
						}
						className="w-full"
					/>
					<div className="flex items-center justify-between">
						<Label htmlFor="grain-density" className="text-xs">
							Densidad
						</Label>
						<span className="text-xs text-muted-foreground">{Math.round((grainOptions?.density || 0) * 100)}%</span>
					</div>
					<Slider
						id="grain-density"
						min={0}
						max={1}
						step={0.01}
						value={[grainOptions?.density || 0]}
						onValueChange={(value) =>
							onGrainOptionsChange({
								...grainOptions,
								density: value[0],
							})
						}
						className="w-full"
					/>
				</div>
			</div>
		</motion.div>
	);
}
