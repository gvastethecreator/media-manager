# Guía de Migración a Componentes Entity Cards Refactorizados

Esta guía proporciona instrucciones detalladas para migrar desde los componentes antiguos de tarjetas de entidades a la nueva arquitectura basada en componentes base.

## Beneficios de la Migración

- **Reducción de código**: Los nuevos componentes son más concisos (~60% menos código)
- **Mejor tipado**: Props tipadas y adaptadores mejorados
- **Mayor consistencia**: Interfaz común entre diferentes tipos de tarjetas
- **Mejor rendimiento**: Componentes optimizados con memoización
- **Mantenimiento simplificado**: Arquitectura modular y coherente

## Visión General de Cambios

### 1. Estructura de Componentes

```
// ANTES: Componentes monolíticos grandes
src/components/features/entity-cards/layouts/
  ├── album-card-layout.tsx (~700 líneas)
  ├── note-card-layout.tsx (~700 líneas)
  └── ...
```

```
// DESPUÉS: Arquitectura basada en componentes
src/components/features/entity-cards/
  ├── base/ (componentes fundamentales)
  │   ├── base-card-layout.tsx
  │   ├── card-sections.tsx (Header, Footer, etc.)
  │   └── ...
  ├── layouts/refactored/ (nuevos layouts más ligeros)
  │   ├── album-card-layout.tsx (~300 líneas)
  │   ├── note-card-layout.tsx (~300 líneas)
  │   └── ...
  └── ...
```

### 2. API de Componentes

```tsx
// ANTES: Mezcla de propiedades específicas y generales
<AlbumCard
  data={album}
  onClick={handleClick}
  showVisualizationConfig={showConfig}
  className="my-custom-class"
  // Muchas otras props específicas...
/>
```

```tsx
// DESPUÉS: API más clara y tipada
<AlbumCard
  data={album}
  onClick={handleClick}
  options={{
    // Opciones visuales tipadas
    designSystem: { preset: 'modern' },
    enableGlowEffect: true,
  }}
  className="my-custom-class"
/>
```

## Guía de Migración Paso a Paso

### Para Desarrolladores de Aplicaciones

Si utilizas tarjetas de entidades en tu aplicación:

1. **Actualiza tus importaciones**:

```tsx
// ANTES
import { AlbumCard } from '@/components/features/entity-cards';

// DESPUÉS
import { AlbumCard } from '@/components/features/entity-cards/layouts/refactored';
// O sigue usando la misma importación ya que será actualizada automáticamente:
import { AlbumCard } from '@/components/features/entity-cards';
```

2. **Ajusta las opciones visuales**:

```tsx
// ANTES
<AlbumCard
  data={album}
  showGlow={true}
  shadowStyle="soft"
  borderWidth={2}
  // Props separadas para configuración visual
/>

// DESPUÉS
<AlbumCard
  data={album}
  options={{
    enableGlowEffect: true,
    designSystem: {
      shadowStyle: 'soft',
      borderWidth: 2,
    }
  }}
/>
```

3. **Verifica tipos de datos**:

Los nuevos componentes tienen mejor tipado, por lo que TypeScript puede detectar problemas que antes pasaban desapercibidos.

### Para Desarrolladores de Componentes

Si trabajas en la implementación de componentes de tarjetas:

1. **Usa componentes base para nuevas tarjetas**:

```tsx
import {
  BaseCardLayout,
  CardHeader,
  CardFooter,
  CardImageSection,
  CardMetadataSection,
} from '@/components/features/entity-cards/base';

export function MyNewCardLayout() {
  return (
    <BaseCardLayout data={...} options={...}>
      <CardHeader title="..." />
      <CardImageSection imageUrl="..." />
      <CardMetadataSection items={...} />
      <CardFooter {...} />
    </BaseCardLayout>
  );
}
```

2. **Refactoriza tarjetas existentes**:

- Examina el componente `AlbumCardLayout` refactorizado como ejemplo
- Extrae secciones comunes a componentes reutilizables
- Usa los tipos base para una interfaz coherente

3. **Migra los controles específicos del dominio**:

