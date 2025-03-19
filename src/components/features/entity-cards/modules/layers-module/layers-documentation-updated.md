# Guía para Implementar y Utilizar el Sistema de Capas

## Introducción

Este documento explica cómo funciona el sistema de capas integrado en las tarjetas de entidad, y cómo crear e implementar nuevas capas. El sistema ha sido optimizado para mejorar el rendimiento y facilitar la integración con los componentes existentes.

## Arquitectura del Sistema

El sistema de capas se divide en dos partes principales:

1. **Implementaciones individuales** (`/layers/`): Contiene las implementaciones específicas de cada capa
2. **Sistema core** (`/modules/layers/`): Gestiona el estado, registro y renderizado de las capas

### Componentes principales

- `LayersProvider`: Proveedor de contexto que gestiona el estado global de las capas
- `useLayers`: Hook para acceder al sistema de capas y sus funcionalidades
- `RegisterLayersV2`: Componente que registra todas las capas disponibles
- `EntityCardLayersIntegration`: Componente de alto nivel para integrar el sistema de capas en tarjetas

## Implementación de una nueva capa

### 1. Estructura de archivos

Para implementar una nueva capa, se recomienda seguir esta estructura:

```
src/components/features/entity-cards/layers/mi-capa/
  ├── index.ts                     # Exporta la implementación como capa
  ├── mi-capa-effect-layer.tsx     # Componente visual de la capa
  ├── mi-capa-settings.tsx         # Componente para configurar la capa
  ├── actions/                     # Funciones del servidor (opcional)
  │   ├── index.ts
  │   └── mi-capa-config.action.ts
```

### 2. Implementación de la interfaz `LayerImplementation`

Cada capa debe implementar la interfaz `LayerImplementation`:

```typescript
// index.ts
'use client';

import { MiIcono } from 'lucide-react';
import type { LayerImplementation } from '../../layers/types';
import { MiCapaEffectLayer } from './mi-capa-effect-layer';
import { MiCapaSettings } from './mi-capa-settings';

// Configuración por defecto
const defaultConfig = {
    enabled: true,
    layerIndex: 5,
    // Propiedades específicas
    miPropiedad: 'valor',
};

// Implementación de la capa
export const miCapaLayerImplementation: LayerImplementation = {
    // Identificador único
    type: 'mi-capa',

    // Metadatos para la UI
    name: 'Mi Capa',
    description: 'Descripción de lo que hace esta capa',
    category: 'effects', // Categoría: 'effects', 'structure', 'content'
    icon: <MiIcono size={16} />,

    // Configuración por defecto
    defaultConfig,

    // Tipos de entidad compatibles
    compatibleEntityTypes: ['image', 'album', 'folder'],

    // Función de renderizado
    render: ({ config, isHovered, mousePosition, isActive, isExploded, entityType }) => {
        return (
            <MiCapaEffectLayer
                config={config}
                isHovered={isHovered}
                isExploded={isExploded}
                mousePosition={mousePosition}
                activeLayer={isActive ? 'mi-capa' : null}
            />
        );
    },

    // Componente de configuración
    Settings: ({ config, onChange, entityType, entityId }) => {
        return (
            <MiCapaSettings
                config={config}
                onChange={onChange}
                entityType={entityType}
                entityId={entityId}
            />
        );
    }
};

// Exportar acciones del servidor si son necesarias
export const miCapaServerActions = {
    // Funciones para obtener/actualizar configuración
};
```

### 3. Implementación del componente visual

El componente que renderiza la capa debe aceptar las propiedades necesarias:

