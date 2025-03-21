'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd';
import { Eye, GripVertical, Layers } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLayerPlugin } from './layer-plugin-system';

// Definición de la estructura de datos para sistema de capas
interface LayerSystemConfig {
	order: string[];
	explodeView: boolean;
	explodeDistance: number;
	layerBlending: string;
	layerSpacing: number;
}

// Valores predeterminados para configuración de capas
const DEFAULT_LAYER_SYSTEM: LayerSystemConfig = {
	order: [],
	explodeView: false,
	explodeDistance: 10,
	layerBlending: 'normal',
	layerSpacing: 2
};

// Función para asegurar que se tengan valores predeterminados
const getLayerSystemWithDefaults = (config: Partial<LayerSystemConfig> = {}): LayerSystemConfig => {
	return {
		order: config.order || DEFAULT_LAYER_SYSTEM.order,
		explodeView: config.explodeView ?? DEFAULT_LAYER_SYSTEM.explodeView,
		explodeDistance: config.explodeDistance ?? DEFAULT_LAYER_SYSTEM.explodeDistance,
		layerBlending: config.layerBlending || DEFAULT_LAYER_SYSTEM.layerBlending,
		layerSpacing: config.layerSpacing ?? DEFAULT_LAYER_SYSTEM.layerSpacing
	};
};

// Interfaz para opciones de tarjeta
interface CardOptions {
	layerSystem?: Partial<LayerSystemConfig>;
	layerConfigs?: Record<string, any>;
	[key: string]: any;
}

interface LayersConfigPanelProps {
	cardOptions: CardOptions;
	onCardOptionsChange: (options: CardOptions) => void;
	entityType: string;
	entityId?: string;
}

// Interfaz de capa para tipado en la renderización
interface Layer {
	type: string;
	name: string;
	description?: string;
	defaultConfig: any;
	[key: string]: any;
}

