'use client';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
	Cpu,
	Image as ImageIcon,
	LineChart,
	Loader2,
	MousePointerClick,
	RefreshCwIcon,
	TimerReset,
	ZoomIn
} from 'lucide-react';
import { useState } from 'react';
import {
	FormGroup,
	FormLayout,
	FormRow,
	FormSection,
	FormSelect,
	FormSlider,
	FormToggle,
} from '../../../../settings/panels/shared/form-components';
import { type PerformanceOptions, cacheStrategyOptions, loadingStrategyOptions, performanceModeOptions } from './types';

interface PerformancePanelProps {
	options: PerformanceOptions;
	updateOption: (key: keyof PerformanceOptions, value: unknown) => void;
	resetOptions: () => void;
	applyPreset: (presetName: 'quality' | 'balanced' | 'performance') => void;
	disabled?: boolean;
	className?: string;
}

/**
 * Panel de configuración de rendimiento
 * @param props - Propiedades del panel
 * @returns Componente React
 */
export function PerformancePanel({
	options,
	updateOption,
	resetOptions,
	applyPreset,
	disabled = false,
	className,
}: PerformancePanelProps) {
	// Estado para pestaña activa
	const [activeTab, setActiveTab] = useState<string>('general');

	// Renderizar sección general
	const GeneralSection = () => (
		<FormSection
			title="Configuración General"
			description="Ajustes generales de rendimiento"
			colorScheme="core"
			icon={<Cpu className="h-3.5 w-3.5 text-muted-foreground" />}
		>
			<FormGroup>
				<FormRow cols={1}>
					<FormSelect
						id="performance-mode"
						label="Modo de Rendimiento"
						description="Balance entre calidad visual y rendimiento"
						value={options.performanceMode ?? 'balanced'}
						onValueChange={(value) => updateOption('performanceMode', value)}
						options={performanceModeOptions}
						disabled={disabled}
					/>
				</FormRow>

				<FormRow cols={2}>
					<FormToggle
						id="enable-cache"
						label="Habilitar Caché"
						description="Almacenar datos para mejorar el rendimiento"
						checked={options.enableCache ?? true}
						onCheckedChange={(checked) => updateOption('enableCache', checked)}
						disabled={disabled}
					/>

					<FormToggle
						id="hardware-acceleration"
						label="Aceleración Hardware"
						description="Usar GPU para renderizado"
						checked={options.enableHardwareAcceleration ?? true}
						onCheckedChange={(checked) => updateOption('enableHardwareAcceleration', checked)}
						disabled={disabled}
					/>
				</FormRow>

				<FormRow cols={1}>
					<FormSelect
						id="loading-strategy"
						label="Estrategia de Carga"
						description="Cómo se cargan los componentes"
						value={options.loadingStrategy ?? 'progressive'}
						onValueChange={(value) => updateOption('loadingStrategy', value)}
						options={loadingStrategyOptions}
						disabled={disabled}
					/>
				</FormRow>
			</FormGroup>
		</FormSection>
	);

	// Renderizar sección de imágenes
	const ImagesSection = () => (
		<FormSection
			title="Optimización de Imágenes"
			description="Configuración para la carga y optimización de imágenes"
			colorScheme="core"
			icon={<ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />}
		>
			<FormGroup>
				<FormRow cols={2}>
					<FormToggle
						id="lazy-load"
						label="Carga Perezosa"
						description="Cargar imágenes solo cuando son visibles"
						checked={options.lazyLoad ?? true}
						onCheckedChange={(checked) => updateOption('lazyLoad', checked)}
						disabled={disabled}
					/>

					<FormToggle
						id="prefetch"
						label="Precarga"
						description="Precargar imágenes anticipadamente"
						checked={options.prefetch ?? true}
						onCheckedChange={(checked) => updateOption('prefetch', checked)}
						disabled={disabled}
					/>
				</FormRow>

				<FormRow cols={2}>
					<FormToggle
						id="image-optimization"
						label="Optimización de Imágenes"
						description="Reducir tamaño y mejorar rendimiento"
						checked={options.imageOptimization ?? true}
						onCheckedChange={(checked) => updateOption('imageOptimization', checked)}
						disabled={disabled}
					/>

					<FormToggle
						id="prefetch-hover"
						label="Precargar al Hover"
						description="Precargar imágenes al pasar el cursor"
						checked={options.prefetchOnHover ?? true}
						onCheckedChange={(checked) => updateOption('prefetchOnHover', checked)}
						disabled={disabled}
					/>
				</FormRow>
			</FormGroup>
		</FormSection>
	);

	// Renderizar sección de animaciones
	const AnimationsSection = () => (
		<FormSection
			title="Animaciones"
			description="Configuración para animaciones y transiciones"
			colorScheme="core"
			icon={<MousePointerClick className="h-3.5 w-3.5 text-muted-foreground" />}
		>
			<FormGroup>
				<FormRow cols={1}>
					<FormToggle
						id="reduced-motion"
						label="Movimiento Reducido"
						description="Simplificar animaciones para mejorar rendimiento"
						checked={options.reducedMotion ?? false}
						onCheckedChange={(checked) => updateOption('reducedMotion', checked)}
						disabled={disabled}
					/>
				</FormRow>

				<FormRow cols={1}>
					<FormSlider
						id="animation-duration"
						label="Duración de Animación"
						description="Duración en milisegundos"
						min={0}
						max={1000}
						step={10}
						value={[options.animationDuration ?? 300]}
						onValueChange={([value]) => updateOption('animationDuration', value)}
						disabled={disabled}
					/>
				</FormRow>

				<FormRow cols={1}>
					<FormSlider
						id="animation-max-fps"
						label="FPS Máximos"
						description="Limitar cuadros por segundo"
						min={15}
						max={120}
						step={5}
						value={[options.animationMaxFPS ?? 60]}
						onValueChange={([value]) => updateOption('animationMaxFPS', value)}
						disabled={disabled}
					/>
				</FormRow>
			</FormGroup>
		</FormSection>
	);

	// Renderizar sección avanzada
	const AdvancedSection = () => (
		<FormSection
			title="Configuración Avanzada"
			description="Ajustes técnicos para optimización avanzada"
			colorScheme="core"
			icon={<LineChart className="h-3.5 w-3.5 text-muted-foreground" />}
		>
			<FormGroup>
				<FormRow cols={2}>
					<FormToggle
						id="use-raf"
						label="Usar requestAnimationFrame"
						description="Sincronizar con refresco de pantalla"
						checked={options.useRAF ?? true}
						onCheckedChange={(checked) => updateOption('useRAF', checked)}
						disabled={disabled}
					/>

					<FormToggle
						id="batch-updates"
						label="Actualizar por Lotes"
						description="Agrupar actualizaciones del DOM"
						checked={options.batchUpdates ?? true}
						onCheckedChange={(checked) => updateOption('batchUpdates', checked)}
						disabled={disabled}
					/>
				</FormRow>

				<FormRow cols={1}>
					<FormSlider
						id="throttle-ms"
						label="Throttle (ms)"
						description="Limitar frecuencia de eventos"
						min={0}
						max={500}
						step={10}
						value={[options.throttleMs ?? 150]}
						onValueChange={([value]) => updateOption('throttleMs', value)}
						disabled={disabled}
					/>
				</FormRow>

				<FormRow cols={1}>
					<FormSlider
						id="debounce-time"
						label="Debounce (ms)"
						description="Retardo para eventos frecuentes"
						min={0}
						max={1000}
						step={10}
						value={[options.debounceTime ?? 300]}
						onValueChange={([value]) => updateOption('debounceTime', value)}
						disabled={disabled}
					/>
				</FormRow>

				<FormRow cols={1}>
					<FormSelect
						id="cache-strategy"
						label="Estrategia de Caché"
						description="Método para almacenar datos en caché"
						value={options.cacheStrategy ?? 'memory'}
						onValueChange={(value) => updateOption('cacheStrategy', value)}
						options={cacheStrategyOptions}
						disabled={disabled}
					/>
				</FormRow>

				<FormRow cols={1}>
					<FormToggle
						id="virtualize-list"
						label="Virtualizar Listas"
						description="Renderizar solo elementos visibles"
						checked={options.virtualizeList ?? true}
						onCheckedChange={(checked) => updateOption('virtualizeList', checked)}
						disabled={disabled}
					/>
				</FormRow>

				<FormRow cols={2}>
					<FormToggle
						id="preloading"
						label="Precarga de Datos"
						description="Cargar datos anticipadamente"
						checked={options.enablePreloading ?? true}
						onCheckedChange={(checked) => updateOption('enablePreloading', checked)}
						disabled={disabled}
					/>

					<FormToggle
						id="use-wasm"
						label="Usar WebAssembly"
						description="Habilitar aceleración WASM"
						checked={options.useWASM ?? false}
						onCheckedChange={(checked) => updateOption('useWASM', checked)}
						disabled={disabled}
					/>
				</FormRow>
			</FormGroup>
		</FormSection>
	);

	return (
		<FormLayout
			title="Rendimiento"
			description="Optimiza el rendimiento de tus tarjetas"
			className={className}
			colorScheme="core"
			icon={<Cpu className="h-4 w-4" />}
			variant="colored"
			trailing={
				<Button
					type="button"
					onClick={resetOptions}
					variant="outline"
					size="sm"
					disabled={disabled}
					className="mt-1"
				>
					<RefreshCwIcon className="mr-1 h-3 w-3" />
					Restablecer
				</Button>
			}
		>
			<div className="mb-4 flex space-x-2">
				<Button
					onClick={() => applyPreset('quality')}
					variant={options.performanceMode === 'quality' ? 'default' : 'outline'}
					size="sm"
					className="flex-1"
					disabled={disabled}
				>
					<ZoomIn className="mr-1 h-3 w-3" />
					Calidad
				</Button>

				<Button
					onClick={() => applyPreset('balanced')}
					variant={options.performanceMode === 'balanced' ? 'default' : 'outline'}
					size="sm"
					className="flex-1"
					disabled={disabled}
				>
					<TimerReset className="mr-1 h-3 w-3" />
					Equilibrado
				</Button>

				<Button
					onClick={() => applyPreset('performance')}
					variant={options.performanceMode === 'performance' ? 'default' : 'outline'}
					size="sm"
					className="flex-1"
					disabled={disabled}
				>
					<Loader2 className="mr-1 h-3 w-3" />
					Rendimiento
				</Button>
			</div>

			<Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="w-full">
				<TabsList className="grid w-full grid-cols-4 h-8">
					<TabsTrigger className="text-[10px]" value="general">
						General
					</TabsTrigger>
					<TabsTrigger className="text-[10px]" value="images">
						Imágenes
					</TabsTrigger>
					<TabsTrigger className="text-[10px]" value="animations">
						Animaciones
					</TabsTrigger>
					<TabsTrigger className="text-[10px]" value="advanced">
						Avanzado
					</TabsTrigger>
				</TabsList>

				<TabsContent value="general" className="mt-4 space-y-6">
					<GeneralSection />
				</TabsContent>

				<TabsContent value="images" className="mt-4 space-y-6">
					<ImagesSection />
				</TabsContent>

				<TabsContent value="animations" className="mt-4 space-y-6">
					<AnimationsSection />
				</TabsContent>

				<TabsContent value="advanced" className="mt-4 space-y-6">
					<AdvancedSection />
				</TabsContent>
			</Tabs>
		</FormLayout>
	);
}
