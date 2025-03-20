# Módulo Design

Este módulo gestiona el sistema de diseño y apariencia visual de las tarjetas de entidad.

## Estructura

```typescript
design/
├── adapters.ts          # Adaptadores para diferentes tipos de entidades
├── design-adapter.ts    # Adaptador principal del sistema de diseño
├── design-module.tsx    # Componente principal del módulo
├── design-panel.tsx     # Panel de configuración de diseño
├── design-presets.tsx   # Gestión de presets de diseño
├── design-preview.tsx   # Vista previa de diseños
├── index.ts            # Punto de entrada del módulo
├── presets.ts          # Definición de presets
├── types.ts            # Tipos y interfaces
└── use-design-system.ts # Hook para el sistema de diseño
```

## Componentes Principales

### DesignPanel

Panel de configuración que permite personalizar todos los aspectos visuales de las tarjetas.

### DesignPreview

Componente de vista previa que muestra los cambios en tiempo real.

### DesignSystem

Sistema central que gestiona la apariencia visual y los estilos de las tarjetas.

## Tipos de Datos

Los tipos principales se encuentran en `types.ts` e incluyen:

- DesignSystemConfig
- DesignPreset
- DesignOptions

## Adaptadores

El sistema utiliza adaptadores para convertir la configuración de diseño en estilos CSS y props de componentes.

## Presets

El módulo incluye un sistema de presets que permite:

- Guardar configuraciones predefinidas
- Cargar estilos predeterminados
- Compartir configuraciones entre tarjetas

## Uso

```typescript
import { useDesignSystem } from './use-design-system';
import { DesignPanel } from './design-panel';

// Usar el hook para acceder al sistema de diseño
const { config, updateConfig } = useDesignSystem();

// Renderizar el panel de configuración
<DesignPanel config={config} onUpdate={updateConfig} />
```

## Integración con otros Módulos

El módulo design se integra principalmente con:

- Módulo Core: Para la configuración base
- Módulo Effects: Para efectos visuales
- Módulo Colors: Para la gestión de colores
