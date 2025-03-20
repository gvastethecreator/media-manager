# Módulo de Efectos para Entity Cards

## 📋 Descripción

El módulo de efectos proporciona un sistema completo para configurar y aplicar efectos visuales y avanzados a las Entity Cards. Permite personalizar aspectos como efectos holográficos, líneas de escaneo, brillos, texturas y más.

## 🧩 Componentes

- **EffectsModule**: Componente principal que integra todos los efectos disponibles.
- **EffectsPanel**: Panel de configuración con pestañas para efectos visuales y avanzados.
- **VisualEffectsManager**: Gestiona los efectos visuales básicos.
- **AdvancedEffectsPanel**: Controla efectos más complejos como distorsiones y filtros.

## 🪝 Hooks y Utilidades

- **useEffects**: Hook principal para gestionar el estado de los efectos.
- **useAdvancedEffects**: Hook específico para efectos avanzados.
- **adaptCardOptionsToEffectsConfig**: Convierte opciones de tarjeta a configuración de efectos.
- **adaptEffectsConfigToCardOptions**: Convierte configuración de efectos a opciones de tarjeta.

## 🧪 Uso

```tsx
import { EffectsModule } from '@/components/features/entity-cards/modules/effects';

function MyComponent() {
  const [cardOptions, setCardOptions] = useState({});
  
  return (
    <EffectsModule 
      initialConfig={{}}
      onChange={(config) => console.log('Config actualizada:', config)}
      cardOptions={cardOptions}
      onCardOptionsChange={setCardOptions}
    />
  );
}
```

## 📊 Estructura de Configuración

La configuración de efectos se divide en dos categorías principales:

### Efectos Visuales

```typescript
interface VisualEffectsConfig {
  holographic?: HolographicOptions;
  scanlines?: ScanlinesOptions;
  glow?: GlowOptions;
  grain?: GrainOptions;
  border?: BorderOptions;
}
```

### Efectos Avanzados

```typescript
interface AdvancedEffectsConfig {
  distortion?: DistortionOptions;
  filters?: FiltersOptions;
  textures?: TexturesOptions;
  overlay?: OverlayOptions;
}
```

## 🔄 Integración con otros módulos

Este módulo está diseñado para trabajar en conjunto con otros módulos de Entity Cards:

- **Módulo de Colores**: Los efectos utilizan los colores definidos en el módulo de colores.
- **Módulo de Animación**: Algunos efectos pueden animarse utilizando el sistema de animación.
- **Módulo Core**: La configuración de efectos se integra con las opciones principales de las tarjetas.

## 🔍 Ejemplos

### Aplicar efecto holográfico

```tsx
const effectsConfig = {
  visual: {
    holographic: {
      enabled: true,
      intensity: 0.5,
      color: "59, 130, 246"
    }
  }
};

<EffectsModule initialConfig={effectsConfig} />
```

### Combinar múltiples efectos

```tsx
const effectsConfig = {
  visual: {
    glow: {
      enabled: true,
      color: "245, 158, 11",
      radius: 15
    },
    scanlines: {
      enabled: true,
      opacity: 0.3
    }
  },
  advanced: {
    filters: {
      enabled: true,
      blur: 0,
      contrast: 110,
      brightness: 105
    }
  }
};

<EffectsModule initialConfig={effectsConfig} />
```
