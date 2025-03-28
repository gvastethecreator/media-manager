import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type React from 'react';
import { usePixelateStore } from '../actions/pixelate-config.action';

interface PixelateConfigProps {
	className?: string;
}

const BLEND_MODES = ['normal', 'multiply', 'screen', 'overlay'] as const;
const ANIMATION_PATTERNS = ['none', 'wave', 'spiral', 'random'] as const;

export const PixelateConfig: React.FC<PixelateConfigProps> = ({ className }) => {
	const {
		config,
		toggleEnabled,
		setPixelSize,
		setOpacity,
		setBlendMode,
		toggleAnimation,
		setAnimationSpeed,
		setAnimationPattern,
		toggleColorQuantization,
		setColorLevels,
		togglePreserveAlpha,
		setThreshold,
		toggleEdgeDetection,
		setEdgeColor,
		setEdgeThickness,
		setNoiseAmount,
		setGlitchIntensity,
		setGlitchFrequency,
	} = usePixelateStore();

	return (
		<div className={cn('space-y-6', className)}>
			{/* Controles básicos */}
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<Label>Habilitado</Label>
					<Switch checked={config.enabled} onCheckedChange={toggleEnabled} />
				</div>

				<div className="space-y-2">
					<Label>Tamaño de píxel</Label>
					<Slider
						value={[config.pixelSize]}
						min={1}
						max={32}
						step={1}
						onValueChange={(value) => setPixelSize(value[0])}
					/>
				</div>

				<div className="space-y-2">
					<Label>Opacidad</Label>
					<Slider
						value={[config.opacity]}
						min={0}
						max={1}
						step={0.01}
						onValueChange={(value) => setOpacity(value[0])}
					/>
				</div>

				<div className="flex items-center justify-between">
					<Label>Modo de mezcla</Label>
					<Select value={config.blendMode} onValueChange={setBlendMode}>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="Seleccionar modo" />
						</SelectTrigger>
						<SelectContent>
							{BLEND_MODES.map((mode) => (
								<SelectItem key={mode} value={mode}>
									{mode.charAt(0).toUpperCase() + mode.slice(1)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Controles de animación */}
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<Label>Animación</Label>
					<Switch checked={config.animated} onCheckedChange={toggleAnimation} />
				</div>

				{config.animated && (
					<>
						<div className="space-y-2">
							<Label>Velocidad de animación</Label>
							<Slider
								value={[config.animationSpeed]}
								min={0.1}
								max={5}
								step={0.1}
								onValueChange={(value) => setAnimationSpeed(value[0])}
							/>
						</div>

						<div className="flex items-center justify-between">
							<Label>Patrón de animación</Label>
							<Select
								value={config.animationPattern}
								onValueChange={(value: (typeof ANIMATION_PATTERNS)[number]) => setAnimationPattern(value)}
							>
								<SelectTrigger className="w-[180px]">
									<SelectValue placeholder="Seleccionar patrón" />
								</SelectTrigger>
								<SelectContent>
									{ANIMATION_PATTERNS.map((pattern) => (
										<SelectItem key={pattern} value={pattern}>
											{pattern.charAt(0).toUpperCase() + pattern.slice(1)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</>
				)}
			</div>

			{/* Controles de color */}
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<Label>Cuantización de color</Label>
					<Switch checked={config.colorQuantization} onCheckedChange={toggleColorQuantization} />
				</div>

				{config.colorQuantization && (
					<div className="space-y-2">
						<Label>Niveles de color</Label>
						<Slider
							value={[config.colorLevels]}
							min={2}
							max={16}
							step={1}
							onValueChange={(value) => setColorLevels(value[0])}
						/>
					</div>
				)}

				<div className="flex items-center justify-between">
					<Label>Preservar alfa</Label>
					<Switch checked={config.preserveAlpha} onCheckedChange={togglePreserveAlpha} />
				</div>
			</div>

			{/* Controles de borde */}
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<Label>Detección de bordes</Label>
					<Switch checked={config.edgeDetection} onCheckedChange={toggleEdgeDetection} />
				</div>

				{config.edgeDetection && (
					<>
						<div className="space-y-2">
							<Label>Umbral</Label>
							<Slider
								value={[config.threshold]}
								min={0}
								max={1}
								step={0.01}
								onValueChange={(value) => setThreshold(value[0])}
							/>
						</div>

						<div className="space-y-2">
							<Label>Grosor de borde</Label>
							<Slider
								value={[config.edgeThickness]}
								min={1}
								max={5}
								step={0.5}
								onValueChange={(value) => setEdgeThickness(value[0])}
							/>
						</div>

						{/* Color picker para el color del borde podría ir aquí */}
					</>
				)}
			</div>

			{/* Controles de efectos */}
			<div className="space-y-4">
				<div className="space-y-2">
					<Label>Cantidad de ruido</Label>
					<Slider
						value={[config.noiseAmount]}
						min={0}
						max={1}
						step={0.01}
						onValueChange={(value) => setNoiseAmount(value[0])}
					/>
				</div>

				<div className="space-y-2">
					<Label>Intensidad de glitch</Label>
					<Slider
						value={[config.glitchIntensity]}
						min={0}
						max={1}
						step={0.01}
						onValueChange={(value) => setGlitchIntensity(value[0])}
					/>
				</div>

				{config.glitchIntensity > 0 && (
					<div className="space-y-2">
						<Label>Frecuencia de glitch</Label>
						<Slider
							value={[config.glitchFrequency]}
							min={0}
							max={10}
							step={0.1}
							onValueChange={(value) => setGlitchFrequency(value[0])}
						/>
					</div>
				)}
			</div>
		</div>
	);
};
