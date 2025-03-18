# Módulo de Video para Tarjetas de Entidades

Este módulo proporciona un sistema completo para configurar y personalizar la visualización de videos en las tarjetas de entidades.

## Características

- **Efectos visuales avanzados**: Efectos holográficos, brillo, bordes animados, etc.
- **Diseño 3D**: Configuración de efectos tridimensionales y elevación
- **Efectos de profundidad**: Sombras, reflejos y efectos parallax
- **Controles de video**: Configuración de autoplay, loop, controles, velocidad, etc.
- **Optimización de rendimiento**: Opciones para mejorar el rendimiento en diferentes dispositivos

## Componentes

### VideoModule

Componente principal que integra todo el sistema de video.

```tsx
import { VideoModule } from '@/components/features/entity-cards/modules/video';

<VideoModule
	initialOptions={{
		videoAutoplay: false,
		videoLoop: true,
		videoMuted: true,
	}}
	onChange={(options) => console.log('Video options updated:', options)}
/>;
```

### VideoPanel

Panel de configuración para ajustar las opciones de video.

```tsx
import { VideoPanel } from '@/components/features/entity-cards/modules/video';

<VideoPanel
	videoOptions={videoOptions}
	handleVideoChange={handleVideoChange}
	handleDesignSystemChange={handleDesignSystemChange}
	handleEffectsChange={handleEffectsChange}
	handlePerformanceChange={handlePerformanceChange}
	resetOptions={handleResetOptions}
/>;
```

## Hooks

### useVideoSystem

Hook para gestionar el estado y la lógica del sistema de video.

```tsx
import { useVideoSystem } from '@/components/features/entity-cards/modules/video';

const { options, updateOption, updateDesignSystemOption, updateEffectOption, updatePerformanceOption, resetOptions } =
	useVideoSystem(initialOptions, handleOptionsChange);
```

## Tipos

```tsx
import { VideoOptions } from '@/components/features/entity-cards/modules/video';

const defaultOptions: VideoOptions = {
	enable3DEffect: false,
	videoAutoplay: false,
	videoLoop: true,
	// ...
};
```

## Opciones Disponibles

| Opción                    | Tipo    | Descripción                        |
| ------------------------- | ------- | ---------------------------------- |
| `enable3DEffect`          | boolean | Habilitar efectos tridimensionales |
| `enableHolographicEffect` | boolean | Activar efecto holográfico         |
| `enableGlowEffect`        | boolean | Añadir efecto de brillo            |
| `enableAnimatedBorder`    | boolean | Animar el borde de la tarjeta      |
| `videoAutoplay`           | boolean | Reproducir video automáticamente   |
| `videoLoop`               | boolean | Repetir video en bucle             |
| `videoMuted`              | boolean | Silenciar video                    |
| `videoControls`           | boolean | Mostrar controles de reproducción  |
| `videoPlaybackRate`       | number  | Velocidad de reproducción          |

## Integración

Este módulo está diseñado para integrarse perfectamente con el sistema de tarjetas de entidades, proporcionando opciones de configuración para la reproducción y visualización de videos.
