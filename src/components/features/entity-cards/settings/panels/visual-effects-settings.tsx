'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils/utils';
import { Flame, Info, Rotate3d, Scan, Sparkles } from 'lucide-react';
import type { CardOptions, CardSettingsProps } from '../../types/card-settings-types';

// Esquema de colores para el componente de efectos visuales
const visualEffectsColors = {
	bg: 'bg-indigo-500/5',
	border: 'border-indigo-500/20',
	text: 'text-indigo-600',
	highlight: 'bg-indigo-500/10',
};

export function VisualEffectsSettings({ cardOptions, onCardOptionsChange }: CardSettingsProps) {
	// Manejador para cambios en opciones individuales
	const handleOptionChange = (key: keyof CardOptions, value: unknown) => {
		onCardOptionsChange({
			...cardOptions,
			[key]: value,
		});
	};

	return (
		<Card className={cn('border border-border/40 shadow-sm', visualEffectsColors.border)}>
			<CardHeader className="p-2.5 pb-1.5">
				<CardTitle className="text-xs font-medium flex items-center gap-1.5">
					<Sparkles className={cn('h-3.5 w-3.5', visualEffectsColors.text)} />
					Efectos Visuales
				</CardTitle>
			</CardHeader>
			<CardContent className="p-2.5 space-y-3">
				{/* Efectos Básicos */}
				<div className="space-y-2">
					<div className="grid grid-cols-2 gap-2">
						<div className="space-y-1.5">
							<div className="flex items-center justify-between">
								<Label htmlFor="enable3DEffect" className="text-[11px] flex items-center cursor-pointer gap-1.5">
									<Rotate3d className="h-3 w-3 text-indigo-500" />
									Efecto 3D
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger asChild>
												<Info className="h-3 w-3 text-muted-foreground" />
											</TooltipTrigger>
											<TooltipContent className="text-[10px] max-w-[180px]" side="top">
												Activa el efecto de rotación 3D al pasar el ratón
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								</Label>
								<Switch
									id="enable3DEffect"
									checked={cardOptions.enable3DEffect}
									onCheckedChange={(checked) => handleOptionChange('enable3DEffect', checked)}
								/>
							</div>
						</div>

						<div className="space-y-1.5">
							<div className="flex items-center justify-between">
								<Label
									htmlFor="enableHolographicEffect"
									className="text-[11px] flex items-center cursor-pointer gap-1.5"
								>
									<Sparkles className="h-3 w-3 text-indigo-500" />
									Holográfico
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger asChild>
												<Info className="h-3 w-3 text-muted-foreground" />
											</TooltipTrigger>
											<TooltipContent className="text-[10px] max-w-[180px]" side="top">
												Añade un efecto holográfico que cambia con el movimiento
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								</Label>
								<Switch
									id="enableHolographicEffect"
									checked={cardOptions.enableHolographicEffect}
									onCheckedChange={(checked) => handleOptionChange('enableHolographicEffect', checked)}
								/>
							</div>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-2">
						<div className="space-y-1.5">
							<div className="flex items-center justify-between">
								<Label htmlFor="enableGlowEffect" className="text-[11px] flex items-center cursor-pointer gap-1.5">
									<Flame className="h-3 w-3 text-indigo-500" />
									Brillo
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger asChild>
												<Info className="h-3 w-3 text-muted-foreground" />
											</TooltipTrigger>
											<TooltipContent className="text-[10px] max-w-[180px]" side="top">
												Agrega un suave brillo alrededor de la tarjeta
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								</Label>
								<Switch
									id="enableGlowEffect"
									checked={cardOptions.enableGlowEffect}
									onCheckedChange={(checked) => handleOptionChange('enableGlowEffect', checked)}
								/>
							</div>
						</div>

						<div className="space-y-1.5">
							<div className="flex items-center justify-between">
								<Label htmlFor="enableScanlines" className="text-[11px] flex items-center cursor-pointer gap-1.5">
									<Scan className="h-3 w-3 text-indigo-500" />
									Líneas de Escaneo
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger asChild>
												<Info className="h-3 w-3 text-muted-foreground" />
											</TooltipTrigger>
											<TooltipContent className="text-[10px] max-w-[180px]" side="top">
												Añade un efecto de líneas de escaneo a la tarjeta
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								</Label>
								<Switch
									id="enableScanlines"
									checked={cardOptions.enableScanlines}
									onCheckedChange={(checked) => handleOptionChange('enableScanlines', checked)}
								/>
							</div>
						</div>
					</div>
				</div>

				{/* Configuración 3D */}
				<div className={cn('space-y-3', !cardOptions.enable3DEffect && 'opacity-50 pointer-events-none')}>
					<div className="grid grid-cols-2 gap-2">
						<div className="space-y-1.5">
							<div className="flex items-center justify-between">
								<Label htmlFor="maxRotation" className="text-[11px] flex items-center gap-1.5">
									Rotación Máxima
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger asChild>
												<Info className="h-3 w-3 text-muted-foreground" />
											</TooltipTrigger>
											<TooltipContent className="text-[10px] max-w-[180px]" side="top">
												Ángulo máximo de rotación en grados
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								</Label>
								<span className="text-[10px] font-mono text-muted-foreground">{cardOptions.maxRotation || 15}°</span>
							</div>
							<Slider
								id="maxRotation"
								min={5}
								max={25}
								step={1}
								value={[cardOptions.maxRotation || 15]}
								onValueChange={(value) => handleOptionChange('maxRotation', value[0])}
								className="cursor-pointer"
							/>
						</div>

						<div className="space-y-1.5">
							<div className="flex items-center justify-between">
								<Label htmlFor="hoverLiftHeight" className="text-[11px] flex items-center gap-1.5">
									Altura de Elevación
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger asChild>
												<Info className="h-3 w-3 text-muted-foreground" />
											</TooltipTrigger>
											<TooltipContent className="text-[10px] max-w-[180px]" side="top">
												Altura a la que se eleva la tarjeta en píxeles
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								</Label>
								<span className="text-[10px] font-mono text-muted-foreground">
									{cardOptions.hoverLiftHeight || 10}px
								</span>
							</div>
							<Slider
								id="hoverLiftHeight"
								min={0}
								max={30}
								step={1}
								value={[cardOptions.hoverLiftHeight || 10]}
								onValueChange={(value) => handleOptionChange('hoverLiftHeight', value[0])}
								className="cursor-pointer"
							/>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
