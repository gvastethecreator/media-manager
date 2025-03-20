# Guía para Implementar Capas en el Sistema de Entity Cards

## Introducción

Este documento explica cómo implementar nuevas capas visuales para las tarjetas de entidad siguiendo la nueva interfaz `LayerImplementation`. La arquitectura del sistema se divide en dos partes principales:

1. **Implementaciones individuales** (/layers/): Contiene las implementaciones específicas de cada capa
2. **Sistema core** (/modules/layers/): Gestiona el estado, registro y adaptadores de las capas

## Estructura de tipos

La interfaz principal para implementar una capa es `LayerImplementation`, definida en `src/components/features/entity-cards/layers/types.ts`:

```typescript
export interface LayerImplementation {
    /**
     * Identificador único de la capa
     */
    type: string;

    /**
     * Nombre amigable para mostrar en la UI
     */
    name: string;

    /**
     * Descripción de la funcionalidad de la capa
     */
    description?: string;

    /**
     * Categoría a la que pertenece la capa
     */
    category?: string;

    /**
     * Configuración por defecto para la capa
     */
    defaultConfig?: LayerConfig;

    /**
     * Icono para representar la capa en la UI
     */
    icon?: React.ReactNode;

    /**
     * Tipos de entidad compatibles con esta capa
     */
    compatibleEntityTypes?: string[];

    /**
     * Función para renderizar la capa
     */
    render: (props: LayerRenderProps) => React.ReactNode;

    /**
     * Componente para configurar la capa (opcional)
     */
    Settings?: React.ComponentType<LayerSettingsProps>;
}
```

## Creando una nueva capa

### 1. Estructura de archivos

Para una nueva capa, sigue esta estructura:

```
src/components/features/entity-cards/layers/mi-capa/
  ├── index.ts                     # Punto de entrada (para compatibilidad)
  ├── mi-capa-implementation.ts    # Implementación de la capa con LayerImplementation
  ├── mi-capa-layer.tsx            # Componente de renderizado
  ├── mi-capa-settings.tsx         # Componente de configuración (opcional)
  └── actions.ts                   # Acciones de servidor (opcional)
```

### 2. Implementación de la capa

Ejemplo de implementación siguiendo la interfaz `LayerImplementation`:

```typescript
// mi-capa-implementation.ts
'use client';

import { MiIcono } from 'lucide-react';
import { MiCapaLayer } from './mi-capa-layer';
import { MiCapaSettings } from './mi-capa-settings';
import { deleteConfig, getConfig, updateConfig } from './actions';
import type { LayerImplementation } from '../../layers/types';

const defaultConfig = {
    enabled: true,
    layerIndex: 5,
    // Propiedades específicas de la capa
    miPropiedad1: 'valor1',
    miPropiedad2: 50,
};

export const miCapaImplementation: LayerImplementation = {
    type: 'mi-capa',
    name: 'Mi Capa',
    description: 'Descripción de lo que hace esta capa',
    category: 'effects', // O 'structure', 'content', etc.
    defaultConfig,
    icon: <MiIcono size={16} />,
    compatibleEntityTypes: ['image', 'album'],

    render: ({ config, isHovered, mousePosition, isActive, isExploded, entityType }) => {
        return (
            <MiCapaLayer
                config={config}
                isHovered={isHovered}
                isExploded={isExploded}
                isActive={isActive}
                mousePosition={mousePosition}
                entityType={entityType}
            />
        );
    },

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

// Exportar acciones de servidor si son necesarias
export const serverActions = {
    getConfig,
    updateConfig,
    deleteConfig
};
```

### 3. Registrar la capa en el sistema

Una vez implementada, hay que registrar la capa en `src/components/features/entity-cards/modules/layers/register-layers.tsx`:

```typescript
// 1. Importar la implementación
import { miCapaImplementation } from '../../layers/mi-capa/mi-capa-implementation';

// 2. Añadir a los mapeos de tipos de entidad
const ENTITY_TYPE_LAYERS: LayerMapping = {
  'image': [
    // Otras capas...
    miCapaImplementation
  ],
  // Otros tipos...
};
```

## Componentes importantes

### LayerRenderProps

Propiedades que recibe la función `render`:

```typescript
interface LayerRenderProps {
    config: LayerConfig;           // Configuración actual
    isHovered?: boolean;           // Si el mouse está sobre la tarjeta
    mousePosition?: { x: number; y: number }; // Posición relativa del mouse
    isActive?: boolean;            // Si la capa está seleccionada
    isExploded?: boolean;          // Si la vista está en modo explotado
    entityType: string;            // Tipo de entidad
    entityId?: string;             // ID de la entidad (opcional)
    context?: any;                 // Contexto adicional
}
```

### LayerSettingsProps

Propiedades que recibe el componente `Settings`:

```typescript
interface LayerSettingsProps {
    config: LayerConfig;           // Configuración actual
    onChange: (config: Partial<LayerConfig>) => void; // Para actualizar config
    entityType: string;            // Tipo de entidad
    entityId?: string;             // ID de la entidad (opcional)
}
```

## Mejores prácticas

1. **Rendimiento**: Usa `React.memo` y hooks de memorización donde sea apropiado
2. **Tipado**: Define interfaces para tus configuraciones específicas
3. **Errores**: Maneja posibles errores de renderizado y estados no válidos
4. **Composición**: Separa la lógica de renderizado de la gestión de estado
5. **Estilo**: Usa Tailwind CSS para estilizar los componentes
6. **Accesibilidad**: Asegúrate de que tus componentes sean accesibles

## Ejemplos completos

Para ver implementaciones completas, revisa:
- `src/components/features/entity-cards/layers/border/border-layer-implementation.ts`
- `src/components/features/entity-cards/layers/glow/glow-layer-implementation.ts`