'use client';

/**
 * 🎛️ Panel de administración de capas
 *
 * Este componente proporciona una interfaz para configurar y personalizar
 * las capas aplicadas a una tarjeta de entidad.
 */

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { RefreshCwIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLayerPlugin } from '../../layers/layer-plugin-system';
import type { EntityCardLayerSystemConfig } from './entity-card-layer-adapter';

export interface LayerAdminPanelProps {
	entityType: string;
	config: EntityCardLayerSystemConfig;
	onChange: (config: EntityCardLayerSystemConfig) => void;
	className?: string;
}

/**
 * Panel para administrar y configurar capas
 */
export function LayerAdminPanel({ entityType, config, onChange, className }: LayerAdminPanelProps) {
	const { getRegisteredLayers } = useLayerPlugin();
	const [localConfig, setLocalConfig] = useState<EntityCardLayerSystemConfig>(config);
	const [expandedLayers, setExpandedLayers] = useState<string[]>([]);
	const [activeTab, setActiveTab] = useState('layers');

	// Sincronizar config externa con estado local
	useEffect(() => {
		setLocalConfig(config);
	}, [config]);

	// Obtener todas las capas registradas
	const registeredLayers = getRegisteredLayers();

	// Filtrar capas por tipo de entidad si es necesario
	const availableLayers = registeredLayers.filter((layer) => {
		// Si la capa especifica tipos de entidad y no incluye el tipo actual, filtrarla
		if (layer.entityTypes && !layer.entityTypes.includes(entityType)) {
			return false;
		}
		return true;
	});

	// Actualizar configuración local y propagar cambios
	const updateConfig = (newConfig: EntityCardLayerSystemConfig) => {
		setLocalConfig(newConfig);
		onChange(newConfig);
	};

	// Actualizar una capa específica
	const updateLayerConfig = (layerId: string, layerConfig: Record<string, unknown>) => {
		const newConfig = {
			...localConfig,
			layerConfigs: {
				...localConfig.layerConfigs,
				[layerId]: {
					...(localConfig.layerConfigs[layerId] || {}),
					...layerConfig,
				},
			},
		};
		setLocalConfig(newConfig);
		onChange(newConfig);
	};

	// Alternar visibilidad de una capa
	const toggleLayerVisibility = (layerId: string) => {
		const layer = localConfig.layers[layerId];
		updateLayerConfig(layerId, {
			enabled: !layer?.enabled,
		});
	};

	// Restablecer una capa a su configuración predeterminada
	const resetLayerToDefault = (layerId: string) => {
		const layerDef = registeredLayers.find((l) => l.id === layerId);
		if (!layerDef) return;

		updateLayerConfig(layerId, {
			...layerDef.defaultConfig,
			enabled: true,
		});
	};

	// Alternar expansión de una capa en el acordeón
	const toggleLayerExpansion = (layerId: string) => {
		setExpandedLayers((prev) => (prev.includes(layerId) ? prev.filter((id) => id !== layerId) : [...prev, layerId]));
	};

	return (
		<Card className={cn('w-full', className)}>
			<CardHeader>
				<CardTitle>Administrador de Capas</CardTitle>
				<CardDescription>Personaliza las capas y efectos de tu tarjeta</CardDescription>
			</CardHeader>
			<CardContent>
				<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
					<TabsList className="grid grid-cols-2 mb-4">
						<TabsTrigger value="layers">Capas</TabsTrigger>
						<TabsTrigger value="global">Configuración Global</TabsTrigger>
					</TabsList>

					<TabsContent value="layers" className="space-y-4">
						<ScrollArea className="h-[400px] pr-4">
							<Accordion type="multiple" value={expandedLayers} className="w-full">
								{availableLayers.map((layer) => {
									const layerConfig = localConfig.layers[layer.id] || { enabled: false };
									const isEnabled = layerConfig.enabled !== false;

									return (
										<AccordionItem
											key={layer.id}
											value={layer.id}
											className={cn('border rounded-md mb-2 overflow-hidden', !isEnabled && 'opacity-70')}
										>
											<div className="flex items-center px-4 py-2">
												<Switch
													checked={isEnabled}
													onCheckedChange={() => toggleLayerVisibility(layer.id)}
													className="mr-3"
												/>
												<AccordionTrigger
													onClick={() => toggleLayerExpansion(layer.id)}
													className="flex-1 hover:no-underline py-0"
												>
													<span className="font-medium">{layer.name}</span>
												</AccordionTrigger>
												<TooltipProvider>
													<Tooltip>
														<TooltipTrigger asChild>
															<Button
																type="button"
																variant="ghost"
																size="icon"
																className="h-8 w-8"
																onClick={() => resetLayerToDefault(layer.id)}
															>
																<RefreshCwIcon className="h-4 w-4" />
															</Button>
														</TooltipTrigger>
														<TooltipContent>
															<p>Restablecer a valores predeterminados</p>
														</TooltipContent>
													</Tooltip>
												</TooltipProvider>
											</div>

											<AccordionContent className="px-4 pb-3 pt-1">
												<div className="space-y-4">
													{layer.configUI ? (
														<layer.configUI
															config={layerConfig}
															onChange={(newLayerConfig) => updateLayerConfig(layer.id, newLayerConfig)}
														/>
													) : (
														<div className="text-sm text-muted-foreground">
															Esta capa no tiene opciones de configuración.
														</div>
													)}
												</div>
											</AccordionContent>
										</AccordionItem>
									);
								})}
							</Accordion>
						</ScrollArea>
					</TabsContent>

					<TabsContent value="global" className="space-y-4">
						<div className="space-y-4">
							<div className="grid gap-2">
								<Label htmlFor="global-opacity">Opacidad Global</Label>
								<div className="flex items-center gap-4">
									<Slider
										id="global-opacity"
										min={0}
										max={100}
										step={1}
										value={[localConfig.globalOpacity ?? 100]}
										onValueChange={([value]) =>
											updateConfig({
												...localConfig,
												globalOpacity: value,
											})
										}
										className="flex-1"
									/>
									<span className="w-12 text-right text-sm">{localConfig.globalOpacity ?? 100}%</span>
								</div>
							</div>

							<div className="grid gap-2">
								<Label htmlFor="global-scale">Escala Global</Label>
								<div className="flex items-center gap-4">
									<Slider
										id="global-scale"
										min={50}
										max={150}
										step={1}
										value={[localConfig.globalScale ?? 100]}
										onValueChange={([value]) =>
											updateConfig({
												...localConfig,
												globalScale: value,
											})
										}
										className="flex-1"
									/>
									<span className="w-12 text-right text-sm">{localConfig.globalScale ?? 100}%</span>
								</div>
							</div>

							<div className="flex items-center space-x-2 pt-2">
								<Checkbox
									id="disable-animations"
									checked={localConfig.disableAnimations}
									onCheckedChange={(checked) =>
										updateConfig({
											...localConfig,
											disableAnimations: checked === true,
										})
									}
								/>
								<Label htmlFor="disable-animations">Desactivar animaciones</Label>
							</div>

							<div className="flex items-center space-x-2">
								<Checkbox
									id="high-performance"
									checked={localConfig.highPerformanceMode}
									onCheckedChange={(checked) =>
										updateConfig({
											...localConfig,
											highPerformanceMode: checked === true,
										})
									}
								/>
								<Label htmlFor="high-performance">Modo de alto rendimiento</Label>
							</div>
						</div>
					</TabsContent>
				</Tabs>
			</CardContent>
			<CardFooter className="flex justify-end">
				<Button
					type="button"
					variant="outline"
					onClick={() => updateConfig(config)}
					className="mr-2"
				>
					Restablecer
				</Button>
			</CardFooter>
		</Card>
	);
}

