'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils/utils';
import { Activity, Clock, Eye, Fingerprint, Focus, Hand, Info, MousePointer, Timer } from 'lucide-react';
import type { CardOptions, CardSettingsProps } from '../../types/card-settings-types';

// Esquema de colores para el componente de estados
const statesColors = {
	bg: 'bg-orange-500/5',
	border: 'border-orange-500/20',
	text: 'text-orange-600',
	highlight: 'bg-orange-500/10',
};

export function StatesSettings({ cardOptions, onCardOptionsChange }: CardSettingsProps) {
	// Manejador para cambios en opciones individuales
	const _handleOptionChange = (key: keyof CardOptions, value: unknown) => {
		onCardOptionsChange({
			...cardOptions,
			[key]: value,
		});
	};

	// Manejador para cambios en estados específicos
	const handleStateChange = (state: string, value: unknown) => {
		onCardOptionsChange({
			...cardOptions,
			states: {
				...cardOptions.states,
				[state]: value,
			},
		});
	};

	return (
		<Card className={cn('border border-border/40 shadow-sm', statesColors.border)}>
			<CardHeader className="p-2.5 pb-1.5">
				<CardTitle className="text-xs font-medium flex items-center gap-1.5">
					<Activity className={cn('h-3.5 w-3.5', statesColors.text)} />
					Configuración de Estados
				</CardTitle>
			</CardHeader>
			<CardContent className="p-2.5 space-y-3">
				{/* Estados Interactivos */}
				<div className="space-y-2.5">
					<div className="grid grid-cols-2 gap-2">
						<div className="space-y-1.5">
							<div className="flex items-center justify-between">
								<Label htmlFor="enableHoverState" className="text-[11px] flex items-center cursor-pointer gap-1.5">
									<MousePointer className="h-3 w-3 text-orange-500" />
									Estado Hover
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger asChild>
												<Info className="h-3 w-3 text-muted-foreground" />
											</TooltipTrigger>
											<TooltipContent className="text-[10px] max-w-[180px]" side="top">
												Activa efectos al pasar el cursor sobre la tarjeta
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								</Label>
								<Switch
									id="enableHoverState"
									checked={cardOptions.states?.enableHover}
									onCheckedChange={(checked) => handleStateChange('enableHover', checked)}
								/>
							</div>
						</div>

						<div className="space-y-1.5">
							<div className="flex items-center justify-between">
								<Label htmlFor="enableFocusState" className="text-[11px] flex items-center cursor-pointer gap-1.5">
									<Focus className="h-3 w-3 text-orange-500" />
									Estado Focus
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger asChild>
												<Info className="h-3 w-3 text-muted-foreground" />
											</TooltipTrigger>
											<TooltipContent className="text-[10px] max-w-[180px]" side="top">
												Activa efectos cuando la tarjeta recibe el foco
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								</Label>
								<Switch
									id="enableFocusState"
									checked={cardOptions.states?.enableFocus}
									onCheckedChange={(checked) => handleStateChange('enableFocus', checked)}
								/>
							</div>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-2">
						<div className="space-y-1.5">
							<div className="flex items-center justify-between">
								<Label htmlFor="enableActiveState" className="text-[11px] flex items-center cursor-pointer gap-1.5">
									<Hand className="h-3 w-3 text-orange-500" />
									Estado Activo
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger asChild>
												<Info className="h-3 w-3 text-muted-foreground" />
											</TooltipTrigger>
											<TooltipContent className="text-[10px] max-w-[180px]" side="top">
												Activa efectos cuando la tarjeta está siendo presionada
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								</Label>
								<Switch
									id="enableActiveState"
									checked={cardOptions.states?.enableActive}
									onCheckedChange={(checked) => handleStateChange('enableActive', checked)}
								/>
							</div>
						</div>

						<div className="space-y-1.5">
							<div className="flex items-center justify-between">
								<Label htmlFor="enableSelectedState" className="text-[11px] flex items-center cursor-pointer gap-1.5">
									<Fingerprint className="h-3 w-3 text-orange-500" />
									Estado Selected
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger asChild>
												<Info className="h-3 w-3 text-muted-foreground" />
											</TooltipTrigger>
											<TooltipContent className="text-[10px] max-w-[180px]" side="top">
												Activa efectos cuando la tarjeta está seleccionada
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								</Label>
								<Switch
									id="enableSelectedState"
									checked={cardOptions.states?.enableSelected}
									onCheckedChange={(checked) => handleStateChange('enableSelected', checked)}
								/>
							</div>
						</div>
					</div>

					{/* Configuración de Efectos de Estado */}
					<div className="mt-2 space-y-2">
						<Label className="text-[11px] flex items-center gap-1.5 font-medium">
							<Eye className="h-3 w-3 text-orange-500" />
							Configuración de Efectos
						</Label>

						<div className="space-y-1.5">
							<Label htmlFor="stateEffect" className="text-[11px]">
								Efecto de Estado
							</Label>
							<Select
								value={cardOptions.states?.stateEffect}
								onValueChange={(value) => handleStateChange('stateEffect', value)}
							>
								<SelectTrigger id="stateEffect" className="w-full h-7 text-xs">
									<SelectValue placeholder="Selecciona un efecto" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="scale">Escala</SelectItem>
									<SelectItem value="glow">Brillo</SelectItem>
									<SelectItem value="lift">Elevación</SelectItem>
									<SelectItem value="highlight">Resaltado</SelectItem>
									<SelectItem value="border">Borde</SelectItem>
									<SelectItem value="shadow">Sombra</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="grid grid-cols-2 gap-2">
							<div className="space-y-1.5">
								<div className="flex items-center justify-between">
									<Label htmlFor="stateIntensity" className="text-[11px] flex items-center gap-1.5">
										<Activity className="h-3 w-3 text-orange-500" />
										Intensidad
									</Label>
									<span className="text-[10px] font-mono text-muted-foreground">
										{cardOptions.states?.stateIntensity || 1}
									</span>
								</div>
								<Slider
									id="stateIntensity"
									min={0}
									max={2}
									step={0.1}
									value={[cardOptions.states?.stateIntensity || 1]}
									onValueChange={(value) => handleStateChange('stateIntensity', value[0])}
									className="cursor-pointer"
								/>
							</div>

							<div className="space-y-1.5">
								<div className="flex items-center justify-between">
									<Label htmlFor="stateDuration" className="text-[11px] flex items-center gap-1.5">
										<Timer className="h-3 w-3 text-orange-500" />
										Duración
									</Label>
									<span className="text-[10px] font-mono text-muted-foreground">
										{cardOptions.states?.stateDuration || 200}ms
									</span>
								</div>
								<Slider
									id="stateDuration"
									min={0}
									max={1000}
									step={50}
									value={[cardOptions.states?.stateDuration || 200]}
									onValueChange={(value) => handleStateChange('stateDuration', value[0])}
									className="cursor-pointer"
								/>
							</div>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
