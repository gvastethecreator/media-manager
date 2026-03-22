/**
 * @file UI Components - Barrel Export Consolidado
 * @module components/ui
 * @description Exportaciones centralizadas de los componentes UI finales y sus variantes legacy
 *
 * USO RECOMENDADO:
 * Importar desde aquí para garantizar consistencia visual:
 * import { Switch, Checkbox, RadioGroup } from '@/components/ui';
 *
 * NOTA: Los componentes finales incluyen animaciones GSAP por defecto.
 * Para desactivar animaciones: <Switch animated={false} />
 */

// ============================================
// FORM CONTROLS - Controles de formulario (RECOMENDADOS)
// ============================================
export { Checkbox, type CheckboxProps } from './checkbox';
// ============================================
// NAVIGATION & MENUS - Navegación y menús (RECOMENDADOS)
// ============================================
export {
	ContextMenu,
	ContextMenuCheckboxItem,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuLabel,
	ContextMenuRadioGroup,
	ContextMenuRadioItem,
	ContextMenuSeparator,
	ContextMenuShortcut,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
	ContextMenuTrigger,
} from './context-menu';
export {
	Menubar,
	MenubarCheckboxItem,
	MenubarContent,
	MenubarItem,
	MenubarLabel,
	MenubarMenu,
	MenubarRadioGroup,
	MenubarRadioItem,
	MenubarSeparator,
	MenubarShortcut,
	MenubarSub,
	MenubarSubContent,
	MenubarSubTrigger,
	MenubarTrigger,
} from './menubar';
export { RadioGroup, RadioGroupItem, type RadioGroupItemProps, type RadioGroupProps } from './radio-group';
export { Slider, type SliderProps } from './slider';
export { Switch, type SwitchProps } from './switch';

export {
	Toolbar,
	ToolbarButton,
	ToolbarLink,
	ToolbarSeparator,
	ToolbarToggleGroup,
	ToolbarToggleItem,
} from './toolbar';

// ============================================
// LEGACY EXPORTS - Componentes antiguos (deprecados, para compatibilidad)
// ============================================
// NOTA: Estos componentes existen solo por compatibilidad.
// Prefiere importar los componentes finales desde este barrel.

// Form Controls Legacy (sin animaciones)
export { Checkbox as CheckboxLegacy } from './checkbox-legacy';
// Navigation Legacy (sin animaciones)
export * as ContextMenuLegacy from './context-menu-legacy';
export * as MenubarLegacy from './menubar-legacy';
export { RadioGroup as RadioGroupLegacy, RadioGroupItem as RadioGroupItemLegacy } from './radio-group-legacy';
export { Slider as SliderLegacy } from './slider-legacy';
export { Switch as SwitchLegacy } from './switch-legacy';
