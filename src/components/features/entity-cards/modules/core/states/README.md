# Módulo de Estados para Entity Cards

Este módulo proporciona un sistema de estados completo para gestionar las interacciones y estados visuales de las tarjetas de entidad.

## Características

- **Gestión de estados interactivos**: Hover, Focus, Active, Selected, Disabled
- **Configuración visual detallada**: Escala, rotación, elevación, brillo y más
- **API sencilla**: Fácil de integrar con cualquier componente de tarjeta
- **Hook personalizado**: Para gestionar estados de forma programática
- **Generación de clases CSS**: Para aplicar estilos basados en estados

## Componentes Principales

### `StatesModule`

El componente principal que encapsula toda la funcionalidad del módulo de estados.

```tsx
import { StatesModule } from '@/components/features/entity-cards/modules/core/states';

function MyComponent() {
  return (
    <StatesModule
      initialStatesSystem={{
        hover: {
          scale: 1.03,
          rotate: true,
          lift: true
        },
        // Otros estados...
      }}
      onChange={(statesSystem) => {
        // Guardar configuración actualizada
      }}
    />
  );
}
```

### `StatesPanel`

Panel de configuración UI para ajustar los estados interactivos.

```tsx
import { StatesPanel } from '@/components/features/entity-cards/modules/core/states';
import { useState } from 'react';

function ConfigPanel() {
  const [statesConfig, setStatesConfig] = useState(/* config inicial */);

  return (
    <StatesPanel
      statesSystem={statesConfig}
      onChange={setStatesConfig}
    />
  );
}
```

## Hook: useStatesSystem

Hook para gestionar el estado de interacción en componentes.

```tsx
import { useStatesSystem } from '@/components/features/entity-cards/modules/core/states';

function InteractiveCard() {
  const {
    statesSystem,
    updateState,
    toggleState,
    resetState,
    generateStateClasses
  } = useStatesSystem();

  return (
    <div className={generateStateClasses('hover')}>
      {/* Contenido de la tarjeta */}
    </div>
  );
}
```

## Tipos

El módulo exporta varios tipos útiles:

- `StatesSystem`: La configuración completa del sistema de estados
- `HoverState`, `FocusState`, etc.: Configuraciones para cada tipo de estado
- `StatesModuleProps`: Props para el módulo principal
- `UseStatesSystemProps`: Props para el hook

## Integración con Entity Cards

Para integrar los estados en las tarjetas de entidad:

1. Añadir la configuración de estados al modelo `CardOptions` o `CoreConfig`
2. Aplicar las clases generadas por `generateStateClasses()` al componente de tarjeta
3. Utilizar el hook `useStatesSystem` para gestionar el estado de interacción

## Estados Disponibles

- **Hover**: Aplicado cuando el usuario pasa el cursor sobre la tarjeta
- **Focus**: Aplicado cuando la tarjeta tiene el foco del teclado
- **Active**: Aplicado cuando la tarjeta está siendo clickeada
- **Selected**: Aplicado cuando la tarjeta está seleccionada
- **Disabled**: Aplicado cuando la tarjeta está deshabilitada

Cada estado puede configurar propiedades como escala, rotación, elevación, brillo y más.