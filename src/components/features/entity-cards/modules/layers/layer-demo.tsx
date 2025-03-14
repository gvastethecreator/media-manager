'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type * as React from 'react';
import { useEffect, useState } from 'react';
import { GlowSettings } from './glow/glow-settings';
import { type BaseLayerConfig, LayerPluginProvider, LayerRenderer, useLayerPlugin } from './layer-plugin-system';
import { RegisterLayers } from './register-layers';

interface LayerDemoProps {
	entityType: string;
	entityId?: string;
}

/**
 * Panel de control interno para la demostración de capas
 */
function LayerControls({ entityType, entityId }: LayerDemoProps) {
	const { getLayers } = useLayerPlugin();
	const layers = getLayers();
	const [activeTab, setActiveTab] = useState<string>('glow');
	const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
	const [isHovered, setIsHovered] = useState(false);
	const [isExploded, setIsExploded] = useState(false);
	const [activeLayer, setActiveLayer] = useState<string | null>(null);
	const [configs, setConfigs] = useState<Record<string, BaseLayerConfig>>({});

	// Función para obtener estilos de transformación para capas explotadas
	const getExplodeLayerTransform = (index: number) => {
		if (!isExploded) {
			return {};
		}

		const offset = 10 * (index + 1);
		return {
			transform: `translateY(${offset}px)`,
			opacity: 1 - index * 0.1,
		};
	};

	// Cargar configuraciones iniciales
	useEffect(() => {
		const loadConfigs = async () => {
			const loadedConfigs: Record<string, BaseLayerConfig> = {};

			for (const layer of layers) {
				if (layer.getServerActions) {
					try {
						const actions = layer.getServerActions();
						const response = await actions.getConfig(entityType, entityId);

						if (response.success && response.data) {
							loadedConfigs[layer.type] = response.data;
						} else {
							loadedConfigs[layer.type] = layer.defaultConfig;
						}
					} catch (error) {
						console.error(`Error al cargar configuración para ${layer.type}:`, error);
						loadedConfigs[layer.type] = layer.defaultConfig;
					}
				} else {
					loadedConfigs[layer.type] = layer.defaultConfig;
				}
			}

			setConfigs(loadedConfigs);
		};

		loadConfigs();
	}, [entityType, entityId, layers]);

	// Manejar toggle de explotación
	const handleToggleExplode = () => {
		setIsExploded(!isExploded);
	};

	// Manejar movimiento del ratón
	const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
		const rect = e.currentTarget.getBoundingClientRect();
		const x = ((e.clientX - rect.left) / rect.width) * 100;
		const y = ((e.clientY - rect.top) / rect.height) * 100;
		setMousePosition({ x, y });
	};

	return (
		<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<div className="lg:col-span-1 space-y-6">
				<Card>
					<CardHeader>
						<CardTitle>Vista previa de capas</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<button
							className="w-full aspect-square rounded-md border bg-gradient-to-br from-blue-500/20 to-purple-500/20 relative overflow-hidden"
							onMouseMove={handleMouseMove}
							onMouseEnter={() => setIsHovered(true)}
							onMouseLeave={() => setIsHovered(false)}
							onClick={handleToggleExplode}
							onKeyDown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									handleToggleExplode();
								}
							}}
							aria-pressed={isExploded}
							type="button"
						>
							<LayerRenderer
								isExploded={isExploded}
								isHovered={isHovered}
								mousePosition={mousePosition}
								activeLayer={activeLayer}
								getExplodeLayerTransform={getExplodeLayerTransform}
								entityType={entityType}
								entityId={entityId}
								configs={configs}
							/>
							<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
								<span className="text-white text-lg font-bold drop-shadow-md">
									{isExploded ? 'Haz clic para contraer' : 'Haz clic para expandir'}
								</span>
							</div>
						</button>
					</CardContent>
				</Card>
			</div>

			<div className="lg:col-span-2">
				<Card>
					<CardHeader>
						<CardTitle>Configuración de capas</CardTitle>
					</CardHeader>
					<CardContent>
						<Tabs value={activeTab} onValueChange={setActiveTab}>
							<TabsList className="mb-4">
								{layers.map((layer) => (
									<TabsTrigger key={layer.type} value={layer.type} onClick={() => setActiveLayer(layer.type)}>
										{layer.type.charAt(0).toUpperCase() + layer.type.slice(1)}
									</TabsTrigger>
								))}
							</TabsList>
							{layers.map((layer) => {
								const SettingsComponent = layer.SettingsComponent;
								return (
									<TabsContent key={layer.type} value={layer.type}>
										{SettingsComponent ? (
											<SettingsComponent
												entityType={entityType}
												entityId={entityId}
												onConfigUpdate={(newConfig: BaseLayerConfig) => {
													setConfigs((prev) => ({
														...prev,
														[layer.type]: newConfig,
													}));
												}}
											/>
										) : (
											<div className="p-4 bg-muted rounded-md">
												<p>No hay panel de configuración disponible para esta capa.</p>
											</div>
										)}
									</TabsContent>
								);
							})}
						</Tabs>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

/**
 * Componente de demostración de capas con proveedor de contexto
 */
export function LayerDemo({ entityType, entityId }: LayerDemoProps) {
	return (
		<LayerPluginProvider>
			<RegisterLayers />
			<LayerControls entityType={entityType} entityId={entityId} />
		</LayerPluginProvider>
	);
}
