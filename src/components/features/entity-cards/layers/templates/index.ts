/**
 * Plantilla para implementar nuevas capas en el sistema
 * @module EntityCards/Layers/Templates
 */
import type { LayerComponent } from '../layer-plugin-system';
import {
	deleteTemplateConfig,
	getTemplateConfig,
	updateTemplateConfig,
	type TemplateLayerConfig,
} from './actions/template-config.action';
import { TemplateEffectLayer, TemplateLayerSettings } from './layer-template';

/**
 * Definición de la capa para el sistema de plugins
 * Este objeto define la capa completa con sus componentes y configuración
 */
export const templateLayer: LayerComponent<TemplateLayerConfig> = {
	// Identificador único para la capa
	type: 'template',

	// Componente que renderiza el efecto visual
	Component: TemplateEffectLayer,

	// Componente para configurar la capa (opcional)
	SettingsComponent: TemplateLayerSettings,

	// Configuración por defecto
	defaultConfig: {
		enabled: true,
		layerIndex: 5,
		color: '#3b82f6',
		intensity: 0.5,
		mode: 'normal',
		visibleOnHover: false,
	},

	// Acciones del servidor para la capa
	getServerActions: () => ({
		getConfig: getTemplateConfig,
		updateConfig: updateTemplateConfig,
		deleteConfig: deleteTemplateConfig,
	}),
};

// Exportar componentes y tipos
export * from './actions/template-config.action';
export type { TemplateLayerConfig } from './actions/template-config.action';
export { TemplateEffectLayer, TemplateLayerSettings } from './layer-template';

/**
 * GUÍA DE USO:
 *
 * 1. Duplica esta carpeta y renómbrala con el nombre de tu capa
 * 2. Reemplaza "Template" por el nombre de tu capa en todos los archivos
 * 3. Personaliza la implementación según tus necesidades
 * 4. Registra tu capa en register-layers.tsx
 *
 * NOTA: Asegúrate de actualizar el schema de Prisma si necesitas
 * guardar la configuración en la base de datos.
 */
