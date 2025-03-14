'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
	Cpu,
	Hourglass,
	Image as ImageIcon,
	LineChart,
	Loader2,
	MousePointerClick,
	RefreshCwIcon,
	ZoomIn,
} from 'lucide-react';
import {
	FormGroup,
	FormLayout,
	FormRow,
	FormSection,
	FormSelect,
	FormSlider,
	FormToggle,
	PanelHeader,
} from '../../../settings/panels/shared';
import type { PerformanceModuleProps } from './types';
import { usePerformance } from './use-performance';

/**
 * Componente principal del módulo de rendimiento
 * @param props - Propiedades del módulo
 * @returns Componente React
 */
export function PerformanceModule({
	initialOptions = {},
	onChange,
	disabled = false,
	className,
}: PerformanceModuleProps) {
	// Utilizamos el hook para gestionar el estado y la lógica
	const {
		options,
		activeTab,
		setActiveTab,
		updateOption,
		resetToDefaults,
		cacheStrategyOptions,
		loadingStrategyOptions,
		performanceModeOptions,
	} = usePerformance({
		initialOptions,
		onChange,
		disabled,
	});

	return (
		<Card className={cn('w-full bg-slate-50/20 border-slate-200/50', className)}>
			<FormLayout>
				<PanelHeader
					title="Optimización de Rendimiento"
					description="Configura opciones para mejorar el rendimiento y la experiencia del usuario"
				/>

				<Tabs defaultValue="imageLoading" className="w-full" onValueChange={setActiveTab} value={activeTab}>
					<TabsList className="w-full grid grid-cols-3 h-9 mb-4">
						<TabsTrigger value="imageLoading" className="text-xs">
							<ImageIcon className="h-3.5 w-3.5 mr-1" />
							Carga
						</TabsTrigger>
						<TabsTrigger value="virtualization" className="text-xs">
							<Cpu className="h-3.5 w-3.5 mr-1" />
							Virtualización
						</TabsTrigger>
						<TabsTrigger value="animations" className="text-xs">
							<RefreshCwIcon className="h-3.5 w-3.5 mr-1" />
							Animaciones
						</TabsTrigger>
					</TabsList>

					{/* Tab de Carga de Imágenes */}
					<TabsContent value="imageLoading" className="space-y-4 mt-2 animate-in fade-in-50 duration-300">
						<FormSection title="Estrategia de Carga">
							<FormGroup>
								<FormSelect
									id="loadingStrategy"
									label="Estrategia de carga"
									description="Método para cargar las imágenes y recursos"
									value={options.loadingStrategy}
									onValueChange={(value) => updateOption('loadingStrategy', value)}
									options={loadingStrategyOptions}
									disabled={disabled}
									icon={<Loader2 className="h-4 w-4" />}
								/>

								<FormToggle
									id="enablePreloading"
									label="Precarga automática"
									description="Precarga recursos para mejorar la experiencia"
									checked={options.enablePreloading}
									onCheckedChange={(checked) => updateOption('enablePreloading', checked)}
									disabled={disabled}
								/>
							</FormGroup>
						</FormSection>

						<FormSection title="Carga de Imágenes">
							<FormGroup>
								<FormToggle
									id="lazyLoad"
									label="Carga diferida (lazy loading)"
									description="Carga las imágenes solo cuando están a punto de ser visibles"
									checked={options.lazyLoad}
									onCheckedChange={(checked) => updateOption('lazyLoad', checked)}
									disabled={disabled}
									icon={<Loader2 className="h-4 w-4" />}
								/>

								<FormToggle
									id="prefetch"
									label="Precarga (prefetch)"
									description="Precarga las imágenes para una navegación más fluida"
									checked={options.prefetch}
									onCheckedChange={(checked) => updateOption('prefetch', checked)}
									disabled={disabled}
								/>
							</FormGroup>

							<FormGroup>
								<FormToggle
									id="imageOptimization"
									label="Optimización de imágenes"
									description="Optimiza automáticamente las imágenes para mejorar el rendimiento"
									checked={options.imageOptimization}
									onCheckedChange={(checked) => updateOption('imageOptimization', checked)}
									disabled={disabled}
								/>

								<FormToggle
									id="prefetchOnHover"
									label="Precarga al pasar el cursor"
									description="Precarga recursos cuando el usuario pasa el cursor sobre la tarjeta"
									checked={options.prefetchOnHover}
									onCheckedChange={(checked) => updateOption('prefetchOnHover', checked)}
									disabled={disabled}
								/>
							</FormGroup>
						</FormSection>

						<FormSection title="Respuesta y Retrasos">
							<FormGroup>
								<FormSlider
									id="debounceTime"
									label="Tiempo de debounce"
									description="Retraso para agrupar múltiples acciones en una sola"
									value={options.debounceTime}
									onValueChange={(value) => updateOption('debounceTime', value)}
									min={0}
									max={1000}
									step={10}
									unit="ms"
									disabled={disabled}
									icon={<MousePointerClick className="h-3.5 w-3.5" />}
								/>

								<FormSlider
									id="transitionDelay"
									label="Retraso de transición"
									description="Tiempo de espera antes de iniciar una transición"
									value={options.transitionDelay}
									onValueChange={(value) => updateOption('transitionDelay', value)}
									min={0}
									max={500}
									step={10}
									unit="ms"
									disabled={disabled}
									icon={<Hourglass className="h-3.5 w-3.5" />}
								/>
							</FormGroup>
						</FormSection>
					</TabsContent>

					{/* Tab de Virtualización y Caché */}
					<TabsContent value="virtualization" className="space-y-4 mt-2 animate-in fade-in-50 duration-300">
						<FormSection title="Modo de Rendimiento">
							<FormGroup>
								<FormSelect
									id="performanceMode"
									label="Modo de rendimiento"
									description="Balance entre rendimiento y calidad visual"
									value={options.performanceMode}
									onValueChange={(value) => updateOption('performanceMode', value)}
									options={performanceModeOptions}
									disabled={disabled}
									icon={<Cpu className="h-4 w-4" />}
								/>

								<FormToggle
									id="enableCache"
									label="Habilitar caché"
									description="Almacena datos en caché para mejorar rendimiento"
									checked={options.enableCache}
									onCheckedChange={(checked) => updateOption('enableCache', checked)}
									disabled={disabled}
								/>
							</FormGroup>
						</FormSection>

						<FormSection title="Virtualización y Caché">
							<FormGroup>
								<FormToggle
									id="virtualizeList"
									label="Virtualizar lista"
									description="Renderiza solo las tarjetas visibles en la ventana"
									checked={options.virtualizeList}
									onCheckedChange={(checked) => updateOption('virtualizeList', checked)}
									disabled={disabled}
									icon={<LineChart className="h-4 w-4" />}
								/>

								<FormSelect
									id="cacheStrategy"
									label="Estrategia de caché"
									description="Método para almacenar datos en caché"
									value={options.cacheStrategy}
									onValueChange={(value) => updateOption('cacheStrategy', value)}
									options={cacheStrategyOptions}
									disabled={disabled}
								/>
							</FormGroup>

							<FormGroup>
								<FormToggle
									id="enableHardwareAcceleration"
									label="Aceleración por hardware"
									description="Utiliza la GPU para renderizar animaciones y efectos"
									checked={options.enableHardwareAcceleration}
									onCheckedChange={(checked) => updateOption('enableHardwareAcceleration', checked)}
									disabled={disabled}
								/>

								<FormToggle
									id="useWASM"
									label="Usar WebAssembly"
									description="Utiliza WebAssembly para operaciones intensivas"
									checked={options.useWASM}
									onCheckedChange={(checked) => updateOption('useWASM', checked)}
									disabled={disabled}
								/>
							</FormGroup>
						</FormSection>

						<FormSection title="Optimización Avanzada">
							<FormGroup>
								<FormToggle
									id="batchUpdates"
									label="Actualizaciones por lotes"
									description="Agrupa actualizaciones para mejorar el rendimiento"
									checked={options.batchUpdates}
									onCheckedChange={(checked) => updateOption('batchUpdates', checked)}
									disabled={disabled}
								/>

								<FormSlider
									id="throttleMs"
									label="Tiempo de limitación"
									description="Milisegundos entre actualizaciones"
									value={options.throttleMs}
									onValueChange={(value) => updateOption('throttleMs', value)}
									min={1}
									max={100}
									step={1}
									unit="ms"
									disabled={disabled}
								/>
							</FormGroup>
						</FormSection>
					</TabsContent>

					{/* Tab de Animaciones */}
					<TabsContent value="animations" className="space-y-4 mt-2 animate-in fade-in-50 duration-300">
						<FormSection title="Configuración de Animaciones">
							<FormGroup>
								<FormToggle
									id="reducedMotion"
									label="Movimiento reducido"
									description="Reduce o elimina las animaciones para mejorar el rendimiento"
									checked={options.reducedMotion}
									onCheckedChange={(checked) => updateOption('reducedMotion', checked)}
									disabled={disabled}
									icon={<ZoomIn className="h-4 w-4" />}
								/>

								<FormToggle
									id="useRAF"
									label="Usar requestAnimationFrame"
									description="Utiliza requestAnimationFrame para las animaciones"
									checked={options.useRAF}
									onCheckedChange={(checked) => updateOption('useRAF', checked)}
									disabled={disabled}
								/>
							</FormGroup>

							<FormGroup>
								<FormSlider
									id="animationDuration"
									label="Duración de animaciones"
									description="Tiempo que duran las animaciones"
									value={options.animationDuration}
									onValueChange={(value) => updateOption('animationDuration', value)}
									min={100}
									max={1000}
									step={50}
									unit="ms"
									disabled={disabled}
								/>

								<FormSlider
									id="animationMaxFPS"
									label="FPS máximos"
									description="Frames por segundo máximos para animaciones"
									value={options.animationMaxFPS}
									onValueChange={(value) => updateOption('animationMaxFPS', value)}
									min={30}
									max={120}
									step={30}
									disabled={disabled}
								/>
							</FormGroup>
						</FormSection>

						<FormSection>
							<FormRow>
								<Button
									variant="outline"
									size="sm"
									className="w-full text-xs h-8"
									onClick={resetToDefaults}
									disabled={disabled}
								>
									<RefreshCwIcon className="h-3.5 w-3.5 mr-1" />
									Restaurar valores por defecto
								</Button>
							</FormRow>
						</FormSection>
					</TabsContent>
				</Tabs>
			</FormLayout>
		</Card>
	);
}
