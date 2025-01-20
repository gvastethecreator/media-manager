## Plan de Implementación - Expansión del Sistema

### Fase 1: Schema y Modelos

- [x] Agregar FeaturedImage a todas las entidades
- [x] Implementar sistema universal de favoritos
- [x] Crear modelo para imágenes del sistema
- [x] Expandir modelo Character
- [x] Actualizar modelo Collection
- [x] Crear nuevos modelos:
  - [x] Concepto
  - [x] Prompt
  - [x] Notas
  - [x] Atributo
- [x] Implementar relaciones entre entidades
- [x] Actualizar seed.ts con datos de prueba

### Fase 2: Lógica de Negocio

- [x] Generar tipos Prisma
  - [x] Ejecutar prisma generate
  - [x] Verificar tipos generados
  - [x] Ajustar tipos si es necesario
- [x] Actualizar tipos TypeScript
  - [x] Crear tipos para nuevas entidades
  - [x] Actualizar tipos existentes
  - [x] Implementar tipos de relaciones
- [x] Implementar servicios necesarios
  - [x] Servicio de favoritos universal
    - [x] Gestión de favoritos
    - [x] Eventos de favoritos
  - [x] Servicio de imágenes del sistema
    - [x] Gestión de archivos
    - [x] Optimización
    - [x] Caché
  - [x] Servicios para nuevas entidades
    - [x] Concept Service
    - [x] Prompt Service
    - [x] Note Service
    - [x] Attribute Service
- [x] Crear/Actualizar server actions
  - [x] Acciones para Concept
    - [x] CRUD básico
    - [x] Manejo de relaciones
    - [x] Gestión de favoritos
  - [x] Acciones para Prompt
    - [x] CRUD básico
    - [x] Manejo de relaciones
    - [x] Gestión de favoritos
  - [x] Acciones para Note
    - [x] CRUD básico
    - [x] Manejo de relaciones
    - [x] Gestión de favoritos
  - [x] Acciones para Attribute
    - [x] CRUD básico
    - [x] Manejo de relaciones
    - [x] Gestión de favoritos
  - [x] Acciones para UniversalFavorite
    - [x] Agregar/Quitar favoritos
    - [x] Listar favoritos por tipo
    - [x] Búsqueda y filtrado
  - [x] Acciones para SystemImage
    - [x] CRUD básico
    - [x] Gestión de archivos
    - [x] Optimización de imágenes
- [x] Actualizar sistema de eventos
  - [x] Eventos para favoritos
  - [x] Eventos para relaciones
  - [x] Eventos para nuevas entidades
- [x] Implementar stores para nuevas entidades
  - [x] Store de conceptos
  - [x] Store de prompts
  - [x] Store de notas
  - [x] Store de atributos

### Fase 3: UI/UX

- [x] Diseñar nuevos componentes
  - [x] TagInput
  - [x] ImagePicker
  - [x] EntityForm base
- [x] Implementar formularios
  - [x] Concept Form
  - [x] Prompt Form
  - [x] Note Form
  - [x] Collection Form
  - [x] Character Form
  - [x] Attribute Form
  - [x] Object Form
  - [x] Place Form
  - [x] Album Form
- [ ] Consolidar secciones de configuración
  - [ ] Crear tipos y utilidades comunes
    - [ ] Interfaces base para stores
    - [ ] Tipos para DataTable
    - [ ] Utilidades de conversión de datos
  - [ ] Estandarizar stores
    - [ ] Implementar métodos CRUD consistentes
    - [ ] Agregar tipos faltantes
  - [ ] Actualizar secciones
    - [ ] Prompts Section
    - [ ] Tags Section
    - [ ] Places Section
    - [ ] Objects Section
    - [ ] Notes Section
    - [ ] Concepts Section
    - [ ] Collections Section
    - [ ] Attributes Section
    - [ ] Albums Section
  - [ ] Implementar mejoras comunes
    - [ ] StatsCard en todas las secciones
    - [ ] Manejo consistente de estados de carga
    - [ ] Animaciones y transiciones
    - [ ] Mensajes de error/vacío estandarizados
- [ ] Implementar vistas para nuevas entidades
  - [ ] Vista de conceptos
  - [ ] Vista de prompts
  - [ ] Vista de notas
  - [ ] Vista de atributos
- [ ] Actualizar paneles existentes
  - [ ] Panel de navegación
  - [ ] Panel de detalles
  - [ ] Panel de relaciones
- [ ] Implementar nuevas interacciones
  - [ ] Drag & Drop para relaciones
  - [ ] Búsqueda universal
  - [ ] Filtros avanzados

### Seguimiento de Cambios

#### 2024-03-XX - Inicio de Expansión

- [x] Creación del plan de implementación
- [x] Actualización del schema.prisma
  - [x] Agregado FeaturedImage a todas las entidades
  - [x] Implementado sistema universal de favoritos
  - [x] Creado modelo para imágenes del sistema
  - [x] Expandido modelo Character
  - [x] Actualizado modelo Collection
  - [x] Creados nuevos modelos (Concept, Prompt, Note, Attribute)
  - [x] Implementadas relaciones entre entidades
- [x] Actualización de seed.ts
  - [x] Agregados datos de prueba para nuevas entidades
  - [x] Implementada limpieza de nuevas tablas
  - [x] Agregados ejemplos de favoritos universales
- [x] Implementación de servicios core
  - [x] Servicio de favoritos universal
  - [x] Servicio de imágenes del sistema
  - [x] Servicio de conceptos
  - [x] Servicio de prompts
  - [x] Servicio de notas
  - [x] Servicio de atributos
- [x] Implementación de server actions
  - [x] Concept Actions
  - [x] Prompt Actions
  - [x] Note Actions
  - [x] Attribute Actions
- [x] Implementación de stores
  - [x] Concept Store
  - [x] Prompt Store
  - [x] Note Store
  - [x] Attribute Store
- [x] Implementación de componentes base
  - [x] TagInput
  - [x] ImagePicker
  - [x] EntityForm
- [x] Implementación de formularios
  - [x] Concept Form
  - [x] Prompt Form
  - [x] Note Form
  - [x] Collection Form
  - [x] Character Form
  - [x] Attribute Form
  - [x] Object Form
  - [x] Place Form
  - [x] Album Form

#### Próximos Pasos

1. Implementar vistas para nuevas entidades:
   - Vista de conceptos
   - Vista de prompts
   - Vista de notas
   - Vista de atributos
2. Actualizar paneles existentes:
   - Panel de navegación
   - Panel de detalles
   - Panel de relaciones
3. Implementar nuevas interacciones:
   - Drag & Drop para relaciones
   - Búsqueda universal
   - Filtros avanzados

#### Estado Actual

- Schema actualizado y seed.ts completado
- Tipos Prisma generados
- Servicios core implementados
- Server Actions implementadas
- Stores implementados
- Componentes base implementados
- Formularios implementados
- Pendiente implementación de vistas y paneles
