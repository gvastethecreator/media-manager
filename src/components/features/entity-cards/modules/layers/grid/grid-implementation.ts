import type { LayerImplementation } from '../types';
import {
  createDefaultGridConfig,
  deleteGridConfig,
  getGridConfig,
  updateGridConfig
} from './actions/grid-config.action';
import { GridConfigForm } from './components/grid-config-form';
import { GridLayer } from './components/grid-layer';

/**
 * 📏 Implementación de la capa de grid
 */
export const gridImplementation: LayerImplementation = {
  type: 'grid',
  name: 'Cuadrícula',
  description: 'Añade un patrón de cuadrícula a la tarjeta',
  defaultConfig: createDefaultGridConfig(),
  render: GridLayer,
  settings: GridConfigForm,
  serverActions: {
    getConfig: getGridConfig,
    updateConfig: updateGridConfig,
    deleteConfig: deleteGridConfig,
  },
  icon: 'grid', // Nombre del icono en el sistema de iconos
};