# Módulo de Interacciones

Este módulo proporciona un sistema completo para gestionar las interacciones de los usuarios con las entity cards, incluyendo clics, hover, interacciones táctiles, arrastre, selección y más.

## Características

- **Interacciones Completas**: Soporte para interacciones de mouse, táctil y teclado.
- **Configuración Personalizada**: Panel de configuración detallado con opciones para cada tipo de interacción.
- **Experiencia Adaptativa**: Comportamientos específicos para dispositivos de escritorio y móviles.
- **Capacidades Avanzadas**: Soporte para arrastre, selección, ordenación y navegación por teclado.
- **Hook Personalizado**: API sencilla para gestionar interacciones programáticamente.
- **Accesibilidad**: Opciones específicas para mejorar la accesibilidad.

## Componentes Principales

### InteractionModule

Componente principal que proporciona una interfaz para configurar todas las opciones de interacción disponibles.

```tsx
import { InteractionModule } from '../modules/core/interactions';

function MyComponent() {
  const handleChange = (options) => {
    console.log('Opciones actualizadas:', options);
  };

  return (
    <InteractionModule
      initialOptions={{
        clickEnabled: true,
        clickAction: 'select'
      }}
      onChange={handleChange}
      disabled={false}
    />
  );
}
```

## Hook: useInteractions

Un hook personalizado para gestionar interacciones dentro de componentes.

```tsx
import { useInteractions } from '../modules/core/interactions';

function MyComponent() {
  const {
    options,
    updateOption,
    updateOptions,
    resetOptions,
    isEnabled,
    isHoverEnabled,
    isClickEnabled,
    isTouchEnabled,
    isDraggable,
    isSelectable,
    getClickAction,
    getHoverAction,
    getTouchBehavior
  } = useInteractions({
    initialOptions: {
      enabled: true,
      clickEnabled: true,
      clickAction: 'select'
    }
  });

  // Verificar si las interacciones están habilitadas
  const handleClick = (e) => {
    if (isClickEnabled()) {
      const action = getClickAction();
      switch (action) {
        case 'select':
          console.log('Tarjeta seleccionada');
          break;
        case 'expand':
          console.log('Tarjeta expandida');
          break;
        // Otros casos...
      }
    }
  };

  return (
    <div
      onClick={handleClick}
      draggable={isDraggable()}
      aria-disabled={!isEnabled()}
    >
      Contenido de la tarjeta
    </div>
  );
}
```

## Tipos Exportados

- `InteractionOptions`: Define las opciones disponibles para interacciones.
- `InteractionModuleProps`: Define las propiedades del componente InteractionModule.
- `UseInteractionsProps`: Define las propiedades para el hook useInteractions.
- `UseInteractionsResult`: Define el resultado del hook useInteractions.

## Opciones Disponibles

### Opciones Generales
- `enabled`: Activa/desactiva todas las interacciones.
- `draggable`: Permite arrastrar la tarjeta.
- `selectable`: Permite seleccionar la tarjeta.
- `sortable`: Permite reordenar la tarjeta.

### Opciones de Mouse
- `clickEnabled`: Activa/desactiva interacciones de clic.
- `clickAction`: Acción a realizar al hacer clic (none, flip, expand, select, navigate, custom).
- `doubleClickAction`: Acción a realizar al hacer doble clic.
- `hoverEnabled`: Activa/desactiva interacciones de hover.
- `hoverAction`: Acción a realizar al pasar el mouse (none, preview, highlight, showInfo, custom).
- `hoverEffects`: Activa/desactiva efectos visuales al pasar el mouse.

### Opciones Táctiles
- `touchEnabled`: Activa/desactiva interacciones táctiles.
- `touchBehavior`: Comportamiento táctil principal (tap, doubleTap, longPress, swipe).
- `tapAction`: Acción a realizar al tocar la tarjeta.

### Accesibilidad
- `accessibilityEnabled`: Activa/desactiva funciones adicionales de accesibilidad.
- `keyboardNavigable`: Permite navegar con teclado.
- `ariaLabels`: Activa/desactiva etiquetas ARIA para lectores de pantalla.

## Integración con Entity Cards

Para integrar interacciones en tus entity cards:

1. **Importa el hook**:
   ```tsx
   import { useInteractions } from '../modules/core/interactions';
   ```

2. **Usa el hook en tu componente**:
   ```tsx
   const {
     isClickEnabled,
     getClickAction,
     isDraggable
   } = useInteractions({
     initialOptions: cardOptions.interactions
   });
   ```

3. **Aplica las interacciones al elemento**:
   ```tsx
   <div
     className="card-content"
     onClick={isClickEnabled() ? handleCardClick : undefined}
     draggable={isDraggable()}
   >
     {/* Contenido de la tarjeta */}
   </div>
   ```

4. **Implementa los manejadores de eventos**:
   ```tsx
   const handleCardClick = (e) => {
     const action = getClickAction();
     switch (action) {
       case 'flip':
         flipCard();
         break;
       case 'expand':
         expandCard();
         break;
       // Otros casos...
     }
   };
   ```