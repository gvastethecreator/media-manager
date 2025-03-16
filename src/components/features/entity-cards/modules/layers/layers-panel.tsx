'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
	AlertCircle,
	ChevronDown,
	ChevronUp,
	Eye,
	EyeOff,
	Layers as LayersIcon,
	RefreshCw,
	Settings,
} from 'lucide-react';
import { useState } from 'react';
import { LayerConfigEditor } from '../../layers/layer-config-editor';
import { useLayerPlugin } from './layer-plugin-system';
import { LayersPanelProps } from './types';
import { useLayers } from './use-layers';

/**
 * 🌈 Panel de configuración de capas para Entity Cards
 */
export function LayersPanel({ config, onChange, cardOptions, onCardOptionsChange }: LayersPanelProps) {
	const [activeTab, setActiveTab] = useState<string>('general');
	const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
	const [showLayerEditor, setShowLayerEditor] = useState(false);

	const { toggleLayerEnabled, updateLayerOrder, resetToDefaults } = useLayers();
	const { getLayers } = useLayerPlugin();
	const registeredLayers = getLayers();

	const handleToggleLayer = (layerType: string, enabled: boolean) => {
		toggleLayerEnabled(layerType, enabled);

		// Actualizar config para propagar cambios
		onChange({
			...config,
			layerSystem: {
				...config.layerSystem,
				enabledLayers: {
					...config.layerSystem.enabledLayers,
					[layerType]: enabled,
				},
			},
		});
	};

	const handleMoveLayerUp = (layerType: string) => {
		const currentIndex = config.layerSystem.layerOrder.indexOf(layerType);
		if (currentIndex <= 0) return;

		const newOrder = [...config.layerSystem.layerOrder];
		[newOrder[currentIndex], newOrder[currentIndex - 1]] = [newOrder[currentIndex - 1], newOrder[currentIndex]];

		updateLayerOrder(newOrder);

		// Actualizar config para propagar cambios
		onChange({
			...config,
			layerSystem: {
				...config.layerSystem,
				layerOrder: newOrder,
			},
		});
	};

	const handleMoveLayerDown = (layerType: string) => {
		const currentIndex = config.layerSystem.layerOrder.indexOf(layerType);
		if (currentIndex >= config.layerSystem.layerOrder.length - 1 || currentIndex < 0) return;

		const newOrder = [...config.layerSystem.layerOrder];
		[newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];

		updateLayerOrder(newOrder);

		// Actualizar config para propagar cambios
		onChange({
			...config,
			layerSystem: {
				...config.layerSystem,
				layerOrder: newOrder,
			},
		});
	};

	const handleToggleExplode = (enabled: boolean) => {
		onChange({
			...config,
			layerSystem: {
				...config.layerSystem,
				explode: {
					...config.layerSystem.explode,
					enabled,
				},
			},
		});
	};

	const handleToggleAnimateOnHover = (enabled: boolean) => {
		onChange({
			...config,
			layerSystem: {
				...config.layerSystem,
				animateOnHover: enabled,
			},
		});
	};

	const handleEditLayerConfig = (layerType: string) => {
		setSelectedLayer(layerType);
		setShowLayerEditor(true);
	};

	const handleLayerConfigChange = (layerType: string, layerConfig: any) => {
		onChange({
			...config,
			layerConfigs: {
				...config.layerConfigs,
				[layerType]: {
					...(config.layerConfigs[layerType] || {}),
					...layerConfig,
				},
			},
		});
	};

	const handleResetToDefaults = () => {
		resetToDefaults();
		onChange({
			...config,
		});
	};

	return (
		<Card className="border shadow-sm">
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<CardTitle>Capas</CardTitle>
					<Badge variant="outline" className="text-xs">
						{activeTab === 'general' ? 'General' : 'Capas'}
					</Badge>
				</div>
				<CardDescription>Configura las capas visuales que componen la tarjeta de entidad.</CardDescription>
			</CardHeader>

			<CardContent>
				<Tabs value={activeTab} onValueChange={setActiveTab}>
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="general" className="flex items-center gap-2">
							<Settings className="h-4 w-4" />
							<span className="hidden sm:inline">General</span>
						</TabsTrigger>
						<TabsTrigger value="layers" className="flex items-center gap-2">
							<LayersIcon className="h-4 w-4" />
							<span className="hidden sm:inline">Capas</span>
						</TabsTrigger>
					</TabsList>

					<TabsContent value="general" className="mt-4 space-y-4">
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<div className="space-y-0.5">
									<h3 className="text-sm font-medium">Modo Explodido</h3>
									<p className="text-xs text-muted-foreground">Separa las capas para ver su estructura</p>
								</div>
								<Switch checked={config.layerSystem.explode?.enabled || false} onCheckedChange={handleToggleExplode} />
							</div>

							<div className="flex items-center justify-between">
								<div className="space-y-0.5">
									<h3 className="text-sm font-medium">Animar al Pasar el Cursor</h3>
									<p className="text-xs text-muted-foreground">Anima las capas al pasar el cursor por encima</p>
								</div>
								<Switch
									checked={config.layerSystem.animateOnHover || false}
									onCheckedChange={handleToggleAnimateOnHover}
								/>
							</div>

							<Separator className="my-2" />

							<Button variant="outline" size="sm" className="w-full" onClick={handleResetToDefaults}>
								<RefreshCw className="h-4 w-4 mr-2" />
								Restablecer Valores Predeterminados
							</Button>
						</div>
					</TabsContent>

					<TabsContent value="layers" className="mt-4">
						<div className="space-y-4">
							<Alert variant="warning" className="py-2 mb-4">
								<AlertCircle className="h-4 w-4" />
								<AlertTitle className="text-xs">Orden de capas</AlertTitle>
								<AlertDescription className="text-xs">
									El orden de las capas afecta a cómo se renderizan, las capas superiores se muestran encima de las
									inferiores.
								</AlertDescription>
							</Alert>

							<ScrollArea className="h-[300px] rounded-md border p-2">
								<div className="space-y-2">
									{config.layerSystem.layerOrder.map((layerType) => {
										const layer = registeredLayers.find((l) => l.type === layerType);
										if (!layer) return null;

										const isEnabled = config.layerSystem.enabledLayers[layerType] || false;
										const canMoveUp = config.layerSystem.layerOrder.indexOf(layerType) > 0;
										const canMoveDown =
											config.layerSystem.layerOrder.indexOf(layerType) < config.layerSystem.layerOrder.length - 1;

										return (
											<div
												key={layerType}
												className={cn(
													'flex items-center justify-between px-2 py-1.5 rounded-md border',
													isEnabled ? 'bg-card' : 'bg-muted/20 opacity-70'
												)}
											>
												<div className="flex items-center space-x-2">
													{isEnabled ? (
														<Eye className="h-4 w-4 text-muted-foreground" />
													) : (
														<EyeOff className="h-4 w-4 text-muted-foreground" />
													)}
													<span className="text-sm font-medium">{layer.name}</span>
												</div>

												<div className="flex items-center space-x-1">
													<Button
														variant="ghost"
														size="icon"
														className="h-7 w-7"
														disabled={!canMoveUp}
														onClick={() => handleMoveLayerUp(layerType)}
													>
														<ChevronUp className="h-4 w-4" />
													</Button>

													<Button
														variant="ghost"
														size="icon"
														className="h-7 w-7"
														disabled={!canMoveDown}
														onClick={() => handleMoveLayerDown(layerType)}
													>
														<ChevronDown className="h-4 w-4" />
													</Button>

													<Switch
														checked={isEnabled}
														onCheckedChange={(checked) => handleToggleLayer(layerType, checked)}
													/>

													<Dialog
														open={selectedLayer === layerType && showLayerEditor}
														onOpenChange={(open) => !open && setShowLayerEditor(false)}
													>
														<DialogTrigger asChild>
															<Button
																variant="ghost"
																size="icon"
																className="h-7 w-7"
																onClick={() => handleEditLayerConfig(layerType)}
															>
																<Settings className="h-4 w-4" />
															</Button>
														</DialogTrigger>
														<DialogContent className="sm:max-w-[425px]">
															{selectedLayer && (
																<LayerConfigEditor
																	layerType={selectedLayer}
																	config={config.layerConfigs[selectedLayer] || {}}
																	onChange={(newConfig) => handleLayerConfigChange(selectedLayer, newConfig)}
																/>
															)}
														</DialogContent>
													</Dialog>
												</div>
											</div>
										);
									})}
								</div>
							</ScrollArea>
						</div>
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}
