'use client';

/**
 * 🧩 Panel de configuración de capas
 *
 * Este componente proporciona una interfaz para gestionar y personalizar
 * las capas del sistema de renderizado de tarjetas.
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { clsx } from 'clsx';
import { Eye, EyeOff, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useLayerPlugin } from '../../layers/layer-plugin-system';
import type { CardOptions } from '../../types/card-settings-types';
import type { LayerConfig, LayerSystemConfig } from '../layers/types';
import type { EntityCardLayerSystemConfig } from './entity-card-layer-adapter';
import { LayerPresetsPanel } from './layer-presets-panel';
import { LayerSelector } from './layer-selector';
import type { LayersModuleConfig } from './types';

// Definimos un tipo extendido que incluye layerSpacing
type ExtendedLayerSystemConfig = LayerSystemConfig & {
	layerSpacing?: number;
};

/**
 * Props para el componente LayersPanel
 */
interface LayersPanelProps {
	/** Configuración actual del sistema de capas */
	config: EntityCardLayerSystemConfig | LayersModuleConfig;
	/** Función llamada cuando cambia la configuración */
	onChange: (config: EntityCardLayerSystemConfig) => void;
	/** Opciones de tarjeta (para integración) */
	cardOptions?: CardOptions;
	/** Función para actualizar opciones de tarjeta (para integración) */
	onCardOptionsChange?: (options: CardOptions) => void;
	/** Modo de diseño */
	designMode?: 'compact' | 'full';
}

/**
 * Panel principal para la gestión y configuración de las capas
 */
