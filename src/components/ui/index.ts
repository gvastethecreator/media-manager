/**
 * @file UI Components v3 - Barrel Export Consolidado
 * @module components/ui
 * @description Exportaciones centralizadas de todos los componentes UI rediseñados v3
 *
 * USO RECOMENDADO:
 * Importar desde aquí para garantizar consistencia visual:
 * import { Switch, Checkbox, RadioGroup } from '@/components/ui';
 *
 * NOTA: Los componentes v3 incluyen animaciones animejs por defecto.
 * Para desactivar animaciones: <Switch animated={false} />
 */

// ============================================
// FORM CONTROLS - Controles de formulario (v3 RECOMENDADOS)
// ============================================
export { Checkbox, type CheckboxProps } from './checkbox-v3';
// ============================================
// NAVIGATION & MENUS - Navegación y menús (v3 RECOMENDADOS)
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
} from './context-menu-v3';
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
} from './menubar-v3';
export { RadioGroup, RadioGroupItem, type RadioGroupItemProps, type RadioGroupProps } from './radio-group-v3';
export { Slider, type SliderProps } from './slider-v3';
export { Switch, type SwitchProps } from './switch-v3';

export {
	Toolbar,
	ToolbarButton,
	ToolbarLink,
	ToolbarSeparator,
	ToolbarToggleGroup,
	ToolbarToggleItem,
} from './toolbar-v3';

// ============================================
// LEGACY EXPORTS - Componentes antiguos (deprecados, para compatibilidad)
// ============================================
// NOTA: Estos componentes serán removidos en una versión futura.
// Por favor migra a los componentes v3 para mejor UX y animaciones.

// Form Controls Legacy (sin animaciones)
export { Checkbox as CheckboxLegacy } from './checkbox';
// Navigation Legacy (sin animaciones)
export * as ContextMenuLegacy from './context-menu';
export * as MenubarLegacy from './menubar';
export { RadioGroup as RadioGroupLegacy, RadioGroupItem as RadioGroupItemLegacy } from './radio-group';
export { Slider as SliderLegacy } from './slider';
export { Switch as SwitchLegacy } from './switch';
