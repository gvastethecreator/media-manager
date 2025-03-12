'use client';

import type {
	BorderOptions,
	CardOptions,
	GrainEffectOptions,
	ScanlinesOptions,
} from '@/components/features/entity-cards/base/base-card-types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils/utils';
import {
	Box,
	Fingerprint,
	GanttChartSquare,
	Brain as GrainIcon,
	Info,
	Layers,
	LucideIcon,
	MousePointerClick,
	ScreenShare,
	Sparkles,
	ZoomIn,
} from 'lucide-react';
import type React from 'react';
import type { CardSettingsProps } from './card-settings-types';

// Objeto con opciones de color para cada efecto avanzado
const effectColors = {
	scanlines: {
		bg: 'bg-purple-500/5',
		border: 'border-purple-500/20',
		text: 'text-purple-600',
		highlight: 'bg-purple-500/10',
	},
	grain: {
		bg: 'bg-amber-500/5',
		border: 'border-amber-500/20',
		text: 'text-amber-600',
		highlight: 'bg-amber-500/10',
	},
	halo: {
		bg: 'bg-cyan-500/5',
		border: 'border-cyan-500/20',
		text: 'text-cyan-600',
		highlight: 'bg-cyan-500/10',
	},
	border: {
		bg: 'bg-emerald-500/5',
		border: 'border-emerald-500/20',
		text: 'text-emerald-600',
		highlight: 'bg-emerald-500/10',
	},
};

// Componente para una opción de configuración avanzada con animación
const AnimatedOption = ({
	label,
	value,
	onChange,
	icon,
	description,
	colorScheme,
	children,
}: {
	label: string;
	value: boolean;
	onChange: (value: boolean) => void;
	icon: React.ReactNode;
	description?: string;
	colorScheme: {
		bg: string;
		border: string;
		text: string;
		highlight: string;
	};
	children?: React.ReactNode;
}) => {
	return (
		<AccordionItem value={label} className={cn('border rounded-md my-2', colorScheme.border, value && 'shadow-sm')}>
			<AccordionTrigger className={cn('px-3 py-2 hover:no-underline', value && colorScheme.bg)}>
				<div className="flex items-center justify-between w-full">
					<div className="flex items-center gap-2">
						<span className={cn('p-1 rounded', colorScheme.text, value && colorScheme.highlight)}>{icon}</span>
						<span className="text-sm font-medium">{label}</span>
					</div>
					<Switch
						checked={value}
						onCheckedChange={onChange}
						onClick={(e) => e.stopPropagation()}
						className="data-[state=checked]:bg-primary"
					/>
				</div>
			</AccordionTrigger>
			<AccordionContent className="px-3 pb-3 pt-1">
				{description && <p className="text-xs text-muted-foreground mb-3">{description}</p>}
				{value && children}
			</AccordionContent>
		</AccordionItem>
	);
};

