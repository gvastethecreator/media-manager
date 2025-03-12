'use client';

import type {
	BorderOptions,
	GlowEffectOptions,
	GrainEffectOptions,
	HolographicEffectOptions,
	ScanlinesOptions,
} from '@/components/features/entity-cards/base/base-card-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import * as React from 'react';

interface VisualEffectsManagerProps {
	holographicOptions?: HolographicEffectOptions;
	scanlinesOptions?: ScanlinesOptions;
	glowOptions?: GlowEffectOptions;
	borderOptions?: BorderOptions;
	grainOptions?: GrainEffectOptions;
	onHolographicOptionsChange?: (options: HolographicEffectOptions) => void;
	onScanlinesOptionsChange?: (options: ScanlinesOptions) => void;
	onGlowOptionsChange?: (options: GlowEffectOptions) => void;
	onBorderOptionsChange?: (options: BorderOptions) => void;
	onGrainOptionsChange?: (options: GrainEffectOptions) => void;
}

export function VisualEffectsManager({
	holographicOptions = {},
	scanlinesOptions = {},
	glowOptions = {},
	borderOptions = {
		width: 2,
		pattern: 'solid',
		animationType: 'none',
		animation: {
			type: 'none',
			duration: 3000,
			timing: 'linear',
			iteration: 'infinite',
		},
	},
	grainOptions = {},
	onHolographicOptionsChange,
	onScanlinesOptionsChange,
	onGlowOptionsChange,
	onBorderOptionsChange,
	onGrainOptionsChange,
}: VisualEffectsManagerProps) {
	// Estado local para cada tipo de efecto
	const [localHolographicOptions, setLocalHolographicOptions] =
		React.useState<HolographicEffectOptions>(holographicOptions);
	const [localScanlinesOptions, setLocalScanlinesOptions] = React.useState<ScanlinesOptions>(scanlinesOptions);
	const [localGlowOptions, setLocalGlowOptions] = React.useState<GlowEffectOptions>(glowOptions);
	const [localBorderOptions, setLocalBorderOptions] = React.useState<BorderOptions>(borderOptions);
	const [localGrainOptions, setLocalGrainOptions] = React.useState<GrainEffectOptions>(grainOptions);

	// Funciones para actualizar opciones
	const updateHolographicOption = <K extends keyof HolographicEffectOptions>(
		key: K,
		value: HolographicEffectOptions[K]
	) => {
		setLocalHolographicOptions((prev) => {
			const updated = { ...prev, [key]: value };
			onHolographicOptionsChange?.(updated);
			return updated;
		});
	};

	const updateScanlinesOption = <K extends keyof ScanlinesOptions>(key: K, value: ScanlinesOptions[K]) => {
		setLocalScanlinesOptions((prev) => {
			const updated = { ...prev, [key]: value };
			onScanlinesOptionsChange?.(updated);
			return updated;
		});
	};

	const updateGlowOption = <K extends keyof GlowEffectOptions>(key: K, value: GlowEffectOptions[K]) => {
		setLocalGlowOptions((prev) => {
			const updated = { ...prev, [key]: value };
			onGlowOptionsChange?.(updated);
			return updated;
		});
	};

	const updateBorderOption = <K extends keyof BorderOptions>(key: K, value: BorderOptions[K]) => {
		setLocalBorderOptions((prev) => {
			const updated = { ...prev, [key]: value };
			onBorderOptionsChange?.(updated);
			return updated;
		});
	};

	const updateGrainOption = <K extends keyof GrainEffectOptions>(key: K, value: GrainEffectOptions[K]) => {
		setLocalGrainOptions((prev) => {
			const updated = { ...prev, [key]: value };
			onGrainOptionsChange?.(updated);
			return updated;
		});
	};

	return (
		<div className="w-full space-y-4">
			<Tabs defaultValue="holographic" className="w-full">
				<TabsList className="flex flex-wrap w-full">
					<TabsTrigger value="holographic">Holográfico</TabsTrigger>
					<TabsTrigger value="scanlines">Líneas de Escaneo</TabsTrigger>
					<TabsTrigger value="glow">Resplandor</TabsTrigger>
					<TabsTrigger value="border">Borde</TabsTrigger>
					<TabsTrigger value="grain">Grano</TabsTrigger>
				</TabsList>

				{/* Configuración de efecto holográfico */}
				<TabsContent value="holographic" className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="holographic-pattern">Tipo de Patrón</Label>
							<Select
								value={localHolographicOptions.patternType || 'rainbow'}
								onValueChange={(value) =>
									updateHolographicOption('patternType', value as HolographicEffectOptions['patternType'])
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Selecciona un patrón" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="rainbow">Arcoíris</SelectItem>
									<SelectItem value="linear">Lineal</SelectItem>
									<SelectItem value="radial">Radial</SelectItem>
									<SelectItem value="diagonal">Diagonal</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="holographic-intensity">Intensidad</Label>
							<div className="flex items-center gap-4">
								<Slider
									id="holographic-intensity"
									value={[localHolographicOptions.intensity || 1]}
									min={0}
									max={2}
									step={0.1}
									onValueChange={(value) => updateHolographicOption('intensity', value[0])}
								/>
								<span className="w-8 text-center text-muted-foreground">
									{localHolographicOptions.intensity?.toFixed(1) || '1.0'}
								</span>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="holographic-speed">Velocidad de Animación</Label>
							<div className="flex items-center gap-4">
								<Slider
									id="holographic-speed"
									value={[localHolographicOptions.animationSpeed || 1]}
									min={0}
									max={3}
									step={0.1}
									onValueChange={(value) => updateHolographicOption('animationSpeed', value[0])}
								/>
								<span className="w-8 text-center text-muted-foreground">
									{localHolographicOptions.animationSpeed?.toFixed(1) || '1.0'}
								</span>
							</div>
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="holographic-visible-hover">Visible solo al pasar el ratón</Label>
								<Switch
									id="holographic-visible-hover"
									checked={localHolographicOptions.visibleOnHover}
									onCheckedChange={(checked) => updateHolographicOption('visibleOnHover', checked)}
								/>
							</div>
						</div>
					</div>
				</TabsContent>

				{/* Configuración de líneas de escaneo */}
				<TabsContent value="scanlines" className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="scanlines-opacity">Opacidad</Label>
							<div className="flex items-center gap-4">
								<Slider
									id="scanlines-opacity"
									value={[localScanlinesOptions.opacity || 0.2]}
									min={0}
									max={1}
									step={0.05}
									onValueChange={(value) => updateScanlinesOption('opacity', value[0])}
								/>
								<span className="w-8 text-center text-muted-foreground">
									{localScanlinesOptions.opacity?.toFixed(2) || '0.20'}
								</span>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="scanlines-spacing">Espaciado</Label>
							<div className="flex items-center gap-4">
								<Slider
									id="scanlines-spacing"
									value={[localScanlinesOptions.spacing || 4]}
									min={1}
									max={10}
									step={1}
									onValueChange={(value) => updateScanlinesOption('spacing', value[0])}
								/>
								<span className="w-8 text-center text-muted-foreground">{localScanlinesOptions.spacing || '4'}px</span>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="scanlines-direction">Dirección</Label>
							<Select
								value={localScanlinesOptions.direction || 'horizontal'}
								onValueChange={(value) => updateScanlinesOption('direction', value as ScanlinesOptions['direction'])}
							>
								<SelectTrigger>
									<SelectValue placeholder="Selecciona una dirección" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="horizontal">Horizontal</SelectItem>
									<SelectItem value="vertical">Vertical</SelectItem>
									<SelectItem value="diagonal">Diagonal</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="scanlines-animate">Animar</Label>
								<Switch
									id="scanlines-animate"
									checked={localScanlinesOptions.animate}
									onCheckedChange={(checked) => updateScanlinesOption('animate', checked)}
								/>
							</div>
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="scanlines-visible-hover">Visible solo al pasar el ratón</Label>
								<Switch
									id="scanlines-visible-hover"
									checked={localScanlinesOptions.visibleOnHover}
									onCheckedChange={(checked) => updateScanlinesOption('visibleOnHover', checked)}
								/>
							</div>
						</div>
					</div>
				</TabsContent>

				{/* Configuración de resplandor */}
				<TabsContent value="glow" className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="glow-intensity">Intensidad</Label>
							<div className="flex items-center gap-4">
								<Slider
									id="glow-intensity"
									value={[localGlowOptions.intensity || 1]}
									min={0}
									max={3}
									step={0.1}
									onValueChange={(value) => updateGlowOption('intensity', value[0])}
								/>
								<span className="w-8 text-center text-muted-foreground">
									{localGlowOptions.intensity?.toFixed(1) || '1.0'}
								</span>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="glow-size">Tamaño</Label>
							<div className="flex items-center gap-4">
								<Slider
									id="glow-size"
									value={[localGlowOptions.size || 100]}
									min={0}
									max={200}
									step={5}
									onValueChange={(value) => updateGlowOption('size', value[0])}
								/>
								<span className="w-8 text-center text-muted-foreground">{localGlowOptions.size || '100'}</span>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="glow-animation">Tipo de Animación</Label>
							<Select
								value={localGlowOptions.animationType || 'follow-mouse'}
								onValueChange={(value) =>
									updateGlowOption('animationType', value as GlowEffectOptions['animationType'])
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Selecciona un tipo" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="static">Estático</SelectItem>
									<SelectItem value="pulse">Pulso</SelectItem>
									<SelectItem value="follow-mouse">Seguir ratón</SelectItem>
									<SelectItem value="none">Ninguno</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="glow-visible-hover">Visible solo al pasar el ratón</Label>
								<Switch
									id="glow-visible-hover"
									checked={localGlowOptions.visibleOnHover}
									onCheckedChange={(checked) => updateGlowOption('visibleOnHover', checked)}
								/>
							</div>
						</div>
					</div>
				</TabsContent>

				{/* Configuración de borde */}
				<TabsContent value="border" className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="border-width">Ancho</Label>
							<div className="flex items-center gap-4">
								<Slider
									id="border-width"
									value={[localBorderOptions.width || 2]}
									min={0}
									max={10}
									step={1}
									onValueChange={(value) => updateBorderOption('width', value[0])}
								/>
								<span className="w-8 text-center text-muted-foreground">{localBorderOptions.width || '2'}px</span>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="border-pattern">Patrón</Label>
							<Select
								value={localBorderOptions.pattern || 'solid'}
								onValueChange={(value) => updateBorderOption('pattern', value as BorderOptions['pattern'])}
							>
								<SelectTrigger>
									<SelectValue placeholder="Selecciona un patrón" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="solid">Sólido</SelectItem>
									<SelectItem value="dashed">Discontinuo</SelectItem>
									<SelectItem value="dotted">Punteado</SelectItem>
									<SelectItem value="double">Doble</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="border-animation">Tipo de Animación</Label>
							<Select
								value={localBorderOptions.animationType || 'none'}
								onValueChange={(value) => updateBorderOption('animationType', value as BorderOptions['animationType'])}
							>
								<SelectTrigger>
									<SelectValue placeholder="Selecciona un tipo" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="pulse">Pulso</SelectItem>
									<SelectItem value="rotate">Rotación</SelectItem>
									<SelectItem value="flow">Flujo</SelectItem>
									<SelectItem value="none">Ninguno</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="border-animation-speed">Velocidad de Animación</Label>
							<div className="flex items-center gap-4">
								<Slider
									id="border-animation-speed"
									value={[localBorderOptions.animationSpeed || 1]}
									min={0.1}
									max={3}
									step={0.1}
									onValueChange={(value) => updateBorderOption('animationSpeed', value[0])}
								/>
								<span className="w-8 text-center text-muted-foreground">
									{localBorderOptions.animationSpeed?.toFixed(1) || '1.0'}
								</span>
							</div>
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="border-glow-hover">Resplandor al pasar el ratón</Label>
								<Switch
									id="border-glow-hover"
									checked={localBorderOptions.glowOnHover}
									onCheckedChange={(checked) => updateBorderOption('glowOnHover', checked)}
								/>
							</div>
						</div>
					</div>
				</TabsContent>

				{/* Configuración de grano */}
				<TabsContent value="grain" className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="grain-intensity">Intensidad</Label>
							<div className="flex items-center gap-4">
								<Slider
									id="grain-intensity"
									value={[localGrainOptions.intensity || 0.15]}
									min={0}
									max={1}
									step={0.05}
									onValueChange={(value) => updateGrainOption('intensity', value[0])}
								/>
								<span className="w-8 text-center text-muted-foreground">
									{localGrainOptions.intensity?.toFixed(2) || '0.15'}
								</span>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="grain-density">Densidad</Label>
							<div className="flex items-center gap-4">
								<Slider
									id="grain-density"
									value={[localGrainOptions.density || 0.6]}
									min={0}
									max={1}
									step={0.05}
									onValueChange={(value) => updateGrainOption('density', value[0])}
								/>
								<span className="w-8 text-center text-muted-foreground">
									{localGrainOptions.density?.toFixed(2) || '0.60'}
								</span>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="grain-noise">Tipo de Ruido</Label>
							<Select
								value={localGrainOptions.noise || 'light'}
								onValueChange={(value) => updateGrainOption('noise', value as GrainEffectOptions['noise'])}
							>
								<SelectTrigger>
									<SelectValue placeholder="Selecciona un tipo" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="digital">Digital</SelectItem>
									<SelectItem value="film">Película</SelectItem>
									<SelectItem value="light">Ligero</SelectItem>
									<SelectItem value="heavy">Intenso</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="grain-animated">Animado</Label>
								<Switch
									id="grain-animated"
									checked={localGrainOptions.animated}
									onCheckedChange={(checked) => updateGrainOption('animated', checked)}
								/>
							</div>
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="grain-visible-hover">Visible solo al pasar el ratón</Label>
								<Switch
									id="grain-visible-hover"
									checked={localGrainOptions.visibleOnHover}
									onCheckedChange={(checked) => updateGrainOption('visibleOnHover', checked)}
								/>
							</div>
						</div>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}
