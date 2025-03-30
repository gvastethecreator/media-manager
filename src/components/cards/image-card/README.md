# 🖼️ ImageCard

Componente para mostrar tarjetas de imágenes con metadatos y acciones asociadas.

## 📋 Descripción

Este componente muestra una imagen con sus metadatos principales como dimensiones y etiquetas. Está diseñado para ser usado en galerías, listas y paneles donde se necesite mostrar miniaturas de imágenes con información contextual.

Características:

- Carga y muestra thumbnails de imágenes
- Muestra etiquetas asociadas
- Visualización de dimensiones
- Diferentes variantes de diseño (default, minimal, polaroid)
- Diferentes proporciones de aspecto
- Estados de carga, error y datos vacíos
- Navegación automática o callbacks personalizados
- **Nuevo:** Modo TCG (Trading Card Game) con efectos visuales especiales
- **Nuevo:** Soporte para imágenes favoritas con indicador visual
- **Nuevo:** Efectos decorativos y esquinas estilizadas

## 🔄 Flujo de funcionamiento

```mermaid
graph TD
    A[ImageCard] --> B[Inicialización]
    B --> C[Cargar datos de imagen]
    C --> D{¿Datos cargados?}
    D -->|No, Cargando| E[Mostrar skeleton]
    D -->|No, Error| F[Mostrar error]
    D -->|Sí| G[Renderizar imagen]
    G --> H{¿Tiene onClick?}
    H -->|Sí| I[Retornar con evento clic]
    H -->|No| J[Retornar con Link]
    G --> K{¿tcgMode activado?}
    K -->|Sí| L[Aplicar efectos TCG]

    M[image-server-actions] --> N[Consultar BD]
    N --> O[Transformar imagen]
    O --> P[Retornar datos con isFavorite]
```

## 🗂️ Estructura de archivos

- **index.ts**: Punto de entrada y exportaciones del componente
- **image-card.tsx**: Componente principal que renderiza la tarjeta
- **image-server-actions.ts**: Acciones del servidor para obtener datos de la imagen
- **README.md**: Documentación del componente

## 🖥️ Ejemplos de uso

### Uso básico con navegación automática

```tsx
import { ImageCard } from '@/components/cards/image-card';

function ImageGallery({ imageIds }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {imageIds.map(id => (
        <ImageCard
          key={id}
          imageId={id}
          aspectRatio="square"
        />
      ))}
    </div>
  );
}
```

### Uso con manejador de eventos personalizado

```tsx
import { ImageCard, type ImageCardData } from '@/components/cards/image-card';

function ImageSelector({ imageIds, onSelect }) {
  const handleImageClick = (imageData: ImageCardData) => {
    onSelect(imageData);
  };

  return (
    <div className="grid grid-cols-4 gap-2">
      {imageIds.map(id => (
        <ImageCard
          key={id}
          imageId={id}
          onClick={handleImageClick}
          variant="minimal"
          showDetails={false}
        />
      ))}
    </div>
  );
}
```

### Variantes de diseño con modo TCG

```tsx
import { ImageCard } from '@/components/cards/image-card';

function ImageVariants() {
  return (
    <div className="flex gap-4">
      <ImageCard imageId="img1" variant="default" aspectRatio="square" />
      <ImageCard imageId="img2" variant="minimal" aspectRatio="video" />
      <ImageCard imageId="img3" variant="polaroid" aspectRatio="4/3" />
      <ImageCard imageId="img4" variant="default" aspectRatio="square" tcgMode />
    </div>
  );
}
```

## 🔌 Integración

Este componente se utiliza principalmente en:

- Galerías de imágenes
- Selectores de imágenes
- Listas de resultados de búsqueda
- Paneles de previsualización
- Vistas tipo colección de cartas coleccionables

## 🎨 Personalización visual

El componente ofrece varias opciones de personalización:

- **aspectRatio**: Define la proporción de la tarjeta ('square', 'video', 'auto' o custom como '4/3')
- **variant**: Estilo visual ('default', 'minimal', 'polaroid')
- **showTags**: Mostrar u ocultar las etiquetas
- **showDetails**: Mostrar u ocultar los detalles de la imagen
- **tcgMode**: Activar el modo Trading Card Game con efectos visuales especiales
- **hoverEffects**: Personaliza los efectos visuales al pasar el cursor (predeterminado: true)

## 🎮 Características del modo TCG

El modo TCG añade elementos visuales inspirados en juegos de cartas coleccionables:

- **Esquinas decorativas**: Elementos visuales en las esquinas de la tarjeta
- **Indicador de favorito**: Muestra un icono especial cuando la imagen está marcada como favorita
- **Efectos de hover**: Efectos visuales al pasar el cursor sobre la tarjeta
- **Textura de fondo**: Fondo con patrón sutil que mejora la apariencia de la tarjeta
- **Bordes estilizados**: Bordes con efectos visuales que destacan la tarjeta

## ♿ Accesibilidad

El componente está diseñado siguiendo buenas prácticas de accesibilidad:

- Utiliza atributos ARIA apropiados
- Soporta navegación por teclado con focus visible
- Proporciona texto alternativo para imágenes
- Alto contraste en textos sobre imágenes

## 🔧 Optimizaciones de rendimiento

Para un mejor rendimiento, el componente:

- Utiliza React.memo para evitar renderizados innecesarios
- Carga thumbnails optimizados en lugar de imágenes completas
- Implementa lazy loading para imágenes
- Utiliza Server Actions para obtener datos eficientemente
