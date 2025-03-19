'use client';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
	Eye,
	FileIcon,
	Folder,
	Layers,
	MousePointer,
	RefreshCwIcon,
	Sliders,
	Sparkles
} from 'lucide-react';
import { useState } from 'react';
import {
	FormGroup,
	FormLayout,
	FormRow,
	FormSection,
	FormSelect,
	FormSlider,
	FormToggle
} from '../../../../settings/panels/shared/form-components';
import {
	type FolderOptions,
	aspectRatioOptions,
	blendingModeOptions,
	loadingStrategyOptions,
	sortOptions,
	themeOptions,
} from './types';

// Props para el panel de carpeta
interface FolderPanelProps {
	options: FolderOptions;
	updateCoreFolderConfig: (key: string, value: unknown) => void;
	updateCoreLayerSystem: (key: string, value: unknown) => void;
	updateCorePerformance: (key: string, value: unknown) => void;
	updateCoreEffects: (effectType: string, key: string, value: unknown) => void;
	updateCoreConfig: (key: string, value: unknown) => void;
	resetOptions: () => void;
	disabled?: boolean;
	className?: string;
}

/**
 * Panel de configuración de carpeta
 * @param props - Propiedades del panel
 * @returns Componente React
 */
export function FolderPanel({
	options,
	updateCoreFolderConfig,
	updateCoreLayerSystem,
	updateCorePerformance,
	updateCoreEffects,
	updateCoreConfig,
	resetOptions,
	disabled = false,
	className,
}: FolderPanelProps) {
	// Estado para la pestaña activa
	const [activeTab, setActiveTab] = useState<string>('display');

	// Secciones para la pestaña de visualización
	const DisplaySections = () => (
		<>
			<FormSection
				title="Visualización de Carpeta"
				description="Configura cómo se muestra la carpeta"
				colorScheme="core"
				icon={<FileIcon className="h-3.5 w-3.5 text-muted-foreground" />}
			>
				<FormGroup>
					<FormRow cols={2}>
						<FormToggle
							id="show-icon"
							label="Mostrar Icono"
							description="Muestra un icono representativo"
							checked={options.coreFolderConfig?.showIcon ?? true}
							onCheckedChange={(checked) => updateCoreFolderConfig('showIcon', checked)}
							disabled={disabled}
						/>

						<FormToggle
							id="show-stats"
							label="Mostrar Estadísticas"
							description="Muestra información sobre elementos"
							checked={options.coreFolderConfig?.showStats ?? true}
							onCheckedChange={(checked) => updateCoreFolderConfig('showStats', checked)}
							disabled={disabled}
						/>
					</FormRow>

					<FormRow cols={1}>
						<FormToggle
							id="show-date"
							label="Mostrar Fecha"
							description="Muestra la fecha de modificación"
							checked={options.coreFolderConfig?.showDate ?? true}
							onCheckedChange={(checked) => updateCoreFolderConfig('showDate', checked)}
							disabled={disabled}
						/>
					</FormRow>

					<FormRow cols={1}>
						<FormSlider
							id="grid-columns"
							label="Columnas en Cuadrícula"
							description="Número de columnas para mostrar elementos"
							min={1}
							max={12}
							step={1}
							value={[options.coreFolderConfig?.gridColumns ?? 4]}
							onValueChange={([value]) => updateCoreFolderConfig('gridColumns', value)}
							disabled={disabled}
						/>
					</FormRow>

					<FormRow cols={1}>
						<FormSelect
							id="sort-by"
							label="Ordenar Por"
							description="Criterio para ordenar elementos"
							value={options.coreFolderConfig?.sortBy ?? 'name'}
							onValueChange={(value) => updateCoreFolderConfig('sortBy', value)}
							options={sortOptions}
							disabled={disabled}
						/>
					</FormRow>
				</FormGroup>
			</FormSection>

			<FormSection
				title="Configuración Visual"
				description="Ajustes visuales generales"
				colorScheme="core"
				icon={<Eye className="h-3.5 w-3.5 text-muted-foreground" />}
			>
				<FormGroup>
					<FormRow cols={1}>
						<FormSelect
							id="theme"
							label="Tema"
							description="Apariencia visual general"
							value={options.coreConfig?.theme ?? 'auto'}
							onValueChange={(value) => updateCoreConfig('theme', value)}
							options={themeOptions}
							disabled={disabled}
						/>
					</FormRow>

					<FormRow cols={1}>
						<FormSlider
							id="font-size"
							label="Tamaño de Fuente"
							description="Tamaño del texto en píxeles"
							min={8}
							max={24}
							step={1}
							value={[options.coreConfig?.fontSize ?? 14]}
							onValueChange={([value]) => updateCoreConfig('fontSize', value)}
							disabled={disabled}
						/>
					</FormRow>

					<FormRow cols={1}>
						<FormSlider
							id="corner-radius"
							label="Radio de Esquinas"
							description="Redondeo de esquinas en píxeles"
							min={0}
							max={24}
							step={1}
							value={[options.coreConfig?.cornerRadius ?? 8]}
							onValueChange={([value]) => updateCoreConfig('cornerRadius', value)}
							disabled={disabled}
						/>
					</FormRow>

					<FormRow cols={1}>
						<FormSelect
							id="aspect-ratio"
							label="Relación de Aspecto"
							description="Proporción entre ancho y alto"
							value={options.coreConfig?.aspectRatio ?? '16/9'}
							onValueChange={(value) => updateCoreConfig('aspectRatio', value)}
							options={aspectRatioOptions}
							disabled={disabled}
						/>
					</FormRow>
				</FormGroup>
			</FormSection>
		</>
	);

	// Secciones para la pestaña de capas
	const LayersSections = () => (
		<FormSection
			title="Sistema de Capas"
			description="Configura cómo se organizan las capas"
			colorScheme="core"
			icon={<Layers className="h-3.5 w-3.5 text-muted-foreground" />}
		>
			<FormGroup>
				<FormRow cols={1}>
					<FormSelect
						id="layer-blending"
						label="Modo de Fusión"
						description="Cómo se combinan las capas"
						value={options.coreLayerSystem?.layerBlending ?? 'normal'}
						onValueChange={(value) => updateCoreLayerSystem('layerBlending', value)}
						options={blendingModeOptions}
						disabled={disabled}
					/>
				</FormRow>

				<FormRow cols={1}>
					<FormSlider
						id="layer-spacing"
						label="Espaciado entre Capas"
						description="Distancia entre capas en píxeles"
						min={0}
						max={10}
						step={0.5}
						value={[options.coreLayerSystem?.layerSpacing ?? 2]}
						onValueChange={([value]) => updateCoreLayerSystem('layerSpacing', value)}
						disabled={disabled}
					/>
				</FormRow>
			</FormGroup>
		</FormSection>
	);

	// Secciones para la pestaña de efectos
	const EffectsSections = () => (
		<>
			<FormSection
				title="Efectos Básicos"
				description="Efectos visuales para mejorar la apariencia"
				colorScheme="core"
				icon={<Sparkles className="h-3.5 w-3.5 text-muted-foreground" />}
			>
				<FormGroup>
					<FormRow cols={2}>
						<FormToggle
							id="shadow-enabled"
							label="Sombra"
							description="Añade sombra proyectada"
							checked={options.coreEffects?.shadow?.enabled ?? true}
							onCheckedChange={(checked) => updateCoreEffects('shadow', 'enabled', checked)}
							disabled={disabled}
						/>

						{options.coreEffects?.shadow?.enabled && (
							<FormSlider
								id="shadow-intensity"
								label="Intensidad"
								description="Intensidad del efecto"
								min={0}
								max={100}
								step={1}
								value={[options.coreEffects?.shadow?.intensity ?? 50]}
								onValueChange={([value]) => updateCoreEffects('shadow', 'intensity', value)}
								disabled={disabled}
							/>
						)}
					</FormRow>

					<FormRow cols={2}>
						<FormToggle
							id="glow-enabled"
							label="Brillo"
							description="Añade un halo luminoso"
							checked={options.coreEffects?.glow?.enabled ?? false}
							onCheckedChange={(checked) => updateCoreEffects('glow', 'enabled', checked)}
							disabled={disabled}
						/>

						{options.coreEffects?.glow?.enabled && (
							<FormSlider
								id="glow-intensity"
								label="Intensidad"
								description="Intensidad del efecto"
								min={0}
								max={100}
								step={1}
								value={[options.coreEffects?.glow?.intensity ?? 30]}
								onValueChange={([value]) => updateCoreEffects('glow', 'intensity', value)}
								disabled={disabled}
							/>
						)}
					</FormRow>

					<FormRow cols={2}>
						<FormToggle
							id="border-enabled"
							label="Borde"
							description="Añade borde decorativo"
							checked={options.coreEffects?.border?.enabled ?? false}
							onCheckedChange={(checked) => updateCoreEffects('border', 'enabled', checked)}
							disabled={disabled}
						/>

						{options.coreEffects?.border?.enabled && (
							<FormToggle
								id="border-animated"
								label="Borde Animado"
								description="Anima el borde"
								checked={options.coreEffects?.border?.animated ?? false}
								onCheckedChange={(checked) => updateCoreEffects('border', 'animated', checked)}
								disabled={disabled}
							/>
						)}
					</FormRow>
				</FormGroup>
			</FormSection>

			<FormSection
				title="Efectos Avanzados"
				description="Efectos visuales adicionales"
				colorScheme="core"
				icon={<MousePointer className="h-3.5 w-3.5 text-muted-foreground" />}
			>
				<FormGroup>
					<FormRow cols={2}>
						<FormToggle
							id="reflection-enabled"
							label="Reflejo"
							description="Añade reflejo bajo la tarjeta"
							checked={options.coreEffects?.reflection?.enabled ?? false}
							onCheckedChange={(checked) => updateCoreEffects('reflection', 'enabled', checked)}
							disabled={disabled}
						/>

						{options.coreEffects?.reflection?.enabled && (
							<FormSlider
								id="reflection-opacity"
								label="Opacidad"
								description="Transparencia del reflejo"
								min={0}
								max={100}
								step={1}
								value={[options.coreEffects?.reflection?.opacity ?? 30]}
								onValueChange={([value]) => updateCoreEffects('reflection', 'opacity', value)}
								disabled={disabled}
							/>
						)}
					</FormRow>

					<FormRow cols={2}>
						<FormToggle
							id="parallax-enabled"
							label="Parallax"
							description="Efecto de profundidad al mover"
							checked={options.coreEffects?.parallax?.enabled ?? false}
							onCheckedChange={(checked) => updateCoreEffects('parallax', 'enabled', checked)}
							disabled={disabled}
						/>

						{options.coreEffects?.parallax?.enabled && (
							<FormSlider
								id="parallax-intensity"
								label="Intensidad"
								description="Intensidad del efecto"
								min={0}
								max={100}
								step={1}
								value={[options.coreEffects?.parallax?.intensity ?? 20]}
								onValueChange={([value]) => updateCoreEffects('parallax', 'intensity', value)}
								disabled={disabled}
							/>
						)}
					</FormRow>

					<FormRow cols={2}>
						<FormToggle
							id="holo-enabled"
							label="Holográfico"
							description="Efecto holográfico"
							checked={options.coreEffects?.holographic?.enabled ?? false}
							onCheckedChange={(checked) => updateCoreEffects('holographic', 'enabled', checked)}
							disabled={disabled}
						/>

						{options.coreEffects?.holographic?.enabled && (
							<FormSlider
								id="holo-intensity"
								label="Intensidad"
								description="Intensidad del efecto"
								min={0}
								max={100}
								step={1}
								value={[options.coreEffects?.holographic?.intensity ?? 50]}
								onValueChange={([value]) => updateCoreEffects('holographic', 'intensity', value)}
								disabled={disabled}
							/>
						)}
					</FormRow>
				</FormGroup>
			</FormSection>
		</>
	);

	// Secciones para la pestaña de rendimiento
	const PerformanceSections = () => (
		<FormSection
			title="Rendimiento"
			description="Opciones para optimizar el rendimiento"
			colorScheme="core"
			icon={<Sliders className="h-3.5 w-3.5 text-muted-foreground" />}
		>
			<FormGroup>
				<FormRow cols={2}>
					<FormToggle
						id="enable-cache"
						label="Habilitar Caché"
						description="Almacenar datos para mejorar el rendimiento"
						checked={options.corePerformance?.enableCache ?? true}
						onCheckedChange={(checked) => updateCorePerformance('enableCache', checked)}
						disabled={disabled}
					/>

					<FormToggle
						id="virtual-scroll"
						label="Scroll Virtual"
						description="Renderizar solo elementos visibles"
						checked={options.corePerformance?.useVirtualScroll ?? true}
						onCheckedChange={(checked) => updateCorePerformance('useVirtualScroll', checked)}
						disabled={disabled}
					/>
				</FormRow>

				<FormRow cols={2}>
					<FormToggle
						id="lazy-load"
						label="Carga Perezosa"
						description="Cargar elementos solo cuando son visibles"
						checked={options.corePerformance?.lazyLoad ?? true}
						onCheckedChange={(checked) => updateCorePerformance('lazyLoad', checked)}
						disabled={disabled}
					/>

					<FormSelect
						id="loading-strategy"
						label="Estrategia de Carga"
						description="Cómo se cargan los elementos"
						value={options.corePerformance?.loadingStrategy ?? 'progressive'}
						onValueChange={(value) => updateCorePerformance('loadingStrategy', value)}
						options={loadingStrategyOptions}
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
						value={[options.corePerformance?.throttleMs ?? 100]}
						onValueChange={([value]) => updateCorePerformance('throttleMs', value)}
						disabled={disabled}
					/>
				</FormRow>
			</FormGroup>
		</FormSection>
	);

	return (
		<FormLayout
			title="Configuración de Carpeta"
			description="Personaliza la visualización y comportamiento de las carpetas"
			className={className}
			colorScheme="core"
			icon={<Folder className="h-4 w-4" />}
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
			<Tabs defaultValue="display" value={activeTab} onValueChange={setActiveTab} className="w-full">
				<TabsList className="grid w-full grid-cols-4 h-8">
					<TabsTrigger className="text-[10px]" value="display">
						Visualización
					</TabsTrigger>
					<TabsTrigger className="text-[10px]" value="layers">
						Capas
					</TabsTrigger>
					<TabsTrigger className="text-[10px]" value="effects">
						Efectos
					</TabsTrigger>
					<TabsTrigger className="text-[10px]" value="performance">
						Rendimiento
					</TabsTrigger>
				</TabsList>

				<TabsContent value="display" className="mt-4 space-y-6">
					<DisplaySections />
				</TabsContent>

				<TabsContent value="layers" className="mt-4 space-y-6">
					<LayersSections />
				</TabsContent>

				<TabsContent value="effects" className="mt-4 space-y-6">
					<EffectsSections />
				</TabsContent>

				<TabsContent value="performance" className="mt-4 space-y-6">
					<PerformanceSections />
				</TabsContent>
			</Tabs>
		</FormLayout>
	);
}
