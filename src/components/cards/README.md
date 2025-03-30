# Componentes de Tarjetas - Image Manager

Este directorio contiene los componentes de tarjeta utilizados en toda la aplicación para mostrar diferentes entidades del sistema como carpetas, conceptos y próximamente archivos. Los componentes siguen un patrón de diseño modular y cuentan con modos de visualización estándar y TCG (Trading Card Game).

## Arquitectura

Cada tipo de tarjeta sigue una estructura modular similar:

```
card-type/
  ├── card-type.tsx          # Componente principal
  ├── card-type-header.tsx   # Encabezado de la tarjeta
  ├── card-type-content.tsx  # Contenido principal
  ├── card-type-images.tsx   # Sección de imágenes
  ├── card-type-footer.tsx   # Pie de la tarjeta
  └── card-type-server-actions.ts  # Acciones del servidor
```

## Tipos de Tarjetas Disponibles

1. **FolderCard**: Para mostrar carpetas y sus estadísticas.
2. **ConceptCard**: Para mostrar conceptos y sus relaciones.
3. **FileCard**: (Próximamente) Para mostrar archivos individuales.

## Características Principales

### Modo TCG (Trading Card Game)

Todas las tarjetas soportan un modo TCG que les da la apariencia de cartas coleccionables, similar a juegos como Magic, Yu-Gi-Oh o Pokémon. Este modo incluye:

- Diseño de marco estilizado con bordes decorativos
- Elementos visuales como brillos, gradientes y efectos de hover
- Visualización de estadísticas como "poder" o "rareza"
- Decoraciones en esquinas y elementos de diseño distintivos

Para activar el modo TCG, simplemente pasa la prop `tcgMode={true}` al componente de tarjeta:

```tsx
<FolderCard folderId="123" tcgMode={true} />
```

### Modos de Visualización

Cada tarjeta soporta diferentes modos de visualización:

- **Estándar**: Diseño limpio y minimalista
- **TCG**: Estilo de carta coleccionable
- **Compacto**: Versión más pequeña con menos información

### Props Comunes

Todos los componentes de tarjeta comparten algunas props comunes:

- `className`: Clases CSS adicionales
- `interactive`: Si la tarjeta debe ser interactiva (clickeable)
- `tcgMode`: Activa el modo TCG
- `compact`: Activa el modo compacto

## Ejemplos de Uso

### FolderCard

```tsx
// FolderCard básica
<FolderCard folderId="abc123" />

// FolderCard en modo TCG
<FolderCard
  folderId="abc123"
  tcgMode={true}
  href="/custom/route"
/>

// FolderCard no interactiva
<FolderCard
  folderId="abc123"
  interactive={false}
/>
```

### ConceptCard

```tsx
// ConceptCard básica
<ConceptCard conceptId="xyz789" />

// ConceptCard en modo TCG
<ConceptCard
  conceptId="xyz789"
  tcgMode={true}
/>
```

## Personalización Visual

Cada tipo de tarjeta utiliza el color principal de la entidad que representa para crear un esquema de colores coherente. Los colores secundarios se generan automáticamente para crear gradientes y efectos visuales.

## Accesibilidad

Los componentes de tarjeta están diseñados teniendo en cuenta la accesibilidad:

- Se puede navegar con teclado cuando son interactivos
- Contienen roles ARIA apropiados
- Ofrecen buen contraste de colores
- Incluyen información descriptiva

## Implementación de Servidor

Los componentes utilizan acciones del servidor de Next.js para:

- Obtener datos adicionales
- Recuperar imágenes relacionadas
- Calcular estadísticas
- Generar colores secundarios

## Integración con Tailwind CSS

Todos los componentes utilizan Tailwind CSS para estilos y aprovechan la función `cn()` de la utilidad `@/lib/utils` para combinar clases de manera condicional.

## Rendimiento

Para optimizar el rendimiento:

- Las imágenes se cargan utilizando el componente `next/image`
- Los componentes que requieren datos del servidor están diseñados para ser Server Components
- Se utiliza paginación y límites en las consultas a la base de datos
- Se implementa lazy loading cuando es apropiado

---

Por favor, asegúrate de mantener la coherencia en la estructura de archivos y el diseño visual al crear nuevos tipos de tarjetas.
