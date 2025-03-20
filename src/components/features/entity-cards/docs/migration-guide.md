# Guía de Migración a Entity Cards v2.0

## Resumen de Cambios

La versión 2.0 introduce cambios significativos en la arquitectura del sistema de capas y la gestión de efectos visuales. Esta guía te ayudará a migrar desde la versión 1.x a la 2.0.

## Cambios Principales

### 1. Sistema de Plugins de Capas

#### Antes (v1.x)
```typescript
// Definición de capa antigua
const MyLayer: LayerComponent = {
  name: 'myLayer',
  render: ({ config }) => {
    return <div className="my-layer" />;
  }
};

// Registro de capa
layers.register('myLayer', MyLayer);
```

#### Ahora (v2.0)
```typescript
// Definición de capa nueva
const MyLayer: LayerPlugin<MyLayerConfig> = {
  type: 'my-layer',
  Component: MyLayerComponent,
  SettingsComponent: MyLayerSettings,
  defaultConfig: {
    enabled: true,
    layerIndex: 5
  },
  getServerActions: () => ({
    getConfig: getMyLayerConfig,
    updateConfig: updateMyLayerConfig,
    deleteConfig: deleteMyLayerConfig
  })
};

// Registro de capa
registerLayer(MyLayer);
```

### 2. Configuración de Capas

#### Antes (v1.x)
```typescript
<EntityCard
  options={{
    layers: {
      glow: {
        enabled: true,
        intensity: 0.5
      }
    }
  }}
/>
```

#### Ahora (v2.0)
```typescript
<EntityCard
  layers={{
    glow: {
      enabled: true,
      intensity: 0.5
    }
  }}
  options={{
    renderQuality: 'high',
    interactive: true
  }}
/>
```

### 3. Sistema de Presets

#### Antes (v1.x)
```typescript
<EntityCard
  preset="legendary"
  options={{
    ...customOptions
  }}
/>
```

#### Ahora (v2.0)
```typescript
const { preset } = useCardPreset('legendary');

<EntityCard
  layers={preset.layers}
  options={{
    ...customOptions
  }}
/>
```

## Pasos de Migración

### 1. Actualizar Dependencias

```bash
pnpm update @components/entity-cards@2.0.0
```

### 2. Envolver la Aplicación con el Proveedor

```typescript
// En tu _app.tsx o layout.tsx
import { EntityCardProvider } from '@/components/features/entity-cards';
import { RegisterLayers } from '@/components/features/entity-cards/layers';

export default function App({ Component, pageProps }) {
  return (
    <EntityCardProvider>
      <RegisterLayers />
      <Component {...pageProps} />
    </EntityCardProvider>
  );
}
```

### 3. Migrar Capas Personalizadas

1. Crear nueva estructura de archivos:
```
my-layer/
├── actions/
│   ├── my-layer-config.action.ts
│   └── index.ts
├── my-layer-effect.tsx
├── my-layer-settings.tsx
└── index.ts
```

2. Implementar acciones del servidor:
```typescript
// actions/my-layer-config.action.ts
'use server';

export interface MyLayerConfig extends BaseLayerConfig {
  intensity: number;
  color: string;
}

export async function getMyLayerConfig(entityType: string, entityId?: string) {
  // Implementar
}

export async function updateMyLayerConfig(
  entityType: string,
  config: MyLayerConfig,
  entityId?: string
) {
  // Implementar
}

export async function deleteMyLayerConfig(entityType: string, entityId?: string) {
  // Implementar
}
```

3. Implementar componente de capa:
```typescript
// my-layer-effect.tsx
'use client';

export function MyLayerEffect({
  config,
  isExploded,
  getExplodeLayerTransform
}: LayerComponentProps<MyLayerConfig>) {
  return (
    <div
      className={cn(
        'absolute inset-0',
        isExploded && 'exploded-layer'
      )}
      style={{
        ...(isExploded ? getExplodeLayerTransform(config.layerIndex) : {})
      }}
    />
  );
}
```

4. Implementar componente de configuración:
```typescript
// my-layer-settings.tsx
'use client';

export function MyLayerSettings({
  config,
  onConfigUpdate
}: LayerSettingsProps<MyLayerConfig>) {
  return (
    <div className="layer-settings">
      {/* Implementar UI de configuración */}
    </div>
  );
}
```

