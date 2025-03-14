# Módulo de Capas

Este módulo proporciona un sistema completo para gestionar capas visuales en las tarjetas de entidad, ofreciendo una arquitectura flexible y extensible.

## Características

- **Sistema de Capas**: Gestión centralizada de capas visuales para tarjetas.
- **Capas Configurables**: Cada capa puede ser habilitada/deshabilitada y configurada individualmente.
- **API Extensible**: Interfaz para registrar nuevas capas personalizadas.
- **Orden Configurable**: Control sobre el orden de renderizado de las capas.
- **Previsualización Integrada**: Visualización en tiempo real de los cambios en las capas.

## Componentes

- `LayersPanel`: Componente principal para configurar todo el sistema de capas y capas individuales.
- `useLayersSystem`: Hook para la gestión programática de capas.

## Integración con Sistema de Plugins

El módulo de capas se integra con el sistema de plugins de capas, permitiendo:

- Registro de nuevas capas mediante plugins.
- Descubrimiento dinámico de capas disponibles.
- Configuración específica para cada tipo de capa.

## Ejemplo de Uso

```tsx
import { LayersPanel } from '@/components/features/entity-cards/modules/layers';

function CardEditor() {
  const [cardOptions, setCardOptions] = useState<CardOptions>({});

  return (
    <LayersPanel
      options={cardOptions}
      onChange={setCardOptions}
      entityType="card"
      entityId="123"
    />
  );
}
```

## Estructura del Sistema de Capas

Cada capa tiene:

- Un tipo único
- Una configuración específica
- Un índice que determina su orden de renderizado
- Estado de habilitación/deshabilitación

## Configuración Global

El sistema de capas también permite configuración global:

- Estrategia de renderizado (apilada, compuesta, dinámica)
- Modo de composición (normal, superpuesto, pantalla, multiplicar)
- Opciones personalizadas adicionales

## Extensibilidad

Para añadir nuevas capas, se deben registrar mediante el sistema de plugins:

```typescript
import { registerLayerPlugin } from '@/components/features/entity-cards/layers/layer-plugin-system';

registerLayerPlugin({
  type: 'miCapa',
  defaultConfig: {
    enabled: true,
    layerIndex: 10,
    // Propiedades específicas de la capa
  },
  // Otros métodos y propiedades...
});
```