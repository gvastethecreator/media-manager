# Sistema de Transiciones - Image Manager

Sistema completo de transiciones fluidas y coherentes para la aplicación Image Manager, basado en View Transitions API, FLIP (First Last Invert Play) y anime.js.

## 🎯 Características Principales

- **FLIP Engine**: Transiciones de alto rendimiento basadas en posición real
- **Morphing de Formas**: Transformaciones orgánicas entre diferentes formas
- **Dirección Inteligente**: Animaciones que provienen de la dirección correcta
- **Entrada/Salida Coordinada**: Stagger animations con orígenes precisos
- **Sin Fade Simple**: Usa blur, scale, translate, clip-path
- **Optimizado para Rendimiento**: GPU acceleration, will-change, containment

## 📁 Estructura del Sistema

```
src/
├── lib/transitions/
│   ├── core/
│   │   ├── flip-engine.ts          # Motor FLIP principal
│   │   ├── morph-engine.ts         # Motor de morphing
│   │   ├── direction-tracker.ts    # Rastreador de dirección
│   │   └── enter-exit-coordinator.ts # Coordinador entrada/salida
│   ├── animations/
│   │   ├── easings.ts              # Curvas de easing personalizadas
│   │   └── presets.ts              # Presets de animación
│   └── types/
│       └── index.ts                # Tipos TypeScript
├── hooks/transitions/
│   ├── use-flip.ts                 # Hook FLIP
│   ├── use-morph.ts                # Hook morphing
│   ├── use-enter-exit.ts           # Hook entrada/salida
│   └── use-entity-card-transition.ts # Hook para tarjetas
├── components/transitions/
│   ├── FlipContainer.tsx           # Contenedor FLIP
│   ├── TransitionGroup.tsx         # Grupo con stagger
│   ├── MorphContainer.tsx          # Contenedor con morphing
│   └── integration.tsx             # Exportaciones unificadas
└── styles/transitions.css          # Estilos CSS
```

## 🚀 Uso Rápido

### FLIP (First Last Invert Play)

```tsx
import { useFlip } from '@/hooks/transitions';

function MiComponente() {
  const { ref, executeFlip } = useFlip({ id: 'mi-elemento' });
  const [expandido, setExpandido] = useState(false);

  const handleClick = () => {
    executeFlip(() => {
      setExpandido(!expandido);
    });
  };

  return (
    <div ref={ref} onClick={handleClick}>
      Contenido
    </div>
  );
}
```

### Transiciones de Entrada/Salida

```tsx
import { TransitionGroup, TransitionItem } from '@/components/transitions';

function MiLista({ items }) {
  return (
    <TransitionGroup
      isVisible={items.length > 0}
      staggerDelay={50}
      enterConfig={{ type: 'slide', direction: 'bottom' }}
    >
      {items.map((item, index) => (
        <TransitionItem key={item.id} id={item.id} index={index}>
          <div>{item.name}</div>
        </TransitionItem>
      ))}
    </TransitionGroup>
  );
}
```

### Morphing de Formas

```tsx
import { MorphContainer } from '@/components/transitions';

function MiMorph() {
  const [forma, setForma] = useState('square');

  return (
    <MorphContainer
      morphId="mi-forma"
      shape={forma}
      className="w-32 h-32 bg-primary"
    >
      Contenido
    </MorphContainer>
  );
}
```

### Tarjetas de Entidades

```tsx
import { useEntityCardTransition } from '@/hooks/transitions';

function FolderCard({ folder, onClick }) {
  const { cardRef, handleCardClick } = useEntityCardTransition({
    entityId: folder.id,
    entityType: 'folder',
  });

  return (
    <div ref={cardRef} onClick={() => handleCardClick(() => onClick(folder))}>
      {/* Contenido de la tarjeta */}
    </div>
  );
}
```

## 🎨 Easings Disponibles

### Easings Personalizados

```typescript
import { customEasings } from '@/lib/transitions';

// Easings principales
customEasings.easeOutSuper      // Salida súper suave
customEasings.elasticSubtle     // Elástico sutil
customEasings.bounceSubtle      // Rebote sutil
customEasings.quickSlow         // Desaceleración rápida
customEasings.liquid            // Movimiento líquido
customEasings.scaleOrganic      // Escala orgánica
```

### Easings Contextuales

```typescript
import { contextualEasings } from '@/lib/transitions';

// Según contexto
contextualEasings.navigation    // Para navegación
contextualEasings.element       // Para elementos
contextualEasings.modal         // Para modales
contextualEasings.list          // Para listas
contextualEasings.shared        // Para elementos compartidos
```

## 🧩 Presets de Animación

### Presets de Entrada

```typescript
import { enterPresets } from '@/lib/transitions';

enterPresets.slideIn    // Entrada deslizante
enterPresets.scaleIn    // Entrada con escala
enterPresets.blurIn     // Entrada con desenfoque
enterPresets.elasticIn  // Entrada elástica
enterPresets.zoomIn     // Zoom desde lejos
```

### Presets de Salida

