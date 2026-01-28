import { Cpu, Grid3X3, Layers, LayoutGrid, List, Monitor, Table, Zap } from 'lucide-react';
import type { RenderingModeItem, ViewModeItem } from './settings.types';

export const VIEW_MODES: ViewModeItem[] = [
	{ value: 'grid', label: 'Grid', icon: Grid3X3, color: 'text-primary' },
	{ value: 'list', label: 'Lista', icon: List, color: 'text-primary' },
	{ value: 'cards', label: 'Tarjetas', icon: LayoutGrid, color: 'text-primary' },
	{ value: 'masonry', label: 'Masonry', icon: Layers, color: 'text-primary' },
	{ value: 'table', label: 'Tabla', icon: Table, color: 'text-primary' },
	{ value: 'canvas', label: 'Canvas', icon: Monitor, color: 'text-primary' },
];

export const RENDERING_MODES: RenderingModeItem[] = [
	{ value: 'canvas', label: 'Canvas', icon: Monitor, color: 'text-primary' },
	{ value: 'virtualized', label: 'Virtualizado', icon: Zap, color: 'text-primary' },
	{ value: 'webgl', label: 'WebGL', icon: Cpu, color: 'text-primary' },
];

export const PRESET_COLORS = [
	{ value: 'var(--background)', label: 'Blanco' },
	{ value: 'var(--dt-neutral-100)', label: 'Gris claro' },
	{ value: 'var(--dt-neutral-800)', label: 'Gris oscuro' },
	{ value: 'var(--dt-neutral-950)', label: 'Negro' },
	{ value: 'var(--dt-primary-500)', label: 'Azul' },
	{ value: 'var(--dt-success-500)', label: 'Verde' },
	{ value: 'var(--dt-warning-500)', label: 'Naranja' },
	{ value: 'var(--dt-danger-500)', label: 'Rojo' },
];
