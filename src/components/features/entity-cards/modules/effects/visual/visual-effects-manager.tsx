'use client';

import type { CardOptions } from '@/components/features/entity-cards/types/card-settings-types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Droplets, Scan, Sparkles, SquareAsterisk, Waves } from 'lucide-react';
import { motion } from 'motion/react';

// 🎨 Esquema de colores para el panel
const panelColors = {
	effects: {
		bg: 'bg-cyan-500/5',
		border: 'border-cyan-500/20',
		text: 'text-cyan-600',
	},
};

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
	disabled?: boolean;
}

/**
 * Gestor de efectos visuales para tarjetas
 * @component
 */
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
	disabled = false,
}: VisualEffectsManagerProps) {
	return (
		<Card className={cn('w-full', panelColors.effects.bg, panelColors.effects.border)}>
			<CardHeader className="pb-3">
				<CardTitle className="text-[11px] font-medium flex items-center gap-2">
					<Sparkles className="h-4 w-4" />
					Efectos Visuales
				</CardTitle>
				<CardDescription className="text-[10px] text-muted-foreground">
					Configura los efectos visuales aplicados a la tarjeta
				</CardDescription>
			</CardHeader>
			<CardContent className="p-4 pt-0">
				<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
					{/* Opciones Holográficas */}
					<div className="space-y-3">
						<div className="flex items-center gap-2">
							<Waves className="h-4 w-4 text-muted-foreground" />
							<h4 className="text-sm font-medium">Efecto Holográfico</h4>
						</div>
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
								value={[(holographicOptions?.intensity || 0) * 100]}
								min={0}
								max={100}
								step={1}
								disabled={disabled}
								onValueChange={(value) =>
									onHolographicOptionsChange({
										...holographicOptions,
										intensity: value[0] / 100,
									})
								}
							/>
						</div>
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="holographic-color-shift" className="text-xs">
									Cambio de Color
								</Label>
								<span className="text-xs text-muted-foreground">{holographicOptions?.colorShift || 0}</span>
							</div>
							<Slider
								id="holographic-color-shift"
								value={[holographicOptions?.colorShift || 0]}
								min={0}
								max={10}
								step={0.5}
								disabled={disabled}
								onValueChange={(value) =>
									onHolographicOptionsChange({
										...holographicOptions,
										colorShift: value[0],
									})
								}
							/>
						</div>
						<div className="flex items-center justify-between">
							<Label htmlFor="holographic-animated" className="text-xs">
								Animado
							</Label>
							<Switch
								id="holographic-animated"
								checked={holographicOptions?.animated}
								disabled={disabled}
								onCheckedChange={(checked) =>
									onHolographicOptionsChange({
										...holographicOptions,
										animated: checked,
									})
								}
							/>
						</div>
					</div>

					{/* Opciones de Scanlines */}
					<div className="space-y-3">
						<div className="flex items-center gap-2">
							<Scan className="h-4 w-4 text-muted-foreground" />
							<h4 className="text-sm font-medium">Líneas de Escaneo</h4>
						</div>
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="scanlines-opacity" className="text-xs">
									Opacidad
								</Label>
								<span className="text-xs text-muted-foreground">
									{Math.round((scanlinesOptions?.opacity || 0) * 100)}%
								</span>
							</div>
							<Slider
								id="scanlines-opacity"
								value={[(scanlinesOptions?.opacity || 0) * 100]}
								min={0}
								max={100}
								step={1}
								disabled={disabled}
								onValueChange={(value) =>
									onScanlinesOptionsChange({
										...scanlinesOptions,
										opacity: value[0] / 100,
									})
								}
							/>
						</div>
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="scanlines-spacing" className="text-xs">
									Espaciado
								</Label>
								<span className="text-xs text-muted-foreground">{scanlinesOptions?.spacing || 0}px</span>
							</div>
							<Slider
								id="scanlines-spacing"
								value={[scanlinesOptions?.spacing || 0]}
								min={1}
								max={20}
								step={1}
								disabled={disabled}
								onValueChange={(value) =>
									onScanlinesOptionsChange({
										...scanlinesOptions,
										spacing: value[0],
									})
								}
							/>
						</div>
					</div>

					{/* Opciones de Brillo */}
					<div className="space-y-3">
						<div className="flex items-center gap-2">
							<Sparkles className="h-4 w-4 text-muted-foreground" />
							<h4 className="text-sm font-medium">Efecto de Brillo</h4>
						</div>
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="glow-intensity" className="text-xs">
									Intensidad
								</Label>
								<span className="text-xs text-muted-foreground">{glowOptions?.intensity || 0}</span>
							</div>
							<Slider
								id="glow-intensity"
								value={[glowOptions?.intensity || 0]}
								min={0}
								max={20}
								step={1}
								disabled={disabled}
								onValueChange={(value) =>
									onGlowOptionsChange({
										...glowOptions,
										intensity: value[0],
									})
								}
							/>
						</div>
					</div>

					{/* Opciones de Grano */}
					<div className="space-y-3">
						<div className="flex items-center gap-2">
							<SquareAsterisk className="h-4 w-4 text-muted-foreground" />
							<h4 className="text-sm font-medium">Efecto de Grano</h4>
						</div>
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="grain-intensity" className="text-xs">
									Intensidad
								</Label>
								<span className="text-xs text-muted-foreground">
									{Math.round((grainOptions?.intensity || 0) * 100)}%
								</span>
							</div>
							<Slider
								id="grain-intensity"
								value={[(grainOptions?.intensity || 0) * 100]}
								min={0}
								max={100}
								step={1}
								disabled={disabled}
								onValueChange={(value) =>
									onGrainOptionsChange({
										...grainOptions,
										intensity: value[0] / 100,
									})
								}
							/>
						</div>
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="grain-density" className="text-xs">
									Densidad
								</Label>
								<span className="text-xs text-muted-foreground">{Math.round((grainOptions?.density || 0) * 100)}%</span>
							</div>
							<Slider
								id="grain-density"
								value={[(grainOptions?.density || 0) * 100]}
								min={0}
								max={100}
								step={1}
								disabled={disabled}
								onValueChange={(value) =>
									onGrainOptionsChange({
										...grainOptions,
										density: value[0] / 100,
									})
								}
							/>
						</div>
					</div>
				</motion.div>
			</CardContent>
		</Card>
	);
}
