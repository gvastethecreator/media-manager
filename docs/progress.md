# Sistema Centralizado de Notificaciones

## Análisis de la Situación Actual

Actualmente, el proyecto tiene dos sistemas de notificaciones:

1. **shadcn/ui toast**: Implementado en `src/components/ui/use-toast.ts` y `src/components/ui/toaster.tsx`
2. **sonner**: Implementado en `src/components/ui/sonner.tsx` y configurado en `src/providers/app-provider.tsx`

El problema es que hay inconsistencia en el uso de estos sistemas. Algunos archivos importan toast de shadcn/ui y otros de sonner, lo que causa confusión y posiblemente que algunas notificaciones no se muestren correctamente.

## Plan de Acción

1. ✅ Analizar la situación actual
2. ✅ Crear un servicio centralizado de notificaciones usando sonner
3. ✅ Actualizar el archivo `src/lib/toast.ts` para usar sonner
4. ✅ Migrar un componente de ejemplo (prompt-dialog.tsx) al nuevo sistema
5. ✅ Migrar el resto de referencias de shadcn/ui toast a sonner
6. ⬜ Verificar que todas las notificaciones se muestren correctamente
7. ✅ Documentar el uso del nuevo sistema de notificaciones

## Implementación

### 1. Crear un servicio centralizado de notificaciones ✅

Hemos creado un nuevo servicio en `src/lib/services/toast.service.ts` que utiliza sonner para mostrar notificaciones de manera consistente en toda la aplicación.

Este servicio proporciona:
- Métodos generales: `success`, `error`, `info`, `warning`, `show`
- Métodos específicos para cada categoría: `collection`, `tag`, `favorite`, `folder`, `system`
- Soporte para opciones avanzadas como acciones, duración, etc.

### 2. Actualizar el archivo toast.ts ✅

Hemos modificado el archivo `src/lib/toast.ts` para que utilice el nuevo servicio centralizado de notificaciones, manteniendo la compatibilidad con el código existente.

### 3. Migrar componentes ✅

Hemos actualizado los siguientes componentes para que utilicen el nuevo servicio de notificaciones:

1. `prompt-dialog.tsx`
2. `note-dialog.tsx`
3. `tag-dialog.tsx`
4. `world-item-dialog.tsx`
5. `place-dialog.tsx`
6. `collection-dialog.tsx`
7. `concept-dialog.tsx`

### 4. Documentar el uso del nuevo sistema de notificaciones ✅

Hemos creado un archivo de documentación detallado en `docs/toast-notification-system.md` que explica:
- La arquitectura del sistema
- Cómo usar el servicio de notificaciones
- Ejemplos para diferentes tipos de notificaciones
- Cómo migrar desde el sistema anterior
- Consideraciones de accesibilidad

### 5. Próximos pasos

- Verificar que todas las notificaciones se muestren correctamente
- Eliminar los archivos y componentes del sistema antiguo que ya no se utilizan

## Diagrama de Arquitectura

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

## Ejemplo de Uso

```typescript
// Importar el servicio
import { toastService } from '@/lib/services/toast.service';

// Mostrar una notificación simple
toastService.success('Operación completada con éxito');

// Mostrar una notificación con descripción
toastService.error('Error', { description: 'No se pudo completar la operación' });

// Usar categorías específicas
toastService.collection.created('Mi colección');
toastService.tag.imageAdded('Etiqueta importante');
toastService.system.warning('El sistema está experimentando lentitud');
```
