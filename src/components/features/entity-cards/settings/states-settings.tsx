'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Activity, Info } from 'lucide-react';
import type { CardOptions, CardSettingsProps } from './card-settings-types';

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
		<Card className="border border-border/40 shadow-sm">
			<CardHeader className="p-3 pb-2">
				<CardTitle className="text-sm font-medium flex items-center gap-1.5">
					<Activity className="h-4 w-4 text-primary" />
					Configuración de Estados
				</CardTitle>
			</CardHeader>
			<CardContent className="p-3 space-y-4">
				{/* Estados Interactivos */}
				<div className="space-y-4">
					<div className="flex items-center justify-between space-x-3">
						<Label htmlFor="enableHoverState" className="text-sm flex items-center cursor-pointer gap-2">
							Estado Hover
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<Info className="h-3 w-3 text-muted-foreground" />
									</TooltipTrigger>
									<TooltipContent className="text-xs max-w-xs">
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

					<div className="flex items-center justify-between space-x-3">
						<Label htmlFor="enableFocusState" className="text-sm flex items-center cursor-pointer gap-2">
							Estado Focus
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<Info className="h-3 w-3 text-muted-foreground" />
									</TooltipTrigger>
									<TooltipContent className="text-xs max-w-xs">
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

					<div className="flex items-center justify-between space-x-3">
						<Label htmlFor="enableActiveState" className="text-sm flex items-center cursor-pointer gap-2">
							Estado Activo
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<Info className="h-3 w-3 text-muted-foreground" />
									</TooltipTrigger>
									<TooltipContent className="text-xs max-w-xs">
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

					<div className="flex items-center justify-between space-x-3">
						<Label htmlFor="enableSelectedState" className="text-sm flex items-center cursor-pointer gap-2">
							Estado Seleccionado
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<Info className="h-3 w-3 text-muted-foreground" />
									</TooltipTrigger>
									<TooltipContent className="text-xs max-w-xs">
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

					{/* Configuración de Efectos de Estado */}
					<div className="space-y-2">
						<Label className="text-sm">Efecto de Estado</Label>
						<Select
							value={cardOptions.states?.stateEffect}
							onValueChange={(value) => handleStateChange('stateEffect', value)}
						>
							<SelectTrigger className="w-full">
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

					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label htmlFor="stateIntensity" className="text-sm">
								Intensidad del Efecto
							</Label>
							<span className="text-xs font-mono text-muted-foreground">{cardOptions.states?.stateIntensity || 1}</span>
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

					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label htmlFor="stateDuration" className="text-sm">
								Duración del Efecto
							</Label>
							<span className="text-xs font-mono text-muted-foreground">
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
			</CardContent>
		</Card>
	);
}
