/**
 * 🌈 Tipos para el módulo de capas
 */

/**
 * Tipos centralizados para el sistema de capas
 * @module EntityCards/Layers/Types
 */
import type { CardOptions } from '../types/card-settings-types';
import type { ActionResponse, BaseLayerConfig } from '../types/central-types';

/**
 * Funciones de servidor para una capa
 */
export interface LayerServerActions<T extends BaseLayerConfig = BaseLayerConfig> {
	getConfig: (entityType: string, entityId?: string) => Promise<ActionResponse>;
	updateConfig: (entityType: string, config: T, entityId?: string) => Promise<ActionResponse>;
	deleteConfig: (entityType: string, entityId?: string) => Promise<ActionResponse>;
}

/**
 * Propiedades comunes para todos los componentes de capa
 */
export interface CommonLayerProps {
	entityType: string;
	entityId?: string;
	isExploded?: boolean;
	isHovered?: boolean;
	activeLayer?: string | null;
}

/**
 * Función para transformar una capa en la vista explotada
 */
export type ExplodeLayerTransformFunction = (index: number) => React.CSSProperties;

/**
 * Propiedades para el panel de configuración de capas
 */
export interface LayersSettingsPanelProps {
	options: CardOptions;
	onOptionsChange: (options: CardOptions) => void;
	entityType: string;
	entityId?: string;
	className?: string;
	showPresets?: boolean;
}

/**
 * Opciones de configuración global para capas
 */
export interface LayersGlobalOptions {
	renderStrategy: 'stacked' | 'composed' | 'dynamic';
	compositionMode: 'normal' | 'overlay' | 'screen' | 'multiply';
	enableHoverEffects: boolean;
	enableActiveLayerHighlight: boolean;
	explodeSpacing: number;
}

/**
 * Información de una capa para el selector
 */
export interface LayerInfo {
	id: string;
	name: string;
	description?: string;
	icon?: React.ReactNode;
	category?: string;
	isEnabled: boolean;
	layerIndex: number;
}

/**
 * Estado del sistema de capas
 */
export interface LayersSystemState {
	activeLayers: string[];
	explodedView: boolean;
	selectedLayer: string | null;
	globalOptions: LayersGlobalOptions;
	layerConfigs: Record<string, BaseLayerConfig>;
}

/**
 * Evento de cambio de capa
 */
export interface LayerChangeEvent {
	layerId: string;
	enabled: boolean;
	config: BaseLayerConfig;
}

/**
 * Resultado del hook useLayersSystem
 */
export interface LayersSystemResult {
	layersSystem: {
		isReady: boolean;
		getLayers: () => LayerInfo[];
		getLayerConfig: (layerId: string) => BaseLayerConfig | null;
		updateLayerConfig: (layerId: string, config: Partial<BaseLayerConfig>) => void;
		enableLayer: (layerId: string, enabled: boolean) => void;
		setActiveLayer: (layerId: string | null) => void;
		toggleExplodedView: () => void;
		isExploded: boolean;
		activeLayer: string | null;
		reset: () => void;
	};
}

/**
 * Configuración para una capa específica
 */
export interface LayerConfig {
	/**
	 * Indica si la capa está habilitada
	 */
	enabled: boolean;

	/**
	 * Índice de la capa que determina su posición de renderizado
	 */
	layerIndex: number;

	/**
	 * Propiedades adicionales específicas de cada tipo de capa
	 */
	[key: string]: unknown;
}

/**
 * Implementación de una capa en el sistema
 * Esta interfaz define la estructura que debe seguir cualquier capa que se registre en el sistema
 */
export interface LayerImplementation {
	/**
	 * Identificador único de la capa
	 */
	type: string;

	/**
	 * Nombre amigable para mostrar en la UI
	 */
	name: string;

	/**
	 * Descripción de la funcionalidad de la capa
	 */
	description?: string;

	/**
	 * Categoría a la que pertenece la capa
	 */
	category?: string;

	/**
	 * Configuración por defecto para la capa
	 */
	defaultConfig?: LayerConfig;

	/**
	 * Icono para representar la capa en la UI
	 */
	icon?: React.ReactNode;

	/**
	 * Tipos de entidad compatibles con esta capa
	 */
	compatibleEntityTypes?: string[];

	/**
	 * Función para renderizar la capa
	 */
	render: (props: LayerRenderProps) => React.ReactNode;

	/**
	 * Componente para configurar la capa (opcional)
	 */
	Settings?: React.ComponentType<LayerSettingsProps>;
}

/**
 * Props para renderizar una capa
 */
export interface LayerRenderProps {
	/**
	 * Configuración actual de la capa
	 */
	config: LayerConfig;

	/**
	 * Si el mouse está sobre la tarjeta
	 */
	isHovered?: boolean;

	/**
	 * Posición relativa del mouse sobre la tarjeta
	 */
	mousePosition?: { x: number; y: number };

	/**
	 * Si la capa está activa/seleccionada
	 */
	isActive?: boolean;

	/**
	 * Si la vista está en modo explotado
	 */
	isExploded?: boolean;

	/**
	 * Tipo de entidad
	 */
	entityType: string;

	/**
	 * ID de la entidad (opcional)
	 */
	entityId?: string;

	/**
	 * Contexto adicional para la capa
	 */
	context?: Record<string, unknown>;
}

/**
 * Props para el componente de configuración de una capa
 */
export interface LayerSettingsProps {
	/**
	 * Configuración actual de la capa
	 */
	config: LayerConfig;

	/**
	 * Callback para actualizar la configuración
	 */
	onChange: (config: Partial<LayerConfig>) => void;

	/**
	 * Tipo de entidad
	 */
	entityType: string;

	/**
	 * ID de la entidad (opcional)
	 */
	entityId?: string;
}

/**
 * Configuración del sistema de capas
 */
export interface LayerSystemConfig {
	/**
	 * Determina si las capas están habilitadas globalmente
	 */
	enabled: boolean;

	/**
	 * Configuración de estrategia de renderizado de capas
	 */
	renderStrategy: 'stacked' | 'composited' | 'dynamic';

	/**
	 * Modo de composición para capas superpuestas
	 */
	compositionMode: 'normal' | 'overlay' | 'screen' | 'multiply';

	/**
	 * Capas habilitadas con sus estados
	 */
	enabledLayers?: Record<string, boolean>;

	/**
	 * Orden de renderizado de las capas
	 */
	layerOrder?: string[];

	/**
	 * Opciones adicionales para el sistema de capas
	 */
	options?: Record<string, unknown>;
}
