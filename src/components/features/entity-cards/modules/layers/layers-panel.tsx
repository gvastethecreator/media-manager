'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Layers, Settings } from 'lucide-react';
import { useState } from 'react';
import { useLayersSystem } from './hooks/use-layers-system';
import type { BaseLayerConfig } from './layer-config-base';

// Componentes provisionales hasta que se implementen los componentes finales
const LayerConfigEditor = ({ layerType, entityType, entityId, initialConfig, onConfigChange, onCancel }: any) => (
	<div>
		<h2>Configuración de {layerType}</h2>
		<Button onClick={onCancel}>Cancelar</Button>
	</div>
);

const LayersConfigPanel = ({ cardOptions, onCardOptionsChange, entityType, entityId }: any) => (
	<div>Configuración de capas</div>
);

// Estructura de datos para la configuración del sistema de capas
interface LayerSystemConfig {
	order: string[];
	explodeView: boolean;
	explodeDistance: number;
	layerBlending: string;
	layerSpacing: number;
}

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

// Componentes de formulario simplificados
const FormLayout = ({ title, description, colorScheme, variant, children }: any) => (
	<div className="space-y-4 p-4 border rounded-md">
		<h2 className="text-xl font-semibold">{title}</h2>
		<p className="text-muted-foreground">{description}</p>
		{children}
	</div>
);

const FormSection = ({ title, description, colorScheme, children }: any) => (
	<div className="space-y-2 p-3 border rounded-md">
		<h3 className="text-base font-medium">{title}</h3>
		<p className="text-sm text-muted-foreground">{description}</p>
		{children}
	</div>
);

const FormGroup = ({ children }: any) => (
	<div className="space-y-2">{children}</div>
);

// Interfaces para los props
interface CardOptions {
	layerSystem?: Partial<LayerSystemConfig>;
	layerConfigs?: Record<string, any>;
	[key: string]: any;
}

interface LayersSettingsPanelProps {
	options: CardOptions;
	entityType: string;
	entityId?: string;
}

// Extendemos la interfaz LayersSettingsPanelProps para incluir las propiedades faltantes
interface ExtendedLayersSettingsPanelProps extends LayersSettingsPanelProps {
	onChange: (options: any) => void;
	disabled?: boolean;
}

/**
 * 🌈 Panel unificado de configuración de capas
 *
 * Permite gestionar todas las capas disponibles y su configuración
 * incluyendo habilitación/deshabilitación, orden y propiedades específicas.
 */
export function LayersPanel({ options, onChange, entityType, entityId, disabled = false }: ExtendedLayersSettingsPanelProps) {
	// Estado para la pestaña activa
	const [activeTab, setActiveTab] = useState('general');

	// Obtener funcionalidades del hook de sistema de capas
	const { availableLayers, activeLayerConfig, setActiveLayerConfig, toggleLayerEnabled } = useLayersSystem(options);

	// Asegurarnos de tener configuraciones predeterminadas
	getLayerSystemWithDefaults(options.layerSystem as Partial<LayerSystemConfig>);

	// Resetear todas las capas a la configuración predeterminada
	const handleResetAll = () => {
		const defaultLayerConfigs: Record<string, BaseLayerConfig> = {};

		for (const layer of availableLayers) {
			defaultLayerConfigs[layer.type] = { ...layer.defaultConfig };
		}

		onChange({
			...options,
			layerSystem: { ...DEFAULT_LAYER_SYSTEM },
			layerConfigs: defaultLayerConfigs,
		});
	};

	// Manejar cambios en la configuración individual de una capa
	const handleLayerConfigChange = (layerType: string, config: Record<string, unknown>) => {
		onChange({
			...options,
			layerConfigs: {
				...(options.layerConfigs as Record<string, unknown> || {}),
				[layerType]: config,
			},
		});

		setActiveLayerConfig(null);
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
		>
			<FormGroup>
				<div className="flex justify-end mb-4">
					<Button variant="outline" size="sm" onClick={handleResetAll} disabled={disabled}>
						Restablecer Todo
					</Button>
				</div>
				<ScrollArea className="h-[320px] pr-4">
					<div className="space-y-3">
						{availableLayers.map((layer: any) => {
							const layerConfig = (options.layerConfigs as Record<string, any>)?.[layer.type] || layer.defaultConfig;
							const isEnabled = layerConfig.enabled;

							return (
								<div
									key={layer.type}
									className={`flex items-center justify-between p-3 rounded-md border ${isEnabled ? 'border-border/50 bg-card/80' : 'border-border/30 bg-muted/30'
										}`}
								>
									<div className="flex items-center gap-2">
										<Switch
											checked={isEnabled}
											onCheckedChange={(checked) => toggleLayerEnabled(layer.type, checked, options, onChange)}
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
												onConfigChange={(config: any) => handleLayerConfigChange(layer.type, config)}
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
