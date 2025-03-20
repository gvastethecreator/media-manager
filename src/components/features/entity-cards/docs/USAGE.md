# Guía de Uso: Entity Cards v2.0

## Introducción

Esta guía proporciona ejemplos detallados y casos de uso para implementar y personalizar Entity Cards en tu aplicación.

## Instalación y Setup

```typescript
// En tu componente principal
import { EntityCardProvider } from '@/components/features/entity-cards';
import { RegisterLayers } from '@/components/features/entity-cards/layers';

export function App() {
  return (
    <EntityCardProvider>
      <RegisterLayers />
      {/* Tu aplicación */}
    </EntityCardProvider>
  );
}
```

## Ejemplos de Uso

### 1. Tarjeta Básica

```typescript
import { EntityCard } from '@/components/features/entity-cards';

export function SimpleCard() {
  return (
    <EntityCard
      entityType="image"
      entityId="img-1"
      title="Mi Imagen"
      description="Una descripción simple"
      imageUrl="/path/to/image.jpg"
    />
  );
}
```

### 2. Tarjeta con Efectos Visuales

```typescript
import { EntityCard } from '@/components/features/entity-cards';

export function FancyCard() {
  return (
    <EntityCard
      entityType="world-item"
      entityId="item-1"
      title="Objeto Especial"
      rarity="legendary"
      layers={{
        holographic: {
          enabled: true,
          intensity: 0.8,
          pattern: 'rainbow'
        },
        glow: {
          enabled: true,
          color: '#ff00ff',
          spread: 20
        },
        border: {
          enabled: true,
          style: 'animated',
          width: 2
        }
      }}
    />
  );
}
```

### 3. Tarjeta con Configuración Avanzada

```typescript
import { EntityCard } from '@/components/features/entity-cards';
import { useEntityCardConfig } from '@/components/features/entity-cards/hooks';

export function AdvancedCard() {
  const config = useEntityCardConfig({
    entityType: 'folder',
    presetId: 'special-folder'
  });

  return (
    <EntityCard
      entityType="folder"
      entityId="folder-1"
      title="Carpeta Especial"
      layers={config.layers}
      options={{
        interactive: true,
        animationPreset: 'smooth',
        renderQuality: 'high'
      }}
      onLayerClick={(layerName) => {
        console.log(`Capa clickeada: ${layerName}`);
      }}
    />
  );
}
```

### 4. Tarjeta con Capas Personalizadas

```typescript
import { EntityCard, registerLayer } from '@/components/features/entity-cards';
import { MyCustomLayer } from './my-custom-layer';

// Registrar capa personalizada
registerLayer({
  type: 'custom-effect',
  Component: MyCustomLayer,
  defaultConfig: {
    enabled: true,
    layerIndex: 10,
    // Configuración específica
    intensity: 0.5,
    color: '#000000'
  }
});

export function CustomCard() {
  return (
    <EntityCard
      entityType="custom"
      entityId="custom-1"
      title="Tarjeta Personalizada"
      layers={{
        'custom-effect': {
          enabled: true,
          intensity: 0.8,
          color: '#ff0000'
        }
      }}
    />
  );
}
```

## Hooks Disponibles

### useEntityCard

```typescript
import { useEntityCard } from '@/components/features/entity-cards/hooks';

function MyComponent() {
  const { card, loading, error } = useEntityCard({
    entityType: 'image',
    entityId: 'img-1'
  });

  if (loading) return <CardSkeleton />;
  if (error) return <ErrorCard error={error} />;

  return <EntityCard {...card} />;
}
```

### useLayerConfig

```typescript
import { useLayerConfig } from '@/components/features/entity-cards/hooks';

function ConfigurableCard() {
  const { config, updateConfig } = useLayerConfig('holographic');

  return (
    <div>
      <EntityCard
        entityType="image"
        entityId="img-1"
        layers={{ holographic: config }}
      />
      <input
        type="range"
        value={config.intensity}
        onChange={(e) => updateConfig({ intensity: e.target.value })}
      />
    </div>
  );
}
```

### useCardPreset

```typescript
import { useCardPreset } from '@/components/features/entity-cards/hooks';

function PresetCard() {
  const { preset, applyPreset } = useCardPreset('legendary');

  return (
    <EntityCard
      entityType="world-item"
      entityId="item-1"
      layers={preset.layers}
      onPresetChange={(newPreset) => applyPreset(newPreset)}
    />
  );
}
```

## Presets Predefinidos

### Rareza Legendaria

```typescript
const legendaryPreset = {
  id: 'legendary',
  name: 'Legendario',
  layers: {
    holographic: {
      enabled: true,
      pattern: 'rainbow',
      intensity: 1
    },
    glow: {
      enabled: true,
      color: '#ffd700',
      spread: 30
    },
    border: {
      enabled: true,
      style: 'animated-gold',
      width: 3
    }
  }
};
```

