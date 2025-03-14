# Módulo de Efectos Visuales

Este módulo proporciona un sistema completo para aplicar y gestionar efectos visuales CSS en las entity cards. Permite manipular propiedades como brillo, contraste, desenfoque, opacidad y muchas más.

## Características

- **Efectos CSS Avanzados**: Aplicación de filtros como brillo, contraste, saturación, rotación de tono, escala de grises, sepia, invertir, opacidad, desenfoque y sombras.
- **Efectos de Fondo**: Soporte para backdrop-filter con desenfoque, brillo, saturación y opacidad de fondo.
- **Configuración Detallada**: Panel de configuración con controles precisos para cada efecto.
- **Hook Personalizado**: API sencilla para gestionar efectos visuales programáticamente.
- **Generación de CSS**: Herramientas para generar las cadenas CSS necesarias para aplicar los efectos.

## Componentes Principales

### VisualEffectsModule

Componente principal que proporciona una interfaz para configurar todos los efectos visuales disponibles.

```tsx
import { VisualEffectsModule } from '../modules/layers/filters/visual-effects';

function MyComponent() {
  const handleChange = (effects) => {
    console.log('Efectos actualizados:', effects);
  };

  return (
    <VisualEffectsModule
      initialEffects={{
        brightness: 110,
        contrast: 105
      }}
      onChange={handleChange}
      disabled={false}
    />
  );
}
```

## Hook: useVisualEffects

Un hook personalizado para gestionar efectos visuales dentro de componentes.

```tsx
import { useVisualEffects } from '../modules/layers/filters/visual-effects';

function MyComponent() {
  const {
    effects,
    updateEffect,
    updateEffects,
    resetEffects,
    hasActiveEffects,
    generateCssFilters,
    generateBackdropCssFilters
  } = useVisualEffects({
    initialEffects: {
      brightness: 120,
      contrast: 110
    }
  });

  // Actualizar un efecto individual
  const handleBrightnessChange = (value) => {
    updateEffect('brightness', value);
  };

  // Aplicar los filtros CSS generados
  return (
    <div
      style={{
        filter: generateCssFilters(),
        backdropFilter: generateBackdropCssFilters()
      }}
    >
      Contenido con efectos visuales aplicados
    </div>
  );
}
```

## Tipos Exportados

- `VisualEffectsOptions`: Define las opciones disponibles para los efectos visuales.
- `VisualEffectsModuleProps`: Define las propiedades del componente VisualEffectsModule.
- `UseVisualEffectsProps`: Define las propiedades para el hook useVisualEffects.
- `UseVisualEffectsResult`: Define el resultado del hook useVisualEffects.

## Efectos Disponibles

### Ajustes de Imagen
- `brightness`: Controla el brillo (0-200%)
- `contrast`: Controla el contraste (0-200%)
- `saturate`: Controla la saturación (0-200%)
- `hueRotate`: Controla la rotación de tono (0-360°)

### Filtros de Estilo
- `grayscale`: Controla la escala de grises (0-100%)
- `sepia`: Controla el efecto sepia (0-100%)
- `invert`: Controla la inversión de colores (0-100%)
- `opacity`: Controla la opacidad (0-100%)

### Efectos de Desenfoque
- `blur`: Controla el desenfoque (0-20px)
- `dropShadow`: Activa/desactiva la sombra

### Efectos de Fondo
- `backdropBlur`: Controla el desenfoque de fondo (0-20px)
- `backdropBrightness`: Controla el brillo de fondo (0-200%)
- `backdropSaturate`: Controla la saturación de fondo (0-200%)
- `backdropOpacity`: Controla la opacidad de fondo (0-100%)

## Integración con Entity Cards

Para integrar efectos visuales en tus entity cards:

1. **Importa el hook**:
   ```tsx
   import { useVisualEffects } from '../modules/layers/filters/visual-effects';
   ```

2. **Usa el hook en tu componente**:
   ```tsx
   const { effects, generateCssFilters } = useVisualEffects({
     initialEffects: cardOptions.visualEffects
   });
   ```

3. **Aplica los filtros al elemento**:
   ```tsx
   <div
     className="card-content"
     style={{ filter: generateCssFilters() }}
   >
     {/* Contenido de la tarjeta */}
   </div>
   ```

4. **Guarda configuraciones actualizadas**:
   ```tsx
   const { updateEffects } = useVisualEffects();

   const handleSaveConfig = (newEffects) => {
     updateEffects(newEffects);
     saveCardOptions({ ...cardOptions, visualEffects: newEffects });
   };
   ```