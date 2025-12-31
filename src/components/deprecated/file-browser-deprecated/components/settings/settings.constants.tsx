import { Cpu, Grid3X3, Layers, LayoutGrid, List, Monitor, Table, Zap } from 'lucide-react';
import type { RenderingModeItem, ViewModeItem } from './settings.types';

/**
 * Modos de vista disponibles con iconos y colores
 */
export const VIEW_MODES: ViewModeItem[] = [
	{ value: 'grid', label: 'Grid', icon: Grid3X3, color: 'text-blue-600' },
	{ value: 'list', label: 'Lista', icon: List, color: 'text-green-600' },
	{ value: 'cards', label: 'Tarjetas', icon: LayoutGrid, color: 'text-purple-600' },
	{ value: 'masonry', label: 'Masonry', icon: Layers, color: 'text-orange-600' },
	{ value: 'table', label: 'Tabla', icon: Table, color: 'text-red-600' },
	{ value: 'canvas', label: 'Canvas', icon: Monitor, color: 'text-cyan-600' },
];

/**
 * Modos de renderizado disponibles con iconos y colores
 */
export const RENDERING_MODES: RenderingModeItem[] = [
	{ value: 'canvas', label: 'Canvas', icon: Monitor, color: 'text-blue-500' },
	{ value: 'virtualized', label: 'Virtualizado', icon: Zap, color: 'text-green-500' },
	{ value: 'webgl', label: 'WebGL', icon: Cpu, color: 'text-purple-500' },
];

/**
 * Colores preset para ColorPicker
 */
export const PRESET_COLORS = [
	{ value: '#ffffff', label: 'Blanco' },
	{ value: '#f3f4f6', label: 'Gris claro' },
	{ value: '#1f2937', label: 'Gris oscuro' },
	{ value: '#000000', label: 'Negro' },
	{ value: '#3b82f6', label: 'Azul' },
	{ value: '#10b981', label: 'Verde' },
	{ value: '#f59e0b', label: 'Naranja' },
	{ value: '#ef4444', label: 'Rojo' },
];
