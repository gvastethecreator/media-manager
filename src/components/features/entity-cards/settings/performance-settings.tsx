'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Gauge, Info } from 'lucide-react';
import type { CardOptions, CardSettingsProps } from './card-settings-types';

export function PerformanceSettings({ cardOptions, onCardOptionsChange }: CardSettingsProps) {
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
					<Gauge className="h-4 w-4 text-primary" />
					Configuración de Rendimiento
				</CardTitle>
			</CardHeader>
			<CardContent className="p-3 space-y-4">
				{/* Optimizaciones de Rendimiento */}
				<div className="space-y-4">
					<div className="flex items-center justify-between space-x-3">
						<Label htmlFor="enableLazyLoading" className="text-sm flex items-center cursor-pointer gap-2">
							Carga Perezosa
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<Info className="h-3 w-3 text-muted-foreground" />
									</TooltipTrigger>
									<TooltipContent className="text-xs max-w-xs">
										Carga las imágenes solo cuando son visibles en pantalla
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</Label>
						<Switch
							id="enableLazyLoading"
							checked={cardOptions.enableLazyLoading}
							onCheckedChange={(checked) => handleOptionChange('enableLazyLoading', checked)}
						/>
					</div>

					<div className="flex items-center justify-between space-x-3">
						<Label htmlFor="enableImageOptimization" className="text-sm flex items-center cursor-pointer gap-2">
							Optimización de Imágenes
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<Info className="h-3 w-3 text-muted-foreground" />
									</TooltipTrigger>
									<TooltipContent className="text-xs max-w-xs">
										Optimiza automáticamente las imágenes para mejorar el rendimiento
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</Label>
						<Switch
							id="enableImageOptimization"
							checked={cardOptions.enableImageOptimization}
							onCheckedChange={(checked) => handleOptionChange('enableImageOptimization', checked)}
						/>
					</div>

					<div className="flex items-center justify-between space-x-3">
						<Label htmlFor="enableVirtualization" className="text-sm flex items-center cursor-pointer gap-2">
							Virtualización
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<Info className="h-3 w-3 text-muted-foreground" />
									</TooltipTrigger>
									<TooltipContent className="text-xs max-w-xs">
										Renderiza solo las tarjetas visibles en pantalla
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</Label>
						<Switch
							id="enableVirtualization"
							checked={cardOptions.enableVirtualization}
							onCheckedChange={(checked) => handleOptionChange('enableVirtualization', checked)}
						/>
					</div>

					<div className="flex items-center justify-between space-x-3">
						<Label htmlFor="enableCaching" className="text-sm flex items-center cursor-pointer gap-2">
							Caché
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<Info className="h-3 w-3 text-muted-foreground" />
									</TooltipTrigger>
									<TooltipContent className="text-xs max-w-xs">
										Almacena en caché las tarjetas para mejorar el rendimiento
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</Label>
						<Switch
							id="enableCaching"
							checked={cardOptions.enableCaching}
							onCheckedChange={(checked) => handleOptionChange('enableCaching', checked)}
						/>
					</div>

					{/* Configuración de Animaciones */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label htmlFor="animationDuration" className="text-sm">
								Duración de Animaciones
							</Label>
							<span className="text-xs font-mono text-muted-foreground">{cardOptions.animationDuration || 300}ms</span>
						</div>
						<Slider
							id="animationDuration"
							min={0}
							max={1000}
							step={50}
							value={[cardOptions.animationDuration || 300]}
							onValueChange={(value) => handleOptionChange('animationDuration', value[0])}
							className="cursor-pointer"
						/>
					</div>

					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label htmlFor="transitionDuration" className="text-sm">
								Duración de Transiciones
							</Label>
							<span className="text-xs font-mono text-muted-foreground">{cardOptions.transitionDuration || 200}ms</span>
						</div>
						<Slider
							id="transitionDuration"
							min={0}
							max={1000}
							step={50}
							value={[cardOptions.transitionDuration || 200]}
							onValueChange={(value) => handleOptionChange('transitionDuration', value[0])}
							className="cursor-pointer"
						/>
					</div>

					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label htmlFor="throttleDelay" className="text-sm">
								Retraso de Throttle
							</Label>
							<span className="text-xs font-mono text-muted-foreground">{cardOptions.throttleDelay || 100}ms</span>
						</div>
						<Slider
							id="throttleDelay"
							min={0}
							max={500}
							step={25}
							value={[cardOptions.throttleDelay || 100]}
							onValueChange={(value) => handleOptionChange('throttleDelay', value[0])}
							className="cursor-pointer"
						/>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