export function AdvancedEffectsSettings({ cardOptions, onCardOptionsChange }: CardSettingsProps) {
	// Manejador para cambios en opciones individuales
	const handleOptionChange = (key: keyof CardOptions, value: unknown) => {
		onCardOptionsChange({
			...cardOptions,
			[key]: value,
		});
	};

	// Manejador para opciones de scanlines
	const handleScanlinesOptionChange = (key: string, value: unknown) => {
		const currentOptions = cardOptions.scanlinesOptions || {
			opacity: 0.2,
			spacing: 4,
			direction: 'horizontal',
			animate: true,
		};

		onCardOptionsChange({
			...cardOptions,
			scanlinesOptions: {
				...currentOptions,
				[key]: value,
			},
		});
	};

	// Manejador para opciones de grano
	const handleGrainOptionChange = (key: string, value: unknown) => {
		const currentOptions = cardOptions.grainOptions || {
			intensity: 0.2,
			density: 0.5,
			noise: 'light',
			animated: false,
		};

		onCardOptionsChange({
			...cardOptions,
			grainOptions: {
				...currentOptions,
				[key]: value,
			},
		});
	};

	// Manejador para opciones de borde
	const handleBorderOptionChange = (key: string, value: unknown) => {
		const currentOptions = cardOptions.borderOptions || {
			width: 2,
			pattern: 'solid',
			animationType: 'pulse',
			animation: {
				type: 'pulse',
				duration: 3000,
				timing: 'linear',
				iteration: 'infinite',
			},
		};

		onCardOptionsChange({
			...cardOptions,
			borderOptions: {
				...currentOptions,
				[key]: value,
			},
		});
	};

	// Valores actuales para scanlines
	const scanlinesOpacity =
		cardOptions.scanlinesOptions?.opacity !== undefined ? cardOptions.scanlinesOptions.opacity * 100 : 20;
	const scanlinesSpacing = cardOptions.scanlinesOptions?.spacing || 4;
	const scanlinesDirection = cardOptions.scanlinesOptions?.direction || 'horizontal';
	const scanlinesAnimate = cardOptions.scanlinesOptions?.animate || false;

	// Valores actuales para grano
	const grainIntensity =
		cardOptions.grainOptions?.intensity !== undefined ? cardOptions.grainOptions.intensity * 100 : 15;
	const grainDensity = cardOptions.grainOptions?.density !== undefined ? cardOptions.grainOptions.density * 100 : 60;
	const grainNoise = cardOptions.grainOptions?.noise || 'light';
	const grainAnimated = cardOptions.grainOptions?.animated || false;

	// Valores actuales para borde animado
	const borderWidth = cardOptions.borderOptions?.width || 2;
	const borderPattern = cardOptions.borderOptions?.pattern || 'solid';
	const borderAnimationType = cardOptions.borderOptions?.animationType || 'flow';

	return (
		<Card>
			<CardHeader className="p-3 pb-2">
				<CardTitle className="text-sm font-medium flex items-center gap-2">
					<Sparkles className="h-4 w-4 text-primary" />
					<span>Efectos Avanzados</span>
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Info className="h-3.5 w-3.5 text-muted-foreground cursor-pointer" />
							</TooltipTrigger>
							<TooltipContent side="top" className="text-xs max-w-xs">
								Configura efectos visuales adicionales para personalizar la apariencia de las tarjetas.
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</CardTitle>
			</CardHeader>

			<CardContent className="p-3 pt-1 space-y-1">
				<Accordion type="multiple" className="w-full">
					{/* Efecto de Scanlines */}
					<AnimatedOption
						label="Líneas de Escaneo"
						value={cardOptions.enableScanlines || false}
						onChange={(value) => handleOptionChange('enableScanlines', value)}
						icon={<GanttChartSquare className="h-4 w-4" />}
						description="Añade un efecto de líneas horizontales o verticales que simula una pantalla CRT."
						colorScheme={effectColors.scanlines}
					>
						<div className="space-y-3">
							{/* Opacidad */}
							<div className="grid gap-1.5">
								<div className="flex items-center justify-between">
									<Label className="text-xs">Opacidad</Label>
									<span className="text-xs text-muted-foreground">{scanlinesOpacity.toFixed(0)}%</span>
								</div>
								<Slider
									min={0}
									max={100}
									step={1}
									value={[scanlinesOpacity]}
									onValueChange={([value]) => handleScanlinesOptionChange('opacity', value / 100)}
								/>
							</div>

							{/* Espaciado */}
							<div className="grid gap-1.5">
								<div className="flex items-center justify-between">
									<Label className="text-xs">Espaciado</Label>
									<span className="text-xs text-muted-foreground">{scanlinesSpacing}px</span>
								</div>
								<Slider
									min={1}
									max={20}
									step={1}
									value={[scanlinesSpacing]}
									onValueChange={([value]) => handleScanlinesOptionChange('spacing', value)}
								/>
							</div>

							{/* Dirección */}
							<div className="grid gap-1.5">
								<Label className="text-xs">Dirección</Label>
								<Select
									value={scanlinesDirection}
									onValueChange={(value) => handleScanlinesOptionChange('direction', value)}
								>
									<SelectTrigger className="h-8 text-xs">
										<SelectValue placeholder="Selecciona dirección" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="horizontal">Horizontal</SelectItem>
										<SelectItem value="vertical">Vertical</SelectItem>
										<SelectItem value="diagonal">Diagonal</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{/* Animación */}
							<div className="flex items-center justify-between">
								<div className="flex items-center space-x-2">
									<Label htmlFor="scanlinesAnimate" className="text-xs cursor-pointer">
										Animar
									</Label>
								</div>
								<Switch
									id="scanlinesAnimate"
									checked={scanlinesAnimate}
									onCheckedChange={(checked) => handleScanlinesOptionChange('animate', checked)}
								/>
							</div>
						</div>
					</AnimatedOption>

					{/* Efecto de Grano */}
					<AnimatedOption
						label="Efecto de Grano"
						value={cardOptions.enableGrainEffect || false}
						onChange={(value) => handleOptionChange('enableGrainEffect', value)}
						icon={<GrainIcon className="h-4 w-4" />}
						description="Añade una textura de grano que da un aspecto más realista y analógico."
						colorScheme={effectColors.grain}
					>
						<div className="space-y-3">
							{/* Intensidad */}
							<div className="grid gap-1.5">
								<div className="flex items-center justify-between">
									<Label className="text-xs">Intensidad</Label>
									<span className="text-xs text-muted-foreground">{grainIntensity.toFixed(0)}%</span>
								</div>
								<Slider
									min={0}
									max={100}
									step={1}
									value={[grainIntensity]}
									onValueChange={([value]) => handleGrainOptionChange('intensity', value / 100)}
								/>
							</div>

							{/* Densidad */}
							<div className="grid gap-1.5">
								<div className="flex items-center justify-between">
									<Label className="text-xs">Densidad</Label>
									<span className="text-xs text-muted-foreground">{grainDensity.toFixed(0)}%</span>
								</div>
								<Slider
									min={10}
									max={100}
									step={1}
									value={[grainDensity]}
									onValueChange={([value]) => handleGrainOptionChange('density', value / 100)}
								/>
							</div>

							{/* Tipo de ruido */}
							<div className="grid gap-1.5">
								<Label className="text-xs">Tipo de ruido</Label>
								<Select value={grainNoise} onValueChange={(value) => handleGrainOptionChange('noise', value)}>
									<SelectTrigger className="h-8 text-xs">
										<SelectValue placeholder="Selecciona tipo" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="light">Ligero</SelectItem>
										<SelectItem value="digital">Digital</SelectItem>
										<SelectItem value="film">Película</SelectItem>
										<SelectItem value="heavy">Intenso</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{/* Animación */}
							<div className="flex items-center justify-between">
								<div className="flex items-center space-x-2">
									<Label htmlFor="grainAnimated" className="text-xs cursor-pointer">
										Animar
									</Label>
								</div>
								<Switch
									id="grainAnimated"
									checked={grainAnimated}
									onCheckedChange={(checked) => handleGrainOptionChange('animated', checked)}
								/>
							</div>
						</div>
					</AnimatedOption>

					{/* Efecto de Halo de Luz */}
					<AnimatedOption
						label="Halo de Luz"
						value={cardOptions.enableLightHalo || false}
						onChange={(value) => handleOptionChange('enableLightHalo', value)}
						icon={<ZoomIn className="h-4 w-4" />}
						description="Crea un efecto de halo luminoso que sigue el cursor o pulsa suavemente."
						colorScheme={effectColors.halo}
					>
						<div className="p-3 rounded bg-muted/40">
							<p className="text-xs text-center">Próximamente más opciones avanzadas</p>
						</div>
					</AnimatedOption>

					{/* Borde Animado */}
					<AnimatedOption
						label="Borde Animado"
						value={cardOptions.enableAnimatedBorder || false}
						onChange={(value) => handleOptionChange('enableAnimatedBorder', value)}
						icon={<MousePointerClick className="h-4 w-4" />}
						description="Añade un borde con animaciones dinámicas y efectos visuales."
						colorScheme={effectColors.border}
					>
						<div className="space-y-3">
							{/* Ancho del borde */}
							<div className="grid gap-1.5">
								<div className="flex items-center justify-between">
									<Label className="text-xs">Ancho del borde</Label>
									<span className="text-xs text-muted-foreground">{borderWidth}px</span>
								</div>
								<Slider
									min={1}
									max={10}
									step={1}
									value={[borderWidth]}
									onValueChange={([value]) => handleBorderOptionChange('width', value)}
								/>
							</div>

							{/* Patrón del borde */}
							<div className="grid gap-1.5">
								<Label className="text-xs">Patrón</Label>
								<Select value={borderPattern} onValueChange={(value) => handleBorderOptionChange('pattern', value)}>
									<SelectTrigger className="h-8 text-xs">
										<SelectValue placeholder="Selecciona patrón" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="solid">Sólido</SelectItem>
										<SelectItem value="dashed">Discontinuo</SelectItem>
										<SelectItem value="dotted">Punteado</SelectItem>
										<SelectItem value="double">Doble</SelectItem>
										<SelectItem value="gradient">Degradado</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{/* Tipo de animación */}
							<div className="grid gap-1.5">
								<Label className="text-xs">Animación</Label>
								<Select
									value={borderAnimationType}
									onValueChange={(value) => handleBorderOptionChange('animationType', value)}
								>
									<SelectTrigger className="h-8 text-xs">
										<SelectValue placeholder="Tipo de animación" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="none">Ninguna</SelectItem>
										<SelectItem value="flow">Flujo</SelectItem>
										<SelectItem value="pulse">Pulso</SelectItem>
										<SelectItem value="rainbow">Arcoíris</SelectItem>
										<SelectItem value="shimmer">Destello</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					</AnimatedOption>
				</Accordion>
			</CardContent>
		</Card>
	);
}
