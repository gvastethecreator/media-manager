# Plan de Migración y Optimización

## Estado Actual

- Mezcla de endpoints API y server actions
- Schema Prisma completo y funcional
- Sistema de colas implementado
- Estructura modular por entidades

## Plan de Acción

### Fase 1: Análisis de Endpoints (Completado)

- [x] Mapear todos los endpoints actuales
- [x] Identificar endpoints deprecados
- [x] Documentar dependencias entre endpoints
- [x] Analizar uso de endpoints en el frontend

### Fase 2: Migración por Módulos

- [x] Módulo de Favoritos
- [x] Módulo de Carpetas
- [x] Módulo de Colecciones
- [x] Módulo de Etiquetas
- [x] Módulo de Thumbnails (Parcial)
- [ ] Módulo de Álbumes
- [ ] Módulo de Personajes
- [ ] Módulo de Lugares
- [ ] Módulo de Objetos
- [ ] Módulo de Actividades
- [ ] Módulo de Estadísticas

### Fase 3: Limpieza y Optimización

- [ ] Eliminar código duplicado
- [ ] Optimizar consultas a base de datos
- [ ] Refactorizar lógica común
- [ ] Implementar mejores prácticas de Server Actions

### Fase 4: Pruebas y Validación

- [ ] Pruebas de funcionalidad
- [ ] Validación de performance
- [ ] Documentación actualizada
- [ ] Revisión de seguridad

## Progreso Diario

### 2024-01-14

- Inicio del proyecto de migración
- Creación del plan de acción
- Análisis inicial de la estructura del proyecto
- Migración completa del módulo de favoritos
- Migración completa del módulo de carpetas
- Migración completa del módulo de colecciones
- Eliminación de endpoints deprecados:
  - `/api/folders/[id]`
  - `/api/folders/[id]/images`
  - `/api/images/favorites`
  - `/api/collections/[id]/images`

### 2024-01-15

- Migración completa del módulo de etiquetas:

  - Actualización de server actions para manejar correctamente FileItem
  - Eliminación de endpoints deprecados en el frontend
  - Simplificación de la interfaz Tag y componente TagCard
  - Mejora en el manejo de thumbnails y metadata

- Migración del módulo de thumbnails:
  - Implementación de getThumbnail en server actions
  - Actualización de FileCard para usar server actions
  - Actualización de AdvancedFileViewer para usar server actions
  - Actualización de ThumbnailService para usar server actions
  - Pendiente: eliminar endpoints antiguos después de validar funcionamiento

### 2024-01-16

- Mejoras en el módulo de thumbnails:
  - Agregado de estadísticas adicionales:
    - Total de miniaturas generadas
    - Peso total del caché de miniaturas
  - Reorganización de la interfaz de estadísticas
  - Optimización de la visualización de miniaturas recientes
  - Mejora en la presentación de métricas del sistema

## Próximos Pasos

1. Completar migración de thumbnails:

   - Validar funcionamiento de server actions en:
     - FileCard
     - AdvancedFileViewer
     - ThumbnailService
   - Eliminar endpoints redundantes:
     - /api/thumbnails/[id]
     - /api/thumbnails/validate
     - /api/thumbnails/migrate
     - /api/thumbnails/clean (duplicado)
   - Mantener endpoints necesarios:
     - /api/thumbnails/events (SSE)

2. Migrar módulo de álbumes:

   - Crear server actions para álbumes
   - Actualizar el store para usar las nuevas actions
   - Eliminar endpoints antiguos

3. Migrar módulo de personajes:
   - Crear server actions para personajes
   - Actualizar el store para usar las nuevas actions
   - Eliminar endpoints antiguos
