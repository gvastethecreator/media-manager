'use client';

// Exportar la implementación
export { patternImplementation } from './pattern-implementation';

// Exportar componentes
export { PatternLayer } from './components/pattern-layer';

// Exportar tipos
export type { PatternConfig } from './actions/pattern-config.action';

// Exportar configuraciones
export {
	defaultPatternConfig,
	patternConfigSchema
} from './actions/pattern-config.action';

// Exportar acciones del servidor
export {
	deletePatternConfig, getPatternConfig,
	updatePatternConfig
} from './actions/pattern-server-actions';

// Exportar hooks
export * from './hooks/use-pattern';

