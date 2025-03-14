# Módulo de Previsualización para Entity Cards

## 📋 Descripción

El módulo de previsualización proporciona configuraciones para personalizar cómo se muestran las Entity Cards en modo de vista previa. Permite ajustar tamaños, controles, información y opciones de interacción.

## 🧩 Componentes

- `PreviewModule`: Componente principal que muestra las opciones de configuración de previsualización.

## 🪝 Hooks

- `usePreview`: Hook para gestionar el estado y la lógica de las opciones de previsualización.

## 🧪 Uso

```tsx
import { PreviewModule } from '@/components/features/entity-cards/modules/preview';

function MyComponent() {
  const handleChange = (options) => {
    console.log('Opciones actualizadas:', options);
  };

  return (
    <PreviewModule
      initialOptions={{
        size: 'medium',
        showControls: true,
        showInfo: true
      }}
      onChange={handleChange}
    />
  );
}
```

## 🔧 Opciones de Configuración

### Tamaño
- `size`: Tamaño predefinido ('small', 'medium', 'large', 'custom')
- `customWidth`: Ancho personalizado en píxeles (cuando size es 'custom')
- `customHeight`: Alto personalizado en píxeles (cuando size es 'custom')

### Visualización
- `showControls`: Muestra controles de navegación
- `showInfo`: Muestra información adicional sobre la tarjeta
- `showBorder`: Muestra un borde alrededor de la tarjeta
- `backgroundColor`: Color de fondo de la vista previa

### Interacción
- `enableInteraction`: Permite interactuar con la tarjeta en la vista previa
- `autoRotate`: Activa la rotación automática de la tarjeta
- `rotationSpeed`: Velocidad de rotación (cuando autoRotate está activo)
- `zoomLevel`: Nivel de zoom inicial

## 🧮 Tamaños Predefinidos

- **Pequeño**: 200x300 px
- **Mediano**: 300x400 px
- **Grande**: 400x600 px
- **Personalizado**: Dimensiones definidas por el usuario

## 🔄 Integración

Este módulo está diseñado para integrarse con el sistema de Entity Cards, proporcionando una manera sencilla de configurar la visualización de las tarjetas en modo de vista previa.