```typescript
import { exitPresets } from '@/lib/transitions';

exitPresets.slideOut    // Salida deslizante
exitPresets.scaleOut    // Salida con escala
exitPresets.blurOut     // Salida con desenfoque
exitPresets.zoomOut     // Zoom hacia lejos
```

## 📐 Direcciones de Transición

Las direcciones disponibles son:

- `'top'` | `'bottom'` | `'left'` | `'right'`
- `'top-left'` | `'top-right'` | `'bottom-left'` | `'bottom-right'`
- `'center'` | `'auto'`

## ⚡ Optimizaciones de Rendimiento

El sistema incluye automáticamente:

- **GPU Acceleration**: Uso de `transform3d` y `will-change`
- **CSS Containment**: `contain: layout style paint`
- **Reduced Motion**: Respeto de `prefers-reduced-motion`
- **Adaptive Quality**: Ajuste según capacidades del dispositivo

### Verificar soporte del navegador:

```typescript
import { checkBrowserSupport } from '@/lib/transitions';

const support = checkBrowserSupport();
// { flip: true, morph: true, webAnimations: true, clipPath: true }
```

### Respetar preferencias de accesibilidad:

```typescript
import { shouldReduceMotion, getAdjustedDuration } from '@/lib/transitions';

const duration = getAdjustedDuration(400); // 150ms si prefers-reduced-motion
```

## 🎭 Integraciones

### File Viewer

```tsx
import { FileViewerTransition, ThumbnailTransition } from '@/components/transitions/integration';
```

### Paneles (Nav y Detalles)

```tsx
import { NavPanelTransition, DetailsPanelTransition } from '@/components/transitions/integration';
```

### Settings

```tsx
import { SettingsSectionTransition, SettingsItemTransition } from '@/components/transitions/integration';
```

### Tarjetas de Entidades

```tsx
import { EntityCardTransition, EntityCardGridTransition } from '@/components/transitions/integration';
```

## 🔧 Configuración

### Configuración Global

```typescript
import { 
  getFlipEngine, 
  getEnterExitCoordinator,
  enableTransitionsDebug 
} from '@/lib/transitions';

// Habilitar debug
enableTransitionsDebug();

// Limpiar transiciones
getFlipEngine().destroy();
getEnterExitCoordinator().clearAll();
```

### Variables CSS

```css
:root {
  /* Duraciones */
  --transition-duration-fast: 200ms;
  --transition-duration-normal: 350ms;
  --transition-duration-slow: 500ms;
  
  /* Easings */
  --transition-easing-smooth: cubic-bezier(0.16, 1, 0.3, 1);
  --transition-easing-bounce: cubic-bezier(0.68, -0.15, 0.265, 1.15);
}
```

## 🐛 Debug

### Modo Debug Visual

```typescript
import { enableTransitionsDebug } from '@/lib/transitions';

enableTransitionsDebug();
```

O agregar clase al HTML:

```html
<html class="debug-transitions">
```

### Métricas de Rendimiento

```typescript
import { getFlipEngine } from '@/lib/transitions';

const metrics = getFlipEngine().getMetrics();
// { startTime, endTime, actualDuration, framesRendered, averageFPS, jankDetected }
```

## 🎓 Ejemplos Avanzados

### Transición FLIP con Grupo

```tsx
import { useFlipGroup } from '@/hooks/transitions';

function GridReordable() {
  const { registerRef, executeFlip } = useFlipGroup({
    ids: items.map(i => i.id),
  });

  const reorder = () => {
    executeFlip(() => {
      // Reordenar items
    });
  };

  return (
    <div className="grid">
      {items.map(item => (
        <div key={item.id} ref={registerRef(item.id)}>
          {item.content}
        </div>
      ))}
    </div>
  );
}
```

### Morphing Continuo

```tsx
import { useMorphLoop } from '@/hooks/transitions';

function EfectoLiquido() {
  const { ref, start, stop } = useMorphLoop({
    id: 'liquid-effect',
    shapes: ['circle', 'organic', 'blob', 'organic'],
    interval: 2000,
  });

  return (
    <div ref={ref} className="liquid-container">
      Contenido
    </div>
  );
}
```

### Secuencia de Animaciones

```tsx
import { getEnterExitCoordinator } from '@/lib/transitions';

const coordinator = getEnterExitCoordinator();

// Secuencia personalizada
await coordinator.coordinateReplace(
  elementosSalientes,
  elementosEntrantes,
  {
    exitConfig: { type: 'slide', direction: 'left' },
    enterConfig: { type: 'slide', direction: 'right' },
    overlap: 0.2,
  }
);
```

## 📝 Notas de Implementación

1. **FLIP requiere IDs únicos**: Cada elemento FLIP debe tener un ID único
2. **Evitar animaciones durante scroll**: El sistema detecta automáticamente
3. **Preferir transform y opacity**: Son las propiedades más performantes
4. **Usar will-change con moderación**: Solo durante la animación
5. **Testear en dispositivos lentos**: Usar `getOptimalVelocityCurve()`

## 🔗 Dependencias

- `anime.js`: Para animaciones avanzadas
- React 19: Para hooks y componentes
- TypeScript: Tipado completo

## 📄 Licencia

Parte de Image Manager - Sistema interno.
