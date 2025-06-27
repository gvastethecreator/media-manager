
# Auditoría de Entidades y Plan de Acción

Este documento resume el estado actual de las entidades del sistema, basado en una auditoría del `schema.prisma` y su correspondencia con los tipos, stores, servicios y acciones en el código fuente. El objetivo es generar una hoja de ruta para alinear todas las entidades, pagar la deuda técnica y preparar el proyecto para una futura migración a Vite + React.

## Resumen General

La mayoría de las entidades siguen un patrón arquitectónico robusto y moderno (`EntityWithStats`, stores de Zustand modulares, Server Actions). Sin embargo, existe una inconsistencia clave en la capa de servicio: algunas entidades tienen una capa de servicio bien definida que encapsula la lógica de negocio, mientras que otras tienen esta lógica directamente en las Server Actions.

**El objetivo principal de la refactorización será implementar la capa de servicio para todas las entidades que carecen de ella, siguiendo el patrón establecido por `Group` y `Concept`.**

---

## Plan de Acción por Entidad

### Entidades de Sistema

#### 1. `QueueJob`

- **Estado:** ✅ **Excelente**.
- **Observaciones:** Muy bien implementada. La arquitectura es sólida y sirve como un buen ejemplo.
- **Tareas:**
  - **Investigar tipos duplicados:** Analizar `src/types/entities/queue-job/types.ts` y `src/types/queue.ts`. Consolidar en un único archivo canónico para evitar confusiones.

#### 2. `Profile`

- **Estado:** ✅ **Excelente**.
- **Observaciones:** Implementación muy sólida y consistente.
- **Tareas:**
  - **Clarificar `profile/client.ts`:** Investigar el propósito del `profile/client.ts` y determinar si es una capa de abstracción necesaria o si puede ser simplificado/eliminado para reducir la complejidad.

#### 3. `Settings`

- **Estado:** ✅ **Excelente (refactorización completada)**.
- **Observaciones:** ✅ **Progreso completado:**
  - ✅ Flujo Service/Action invertido correctamente - las actions ahora llaman al servicio
  - ✅ Servicio refactorizado con toda la lógica de negocio movida desde actions
  - ✅ Actions convertidas en controladores delgados que validan entrada y llaman al servicio
  - ✅ Eliminación de dependencias circulares y duplicación de código
- **Tareas restantes:**
  - **Consolidar tipos:** Unificar los tipos de `src/types/settings.ts` y `src/types/entities/settings/` para tener una única fuente de verdad.

#### 4. `Folder`

- **Estado:** ✅ **Excelente (deuda técnica resuelta)**.
- **Observaciones:** ✅ **Progreso completado:**
  - ✅ `as any` eliminado de `use-folder-images.ts` - reemplazado con verificación de tipo más segura
  - ✅ Implementación extremadamente robusta sin problemas de tipos
- **Tareas restantes:**
  - **Analizar stores múltiples:** Revisar los stores `files.store` y `unified-file-manager.store` para determinar si la lógica de carpetas puede ser simplificada o centralizada.

#### 5. `Image`

- **Estado:** 🟡 **Bueno (refactorización en progreso)** ✅.
- **Observaciones:** ✅ **Progreso significativo completado:**
  - ✅ TODOs y `as any` eliminados del store core slice
  - ✅ Servicio de imagen refactorizado con métodos CRUD completos
  - ✅ Server actions refactorizadas para usar el servicio (getImage, updateImage, deleteImage)
  - ✅ Eliminación de `as any` en múltiples componentes (world-item-card, selectors, etc.)
- **Tareas restantes:**
  - **Verificar archivo `types-old.ts`:** Confirmar si existe y consolidar si es necesario.
  - **Completar refactorización de actions:** Migrar `createImage` y `getImages` al servicio.
  - **Revisar transformadores:** Asegurar consistencia en toda la cadena de transformación.

#### 6. `Video`

- **Estado:** ✅ **Excelente (refactorización completada)**.
- **Observaciones:** ✅ **Progreso completado:**
  - ✅ Servicio `video.service.ts` implementado con toda la lógica de negocio
  - ✅ Actions refactorizadas para ser controladores delgados que llaman al servicio
  - ✅ Separación completa de responsabilidades: actions validan entrada, servicio maneja lógica de negocio
  - ✅ Patrón arquitectónico consistente con otras entidades refactorizadas
- **Tareas restantes:** Ninguna - refactorización completa.

#### 7. `UploadedImage`

- **Estado:** ✅ **Excelente**.
- **Observaciones:** Implementación limpia y bien aislada.
- **Tareas:**
  - **Consolidar tipos:** Unificar `types/entities/uploaded-image/types.ts` y `types/uploaded-images.ts`.

#### 8. `ImageStats`

- **Estado:** ✅ **Excelente**.
- **Observaciones:** Implementación simple y correcta.
- **Tareas:**
  - **Limpiar código:** Eliminar las menciones al campo `downloads` que ya no existe en el esquema.

#### 9. `Activity`

- **Estado:** ✅ **Excelente**.
- **Observaciones:** Implementación sólida y consistente.
- **Tareas:**
  - **Consolidar flujo Action -> Service:** Asegurar que todas las `actions` pasen por el `service` para interactuar con la base de datos.

---

### Entidades Principales

Para las siguientes entidades, el plan de acción es el mismo:

- ✅ `Album` - **Completado:** Servicio implementado y actions refactorizadas
- `Collection`
- `Tag`
- `Property`
- `Wildcard`
- `Character`
- `Place`
- `WorldItem`
- `Concept`
- `Note`

- **Estado:** 🟡 **Bueno (la mayoría sin capa de servicio)**.
- **Observaciones:** Todas estas entidades están muy bien definidas a nivel de tipos y stores, pero la mayoría carece de una capa de servicio, teniendo la lógica de negocio directamente en las `actions`. `Group` y `Concept` son las excepciones y deben usarse como modelo.
- **Tareas:**
    1. **Implementar la capa de servicio:** Para cada entidad, crear un `[entidad].service.ts` en `src/services/`.
    2. **Mover la lógica de negocio:** Trasladar toda la lógica de base de datos y de negocio desde las `actions` al nuevo servicio.
    3. **Refactorizar las Actions:** Convertir las `actions` en controladores delgados que validen la entrada y llamen a los métodos del servicio correspondiente.

---

### Nuevas Entidades (2025-06-17)

- `Workflow`
- `Document`
- `JsonFile`
- `File3D`
- `Audio`

- **Estado:** 🟡 **Bueno (sin capa de servicio)**.
- **Observaciones:** Estas entidades más nuevas ya siguen los patrones de tipos y stores modernos, pero fueron creadas sin la capa de servicio.
- **Tareas:**
    1. **Implementar la capa de servicio:** Crear los servicios correspondientes para cada una en `src/services/`.
    2. **Refactorizar las Actions:** Mover la lógica de las `actions` a los nuevos servicios.

---

## Próximos Pasos

1. **Priorizar tareas:** Empezar por las tareas de **MÁXIMA PRIORIDAD** (`Image`) y **ALTA PRIORIDAD** (`Folder`).
2. **Refactorización incremental:** Abordar cada entidad una por una para implementar su capa de servicio.
3. **Revisión y pruebas:** Después de refactorizar cada entidad, realizar pruebas exhaustivas para asegurar que no se hayan introducido regresiones.

Este plan proporciona una hoja de ruta clara para mejorar la arquitectura del proyecto, pagar la deuda técnica y facilitar futuras migraciones.
