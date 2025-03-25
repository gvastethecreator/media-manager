import { Grid } from 'lucide-react';
import type { LayerImplementation } from '../types';
import { GridConfigForm } from './components/grid-config-form';
import { GridLayer } from './components/grid-layer';
import { GRID_PRESETS, type GRID_TYPES, type GridConfig } from './grid-config-types';

// Configuración por defecto
const DEFAULT_GRID_CONFIG: GridConfig = {
  enabled: true,
  visibleOnHover: false,
  layerIndex: 1,
  gridType: 'lines',
  spacing: 20,
  thickness: 1,
  color: '#000000',
  opacity: 0.1,
  blendMode: 'normal',
  angle: 0,
  showSubgrid: false,
  subgridDivisions: 2,
  subgridOpacity: 0.05,
  animateOnHover: false,
  animationSpeed: 1,
  colorMode: 'auto',
};

// Presets predefinidos
const GRID_LAYER_PRESETS = Object.entries(GRID_PRESETS).map(([key, preset]) => ({
  name: preset.name,
  description: preset.description,
  config: {
    ...DEFAULT_GRID_CONFIG,
    gridType: preset.type as typeof GRID_TYPES[number],
    spacing: preset.spacing,
    thickness: preset.thickness,
    color: preset.color,
    opacity: preset.opacity,
  } as GridConfig,
}));

/**
 * 📏 Implementación de la capa de grid
 */
export const gridImplementation: LayerImplementation<GridConfig> = {
  type: 'grid',
  name: 'Cuadrícula',
  description: 'Agrega una cuadrícula personalizable a la tarjeta',
  category: 'design',
  defaultConfig: DEFAULT_GRID_CONFIG,
  render: GridLayer,
  settings: GridConfigForm,
  icon: Grid,
  compatibleEntityTypes: ['card', 'folder'],
  presets: GRID_LAYER_PRESETS,
};