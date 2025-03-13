'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils/utils';
import { Database, Gauge, ImageIcon, Info, IterationCcw, Rocket, Timer, Zap } from 'lucide-react';
import type { CardOptions, CardSettingsProps } from '../../types/card-settings-types';

// Esquema de colores para el componente de rendimiento
const performanceColors = {
	bg: 'bg-amber-500/5',
	border: 'border-amber-500/20',
	text: 'text-amber-600',
	highlight: 'bg-amber-500/10',
};

export function PerformanceSettings({ cardOptions, onCardOptionsChange }: CardSettingsProps) {
	// Manejador para cambios en opciones individuales
	const handleOptionChange = (key: keyof CardOptions, value: unknown) => {
		onCardOptionsChange({
			...cardOptions,
			[key]: value,
		});
	};

	return (
		<Card className={cn('border shadow-sm', performanceColors.border)}>
			<CardHeader className="p-2.5 pb-1.5">
				<CardTitle className="text-xs font-medium flex items-center gap-1.5">
					<Rocket className={cn('h-3.5 w-3.5', performanceColors.text)} />
					Configuración de Rendimiento
				</CardTitle>
			</CardHeader>
			<CardContent className="p-2.5 space-y-3">
				{/* Optimizaciones de Rendimiento */}
				<div className="space-y-2.5">
					<div className="grid grid-cols-2 gap-2">
						<div className="space-y-1.5">
							<div className="flex items-center justify-between">
								<Label htmlFor="enableLazyLoading" className="text-[11px] flex items-center gap-1.5 cursor-pointer">
									<ImageIcon className="h-3 w-3 text-amber-500" />
									Carga Perezosa
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger asChild>
												<Info className="h-3 w-3 text-muted-foreground" />
											</TooltipTrigger>
											<TooltipContent className="text-[10px] max-w-[180px]">
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
						</div>

						<div className="space-y-1.5">
							<div className="flex items-center justify-between">
								<Label
									htmlFor="enableImageOptimization"
									className="text-[11px] flex items-center gap-1.5 cursor-pointer"
								>
									<Zap className="h-3 w-3 text-amber-500" />
									Optimiz. Imágenes
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger asChild>
												<Info className="h-3 w-3 text-muted-foreground" />
											</TooltipTrigger>
											<TooltipContent className="text-[10px] max-w-[180px]">
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
						</div>
					</div>

					<div className="grid grid-cols-2 gap-2">
						<div className="space-y-1.5">
							<div className="flex items-center justify-between">
								<Label htmlFor="enableVirtualization" className="text-[11px] flex items-center gap-1.5 cursor-pointer">
									<Gauge className="h-3 w-3 text-amber-500" />
									Virtualización
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger asChild>
												<Info className="h-3 w-3 text-muted-foreground" />
											</TooltipTrigger>
											<TooltipContent className="text-[10px] max-w-[180px]">
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
						</div>

						<div className="space-y-1.5">
							<div className="flex items-center justify-between">
								<Label htmlFor="enableCaching" className="text-[11px] flex items-center gap-1.5 cursor-pointer">
									<Database className="h-3 w-3 text-amber-500" />
									Caché
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger asChild>
												<Info className="h-3 w-3 text-muted-foreground" />
											</TooltipTrigger>
											<TooltipContent className="text-[10px] max-w-[180px]">
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
						</div>
					</div>

					{/* Configuración de Animaciones */}
					<div className="pt-1">
						<Label className="text-[11px] font-medium flex items-center gap-1.5 py-1">
							<Timer className="h-3 w-3 text-amber-500" />
							Tiempos de Animación
						</Label>

						<div className="grid grid-cols-2 gap-3 pt-1.5">
							<div className="space-y-1.5">
								<div className="flex items-center justify-between">
									<Label htmlFor="animationDuration" className="text-[11px]">
										Duración Anim.
									</Label>
									<span className="text-[10px] font-mono text-muted-foreground">
										{cardOptions.animationDuration || 300}ms
									</span>
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

							<div className="space-y-1.5">
								<div className="flex items-center justify-between">
									<Label htmlFor="transitionDuration" className="text-[11px]">
										Duración Trans.
									</Label>
									<span className="text-[10px] font-mono text-muted-foreground">
										{cardOptions.transitionDuration || 200}ms
									</span>
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
						</div>

						<div className="pt-2">
							<div className="space-y-1.5">
								<div className="flex items-center justify-between">
									<Label htmlFor="throttleDelay" className="text-[11px] flex items-center gap-1.5">
										<IterationCcw className="h-3 w-3 text-amber-500" />
										Retraso de Throttle
									</Label>
									<span className="text-[10px] font-mono text-muted-foreground">
										{cardOptions.throttleDelay || 100}ms
									</span>
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
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