### Efecto Cyberpunk

```typescript
const cyberpunkPreset = {
  id: 'cyberpunk',
  name: 'Cyberpunk',
  layers: {
    glitch: {
      enabled: true,
      intensity: 0.7,
      frequency: 0.2
    },
    scanlines: {
      enabled: true,
      opacity: 0.3,
      color: '#00ff00'
    },
    chromaticAberration: {
      enabled: true,
      offset: 2
    }
  }
};
```

## Optimización de Rendimiento

### Lazy Loading de Capas

```typescript
import dynamic from 'next/dynamic';

const HolographicLayer = dynamic(
  () => import('@/components/features/entity-cards/layers/holographic'),
  { ssr: false }
);

registerLayer({
  type: 'holographic',
  Component: HolographicLayer,
  // ...
});
```

### Memorización de Componentes

```typescript
import { memo } from 'react';

const OptimizedCard = memo(function OptimizedCard({
  entityType,
  entityId,
  layers
}: EntityCardProps) {
  return (
    <EntityCard
      entityType={entityType}
      entityId={entityId}
      layers={layers}
      options={{ optimizeRendering: true }}
    />
  );
});
```

### Renderizado Condicional

```typescript
function ConditionalCard({ isVisible, ...props }) {
  if (!isVisible) return null;

  return (
    <EntityCard
      {...props}
      options={{
        ...props.options,
        suspendEffects: !isVisible
      }}
    />
  );
}
```

## Depuración

### Modo Debug

```typescript
<EntityCard
  debug={true}
  onLayerRender={(layerName, renderTime) => {
    console.log(`Capa ${layerName} renderizada en ${renderTime}ms`);
  }}
  onError={(error) => {
    console.error('Error en EntityCard:', error);
  }}
/>
```

### Vista Explodida

```typescript
<EntityCard
  isExploded={true}
  layerSpacing={20}
  onLayerHover={(layerName) => {
    console.log(`Hover en capa: ${layerName}`);
  }}
/>
```

## Integración con el Sistema de Diseño

### Tema Personalizado

```typescript
<EntityCard
  theme={{
    colors: {
      primary: 'var(--primary)',
      secondary: 'var(--secondary)',
      accent: 'var(--accent)'
    },
    borderRadius: 'var(--radius)',
    shadows: {
      normal: 'var(--shadow)',
      hover: 'var(--shadow-lg)'
    }
  }}
/>
```

### Animaciones Personalizadas

```typescript
<EntityCard
  animations={{
    enter: {
      type: 'spring',
      stiffness: 100,
      damping: 10
    },
    hover: {
      scale: 1.05,
      transition: {
        type: 'tween',
        duration: 0.2
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95
    }
  }}
/>
```

## Mejores Prácticas

1. **Optimización de Rendimiento**
   - Usar `memo` para componentes estáticos
   - Implementar lazy loading para efectos pesados
   - Utilizar la opción `optimizeRendering`

2. **Gestión de Estado**
   - Mantener la configuración de capas en el nivel más alto posible
   - Usar los hooks proporcionados para gestionar el estado
   - Implementar memorización de configuraciones

3. **Accesibilidad**
   - Proporcionar textos alternativos
   - Mantener ratios de contraste adecuados
   - Implementar controles de movimiento reducido

4. **Mantenibilidad**
   - Seguir el patrón de componentes establecido
   - Documentar configuraciones personalizadas
   - Mantener las capas modulares

## Solución de Problemas

### Problemas Comunes

1. **Capas no visibles**
   - Verificar que la capa está habilitada
   - Comprobar el orden de las capas
   - Validar la configuración

2. **Rendimiento Lento**
   - Reducir el número de capas activas
   - Implementar lazy loading
   - Usar la opción `optimizeRendering`

3. **Efectos no Funcionan**
   - Verificar soporte del navegador
   - Comprobar conflictos de CSS
   - Validar configuración de efectos

## Recursos Adicionales

1. **Documentación API Completa**
   - [Referencia de Props](/docs/api-reference.md)
   - [Guía de Capas](/docs/layers-guide.md)
   - [Sistema de Plugins](/docs/plugin-system.md)

2. **Ejemplos y Templates**
   - [Galería de Ejemplos](/examples)
   - [Templates Predefinidos](/templates)
   - [Playground](/playground)

3. **Recursos de Desarrollo**
   - [Guía de Contribución](/CONTRIBUTING.md)
   - [Changelog](/CHANGELOG.md)
   - [Roadmap](/ROADMAP.md)
