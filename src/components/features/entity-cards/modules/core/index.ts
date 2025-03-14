/**
 * 🔧 Módulo Core para @entity-cards
 *
 * Exporta los componentes y hooks principales para la configuración
 * del núcleo del sistema de tarjetas.
 */

// Exportar el panel principal
export { CorePanel } from './core-panel';

// Exportar hooks
export { useCoreSettings } from './hooks/use-core-settings';

// Exportar componentes de secciones
export {
	InteractivitySection,
	PerformanceSection,
	FeedbackSection,
	ContentSection,
} from './components/sections';

export * from './core-config';
export * from './core-layer';
export * from './states';
export * from './presets';
export * from './system';
export * from './content';
export * from './config';