/**
 * Componente para configurar propiedades comunes de capas
 */
export function CommonLayerControls({
	config,
	onChange,
}: {
	config: Record<string, unknown>;
	onChange: (config: Record<string, unknown>) => void;
}) {
	return (
		<div className="space-y-3">
			{config.opacity !== undefined && (
				<div className="grid gap-2">
					<Label htmlFor="layer-opacity">Opacidad</Label>
					<div className="flex items-center gap-4">
						<Slider
							id="layer-opacity"
							min={0}
							max={100}
							step={1}
							value={[config.opacity]}
							onValueChange={([value]) =>
								onChange({
									...config,
									opacity: value,
								})
							}
							className="flex-1"
						/>
						<span className="w-12 text-right text-sm">{config.opacity}%</span>
					</div>
				</div>
			)}

			{config.scale !== undefined && (
				<div className="grid gap-2">
					<Label htmlFor="layer-scale">Escala</Label>
					<div className="flex items-center gap-4">
						<Slider
							id="layer-scale"
							min={50}
							max={150}
							step={1}
							value={[config.scale]}
							onValueChange={([value]) =>
								onChange({
									...config,
									scale: value,
								})
							}
							className="flex-1"
						/>
						<span className="w-12 text-right text-sm">{config.scale}%</span>
					</div>
				</div>
			)}

			{config.color !== undefined && (
				<div className="grid gap-2">
					<Label htmlFor="layer-color">Color</Label>
					<div className="flex items-center gap-2">
						<div className="h-8 w-8 rounded-md border" style={{ backgroundColor: config.color }} />
						<Input
							id="layer-color"
							type="color"
							value={config.color}
							onChange={(e) =>
								onChange({
									...config,
									color: e.target.value,
								})
							}
							className="w-16 h-8 p-0"
						/>
						<Input
							value={config.color}
							onChange={(e) =>
								onChange({
									...config,
									color: e.target.value,
								})
							}
							className="flex-1"
						/>
					</div>
				</div>
			)}
		</div>
	);
}
