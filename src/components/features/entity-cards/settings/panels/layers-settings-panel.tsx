'use client';

import { LayerConfigEditor } from '@/components/features/entity-cards/layers/layer-config-editor';
import { useLayerPlugin } from '@/components/features/entity-cards/layers/layer-plugin-system';
import { LayersConfigPanel } from '@/components/features/entity-cards/layers/layers-config-panel';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toastService } from '@/lib/services/toast.service';
import { AlertCircle, Layers, Settings } from 'lucide-react';
import { useState } from 'react';
import { DEFAULT_LAYER_SYSTEM, getLayerSystemWithDefaults } from '../layer-settings-config';
import type { SettingsPanelProps } from '../types';
import { FormGroup, FormLayout, FormSection } from './shared';

interface LayersSettingsPanelProps extends SettingsPanelProps {
	entityType: string;
	entityId?: string;
}

/**
 * Panel unificado de configuración de capas que integra todas las capas disponibles
 * y proporciona una interfaz para configurarlas.
 */
export function LayersSettingsPanel({
	options,
	onChange,
	entityType,
	entityId,
	disabled = false,
}: LayersSettingsPanelProps) {
	const { getLayers } = useLayerPlugin();
	const availableLayers = getLayers();
	const [activeTab, setActiveTab] = useState('general');
	const [activeLayerConfig, setActiveLayerConfig] = useState<string | null>(null);

	// Asegurarnos de tener configuraciones predeterminadas
	getLayerSystemWithDefaults(options.layerSystem);

	// Obtener la configuración de capas o inicializar si no existe
	const layerConfigs = options.layerConfigs || {};

	// Resetear todas las capas a la configuración predeterminada
	const handleResetAll = () => {
		const defaultLayerConfigs = {};
		availableLayers.forEach((layer) => {
			defaultLayerConfigs[layer.type] = { ...layer.defaultConfig };
		});

		onChange({
			...options,
			layerSystem: { ...DEFAULT_LAYER_SYSTEM },
			layerConfigs: defaultLayerConfigs,
		});

		toastService.success('Todas las capas restablecidas a valores predeterminados');
	};

	// Manejar cambios en la configuración individual de una capa
	const handleLayerConfigChange = (layerType: string, config: Record<string, unknown>) => {
		onChange({
			...options,
			layerConfigs: {
				...layerConfigs,
				[layerType]: config,
			},
		});

		setActiveLayerConfig(null);
	};

	// Alternar el estado habilitado/deshabilitado de una capa
	const toggleLayerEnabled = (layerType: string, enabled: boolean) => {
		const currentConfig = layerConfigs[layerType] ||
			availableLayers.find((l) => l.type === layerType)?.defaultConfig || { enabled: false, layerIndex: 0 };

		onChange({
			...options,
			layerConfigs: {
				...layerConfigs,
				[layerType]: {
					...currentConfig,
					enabled,
				},
			},
		});

		toastService.success(`Capa ${layerType} ${enabled ? 'habilitada' : 'deshabilitada'}`);
	};

	// Verificar si hay alguna capa disponible
	if (availableLayers.length === 0) {
		return (
			<Alert variant="destructive">
				<AlertCircle className="h-4 w-4" />
				<AlertTitle>No hay capas disponibles</AlertTitle>
				<AlertDescription>
					No se ha registrado ninguna capa en el sistema. Por favor, verifica la configuración.
				</AlertDescription>
			</Alert>
		);
	}

	// Componente para la configuración general de capas
	const GeneralTab = () => (
		<FormSection
			title="Configuración General de Capas"
			description="Gestiona el comportamiento general del sistema de capas"
			colorScheme="design"
		>
			<FormGroup>
				<LayersConfigPanel
					cardOptions={options}
					onCardOptionsChange={onChange}
					entityType={entityType}
					entityId={entityId}
				/>
			</FormGroup>
		</FormSection>
	);

	// Componente para la lista de capas disponibles
	const LayersTab = () => (
		<FormSection
			title="Capas Disponibles"
			description="Configura las capas individuales y su comportamiento"
			colorScheme="design"
			headerAction={
				<Button variant="outline" size="sm" onClick={handleResetAll} disabled={disabled}>
					Restablecer Todo
				</Button>
			}
		>
			<FormGroup>
				<ScrollArea className="h-[320px] pr-4">
					<div className="space-y-3">
						{availableLayers.map((layer) => {
							const layerConfig = layerConfigs[layer.type] || layer.defaultConfig;
							const isEnabled = layerConfig.enabled;

							return (
								<div
									key={layer.type}
									className={`flex items-center justify-between p-3 rounded-md border ${
										isEnabled ? 'border-border/50 bg-card/80' : 'border-border/30 bg-muted/30'
									}`}
								>
									<div className="flex items-center gap-2">
										<Switch
											checked={isEnabled}
											onCheckedChange={(checked) => toggleLayerEnabled(layer.type, checked)}
											disabled={disabled}
										/>
										<div>
											<div className="flex items-center gap-2">
												<span className="text-sm font-medium">
													{layer.type.charAt(0).toUpperCase() + layer.type.slice(1)}
												</span>
												{!isEnabled && (
													<Badge variant="outline" className="text-xs">
														Deshabilitada
													</Badge>
												)}
											</div>
											<p className="text-xs text-muted-foreground">Índice: {layerConfig.layerIndex}</p>
										</div>
									</div>

									<Dialog
										open={activeLayerConfig === layer.type}
										onOpenChange={(open) => setActiveLayerConfig(open ? layer.type : null)}
									>
										<DialogTrigger asChild>
											<Button variant="outline" size="sm" disabled={disabled}>
												Configurar
											</Button>
										</DialogTrigger>
										<DialogContent className="max-w-md">
											<LayerConfigEditor
												layerType={layer.type}
												entityType={entityType}
												entityId={entityId}
												initialConfig={layerConfig}
												onConfigChange={(config) => handleLayerConfigChange(layer.type, config)}
												onCancel={() => setActiveLayerConfig(null)}
											/>
										</DialogContent>
									</Dialog>
								</div>
							);
						})}
					</div>
				</ScrollArea>
			</FormGroup>
		</FormSection>
	);

	return (
		<FormLayout
			title="Sistema de Capas"
			description="Configura las capas visuales y sus propiedades"
			colorScheme="design"
			variant="colored"
		>
			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
				<TabsList className="w-full">
					<TabsTrigger value="general" className="flex-1">
						<Layers className="h-4 w-4 mr-2" />
						General
					</TabsTrigger>
					<TabsTrigger value="layers" className="flex-1">
						<Settings className="h-4 w-4 mr-2" />
						Capas
					</TabsTrigger>
				</TabsList>

				<TabsContent value="general">
					<GeneralTab />
				</TabsContent>

				<TabsContent value="layers">
					<LayersTab />
				</TabsContent>
			</Tabs>
		</FormLayout>
	);
}
