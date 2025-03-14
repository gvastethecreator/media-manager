# Módulo de Efectos de Distorsión para Entity Cards

Este módulo proporciona un sistema completo para aplicar efectos de distorsión visual a las tarjetas de entidad, incluyendo glitch, aberración cromática y pixelado.

## Características

- **Efectos de distorsión avanzados**: Glitch, aberración cromática y pixelado
- **Configuración detallada**: Control preciso sobre intensidad, frecuencia y otros parámetros
- **Activación condicional por hover**: Posibilidad de mostrar efectos solo al pasar el cursor
- **API sencilla**: Fácil de integrar con cualquier componente de tarjeta
- **Hook personalizado**: Para gestionar efectos de forma programática
- **Generación de clases CSS**: Para aplicar estilos basados en la configuración

## Componentes Principales

### `DistortionEffectsModule`

El componente principal que encapsula toda la funcionalidad del módulo.

```tsx
import { DistortionEffectsModule } from '@/components/features/entity-cards/modules/layers/distortion';

function MyComponent() {
  return (
    <DistortionEffectsModule
      initialEffectsSystem={{
        enabled: true,
        visibleOnHover: true,
        intensity: 0.5,
        glitchEffect: {
          enabled: true,
          intensity: 0.3,
          // Más configuraciones...
        },
        // Más efectos...
      }}
      onChange={(effectsSystem) => {
        // Guardar configuración actualizada
      }}
    />
  );
}
```

### `DistortionEffectsPanel`

Panel de configuración UI para ajustar los efectos de distorsión.

```tsx
import { DistortionEffectsPanel } from '@/components/features/entity-cards/modules/layers/distortion';
import { useState } from 'react';

function ConfigPanel() {
  const [effectsConfig, setEffectsConfig] = useState(/* config inicial */);

  return (
    <DistortionEffectsPanel
      effectsSystem={effectsConfig}
      onChange={setEffectsConfig}
    />
  );
}
```

## Hook: useDistortionEffects

Hook para gestionar los efectos de distorsión en componentes.

```tsx
import { useDistortionEffects } from '@/components/features/entity-cards/modules/layers/distortion';

function DistortedCard() {
  const {
    effectsSystem,
    updateEffect,
    toggleEffects,
    toggleEffect,
    generateEffectClasses
  } = useDistortionEffects();

  return (
    <div className={generateEffectClasses(isHovered)}>
      {/* Contenido de la tarjeta */}
    </div>
  );
}
```

## Tipos

El módulo exporta varios tipos útiles:

- `DistortionEffectsSystem`: La configuración completa del sistema de efectos
- `GlitchEffectOptions`, `ChromaticAberrationOptions`, `PixelateOptions`: Configuraciones para cada tipo de efecto
- `DistortionEffectsModuleProps`: Props para el módulo principal
- `UseDistortionEffectsProps`: Props para el hook

## Efectos Disponibles

### Glitch

Simula errores digitales y corrupciones para crear un aspecto dañado o de mal funcionamiento. Configurable en intensidad, frecuencia y duración.

### Aberración Cromática

Desplaza los canales RGB para simular errores de lentes o efectos retro. Configurable en intensidad y cantidad de desplazamiento.

### Pixelado

Reduce la resolución aparente para crear un aspecto pixelado o de baja resolución. Configurable en intensidad y tamaño de los bloques.

## Integración con Entity Cards

Para integrar los efectos de distorsión en las tarjetas de entidad:

1. Añadir la configuración de efectos al modelo `CardOptions`
2. Aplicar las clases generadas por `generateEffectClasses()` al componente de tarjeta
3. Utilizar el hook `useDistortionEffects` para gestionar los efectos