```typescript
// mi-capa-effect-layer.tsx
'use client';

import { cn } from '@/lib/utils';
import React from 'react';
import type { LayerComponentProps } from '../types';

// Interfaz para la configuración específica
interface MiCapaConfig {
    enabled: boolean;
    layerIndex: number;
    miPropiedad: string;
    // Otras propiedades específicas
}

export function MiCapaEffectLayer({
    isExploded,
    isHovered,
    mousePosition,
    activeLayer,
    getExplodeLayerTransform,
    config,
}: LayerComponentProps<MiCapaConfig>) {
    // Lógica del componente

    return (
        <div
            className={cn(
                'absolute inset-0',
                isExploded ? 'exploded-layer layer-mi-capa' : ''
            )}
            style={{
                // Estilos específicos de la capa
                ...(isExploded ? getExplodeLayerTransform(config.layerIndex) : {})
            }}
            data-layer-active={activeLayer === 'mi-capa' || null}
        >
            {/* Contenido de la capa */}
        </div>
    );
}
```

### 4. Registrar la capa en el sistema

Una vez implementada, registra la capa en el componente `RegisterLayersV2`:

```typescript
import { miCapaLayerImplementation } from './mi-capa';

// Dentro del efecto useEffect en RegisterLayersV2
registerLayer(miCapaLayerImplementation);

// Añadir también al mapa de tipos de entidad
const entityTypeToLayers = {
    image: [
        // Otras capas
        miCapaLayerImplementation,
    ],
    // Otros tipos
};
```

## Utilización del sistema

### Integración básica en tarjetas de entidad

Para integrar el sistema de capas en un componente de tarjeta:

```tsx
import { EntityCardLayersIntegration } from '../modules/layers/entity-card-layers-integration';

function MyEntityCard({ entityType, entityId, cardOptions }) {
    return (
        <EntityCardLayersIntegration
            entityType={entityType}
            entityId={entityId}
            cardOptions={cardOptions}
            isHovered={isHovered}
            isActive={isActive}
            isExploded={isExploded}
            mousePosition={mousePosition}
        >
            {/* Contenido base de la tarjeta */}
            <BaseCardContent />
        </EntityCardLayersIntegration>
    );
}
```

### Acceso directo al sistema de capas

Para acceder al sistema de capas desde cualquier parte de la aplicación:

```tsx
import { useLayers } from '../modules/layers/use-layers';

function MiComponente() {
    const {
        config,
        updateConfig,
        toggleLayerEnabled,
        updateLayerConfig,
        updateLayerOrder,
        resetToDefaults,
        registerLayer
    } = useLayers();

    // Usar las funciones del sistema de capas

    return (
        // ...
    );
}
```

## Optimizaciones de rendimiento

El sistema incluye varias optimizaciones para mejorar el rendimiento:

1. **Memoización de componentes**: Uso de `React.memo` para evitar re-renders innecesarios
2. **useMemo para cálculos costosos**: Las capas a renderizar se calculan con `useMemo`
3. **useCallback para funciones**: Las funciones de renderizado utilizan `useCallback`
4. **Comparación de props personalizada**: Función `arePropsEqual` para el renderizador de capas
5. **Renderizado condicional**: Las capas deshabilitadas no se renderizan

## Ejemplos de implementación

Para ver ejemplos completos, consulta las siguientes implementaciones:

- **Borde**: `src/components/features/entity-cards/layers/border`
- **Brillo**: `src/components/features/entity-cards/layers/glow`
- **Textura**: `src/components/features/entity-cards/layers/textures`
- **Scanlines**: `src/components/features/entity-cards/layers/scanlines`

## Depuración del sistema

Para depurar el sistema de capas, puedes usar estas técnicas:

1. **Modo explosionado**: Activa `isExploded` para ver las capas separadas espacialmente
2. **Consola de desarrollo**: El sistema registra información útil en la consola
3. **Herramientas React**: Usa React DevTools para inspeccionar el estado del sistema

## Mejores prácticas

1. **Renderizado eficiente**: Minimiza las operaciones costosas en el renderizado
2. **Tipado fuerte**: Define interfaces específicas para tus configuraciones
3. **Memoización**: Usa memo, useMemo y useCallback donde sea apropiado
4. **Accesibilidad**: Asegúrate de que tus capas sean accesibles
5. **Animaciones fluidas**: Utiliza propiedades CSS optimizadas para animaciones (transform, opacity)
6. **Lazy loading**: Considera cargar recursos pesados de forma diferida
7. **Documentación**: Documenta tus capas con comentarios descriptivos