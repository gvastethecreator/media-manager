// 🎨 Componentes
export { GlitchConfig } from './components/glitch-config';
export { GlitchLayer } from './components/glitch-layer';

// 🔄 Store y tipos
export { useGlitchStore, type GlitchConfig } from './actions/glitch-config.action';

// 🛠️ Utilidades
export { generateGlitchEffect } from './utils/glitch-utils';

// 🌐 Server Actions
export { deleteGlitchConfig, getGlitchConfig, updateGlitchConfig } from './actions/glitch-config.action';
