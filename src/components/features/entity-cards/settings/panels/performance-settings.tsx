'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import {
	Cpu,
	Hourglass,
	Image as ImageIcon,
	LineChart,
	Loader2,
	MousePointerClick,
	RefreshCwIcon,
	TimerReset,
	ZoomIn,
} from 'lucide-react';
import type { CardOptions } from '../types';
import { SliderOption, ToggleOption, createNestedOptionChangeHandler, panelColors } from './shared/panel-helpers';

type PerformanceKey = keyof NonNullable<CardOptions['performance']>;
type PerformanceValue = NonNullable<CardOptions['performance']>[PerformanceKey];

export function PerformanceSettings({
	options,
	onChange,
	disabled = false,
}: {
	options: CardOptions;
	onChange: (options: CardOptions) => void;
	disabled?: boolean;
}) {
	const handlePerformanceChange = (key: PerformanceKey, value: PerformanceValue) => {
		onChange({
			...options,
			performance: {
				...options.performance,
				[key]: value,
			},
		});
	};

	return (
		<Card className={cn('w-full', panelColors.performance.bg, panelColors.performance.border)}>
			<CardHeader className="pb-3">
				<CardTitle className="text-sm font-medium">Optimización de Rendimiento</CardTitle>
				<CardDescription className="text-xs text-muted-foreground">
					Configura opciones para mejorar el rendimiento y la experiencia del usuario
				</CardDescription>
			</CardHeader>
			<CardContent className="p-4 pt-0">
				<ScrollArea className="h-[300px] pr-4">
					<div className="space-y-5">
						{/* Optimización de Carga */}
						<div className="space-y-3">
							<div className="flex items-center gap-1.5">
								<ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
								<h3 className="text-xs font-medium">Carga de Imágenes</h3>
							</div>
							<div className="space-y-3 pl-5">
								<ToggleOption
									id="lazyLoad"
									label="Carga diferida (lazy loading)"
									description="Carga las imágenes solo cuando están a punto de ser visibles"
									checked={options.performance?.lazyLoad ?? true}
									onCheckedChange={(checked) => handlePerformanceChange('lazyLoad', checked)}
									disabled={disabled}
								/>

								<ToggleOption
									id="prefetch"
									label="Precarga (prefetch)"
									description="Precarga las imágenes para una navegación más fluida"
									checked={options.performance?.prefetch ?? false}
									onCheckedChange={(checked) => handlePerformanceChange('prefetch', checked)}
									disabled={disabled}
								/>

								<ToggleOption
									id="imageOptimization"
									label="Optimización de imágenes"
									description="Optimiza automáticamente las imágenes para mejorar el rendimiento"
									checked={options.performance?.imageOptimization ?? true}
									onCheckedChange={(checked) => handlePerformanceChange('imageOptimization', checked)}
									disabled={disabled}
								/>

								<ToggleOption
									id="prefetchOnHover"
									label="Precarga al pasar el cursor"
									description="Precarga recursos cuando el usuario pasa el cursor sobre la tarjeta"
									checked={options.performance?.prefetchOnHover ?? false}
									onCheckedChange={(checked) => handlePerformanceChange('prefetchOnHover', checked)}
									disabled={disabled}
								/>

								<ToggleOption
									id="placeholderImage"
									label="Imagen de placeholder"
									description="Muestra una imagen de baja resolución mientras se carga la imagen original"
									checked={options.performance?.placeholderImage ?? true}
									onCheckedChange={(checked) => handlePerformanceChange('placeholderImage', checked)}
									disabled={disabled}
								/>

								<ToggleOption
									id="useSkeletonLoading"
									label="Usar skeleton loading"
									description="Muestra un esqueleto animado mientras se cargan las tarjetas"
									checked={options.performance?.useSkeletonLoading ?? true}
									onCheckedChange={(checked) => handlePerformanceChange('useSkeletonLoading', checked)}
									disabled={disabled}
								/>
							</div>
						</div>

						<Separator />

						{/* Virtualización y Caché */}
						<div className="space-y-3">
							<div className="flex items-center gap-1.5">
								<Cpu className="h-3.5 w-3.5 text-muted-foreground" />
								<h3 className="text-xs font-medium">Virtualización y Caché</h3>
							</div>
							<div className="space-y-3 pl-5">
								<ToggleOption
									id="virtualizeList"
									label="Virtualizar lista"
									description="Renderiza solo las tarjetas visibles en la ventana"
									checked={options.performance?.virtualizeList ?? false}
									onCheckedChange={(checked) => handlePerformanceChange('virtualizeList', checked)}
									disabled={disabled}
								/>

								<div className="space-y-1.5">
									<label htmlFor="cacheStrategy" className="text-[11px] flex items-center gap-1.5">
										Estrategia de caché
									</label>
									<Select
										value={options.performance?.cacheStrategy || 'memory'}
										onValueChange={(value) => handlePerformanceChange('cacheStrategy', value)}
										disabled={disabled}
									>
										<SelectTrigger id="cacheStrategy" className="h-8">
											<SelectValue placeholder="Selecciona una estrategia" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="none">Sin caché</SelectItem>
											<SelectItem value="memory">En memoria</SelectItem>
											<SelectItem value="persistent">Persistente</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<ToggleOption
									id="enableHardwareAcceleration"
									label="Aceleración por hardware"
									description="Utiliza la GPU para renderizar animaciones y efectos"
									checked={options.performance?.enableHardwareAcceleration ?? true}
									onCheckedChange={(checked) => handlePerformanceChange('enableHardwareAcceleration', checked)}
									disabled={disabled}
								/>
							</div>
						</div>

						<Separator />

						{/* Animaciones */}
						<div className="space-y-3">
							<div className="flex items-center gap-1.5">
								<RefreshCwIcon className="h-3.5 w-3.5 text-muted-foreground" />
								<h3 className="text-xs font-medium">Animaciones</h3>
							</div>
							<div className="space-y-3 pl-5">
								<ToggleOption
									id="reducedMotion"
									label="Movimiento reducido"
									description="Reduce o elimina las animaciones para mejorar el rendimiento"
									checked={options.performance?.reducedMotion ?? false}
									onCheckedChange={(checked) => handlePerformanceChange('reducedMotion', checked)}
									disabled={disabled}
								/>

								<div className="space-y-2">
									<Label htmlFor="animationDuration" className="text-xs font-medium">
										Duración de animaciones (ms)
									</Label>
									<Slider
										id="animationDuration"
										value={[options.performance?.animationDuration || 300]}
										onValueChange={([value]) => handlePerformanceChange('animationDuration', value)}
										min={100}
										max={1000}
										step={50}
										disabled={disabled}
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="animationMaxFPS" className="text-xs font-medium">
										FPS máximos
									</Label>
									<Slider
										id="animationMaxFPS"
										value={[options.performance?.animationMaxFPS || 60]}
										onValueChange={([value]) => handlePerformanceChange('animationMaxFPS', value)}
										min={30}
										max={120}
										step={30}
										disabled={disabled}
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="timingFunction" className="text-xs font-medium">
										Función de temporización
									</Label>
									<Select
										id="timingFunction"
										value={options.performance?.animationTimingFunction || 'ease-out'}
										onValueChange={(value) => handlePerformanceChange('animationTimingFunction', value)}
										disabled={disabled}
									>
										<SelectTrigger>
											<SelectValue placeholder="Selecciona una función" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="linear">Lineal</SelectItem>
											<SelectItem value="ease">Suave</SelectItem>
											<SelectItem value="ease-in">Entrada suave</SelectItem>
											<SelectItem value="ease-out">Salida suave</SelectItem>
											<SelectItem value="ease-in-out">Entrada y salida suave</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
						</div>

						<Separator />

						{/* Respuesta y Retrasos */}
						<div className="space-y-3">
							<div className="flex items-center gap-1.5">
								<TimerReset className="h-3.5 w-3.5 text-muted-foreground" />
								<h3 className="text-xs font-medium">Respuesta y Retrasos</h3>
							</div>
							<div className="space-y-3 pl-5">
								<SliderOption
									id="debounceTime"
									label="Tiempo de debounce"
									description="Retraso para agrupar múltiples acciones en una sola"
									value={options.performance?.debounceTime ?? 200}
									onValueChange={(value) => handlePerformanceChange('debounceTime', value)}
									min={0}
									max={1000}
									step={10}
									unit="ms"
									disabled={disabled}
									icon={<MousePointerClick className="h-3 w-3" />}
								/>

								<SliderOption
									id="transitionDelay"
									label="Retraso de transición"
									description="Tiempo de espera antes de iniciar una transición"
									value={options.performance?.transitionDelay ?? 0}
									onValueChange={(value) => handlePerformanceChange('transitionDelay', value)}
									min={0}
									max={500}
									step={10}
									unit="ms"
									disabled={disabled}
									icon={<Hourglass className="h-3 w-3" />}
								/>
							</div>
						</div>
					</div>
				</ScrollArea>
			</CardContent>
		</Card>
	);
}
