/**
 * @file Integración de Transiciones - Exportaciones unificadas
 * @module components/transitions/integration
 * @description Exportaciones unificadas para usar transiciones en toda la aplicación
 */

// ============================================================================
// Componentes Base
// ============================================================================

export { FlipContainer } from './FlipContainer';
export { MorphContainer } from './MorphContainer';
export { AnimatePresence, TransitionGroup, TransitionItem } from './TransitionGroup';

// ============================================================================
// Componentes de File Viewer
// ============================================================================

export {
	FileNavigationTransition,
	FileViewerTransition,
	ThumbnailGridTransition,
	ThumbnailTransition,
	ToolbarTransition,
} from '@/components/features/file-viewer/file-viewer-transitions';

// ============================================================================
// Componentes de Paneles
// ============================================================================

export {
	DetailsPanelTransition,
	NavPanelTransition,
	PanelItemTransition,
	PanelOverlayTransition,
	PanelSectionTransition,
	ResizablePanelTransition,
} from '@/components/panels/panel-transitions';

// ============================================================================
// Componentes de Settings
// ============================================================================

export {
	SettingsFormTransition,
	SettingsItemTransition,
	SettingsPageTransition,
	SettingsSectionTransition,
	SettingsTabsTransition,
	SettingsToastTransition,
} from '@/components/settings/settings-transitions';

// ============================================================================
// Componentes de Tarjetas
// ============================================================================

export {
	EntityCardGridTransition,
	EntityCardTransition,
	EntityListTransition,
	EntityPreviewTransition,
	ExpandableCardTransition,
} from '@/components/cards/card-transitions';

// ============================================================================
// Hooks
// ============================================================================

export {
	useEnterExit,
	useEnterExitGroup,
	useEntityCardGroupTransition,
	useEntityCardTransition,
	useFlip,
	useFlipGroup,
	useMorph,
	useMorphLoop,
} from '@/hooks/transitions';

// ============================================================================
// Utilidades
// ============================================================================

export {
	// Configuración
	checkBrowserSupport,
	contextualEasings,
	createContractToPoint,
	createExpandFromPoint,
	createLiquidMorph,
	// Easings
	customEasings,
	disableTransitionsDebug,
	enableTransitionsDebug,
	// Presets
	enterPresets,
	exitPresets,
	generateBorderRadius,
	// Funciones de morphing
	generateClipPath,
	getAdjustedDuration,
	getDirectionalEnterPreset,
	getDirectionalExitPreset,
	getDirectionTracker,
	getDurationByDistance,
	getEasingByMovement,
	getEnterExitCoordinator,
	// Motores
	getFlipEngine,
	getMorphEngine,
	logTransition,
	shouldReduceMotion,
	springConfigs,
	statePresets,
} from '@/lib/transitions';

// ============================================================================
// Tipos
// ============================================================================

export type {
	EnterConfig,
	ExitConfig,
	FlipOptions,
	MorphConfig,
	TransitionDirection,
	TransitionGroupConfig,
} from '@/lib/transitions';