export function LayersConfigPanel({ cardOptions, onCardOptionsChange, entityType, entityId }: LayersConfigPanelProps) {
	const { getLayers, getOrderedLayers } = useLayerPlugin();
	const availableLayers = getLayers();
	const [activeTab, setActiveTab] = useState('general');

	// Asegurarnos de que tengamos valores predeterminados
	const layerSystem = getLayerSystemWithDefaults(cardOptions.layerSystem as Partial<LayerSystemConfig>);

	// Estado para la lista de orden de capas
	const [layerOrder, setLayerOrder] = useState<string[]>(layerSystem.order || DEFAULT_LAYER_SYSTEM.order || []);

	// Actualizar el orden cuando cambian las opciones externas
	useEffect(() => {
		setLayerOrder(layerSystem.order || DEFAULT_LAYER_SYSTEM.order || []);
	}, [layerSystem.order]);

	// Handler para cambios en la configuración de capas
	const handleLayerSystemChange = (key: string, value: unknown) => {
		onCardOptionsChange({
			...cardOptions,
			layerSystem: {
				...(cardOptions.layerSystem as Record<string, unknown> || {}),
				[key]: value,
			},
		});
	};

	// Manejar el reordenamiento de capas
	const handleDragEnd = (result: DropResult) => {
		if (!result.destination) {
			return;
		}

		const sourceIndex = result.source.index;
		const destinationIndex = result.destination.index;

		// Si el orden no cambió, no hacemos nada
		if (sourceIndex === destinationIndex) {
			return;
		}

		// Obtenemos el nuevo orden de capas
		const currentOrder = [...((cardOptions.layerSystem as any)?.order || [])];
		const [removed] = currentOrder.splice(sourceIndex, 1);
		currentOrder.splice(destinationIndex, 0, removed);

		// Actualizar orden de capas
		onCardOptionsChange({
			...cardOptions,
			layerSystem: {
				...(cardOptions.layerSystem as Record<string, unknown> || {}),
				order: currentOrder,
			},
		});
	};

	// Handler para habilitar/deshabilitar todas las capas
	const handleEnableAll = () => {
		const newLayerConfigs: Record<string, Record<string, unknown>> = { ...(cardOptions.layerConfigs as Record<string, Record<string, unknown>> || {}) };

		for (const layer of availableLayers) {
			const currentConfig = newLayerConfigs[layer.type] || { ...layer.defaultConfig };
			newLayerConfigs[layer.type] = {
				...currentConfig,
				enabled: true,
			};
		}

		onCardOptionsChange({
			...cardOptions,
			layerConfigs: newLayerConfigs,
		});
	};

	const handleResetAll = () => {
		// Crear nuevas configuraciones de capas con valores predeterminados
		const defaultLayerConfigs: Record<string, Record<string, unknown>> = {};

		for (const layer of availableLayers) {
			defaultLayerConfigs[layer.type] = { ...layer.defaultConfig };
		}

		onCardOptionsChange({
			...cardOptions,
			layerConfigs: defaultLayerConfigs,
		});
	};

	return (
		<Card className="w-full">
			<CardHeader className="pb-2">
				<CardTitle className="text-sm font-medium flex items-center">
					<Layers className="h-4 w-4 mr-2 text-muted-foreground" />
					Configuración General de Capas
				</CardTitle>
			</CardHeader>
			<CardContent className="p-4 pt-0">
				<Tabs value={activeTab} onValueChange={setActiveTab}>
					<TabsList className="grid grid-cols-3 mb-4">
						<TabsTrigger value="general">General</TabsTrigger>
						<TabsTrigger value="order">Orden</TabsTrigger>
						<TabsTrigger value="advanced">Avanzado</TabsTrigger>
					</TabsList>

					<TabsContent value="general" className="space-y-4">
						<div className="space-y-4">
							<div className="space-y-2">
								<Label>Modo de Mezcla</Label>
								<Select
									value={layerSystem.layerBlending || 'screen'}
									onValueChange={(value) => handleLayerSystemChange('layerBlending', value)}
								>
									<SelectTrigger>
										<SelectValue placeholder="Seleccionar modo de mezcla" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="normal">Normal</SelectItem>
										<SelectItem value="multiply">Multiplicar</SelectItem>
										<SelectItem value="screen">Pantalla</SelectItem>
										<SelectItem value="overlay">Superposición</SelectItem>
										<SelectItem value="darken">Oscurecer</SelectItem>
										<SelectItem value="lighten">Aclarar</SelectItem>
									</SelectContent>
								</Select>
								<p className="text-xs text-muted-foreground mt-1">
									Define cómo se mezclarán visualmente las capas entre sí
								</p>
							</div>

							<div className="space-y-2">
								<div className="flex justify-between">
									<Label>Espaciado de Capas</Label>
									<span className="text-xs">{layerSystem.layerSpacing || 2}px</span>
								</div>
								<Slider
									value={[layerSystem.layerSpacing || 2]}
									min={0}
									max={10}
									step={0.5}
									onValueChange={([value]) => handleLayerSystemChange('layerSpacing', value)}
								/>
								<p className="text-xs text-muted-foreground mt-1">
									Controla la separación entre capas en la vista explosionada
								</p>
							</div>

							<div className="flex items-center justify-between">
								<div>
									<Label>Vista Explosionada</Label>
									<p className="text-xs text-muted-foreground mt-1">
										Muestra las capas separadas para visualizar la estructura
									</p>
								</div>
								<Switch
									checked={layerSystem.explodeView || false}
									onCheckedChange={(checked) => handleLayerSystemChange('explodeView', checked)}
								/>
							</div>

							{layerSystem.explodeView && (
								<div className="space-y-2">
									<div className="flex justify-between">
										<Label>Distancia de Explosión</Label>
										<span className="text-xs">{layerSystem.explodeDistance || 10}px</span>
									</div>
									<Slider
										value={[layerSystem.explodeDistance || 10]}
										min={1}
										max={50}
										step={1}
										onValueChange={([value]) => handleLayerSystemChange('explodeDistance', value)}
									/>
									<p className="text-xs text-muted-foreground mt-1">
										Define la distancia entre las capas en la vista explosionada
									</p>
								</div>
							)}

							<div className="flex justify-between pt-4">
								<Button variant="outline" size="sm" onClick={() => handleEnableAll()}>
									<Eye className="h-4 w-4 mr-2" />
									Habilitar Todas
								</Button>
								<Button variant="outline" size="sm" onClick={() => handleResetAll()}>
									Restablecer Todo
								</Button>
							</div>
						</div>
					</TabsContent>

					<TabsContent value="order">
						<div className="space-y-2">
							<p className="text-xs text-muted-foreground mb-4">
								Arrastra para reordenar las capas. Las capas se renderizan de arriba hacia abajo.
							</p>

							<DragDropContext onDragEnd={handleDragEnd}>
								<Droppable droppableId="droppable-layers">
									{(provided) => (
										<div {...provided.droppableProps} ref={provided.innerRef} className="space-y-1">
											{layerOrder.map((layerId, index) => {
												const layer = availableLayers.find((l: Layer) => l.type === layerId);
												if (!layer) {
													return null;
												}

												const layerConfig = (cardOptions.layerConfigs as Record<string, any>)?.[layerId] || layer.defaultConfig;
												const isEnabled = layerConfig.enabled;

												return (
													<Draggable key={layerId} draggableId={layerId} index={index}>
														{(provided) => (
															<div
																ref={provided.innerRef}
																{...provided.draggableProps}
																className={cn(
																	'flex items-center justify-between p-2 rounded-md border border-border/30',
																	isEnabled ? 'bg-muted/30' : 'bg-muted/10 opacity-70'
																)}
															>
																<div className="flex items-center">
																	<div {...provided.dragHandleProps} className="mr-2 cursor-move">
																		<GripVertical className="h-4 w-4 text-muted-foreground" />
																	</div>
																	<span className="text-xs font-medium">{index + 1}.</span>
																	<span className="text-sm font-medium ml-2">
																		{layerId.charAt(0).toUpperCase() + layerId.slice(1)}
																	</span>
																	{!isEnabled && (
																		<span className="ml-2 text-xs text-muted-foreground">(deshabilitada)</span>
																	)}
																</div>
															</div>
														)}
													</Draggable>
												);
											})}
											{provided.placeholder}
										</div>
									)}
								</Droppable>
							</DragDropContext>
						</div>
					</TabsContent>

					<TabsContent value="advanced" className="space-y-4">
						<div className="space-y-3">
							<div>
								<Label htmlFor="entityInfo">Información de Entidad</Label>
								<div className="flex gap-2 mt-1">
									<Input id="entityInfo" value={entityType} readOnly className="flex-1 bg-muted/20" />
									{entityId && <Input value={entityId} readOnly className="flex-1 bg-muted/20" />}
								</div>
								<p className="text-xs text-muted-foreground mt-1">Entidad a la que se aplica esta configuración</p>
							</div>

							<div className="pt-2">
								<Label>Resumen de Capas</Label>
								<ScrollArea className="h-[200px] border rounded-md border-border/50 mt-1">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead className="w-12">Estado</TableHead>
												<TableHead>Capa</TableHead>
												<TableHead className="text-right">Orden</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{availableLayers.map((layer: Layer) => {
												const layerConfig = (cardOptions.layerConfigs as Record<string, any>)?.[layer.type] || layer.defaultConfig;
												return (
													<TableRow key={layer.type}>
														<TableCell>
															<div
																className={
																	layerConfig.enabled
																		? 'bg-green-500/20 text-green-500 rounded-full px-2 py-0.5 text-[10px] font-medium text-center'
																		: 'bg-red-500/10 text-red-400 rounded-full px-2 py-0.5 text-[10px] font-medium text-center'
																}
															>
																{layerConfig.enabled ? 'Activa' : 'Inactiva'}
															</div>
														</TableCell>
														<TableCell>
															<span className="text-xs font-medium">
																{layer.type.charAt(0).toUpperCase() + layer.type.slice(1)}
															</span>
														</TableCell>
														<TableCell className="text-right">
															<span className="text-xs">{layerConfig.layerIndex}</span>
														</TableCell>
													</TableRow>
												);
											})}
										</TableBody>
									</Table>
								</ScrollArea>
							</div>

							<div className="pt-2 flex justify-end">
								<Button variant="destructive" size="sm" onClick={handleResetAll}>
									Restablecer Todo
								</Button>
							</div>
						</div>
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}