5. Exportar plugin:
```typescript
// index.ts
import type { LayerPlugin } from '../layer-plugin-system';
import { MyLayerEffect } from './my-layer-effect';
import { MyLayerSettings } from './my-layer-settings';
import {
  getMyLayerConfig,
  updateMyLayerConfig,
  deleteMyLayerConfig
} from './actions';

export const myLayerPlugin: LayerPlugin<MyLayerConfig> = {
  type: 'my-layer',
  Component: MyLayerEffect,
  SettingsComponent: MyLayerSettings,
  defaultConfig: {
    enabled: true,
    layerIndex: 5,
    intensity: 0.5,
    color: '#000000'
  },
  getServerActions: () => ({
    getConfig: getMyLayerConfig,
    updateConfig: updateMyLayerConfig,
    deleteConfig: deleteMyLayerConfig
  })
};
```

### 4. Actualizar Uso de Componentes

#### Componentes Existentes

```typescript
// Antes
<EntityCard
  entityType="folder"
  options={{
    layers: {
      glow: { enabled: true },
      border: { enabled: true }
    }
  }}
/>

// Después
<EntityCard
  entityType="folder"
  layers={{
    glow: { enabled: true },
    border: { enabled: true }
  }}
/>
```

#### Hooks Actualizados

```typescript
// Antes
const { cardConfig } = useCardConfig(entityType);

// Después
const { config, updateConfig } = useLayerConfig('holographic');
```

### 5. Migrar Presets

```typescript
// Antes
const preset = {
  name: 'legendary',
  config: {
    // ...
  }
};

// Después
const preset: LayerPreset = {
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
    }
  }
};
```

## Breaking Changes

1. **Nombres de Propiedades**
   - `options.layers` → `layers`
   - `options.displayMode` → `options.renderMode`
   - `options.performanceMode` → `options.renderQuality`

2. **Tipos**
   - `LayerComponent` → `LayerPlugin<T>`
   - `LayerConfig` → `BaseLayerConfig`
   - `CardOptions` → `EntityCardOptions`

3. **Hooks**
   - `useCardConfig` → `useLayerConfig`
   - `usePreset` → `useCardPreset`
   - `useLayers` → `useLayerPlugin`

4. **Métodos**
   - `layers.register()` → `registerLayer()`
   - `layers.get()` → `useLayerPlugin().getLayer()`
   - `layers.update()` → `useLayerPlugin().updateLayer()`

## Verificación de Migración

Lista de verificación para asegurar una migración exitosa:

1. [ ] Actualizar todas las dependencias
2. [ ] Implementar EntityCardProvider
3. [ ] Registrar capas con el nuevo sistema
4. [ ] Actualizar configuraciones de capas
5. [ ] Migrar presets al nuevo formato
6. [ ] Actualizar hooks y métodos
7. [ ] Verificar tipos TypeScript
8. [ ] Probar renderizado de capas
9. [ ] Verificar funcionamiento de efectos
10. [ ] Validar rendimiento

## Solución de Problemas

### Capas no Visibles
```typescript
// Verificar registro
console.log(useLayerPlugin().getRegisteredLayers());

// Verificar configuración
console.log(useLayerConfig('myLayer').config);
```

### Errores de Tipos
```typescript
// Asegurar que las configuraciones extienden BaseLayerConfig
interface MyConfig extends BaseLayerConfig {
  // Propiedades específicas
}

// Usar tipos genéricos correctamente
const MyLayer: LayerPlugin<MyConfig> = {
  // ...
};
```

### Problemas de Rendimiento
```typescript
// Usar modo de desarrollo
<EntityCard
  debug={true}
  onLayerRender={(layer, time) => {
    console.log(`${layer}: ${time}ms`);
  }}
/>
```

## Recursos Adicionales

1. [Documentación API v2.0](/docs/api-reference.md)
2. [Guía de Capas](/docs/layers-guide.md)
3. [Ejemplos Actualizados](/examples)
4. [TypeScript Tipos](/types)

## Soporte

Si encuentras problemas durante la migración:

1. Revisa la [documentación completa](/docs)
2. Consulta los [ejemplos](/examples)
3. Abre un issue en el repositorio
4. Contacta al equipo de desarrollo