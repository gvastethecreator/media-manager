# Sistema Centralizado de Notificaciones

Este documento describe el sistema centralizado de notificaciones implementado en la aplicación utilizando la biblioteca Sonner.

## Introducción

El sistema de notificaciones proporciona una forma consistente y centralizada de mostrar mensajes al usuario en toda la aplicación. Utiliza la biblioteca [Sonner](https://sonner.emilkowal.ski/) para mostrar notificaciones tipo toast de manera elegante y accesible.

## Arquitectura

El sistema está compuesto por:

1. **Componente Toaster**: Configurado en `src/providers/app-provider.tsx`
2. **Servicio de Notificaciones**: Implementado en `src/lib/services/toast.service.ts`
3. **Capa de Compatibilidad**: Implementada en `src/lib/toast.ts` para mantener compatibilidad con el código existente

```mermaid
graph TD
    A[Componentes de la Aplicación] --> B[Servicio Centralizado de Notificaciones<br/>src/lib/services/toast.service.ts]
    B --> C[Sonner Toast]
    C --> D[UI - Notificaciones]

    E[toastService.system.success] --> B
    F[toastService.system.error] --> B
    G[toastService.system.info] --> B
    H[toastService.system.warning] --> B

    I[toastService.collection.*] --> B
    J[toastService.tag.*] --> B
    K[toastService.favorite.*] --> B
    L[toastService.folder.*] --> B

    M[src/lib/toast.ts<br/>(Compatibilidad)] --> B
```

## Uso Básico

Para utilizar el sistema de notificaciones, importa el servicio desde `src/lib/services/toast.service.ts`:

```typescript
import { toastService } from '@/lib/services/toast.service';

// Mostrar una notificación de éxito
toastService.success('Operación completada con éxito');

// Mostrar una notificación de error
toastService.error('Error al procesar la solicitud');

// Mostrar una notificación informativa
toastService.info('La operación está en progreso');

// Mostrar una advertencia
toastService.warning('Esta acción podría tener consecuencias');

// Mostrar una notificación genérica
toastService.show('Mensaje genérico');
```

## Opciones Avanzadas

Puedes personalizar las notificaciones con opciones adicionales:

```typescript
toastService.success('Archivo guardado', {
  description: 'El archivo se ha guardado correctamente en la ubicación especificada.',
  duration: 5000, // 5 segundos
  action: {
    label: 'Deshacer',
    onClick: () => handleUndo()
  }
});
```

## Categorías Específicas

El sistema incluye categorías específicas para diferentes tipos de operaciones:

### Colecciones

```typescript
// Crear una colección
toastService.collection.created('Mi colección');

// Eliminar una colección
toastService.collection.deleted('Mi colección');

// Actualizar una colección
toastService.collection.updated('Mi colección');

// Agregar una imagen a una colección
toastService.collection.imageAdded('Mi colección');

// Eliminar una imagen de una colección
toastService.collection.imageRemoved('Mi colección');
```

### Etiquetas

```typescript
// Crear una etiqueta
toastService.tag.created('Mi etiqueta');

// Eliminar una etiqueta
toastService.tag.deleted('Mi etiqueta');

// Actualizar una etiqueta
toastService.tag.updated('Mi etiqueta');

// Agregar una etiqueta a una imagen
toastService.tag.imageAdded('Mi etiqueta');

// Eliminar una etiqueta de una imagen
toastService.tag.imageRemoved('Mi etiqueta');
```

### Favoritos

```typescript
// Agregar a favoritos
toastService.favorite.added();

// Eliminar de favoritos
toastService.favorite.removed();

// Actualizar favoritos
toastService.favorite.updated();
```

### Carpetas

```typescript
// Actualizar una carpeta
toastService.folder.updated('Mi carpeta');

// Escanear una carpeta
toastService.folder.scanning('Mi carpeta');

// Error en una carpeta
toastService.folder.error('No se pudo acceder a la carpeta');
```

### Sistema

```typescript
// Error del sistema
toastService.system.error('Error al conectar con el servidor');

// Advertencia del sistema
toastService.system.warning('El sistema está experimentando lentitud');

// Información del sistema
toastService.system.info('Se ha iniciado una tarea en segundo plano');

// Éxito del sistema
toastService.system.success('La operación se ha completado correctamente');
```

## Notificaciones con Promesas

Puedes mostrar notificaciones basadas en promesas:

```typescript
toastService.promise(
  saveData(),
  {
    loading: 'Guardando datos...',
    success: 'Datos guardados correctamente',
    error: 'Error al guardar los datos'
  }
);
```

## Descartar Notificaciones

Para descartar notificaciones programáticamente:

```typescript
// Crear una notificación y obtener su ID
const { id } = toastService.info('Esta notificación se cerrará automáticamente');

// Descartar la notificación después de 2 segundos
setTimeout(() => {
  toastService.dismiss(id);
}, 2000);
```

## Migración desde el Sistema Anterior

Si estás utilizando el sistema anterior de notificaciones (shadcn/ui toast), debes migrar al nuevo sistema:

1. Reemplaza las importaciones:
   ```typescript
   // Antes
   import { toast } from '@/components/ui/use-toast';

   // Después
   import { toastService } from '@/lib/services/toast.service';
   ```

2. Actualiza las llamadas:
   ```typescript
   // Antes
   toast({
     title: 'Título',
     description: 'Descripción',
     variant: 'default'
   });

   // Después
   toastService.show('Título', {
     description: 'Descripción'
   });
   ```

## Consideraciones de Accesibilidad

El sistema de notificaciones está diseñado para ser accesible:

- Las notificaciones tienen roles ARIA apropiados
- Se pueden descartar con la tecla Escape
- Tienen contraste adecuado para visibilidad
- Incluyen información contextual para lectores de pantalla

## Personalización

Si necesitas personalizar el aspecto de las notificaciones, puedes modificar el componente Toaster en `src/components/ui/sonner.tsx`.