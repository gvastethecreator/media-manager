'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils/utils';
import { Info, Sparkles } from 'lucide-react';
import type { CardOptions, CardSettingsProps } from './card-settings-types';

export function VisualEffectsSettings({ cardOptions, onCardOptionsChange }: CardSettingsProps) {
	// Manejador para cambios en opciones individuales
	const handleOptionChange = (key: keyof CardOptions, value: unknown) => {
		onCardOptionsChange({
			...cardOptions,
			[key]: value,
		});
	};

	return (
		<Card className="border border-border/40 shadow-sm">
			<CardHeader className="p-3 pb-2">
				<CardTitle className="text-sm font-medium flex items-center gap-1.5">
					<Sparkles className="h-4 w-4 text-primary" />
					Efectos Visuales
				</CardTitle>
			</CardHeader>
			<CardContent className="p-3 space-y-4">
				{/* Efectos Básicos */}
				<div className="space-y-3">
					<div className="flex items-center justify-between space-x-3">
						<Label htmlFor="enable3DEffect" className="text-sm flex items-center cursor-pointer gap-2">
							Efecto 3D
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<Info className="h-3 w-3 text-muted-foreground" />
									</TooltipTrigger>
									<TooltipContent className="text-xs max-w-xs">
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

					<div className="flex items-center justify-between space-x-3">
						<Label htmlFor="enableHolographicEffect" className="text-sm flex items-center cursor-pointer gap-2">
							Efecto Holográfico
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<Info className="h-3 w-3 text-muted-foreground" />
									</TooltipTrigger>
									<TooltipContent className="text-xs max-w-xs">
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

					<div className="flex items-center justify-between space-x-3">
						<Label htmlFor="enableGlowEffect" className="text-sm flex items-center cursor-pointer gap-2">
							Efecto de Brillo
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<Info className="h-3 w-3 text-muted-foreground" />
									</TooltipTrigger>
									<TooltipContent className="text-xs max-w-xs">
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

				{/* Configuración 3D */}
				<div className={cn('space-y-4', !cardOptions.enable3DEffect && 'opacity-50 pointer-events-none')}>
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label htmlFor="maxRotation" className="text-sm flex items-center gap-2">
								Rotación Máxima
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<Info className="h-3 w-3 text-muted-foreground" />
										</TooltipTrigger>
										<TooltipContent className="text-xs max-w-xs">Ángulo máximo de rotación en grados</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							</Label>
							<span className="text-xs font-mono text-muted-foreground">{cardOptions.maxRotation || 15}°</span>
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

					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label htmlFor="hoverLiftHeight" className="text-sm flex items-center gap-2">
								Altura de Elevación
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<Info className="h-3 w-3 text-muted-foreground" />
										</TooltipTrigger>
										<TooltipContent className="text-xs max-w-xs">
											Altura a la que se eleva la tarjeta en píxeles
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							</Label>
							<span className="text-xs font-mono text-muted-foreground">{cardOptions.hoverLiftHeight || 10}px</span>
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
			</CardContent>
		</Card>
	);
}