```tsx
// ANTES: Lógica específica directamente en el componente
function renderMetadataSection() {
  return (
    <div className="album-stats">
      // Muchas líneas de HTML/JSX específico
    </div>
  );
}

// DESPUÉS: Usa los componentes base con lógica específica adaptada
const metadataItems = [
  { label: 'Imágenes', value: imageCount, icon: <Images /> },
  { label: 'Categoría', value: category, icon: <Tag /> },
  // ...otros metadatos
];

return <CardMetadataSection items={metadataItems} />;
```

## Ejemplo de Migración Paso a Paso

Veamos un ejemplo completo de migración de uso de `AlbumCard`:

```tsx
// ANTES
import { AlbumCard } from '@/components/features/entity-cards';

function MyComponent() {
  return (
    <div className="gallery">
      {albums.map(album => (
        <AlbumCard
          key={album.id}
          data={album}
          onClick={() => selectAlbum(album.id)}
          onEdit={() => editAlbum(album.id)}
          onDelete={() => deleteAlbum(album.id)}
          showGlow={true}
          borderWidth={2}
          cornerRadius={8}
          shadowStyle="soft"
        />
      ))}
    </div>
  );
}
```

```tsx
// DESPUÉS
import { AlbumCard } from '@/components/features/entity-cards';
// La importación no cambia gracias al punto de entrada centralizado

function MyComponent() {
  return (
    <div className="gallery">
      {albums.map(album => (
        <AlbumCard
          key={album.id}
          data={album}
          onClick={() => selectAlbum(album.id)}
          onEdit={() => editAlbum(album.id)}
          onDelete={() => deleteAlbum(album.id)}
          options={{
            enableGlowEffect: true,
            designSystem: {
              borderWidth: 2,
              cornerRadius: 8,
              shadowStyle: 'soft',
            }
          }}
        />
      ))}
    </div>
  );
}
```

## Escenario de Migración Gradual

Puedes migrar gradualmente a los nuevos componentes:

1. Los componentes antiguos seguirán funcionando
2. Los nuevos componentes se implementarán bajo `layouts/refactored/`
3. A medida que se completen, se actualizarán las exportaciones en `index.ts`
4. Eventualmente, todos los componentes serán reemplazados sin cambios en las importaciones para los consumidores

## Compatibilidad con Tipos Antiguos

Para mantener compatibilidad con código existente, usamos adaptadores de tipo:

```tsx
// El adaptador garantiza compatibilidad entre versiones de tipos
import { adaptCardOptions } from '@/components/features/entity-cards';

// Uso en componentes para asegurar compatibilidad
const options = adaptCardOptions({
  shadowStyle: 'none', // Valor antiguo
  // otras opciones...
});
```

## Solución de Problemas Comunes

### Error: "Property 'X' does not exist on type..."

Los nuevos componentes utilizan interfaces más estrictas. Verifica que estés usando la estructura correcta de opciones:

```tsx
// INCORRECTO
<AlbumCard shadowStyle="soft" />

// CORRECTO
<AlbumCard options={{ designSystem: { shadowStyle: 'soft' } }} />
```

### Error: "No overload matches this call..."

Las props han sido reestructuradas para mayor coherencia:

```tsx
// INCORRECTO
<AlbumCard album={myAlbum} />

// CORRECTO
<AlbumCard data={myAlbum} />
```

## Preguntas Frecuentes

1. **¿Tengo que migrar inmediatamente?**
   - No, puedes seguir usando los componentes antiguos mientras implementamos la migración gradual.

2. **¿Cambiarán las API de los componentes?**
   - Hemos diseñado la nueva API para ser más consistente y tipada, pero mantenemos compatibilidad con patrones de uso comunes.

3. **¿Cómo puedo contribuir a la migración?**
   - Revisa los PRs etiquetados con `refactor/entity-cards`
   - Sigue los patrones establecidos en los componentes ya refactorizados
   - Añade pruebas para validar comportamiento equivalente

4. **¿Hay cambios visuales?**
   - No, los componentes refactorizados mantienen la misma apariencia visual
   - Solo cambia la estructura interna y API de los componentes

## Próximos Pasos

Consulta el archivo `progress.md` para ver el estado actual de la refactorización y los próximos componentes a migrar.