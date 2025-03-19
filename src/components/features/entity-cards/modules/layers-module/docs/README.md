# 🌈 Sistema de Capas para Entity Cards

Este módulo proporciona un sistema completo para gestionar y configurar las capas visuales que componen las tarjetas de entidades.

## Descripción General

El sistema de capas permite la creación de tarjetas de entidad altamente personalizables mediante la superposición de diferentes componentes visuales. Cada capa puede tener su propia configuración, orden y comportamiento.

## Estructura del Sistema

El sistema está organizado en dos partes principales:

1. **Implementaciones de capas** (`/src/components/features/entity-cards/layers/`)
   - Contiene las implementaciones individuales de cada tipo de capa
   - Cada capa implementa la interfaz `LayerImplementation`
   - Ejemplos: border, glow, holographic, etc.

2. **Sistema core de capas** (`/src/components/features/entity-cards/modules/layers/`)
   - Gestiona la configuración y renderizado de las capas
   - Proporciona componentes de UI para administrar las capas
   - Maneja la conversión entre diferentes formatos de configuración

## Componentes Principales

### LayersModule

El punto de entrada principal para integrar el sistema de capas en una aplicación. Proporciona una interfaz completa para gestionar todas las configuraciones.

```tsx
<LayersModule
  initialConfig={configInicial}
  onChange={handleConfigChange}
  cardOptions={opcionesTarjeta}
  onCardOptionsChange={handleCardOptionsChange}
/>
```

### LayersPanel

Panel de control para gestionar capas individuales, su visibilidad, orden y configuración.

```tsx
<LayersPanel
  config={configuracionCapas}
  onChange={handleConfigChange}
  cardOptions={opcionesTarjeta}
  onCardOptionsChange={handleCardOptionsChange}
/>
```

### LayerManagementDialog

Diálogo modal para gestionar las capas, incluyendo presets y configuración avanzada.

```tsx
<LayerManagementDialog
  entityType="album"
  config={configuracionCapas}
  onChange={handleConfigChange}
  trigger={<Button>Gestionar Capas</Button>}
/>
```

### EntityCardLayerIntegration

Componente que integra el sistema de capas con las tarjetas de entidad.

```tsx
<EntityCardLayerIntegration
  entityType="album"
  cardOptions={opcionesTarjeta}
  onCardOptionsChange={handleCardOptionsChange}
>
  {/* Contenido de la tarjeta */}
</EntityCardLayerIntegration>
```

## Tipos de Datos

### EntityCardLayerSystemConfig

Configuración principal para el sistema de capas en EntityCard:

```typescript
interface EntityCardLayerSystemConfig {
  layerSystem: LayerSystemConfig; // Configuración general del sistema
  layerConfigs: Record<string, LayerConfig>; // Configuraciones individuales
  layers?: Record<string, LayerImplementation>; // Capas registradas (opcional)
  globalOpacity?: number; // Opacidad global
}
```

### LayersModuleConfig

Configuración para el módulo de capas:

```typescript
interface LayersModuleConfig {
  layerSystem: LayerSystemConfig & {
    layerSpacing?: number;
  };
  layerConfigs: Record<string, LayerConfig>;
  layers: Record<string, LayerImplementation>;
}
```

## Implementando una Nueva Capa

Para crear una nueva capa:

1. Crear una carpeta en `/src/components/features/entity-cards/layers/mi-capa/`
2. Implementar un componente para renderizar la capa
3. Implementar un componente para configurar la capa (opcional)
4. Definir la implementación de la capa utilizando la interfaz `LayerImplementation`
5. Exportar la implementación de la capa
6. Registrar la capa en el sistema

Ejemplo de implementación de capa:

```typescript
// MiCapa/index.ts
import { LayerImplementation } from '../types';

export const miCapa: LayerImplementation = {
  type: 'mi-capa',
  name: 'Mi Capa',
  description: 'Descripción de mi capa',
  category: 'effects',
  defaultConfig: {
    enabled: true,
    layerIndex: 10,
    // Otras propiedades específicas
  },
  render: (props) => {
    // Renderizar la capa
    return <MiComponente {...props} />;
  },
  Settings: (props) => {
    // Componente para configurar la capa (opcional)
    return <MiConfiguracion {...props} />;
  }
};
```

## Adaptadores de Configuración

El sistema proporciona adaptadores para convertir entre diferentes formatos de configuración:

- `adaptEntityCardToLayerSystem`: Convierte de CardOptions a EntityCardLayerSystemConfig
- `adaptLayerSystemToEntityCard`: Convierte de EntityCardLayerSystemConfig a CardOptions
- `adaptCardOptionsToLayersConfig`: Convierte de CardOptions a LayersModuleConfig
- `adaptEntityCardConfigToLayersModuleConfig`: Convierte de EntityCardLayerSystemConfig a LayersModuleConfig

## Integración con Entity Cards Settings

El sistema de capas se integra con el panel de configuración global de tarjetas de entidad en `entities-cards-settings.tsx`, permitiendo gestionar las capas como parte de la configuración global de las tarjetas.

## Notas sobre Rendimiento

- Se ha optimizado el rendimiento mediante el uso de memoización (useMemo, useCallback, memo)
- Se evita el re-renderizado innecesario de componentes
- Se optimiza la conversión entre diferentes formatos de configuración

## Ejemplo de Uso Completo

```tsx
import { LayersModule } from '@/components/features/entity-cards/modules/layers';
import { DEFAULT_LAYERS_CONFIG } from '@/components/features/entity-cards/modules/layers/types';

function MiComponente() {
  const [config, setConfig] = useState(DEFAULT_LAYERS_CONFIG);
  const [cardOptions, setCardOptions] = useState({});

  return (
    <LayersModule
      initialConfig={config}
      onChange={setConfig}
      cardOptions={cardOptions}
      onCardOptionsChange={setCardOptions}
    />
  );
}
```