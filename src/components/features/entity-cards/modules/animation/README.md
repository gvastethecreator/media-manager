# Módulo de Animación para Entity Cards

Este módulo proporciona un sistema de animación configurable para las tarjetas de entidad en la aplicación.

## Características

- **Configuración completa**: Permite personalizar todos los aspectos de las animaciones.
- **Presets predefinidos**: Incluye varios estilos de animación listos para usar.
- **Animaciones interactivas**: Efectos para hover, click y transiciones.
- **Accesibilidad**: Modo de movimiento reducido para usuarios con sensibilidad al movimiento.
- **Rendimiento optimizado**: Animaciones eficientes que no afectan al rendimiento.

## Componentes Principales

### `AnimationModule`

El componente principal que encapsula toda la funcionalidad del módulo de animación.

```tsx
import { AnimationModule } from '@/components/features/entity-cards/modules/animation';

function MyComponent() {
  return (
    <AnimationModule
      initialAnimationSystem={{
        enabled: true,
        hoverEffect: true,
        // Otras opciones...
      }}
      onChange={(animationSystem) => {
        // Guardar configuración actualizada
      }}
    />
  );
}
```

### `AnimationPanel`

Panel de configuración UI para ajustar las animaciones.

```tsx
import { AnimationPanel } from '@/components/features/entity-cards/modules/animation';
import { useState } from 'react';

function ConfigPanel() {
  const [animationConfig, setAnimationConfig] = useState(/* config inicial */);

  return (
    <AnimationPanel
      animationSystem={animationConfig}
      onChange={setAnimationConfig}
    />
  );
}
```

## Hooks

### `useAnimationSystem`

Hook para gestionar el estado de animación en componentes.

```tsx
import { useAnimationSystem } from '@/components/features/entity-cards/modules/animation';

function AnimatedComponent() {
  const {
    animationSystem,
    updateAnimationSystem,
    resetAnimationSystem,
    generateAnimationClasses
  } = useAnimationSystem();

  return (
    <div className={generateAnimationClasses()}>
      {/* Contenido animado */}
    </div>
  );
}
```

## Tipos

El módulo exporta varios tipos útiles:

- `AnimationSystem`: La configuración completa del sistema de animación.
- `AnimationSystemPreset`: Estructura para presets de animación predefinidos.
- `AnimationPanelProps`: Props para el panel de configuración.
- `AnimationModuleProps`: Props para el módulo principal.
- `AnimationClassesGenerator`: Función que genera clases CSS basadas en configuración.
- `UseAnimationSystemHook`: Tipo para el hook de animación.

## Estilos CSS

El módulo incluye un archivo CSS (`animations.css`) con todas las animaciones y utilidades necesarias.
Este archivo debe importarse en el archivo CSS principal de la aplicación.

```css
/* En globals.css */
@import './components/features/entity-cards/modules/animation/animations.css';
```

## Integración con Entity Cards

Para integrar las animaciones en las tarjetas de entidad:

1. Añadir la configuración de animación al modelo `CardOptions`.
2. Aplicar las clases generadas por `generateAnimationClasses()` al componente de tarjeta.
3. Utilizar el hook `useAnimationSystem` para gestionar el estado de animación.

## Accesibilidad

El sistema respeta las preferencias del usuario para animaciones reducidas mediante la opción `reducedMotion`.
Cuando está activada, se deshabilitan todas las animaciones decorativas manteniendo solo las esenciales para la usabilidad.