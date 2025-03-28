# 🏷️ TagCard

Componente que muestra una tarjeta estilo Magic para representar etiquetas (tags).

## 📋 Descripción

Este componente forma parte del sistema de tarjetas de entidades, siguiendo el mismo diseño que `CharacterCard`, `PlaceCard` y `WorldItemCard`. Cada tarjeta tiene un diseño inspirado en cartas de Magic con:

- Cabecera con nombre de etiqueta e icono
- Sección de imágenes asociadas
- Sección de contenido con descripción y metadatos
- Pie con estadísticas e información adicional
- Colores personalizados según la configuración de la etiqueta

## 🔄 Flujo de funcionamiento

```mermaid
graph TD
    A[TagCard] --> B[Inicialización]
    B --> C[Cargar datos y estilos]
    C --> D[Generar contenido de tarjeta]
    D --> E{¿Tiene onClick?}
    E -->|Sí| F[Retornar tarjeta con evento]
    E -->|No| G[Retornar tarjeta con Link]

    H[TagCardImages] --> I[Cargar imágenes con server action]
    I --> J{¿Hay imágenes?}
    J -->|Sí| K[Mostrar grid de imágenes]
    J -->|No| L[Mostrar placeholder]

    M[tag-server-actions] --> N[Consultar base de datos]
    N --> O[Transformar datos]
    O --> P[Retornar imágenes e info]
```

## 🗂️ Estructura de archivos

- **index.ts**: Punto de entrada y exportaciones del componente
- **tag-card.tsx**: Componente principal que renderiza la tarjeta
- **tag-card-header.tsx**: Componente para la cabecera de la tarjeta
- **tag-card-images.tsx**: Componente para mostrar las imágenes asociadas
- **tag-card-content.tsx**: Componente para mostrar el contenido de la etiqueta
- **tag-card-footer.tsx**: Componente para mostrar el pie con estadísticas
- **tag-server-actions.ts**: Acciones del servidor para obtener datos
- **README.md**: Documentación del componente

## 🖥️ Ejemplos de uso

### Uso básico con navegación automática

```tsx
import { TagCard } from '@/components/cards/tag-card';

function TagsList({ tags }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {tags.map(tag => (
        <TagCard key={tag.id} tag={tag} />
      ))}
    </div>
  );
}
```

### Uso con manejador de eventos personalizado

```tsx
import { TagCard } from '@/components/cards/tag-card';

function TagSelector({ tags, onSelect }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {tags.map(tag => (
        <TagCard
          key={tag.id}
          tag={tag}
          onClick={onSelect}
        />
      ))}
    </div>
  );
}
```

## 🔌 Integración

Este componente se utiliza principalmente en:
- Vista de etiquetas en el dashboard
- Selectores de etiquetas en formularios
- Paneles de filtrado y organización
- Diálogos y modales de selección

## 🎨 Personalización visual

El componente respeta y utiliza los atributos visuales definidos en la entidad Tag:
- **color**: Color principal de la etiqueta que se utiliza para los bordes y gradientes
- **emoji**: Emoji asociado que se muestra junto al nombre
- **texture**: Textura visual (si está definida)
- **rarity**: Rareza que afecta al diseño visual (common, uncommon, rare, etc.)