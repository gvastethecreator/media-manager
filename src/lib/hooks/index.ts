// 🎣 Hooks principales del sistema - Estructura reorganizada
// Exportaciones centralizadas para fácil importación

// 📊 Hooks de entidades
export * from './entities/use-entity-conversion';
export * from './entities/use-group-sort';
export * from './entities/use-group-filters';
export * from './entities/useFilteredData';
export * from './entities/concept';
export * from './entities/note';

// 📁 Hooks de archivos
export * from './files/use-folder-images';
export * from './files/use-file-list';
export * from './files/use-file-drop';
export * from './files/use-file-actions';
export * from './files/folder';

// 🖥️ Hooks del sistema
export * from './system/use-stats';
export * from './system/use-stats-service';
export * from './system/use-navigation';
export * from './system/use-console-capture';

// 🎨 Hooks de UI
export * from './ui/use-toast';
export * from './ui/use-selection';
export * from './ui/use-glow-effect';
export * from './ui/use-thumbnail-events';

// 🔧 Hooks de utilidades
export * from './utils/use-local-storage';
export * from './utils/use-window-size';
export * from './utils/use-mobile';
export * from './utils/use-settings';
export * from './utils/use-profile-theme';

// 📝 Alias para compatibilidad
export { useIsMobile } from './utils/use-mobile';
export { useSettings } from './utils/use-settings';
