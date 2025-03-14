// Panels that have been migrated to layer system
// export * from './scanlines-settings';
// export * from './holographic-settings';
// export * from './grain-settings';
// export * from './border-settings';
// export * from './patterns-settings';
// export * from './filters-settings';
// export * from './shaders-settings';

// Panels still to be migrated
// export * from './visual-effects-settings'; // ✅ Migrado a /layers/filters/visual-effects
// export * from './design-settings'; // ✅ Migrado a /design
// export * from './states-settings'; // ✅ Migrado a /core/states
export * from './performance-settings';
// export * from './animation-settings'; // ✅ Migrado a /animation
// export * from './interaction-settings'; // ✅ Migrado a /core/interactions
// export * from './content-settings'; // ✅ Migrado a /core/content
// export * from './image-grid-settings'; // ✅ Migrado a /image-grid
// export * from './presets-panel'; // ✅ Migrado a /core/presets
// export * from './rarities-panel'; // ✅ Migrado a /rarities
// export * from './rarity-editor'; // ✅ Migrado a /rarities
// export * from './rarity-distribution'; // ✅ Migrado a /rarities
// export * from './system-settings'; // ✅ Migrado a /core/system
// export * from './visual-effects-manager'; // ✅ Migrado a /effects/visual
// export * from './card-config-manager'; // ✅ Migrado a /core/config
export * from './advanced-effects-settings';
// export * from './distortion-effects-settings'; // ✅ Migrado a /layers/distortion
export * from './folder-settings';
export * from './image-settings';
export * from './video-settings';
// export * from './backside-settings'; // ✅ Migrado a /backside

// New unified layers panel
export * from './layers-settings-panel';

// Exportaciones de paneles de configuración
export * from './general-settings-panel';
export * from './content-settings-panel';
export * from './layers-settings-panel';
export * from './design-settings-panel';
export * from './animation-settings-panel';
export * from './export-settings-panel';
export * from './advanced-settings-panel';
export * from './colors-settings';
export * from './rarities-settings';

// Componentes adaptadores para mantener compatibilidad
// mientras se completa la migración a la arquitectura de módulos
export * from './backside-settings'; // Adaptador para /backside
export * from './design-settings'; // Adaptador para /design
export * from './animation-settings'; // Adaptador para /animation

// Exportaciones de paneles de configuración unificados
export * from './general-settings-panel';
export * from './content-settings-panel';
export * from './layers-settings-panel';
export * from './design-settings-panel';
export * from './animation-settings-panel';
export * from './export-settings-panel';
export * from './advanced-settings-panel';
export * from './colors-settings';
export * from './rarities-settings';

/*
Todos los paneles siguientes han sido migrados a sus respectivos módulos:
✅ 'visual-effects-settings.tsx' → Migrado a /layers/filters/visual-effects
✅ 'states-settings.tsx' → Migrado a /core/states
✅ 'performance-settings.tsx' → Migrado a /performance
✅ 'interaction-settings.tsx' → Migrado a /core/interactions
✅ 'content-settings.tsx' → Migrado a /core/content
✅ 'image-grid-settings.tsx' → Migrado a /image-grid
✅ 'presets-panel.tsx' → Migrado a /core/presets
✅ 'rarities-panel.tsx' → Migrado a /rarities
✅ 'rarity-editor.tsx' → Migrado a /rarities
✅ 'rarity-distribution.tsx' → Migrado a /rarities
✅ 'system-settings.tsx' → Migrado a /core/system
✅ 'visual-effects-manager.tsx' → Migrado a /effects/visual
✅ 'card-config-manager.tsx' → Migrado a /core/config
✅ 'advanced-effects-settings.tsx' → Migrado a /effects/advanced
✅ 'distortion-effects-settings.tsx' → Migrado a /layers/distortion
✅ 'folder-settings.tsx' → Migrado a /folder
✅ 'image-settings.tsx' → Migrado a /image
✅ 'video-settings.tsx' → Migrado a /video
*/