export function LayersPanel({
	config,
	onChange,
	cardOptions,
	onCardOptionsChange,
	designMode = 'full',
}: LayersPanelProps) {
	// Estado para la capa seleccionada actualmente
	const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

	// Estado para la tab activa
	const [activeTab, setActiveTab] = useState<string>('general');

	// Convertir configuración a formato EntityCardLayerSystemConfig si es necesario
	const entityCardConfig: EntityCardLayerSystemConfig = useMemo(() => {
		// Si ya tiene la forma correcta, devolver directamente
		if ('globalOpacity' in config || config.layers === undefined) {
			return config as EntityCardLayerSystemConfig;
		}

		// Convertir de LayersModuleConfig a EntityCardLayerSystemConfig
		return {
			layerSystem: config.layerSystem,
			layerConfigs: config.layerConfigs,
			// Preservar las capas como opcional
			layers: config.layers,
			// Valor por defecto para globalOpacity
			globalOpacity: 100
		};
	}, [config]);

	// Extraer configuración de capas y sistema
	const layerSystem = entityCardConfig.layerSystem || {} as ExtendedLayerSystemConfig;
	const layerConfigs = entityCardConfig.layerConfigs || {} as Record<string, LayerConfig>;

	// Obtener capas disponibles
	const { getLayers, getOrderedLayers } = useLayerPlugin();
	const availableLayers = useMemo(() => getOrderedLayers(), [getOrderedLayers]);

	// Función para actualizar la configuración del sistema
	const updateLayerSystem = (updates: Partial<ExtendedLayerSystemConfig>) => {
		onChange({
			...entityCardConfig,
			layerSystem: {
				...layerSystem,
				...updates,
			},
		});
	};

	// Función para actualizar la configuración de una capa específica
	const updateLayerConfig = (layerId: string, updates: Record<string, unknown>) => {
		onChange({
			...entityCardConfig,
			layerConfigs: {
				...layerConfigs,
				[layerId]: {
					...layerConfigs[layerId],
					...updates,
				},
			},
		});
	};

	// Función para alternar la visibilidad de una capa
	const toggleLayerVisibility = (layerId: string) => {
		const layerEnabled = layerConfigs[layerId]?.enabled ?? false;
		updateLayerConfig(layerId, { enabled: !layerEnabled });

		// Actualizar también el estado habilitado en el sistema de capas
		updateLayerSystem({
			enabledLayers: {
				...layerSystem.enabledLayers,
				[layerId]: !layerEnabled,
			},
		});
	};

	// Extraer y ordenar las capas disponibles
	const layerIds = useMemo(() => {
		return layerSystem.layerOrder || [];
	}, [layerSystem.layerOrder]);

	// Capa actualmente seleccionada
	const selectedLayer = selectedLayerId ? layerConfigs[selectedLayerId] : null;

	return (
		<div className="space-y-4">
			{/* Panel principal de capas */}
			<Card className="bg-muted/25">
				<CardHeader className="p-3 pb-2">
					<div className="flex items-center justify-between">
						<CardTitle className="text-[14px]">Sistema de Capas</CardTitle>
						<Button
							variant="ghost"
							size="icon"
							className="h-7 w-7 text-muted-foreground"
							onClick={() => updateLayerSystem({ enabled: !layerSystem.enabled })}
						>
							{layerSystem.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
						</Button>
					</div>
					<CardDescription className="text-[11px]">
						Gestiona las capas y personaliza su orden y propiedades.
					</CardDescription>
				</CardHeader>
				<CardContent className="p-3 pt-0">
					<Tabs
						defaultValue="general"
						value={activeTab}
						onValueChange={setActiveTab}
						className="w-full"
					>
						<TabsList className="w-full grid grid-cols-3 h-8 bg-transparent mb-2">
							<TabsTrigger value="general" className="text-[11px] h-7">
								General
							</TabsTrigger>
							<TabsTrigger value="layers" className="text-[11px] h-7">
								Capas
							</TabsTrigger>
							<TabsTrigger value="presets" className="text-[11px] h-7">
								Presets
							</TabsTrigger>
						</TabsList>

						{/* Ajustes generales del sistema de capas */}
						<TabsContent value="general" className="pt-1">
							<div className="space-y-3">
								{/* Estrategia de renderizado */}
								<div className="space-y-1.5" id="render-strategy-container">
									<div className="flex items-center justify-between">
										<label htmlFor="render-strategy-container" className="text-[11px] font-medium">
											Estrategia de renderizado
										</label>
									</div>
									<Select
										value={layerSystem.renderStrategy || 'stacked'}
										onValueChange={(value) => updateLayerSystem({
											renderStrategy: value as 'stacked' | 'composited' | 'dynamic'
										})}
									>
										<SelectTrigger className="h-8 text-[11px]">
											<SelectValue placeholder="Seleccionar estilo" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="stacked" className="text-[11px]">
												Apilado (Stacked)
											</SelectItem>
											<SelectItem value="composited" className="text-[11px]">
												Compuesto (Composited)
											</SelectItem>
											<SelectItem value="dynamic" className="text-[11px]">
												Dinámico (Dynamic)
											</SelectItem>
										</SelectContent>
									</Select>
								</div>

								{/* Modo de composición */}
								<div className="space-y-1.5" id="composition-mode-container">
									<div className="flex items-center justify-between">
										<label htmlFor="composition-mode-container" className="text-[11px] font-medium">
											Modo de composición
										</label>
									</div>
									<Select
										value={layerSystem.compositionMode || 'normal'}
										onValueChange={(value) => updateLayerSystem({
											compositionMode: value as 'normal' | 'multiply' | 'screen' | 'overlay'
										})}
									>
										<SelectTrigger className="h-8 text-[11px]">
											<SelectValue placeholder="Seleccionar modo" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="normal" className="text-[11px]">
												Normal
											</SelectItem>
											<SelectItem value="multiply" className="text-[11px]">
												Multiplicar
											</SelectItem>
											<SelectItem value="screen" className="text-[11px]">
												Pantalla
											</SelectItem>
											<SelectItem value="overlay" className="text-[11px]">
												Superposición
											</SelectItem>
										</SelectContent>
									</Select>
								</div>

								{/* Opacidad global */}
								<div className="space-y-1.5">
									<div className="flex items-center justify-between">
										<label htmlFor="global-opacity" className="text-[11px] font-medium">
											Opacidad global
										</label>
										<span className="text-[10px] text-muted-foreground">
											{entityCardConfig.globalOpacity || 100}%
										</span>
									</div>
									<Slider
										id="global-opacity"
										className="py-0.5"
										min={0}
										max={100}
										step={1}
										value={[entityCardConfig.globalOpacity || 100]}
										onValueChange={(values) => onChange({
											...entityCardConfig,
											globalOpacity: values[0],
										})}
										aria-label="Opacidad global"
									/>
								</div>

								{/* Espaciado entre capas */}
								<div className="space-y-1.5">
									<div className="flex items-center justify-between">
										<label htmlFor="layer-spacing" className="text-[11px] font-medium">
											Espaciado entre capas
										</label>
										<span className="text-[10px] text-muted-foreground">
											{(layerSystem as ExtendedLayerSystemConfig).layerSpacing || 2}px
										</span>
									</div>
									<Slider
										id="layer-spacing"
										className="py-0.5"
										min={0}
										max={10}
										step={0.5}
										value={[(layerSystem as ExtendedLayerSystemConfig).layerSpacing || 2]}
										onValueChange={(values) => updateLayerSystem({
											layerSpacing: values[0],
										})}
										aria-label="Espaciado entre capas"
									/>
								</div>
							</div>
						</TabsContent>

						{/* Gestión de capas individuales */}
						<TabsContent value="layers" className="pt-1">
							<div className="space-y-3">
								{/* Lista de capas */}
								<div className="space-y-1.5" id="available-layers-container">
									<div className="flex items-center justify-between mb-1">
										<label htmlFor="available-layers-container" className="text-[11px] font-medium">
											Capas disponibles
										</label>
										<Button
											variant="ghost"
											size="icon"
											className="h-6 w-6"
											title="Añadir nueva capa"
										>
											<Plus className="h-3.5 w-3.5" />
										</Button>
									</div>

									<div className="bg-background/50 rounded-md p-1.5 space-y-1">
										{layerIds.length > 0 ? (
											layerIds.map((layerId) => {
												const layerConfig = layerConfigs[layerId] || { enabled: false };
												const isEnabled = layerConfig.enabled !== false;

												return (
													<button
														type="button"
														key={layerId}
														className={clsx(
															// Base style
															'relative flex items-center w-full p-2 rounded-lg',
															// Hover style
															'hover:bg-accent/40 transition-colors',
															// Selected style
															selectedLayerId === layerId && 'bg-accent',
															// Disabled style
															!isEnabled && 'opacity-50'
														)}
														onClick={() => {
															if (isEnabled) {
																setSelectedLayerId(layerId);
															}
														}}
														tabIndex={0}
														aria-pressed={selectedLayerId === layerId}
													>
														<button
															type="button"
															className="mr-2 flex"
															onClick={(e) => {
																e.stopPropagation();
																toggleLayerVisibility(layerId);
															}}
														>
															{isEnabled ? (
																<Eye className="h-3.5 w-3.5 text-muted-foreground" />
															) : (
																<EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
															)}
														</button>
														<span className="text-[11px] font-medium flex-1">
															{layerId.charAt(0).toUpperCase() + layerId.slice(1)}
														</span>
														<span className="text-[10px] text-muted-foreground">
															{layerConfig.layerIndex !== undefined ?
																`z-index: ${layerConfig.layerIndex}` : ''}
														</span>
													</button>
												);
											})
										) : (
											<div className="text-center text-[11px] text-muted-foreground p-2">
												No hay capas configuradas
											</div>
										)}
									</div>
								</div>

								{/* Configuración de la capa seleccionada */}
								{selectedLayerId && selectedLayer && (
									<div className="space-y-2 border rounded-md p-2 border-muted/50">
										<div className="flex items-center justify-between">
											<h4 className="text-[12px] font-medium">
												{selectedLayerId.charAt(0).toUpperCase() + selectedLayerId.slice(1)}
											</h4>
											<Switch
												checked={selectedLayer.enabled !== false}
												onCheckedChange={(checked) => {
													updateLayerConfig(selectedLayerId, { enabled: checked });
													updateLayerSystem({
														enabledLayers: {
															...layerSystem.enabledLayers,
															[selectedLayerId]: checked,
														},
													});
												}}
											/>
										</div>

										<Separator />

										<div className="space-y-1.5" id="layer-specific-config">
											<label htmlFor="layer-specific-config" className="text-[11px] font-medium">
												Configuración específica
											</label>

											{/* Selector de plugin de capa si está disponible */}
											<LayerSelector
												layerId={selectedLayerId}
												config={selectedLayer as Record<string, unknown>}
												onChange={(newConfig: Record<string, unknown>) => {
													updateLayerConfig(selectedLayerId, newConfig);
												}}
											/>
										</div>
									</div>
								)}
							</div>
						</TabsContent>

						{/* Presets de capas */}
						<TabsContent value="presets" className="pt-1">
							<LayerPresetsPanel
								currentConfig={entityCardConfig}
								entityType="all"
								onApplyPreset={(presetConfig) => {
									onChange(presetConfig);
								}}
							/>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>
		</div>
	);
}
