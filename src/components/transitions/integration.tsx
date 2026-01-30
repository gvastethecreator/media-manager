/**
 * @file Integración de Transiciones - Exportaciones unificadas
 * @module components/transitions/integration
 * @description Exportaciones unificadas para usar transiciones en toda la aplicación
 */

// ============================================================================
// Componentes Base
// ============================================================================

export {
  FlipContainer,
  TransitionGroup,
  TransitionItem,
  MorphContainer,
  AnimatePresence,
} from './index';

// ============================================================================
// Componentes de File Viewer
// ============================================================================

export {
  FileViewerTransition,
  FileNavigationTransition,
  ThumbnailTransition,
  ThumbnailGridTransition,
  ToolbarTransition,
} from '@/components/features/file-viewer/file-viewer-transitions';

// ============================================================================
// Componentes de Paneles
// ============================================================================

export {
  NavPanelTransition,
  DetailsPanelTransition,
  PanelItemTransition,
  PanelSectionTransition,
  ResizablePanelTransition,
  PanelOverlayTransition,
} from '@/components/panels/panel-transitions';

// ============================================================================
// Componentes de Settings
// ============================================================================

export {
  SettingsPageTransition,
  SettingsSectionTransition,
  SettingsItemTransition,
  SettingsFormTransition,
  SettingsToastTransition,
  SettingsTabsTransition,
} from '@/components/settings/settings-transitions';

// ============================================================================
// Componentes de Tarjetas
// ============================================================================

export {
  EntityCardTransition,
  EntityCardGridTransition,
  EntityListTransition,
  ExpandableCardTransition,
  EntityPreviewTransition,
} from '@/components/cards/card-transitions';

// ============================================================================
// Hooks
// ============================================================================

export {
  useFlip,
  useFlipGroup,
  useMorph,
  useMorphLoop,
  useEnterExit,
  useEnterExitGroup,
  useEntityCardTransition,
  useEntityCardGroupTransition,
} from '@/hooks/transitions';

// ============================================================================
// Utilidades
// ============================================================================

export {
  // Motores
  getFlipEngine,
  getMorphEngine,
  getDirectionTracker,
  getEnterExitCoordinator,
  
  // Funciones de morphing
  generateClipPath,
  generateBorderRadius,
  createLiquidMorph,
  createExpandFromPoint,
  createContractToPoint,
  
  // Easings
  customEasings,
  contextualEasings,
  springConfigs,
  getDurationByDistance,
  getEasingByMovement,
  
  // Presets
  enterPresets,
  exitPresets,
  statePresets,
  getDirectionalEnterPreset,
  getDirectionalExitPreset,
  
  // Configuración
  checkBrowserSupport,
  shouldReduceMotion,
  getAdjustedDuration,
  enableTransitionsDebug,
  disableTransitionsDebug,
  logTransition,
} from '@/lib/transitions';

// ============================================================================
// Tipos
// ============================================================================

export type {
  TransitionDirection,
  FlipOptions,
  MorphConfig,
  EnterConfig,
  ExitConfig,
  TransitionGroupConfig,
} from '@/lib/transitions';
