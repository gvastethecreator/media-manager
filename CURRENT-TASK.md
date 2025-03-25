# Refactorización de Tipos y Server Actions

## Plan de trabajo

- [x] Crear tipos base para entities (derivados de Prisma)
- [x] Crear tipos extendidos para UI
- [x] Crear transformers para mapeo entre tipos
- [x] Integrar tipos y transformers en server actions (parcialmente completado)
- [x] Actualizar componentes para utilizar nuevos tipos
- [ ] Pruebas e2e

## Estado actual del proyecto

El proyecto sigue una estructura bien definida:

```
/src
├── /app
│   ├── /actions     # Server actions para cada entidad (NextJS App Router)
│   └── /api         # API routes para endpoints públicos
├── /components   # Componentes reutilizables
├── /hooks        # Hooks personalizados
├── /lib          # Utilidades y configuraciones
├── /server       # Lógica del servidor
├── /services     # Servicios externos
├── /store        # Estado global con Zustand
├── /transformers # Funciones de transformación entre tipos
│   ├── /{entity}/mappers.ts    # Mapeo a formatos específicos
│   ├── /{entity}/serializers.ts # Serialización/deserialización
│   └── /{entity}/index.ts      # Re-exportaciones
└── /types        # Definición de tipos TypeScript
    └── /entities # Tipos para las entidades del dominio
        ├── /{entity}/base.ts     # Tipos base derivados de Prisma
        ├── /{entity}/enums.ts    # Enumeraciones y constantes
        ├── /{entity}/extended.ts # Tipos extendidos para UI
        └── /{entity}/index.ts    # Re-exportaciones
```

## Entidades implementadas

### Completamente implementadas (tipos, transformers y actions)
- [x] Image
- [x] Folder
- [x] Album
- [x] Tag
- [x] Collection
- [x] Character
- [x] Place
- [x] Note
- [x] QueueJob
- [x] Profile
- [x] WorldItem
- [x] Concept
- [x] Prompt
- [x] Activity
- [x] VisualPreset
- [x] Favorite
- [x] File

### Parcialmente implementadas
- [ ] Metadata (falta implementar tipos, transformers y migrar server actions)
- [ ] Stats (falta implementar tipos, transformers y migrar server actions)
- [ ] System (falta implementar tipos, transformers y migrar server actions)
- [ ] Thumbnails (falta implementar tipos, transformers y migrar server actions)
- [ ] UploadedImages (falta implementar tipos, transformers y migrar server actions)

## Integración de server actions con nuevos tipos y transformers

Se ha completado parcialmente la integración de server actions con los nuevos tipos y transformers. Esto ha implicado:

1. **Estructura uniforme de tipos**: Cada entidad tiene su carpeta con tipos base, extendidos, enums y re-exportaciones.

2. **Transformers estandarizados**: Cada entidad tiene transformers para:
   - Mapeo de datos de entrada → Formato Prisma (`mapCreateEntityDataToPrisma`, `mapUpdateEntityDataToPrisma`)
   - Transformación de entidades Prisma → Tipos extendidos para UI (`extendEntity`, `toEntityCard`, `toEntityListItem`)
   - Serialización/deserialización de datos complejos

3. **Server Actions consistentes**: Implementación uniforme con:
   - Códigos de error tipados
   - Función creadora de errores
   - Sistema de notificación de cambios vía eventos
   - Revalidación de rutas centralizada

## Progreso actual

### Migraciones completadas:
- WorldItem: Migrado completamente para usar nuevos tipos y transformers
- Concept: Implementada migración completa con transformers y tipos específicos
- Prompt: Actualizado para usar nuevos tipos, con mejoras en relaciones entre entidades
- Activity: Migrado con funcionalidad extendida para filtrado y limpieza
- VisualPreset: Actualizado server actions para usar tipos y transformers, mejorado el manejo de errores y emisión de eventos
- Album: Corregidos los errores de tipado en server actions
- Favorite: Migrado para utilizar tipos, enums y transformers específicos
- File: Implementados tipos, transformers y migradas server actions con funcionalidad ampliada

## Próximos pasos

### Fase 1: Completar migración de server actions
- [ ] Implementar tipos, transformers y migrar Metadata actions
- [ ] Implementar tipos, transformers y migrar Stats actions
- [ ] Implementar tipos, transformers y migrar System actions
- [ ] Implementar tipos, transformers y migrar Thumbnails actions
- [ ] Implementar tipos, transformers y migrar UploadedImages actions

### Fase 2: Optimización
- [ ] Revisar y mejorar el rendimiento de consultas a la base de datos
  - [ ] Optimizar inclusión de relaciones
  - [ ] Implementar paginación y filtrado eficiente
  - [ ] Ajustar índices de base de datos

- [ ] Implementar caching estratégico
  - [ ] Identificar datos frecuentemente accedidos
  - [ ] Configurar estrategias de caché (React Query, SWR)
  - [ ] Implementar invalidación inteligente de caché

- [ ] Auditar y optimizar operaciones de revalidación
  - [ ] Minimizar revalidaciones innecesarias
  - [ ] Implementar revalidación selectiva

### Fase 3: Interoperabilidad
- [ ] Mejorar interoperabilidad entre entidades
  - [ ] Crear transformers para conversiones entre entidades relacionadas
  - [ ] Estandarizar interfaz de asociación entre entidades
  - [ ] Implementar acciones batch para operaciones masivas

- [ ] Implementar acciones compuestas
  - [ ] Crear acciones que operen en múltiples entidades
  - [ ] Mejorar manejo transaccional
  - [ ] Implementar rollback en caso de errores

### Fase 4: Documentación
- [ ] Documentar estructura de tipos
  - [ ] Crear diagramas de relaciones entre entidades
  - [ ] Añadir ejemplos de uso para cada tipo

- [ ] Documentar patrones de transformación
  - [ ] Explicar flujo de transformación de datos
  - [ ] Documentar mejores prácticas

- [ ] Mejorar documentación en código
  - [ ] Añadir JSDoc completo para todas las funciones públicas
  - [ ] Crear ejemplos en comentarios

### Fase 5: Testing
- [ ] Pruebas unitarias para transformers
  - [ ] Crear casos de prueba para cada transformador
  - [ ] Verificar manejos de casos borde

- [ ] Pruebas de integración para server actions
  - [ ] Simular flujos completos con mocking de DB
  - [ ] Verificar manejo de errores

- [ ] Pruebas e2e para flujos completos
  - [ ] Automatizar flujos principales de usuario
  - [ ] Verificar performance bajo carga

### Fase 6: Migración a Drizzle
- [ ] Preparar tipos base para Drizzle
  - [ ] Crear adaptadores de tipos Prisma → Drizzle
  - [ ] Ajustar transformers para trabajar con esquemas Drizzle

- [ ] Adaptar server actions para usar Drizzle
  - [ ] Reemplazar consultas Prisma con equivalentes Drizzle
  - [ ] Mantener compatibilidad con tipos existentes

- [ ] Migración gradual por entidad
  - [ ] Priorizar entidades menos complejas
  - [ ] Implementar pruebas A/B
