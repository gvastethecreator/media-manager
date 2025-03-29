# Tareas para Verificar Alineación del Esquema con el Proyecto

## Introducción

Hemos actualizado el esquema de Prisma (`schema.prisma`) y necesitamos verificar que todos los componentes del proyecto estén correctamente alineados con esta estructura. También estamos en proceso de migración de Prisma a Drizzle, lo que requiere una atención especial para garantizar la compatibilidad y consistencia.

## Inconsistencias Detectadas

### 🚨 Problemas de Estructura en Tipos de Entidades

2. **Disparidad en importaciones**:
   - Algunas entidades importan `Album` desde `../album/types` mientras otras lo hacen desde `../album/album-types`
   - Esto puede llevar a errores de compilación y referencias circulares, hay que revisar y corregir este tipo de errores en todas las otras entidades

3. **Incompatibilidad en interfaces de relaciones**:
   - Las entidades `Album` y `Collection` tienen interfaz `AlbumBase` y `CollectionBase` con propiedades que deberían ser consistentes
   - `AlbumBase` incluye propiedades como `sortBy` y `filters` que deben verificarse en todas las entidades

### 🚨 Campos Obsoletos o Renombrados

1. **Campos nuevos no reflejados en interfaces**:
   - El campo `parentId` existe en el esquema para `Wildcard` pero no está presente en todos los tipos

2. **Propiedades en Collection no reflejadas en los tipos**:
   - `Collection` tiene campo `editions` como un string en el esquema, pero en algunos tipos está tratado como un array
   - `alternativeUrl` presente en el esquema, pero no en todos los transformadores

3. **Inconsistencia en valores por defecto**:
   - Diferencia entre valores por defecto en el esquema y en los transformadores
   - Ejemplo: `emoji` tiene valores diferentes en distintos archivos

### 🚨 Problemas Específicos por Entidad

1. **Character**:
   - En el schema, los campos como `relationships`, `goals`, etc. son strings con valor por defecto "empty_array", pero en los tipos deberían ser manejados como arrays
   - Se está usando una auto-referencia `type Character = CharacterWithRelations` que podría causar confusión con el tipo importado desde Prisma ✅
   - La estructura de `stats` debería ser manipulada consistentemente entre el tipo básico y el tipo extendido

2. **WorldItem**:
   - Los campos `attributes` y `effects` están definidos como strings en el esquema pero deberían ser tratados como arrays en la aplicación ✅
   - Falta `sortBy` y `filters` en algunas interfaces de creación/actualización ✅
   - El campo `size` tiene valores predefinidos que no se están validando en los tipos ✅

3. **Prompt**:
   - El campo `purpose` existe en el esquema pero no está siendo utilizado consistentemente en todas las interfaces ✅
   - El campo `parameters` debería ser tratado como un objeto JSON pero está definido como string ✅
   - El campo `tags` podría entrar en conflicto con la relación con entidades Tag ✅

4. **Note**:
   - La propiedad `title` no está alineada con otras entidades que usan `name` para el título principal
   - Faltan campos de configuración como `sortBy` y `filters` que existen en otras entidades

## Tareas de Verificación por Componentes

### 1. ✅ Tipos y Definiciones

- [x] Verificar tipos en `src/types/prisma.ts` y asegurar que incluyan todas las entidades del esquema actualizado
  - ✓ Los tipos básicos (QueueJob, Profile, Settings, Folder, Image, Video) existen
  - ✓ Los tipos de entidades organizativas (Album, Collection, Tag, Group) están definidos
  - ✓ Los tipos de entidades de mundo (Character, Place, WorldItem) están definidos
  - ✓ Los tipos de entidades de contenido (Concept, Prompt, Note) están definidos
  - ✓ Los nuevos tipos (Property, Wildcard) están incluidos
  - ✓ Los tipos extendidos con estadísticas para cada entidad están definidos

- [x] Revisar tipos específicos de entidades en `src/types/entities/*` para alineación con el esquema
  - ✓ Todos los directorios para entidades existen y corresponden con las entidades en el esquema
  - ✓ Los tipos de Group están completos e incluyen todas las propiedades del esquema
  - ✓ Los tipos de Wildcard son correctos e incluyen la estructura jerárquica
  - ✓ Los tipos de Property incluyen todas las propiedades y relaciones necesarias
  - ✓ Cada entidad tiene sus interfaces base, con relaciones y operaciones CRUD

- [x] Comparar tipos de Drizzle en `src/types/drizzle/*` con los tipos de Prisma para garantizar compatibilidad
  - ✓ Los tipos de Drizzle para Group están definidos y alineados con los de Prisma
  - ✓ Los tipos de Drizzle para Wildcard preservan todas las propiedades importantes
  - ✓ Los tipos de Drizzle para Property mantienen la misma estructura
  - ✓ Los tipos base (CommonFilters, EntityCounts, OrganizationFields) son consistentes
  - ✓ Los tipos para operaciones CRUD son compatibles entre ambos ORM

- [x] Asegurar que los tipos extendidos (como `WithStats`) incluyan todas las propiedades necesarias
  - ✓ `GroupWithStats` incluye contadores para todas las relaciones relevantes
  - ✓ `WildcardWithStats` incluye conteo de `childWildcards` para la estructura jerárquica
  - ✓ `PropertyWithStats` incluye contador de uso para análisis
  - ✓ `CharacterExtended` incluye parsers para todas las propiedades JSON
  - ✓ Los tipos extendidos en Drizzle preservan estas mismas estadísticas
  - ✓ Las interfaces de conteo `EntityCounts` incluyen todas las entidades

### 2. ✅ Stores y Estado

- [x] Verificar tiendas principales en `src/store/*.store.ts` para compatibilidad con el esquema
  - ✓ Revisar `ui.store.ts` para opciones de visualización de nuevas entidades
  - ✓ Verificar `image-resources.store.ts` para manejo de recursos
  - ✓ Comprobar `thumbnails.store.ts` para compatibilidad con nuevos tipos
  - ✓ Examinar `settings.store.ts` para configuraciones relacionadas con nuevas entidades
  - ✓ Validar `search.store.ts` para búsqueda en nuevas entidades

- [x] Revisar tiendas específicas de entidades en `src/store/entities/*` para alineación con modelos
  - ✓ Las tiendas para Group están estructuradas correctamente con slices para core, UI y filtros
  - ✓ Las tiendas para Wildcard incluyen operaciones para la estructura jerárquica
  - ✓ Las tiendas para Property gestionan correctamente las relaciones
  - ✓ Todas las operaciones CRUD están implementadas
  - ✓ Se utilizan patrones consistentes (slices, persistencia, devtools)

- [x] Asegurar que los selectores y acciones en las tiendas funcionen con la estructura actual
  - ✓ Los selectores acceden correctamente a los nuevos campos
  - ✓ Las acciones manipulan apropiadamente todas las propiedades
  - ✓ Las acciones asíncronas utilizan correctamente las operaciones del esquema
  - ✓ La persistencia preserva los datos correctos

- [ ] Identificar y actualizar campos obsoletos o renombrados en las tiendas
  - [ ] Verificar campos como `editions` en Collection para asegurar consistencia
  - [ ] Revisar los transformadores para asegurar que manejen campos como `alternativeUrl` correctamente
  - [ ] Actualizar referencias a campos que han cambiado de tipo (string vs array)
  - [ ] Verificar que los campos JSON almacenados como strings se procesen adecuadamente (relationships, goals, etc.)

### 3. ✅ Transformadores y Mappers

- [x] Verificar transformadores en `src/transformers/*` para conversión correcta entre modelos y DTOs
  - ✓ Los transformadores de Group gestionan correctamente todos los campos del modelo
  - ✓ Los transformadores de Wildcard mantienen la estructura jerárquica
  - ✓ Los transformadores de Property mapean correctamente propiedades y relaciones
  - ✓ Las funciones de mapeo incluyen validaciones de datos
  - ✓ Los transformadores mantienen la consistencia en todos los tipos de entidades

- [x] Revisar transformadores específicos de Drizzle para mapeo correcto desde/hacia modelos Prisma
  - ✓ El módulo `prisma-to-drizzle.ts` proporciona transformación completa para nuevas entidades
  - ✓ El módulo `drizzle-to-prisma.ts` gestiona correctamente la conversión inversa
  - ✓ Los transformadores manejan correctamente tipos de datos especiales (JSON, fechas)
  - ✓ Los campos opcionales se tratan adecuadamente en ambas direcciones
  - ✓ Los valores por defecto se aplican correctamente cuando es necesario

- [x] Asegurar que todos los nuevos campos estén incluidos en los transformadores
  - [x] Revisar transformadores de Album para incluir campos como `sortBy` y `filters`
  - [x] Verificar que los transformadores de Collection manejen correctamente los campos externos
  - [x] Actualizar transformadores para Wildcard con manejo adecuado de `parentId` y jerarquías
  - [x] Implementar serialización/deserialización para campos como `relationships` en Character
  - [x] Asegurar que `attributes` y `effects` en WorldItem se procesen correctamente como arrays

- [ ] Validar que los campos renombrados o eliminados se manejen correctamente
  - [ ] Identificar y actualizar referencias a campos obsoletos en transformadores
  - [ ] Asegurar consistencia en nombres de campos entre el esquema y los transformadores
  - [ ] Verificar que los campos especiales como `parameters` en Prompt se procesen adecuadamente

### 4. ✅ Acciones del Servidor

- [x] Revisar acciones del servidor en `src/server/actions/*` y `src/app/actions/*` para compatibilidad con el esquema
  - ✓ Las acciones para Profile en `src/server/actions/profile-actions.ts` son compatibles
  - ✓ Las acciones para Group en `src/app/actions/groups/group.actions.ts` son compatibles
  - ✓ Las estructuras de carpetas en `src/app/actions/*` incluyen todas las entidades
  - ✓ Los parámetros y retornos de acciones son compatibles con los tipos definidos
  - ✓ Las validaciones están implementadas correctamente

- [ ] Verificar operaciones CRUD para cada entidad principal
  - [ ] Album: Actualizar operaciones para soportar nuevos campos como `sortBy` y `filters`
  - [ ] Collection: Verificar manejo correcto de campos externos y relaciones
  - [ ] Wildcard: Asegurar operaciones para manejo de estructura jerárquica
  - [x] Character: Verificar el procesamiento correcto de campos JSON almacenados como strings
  - [x] Prompt: Asegurar que el campo `parameters` se maneje correctamente
  - [x] WorldItem: Verificar manejo adecuado de `attributes` y `effects`

- [ ] Asegurar que las relaciones entre entidades se manejen correctamente
  - [ ] Verificar que las operaciones de relación manejen nuevas entidades (Property, Wildcard, Group)
  - [ ] Comprobar consistencia en operaciones de relación entre todas las entidades
  - [ ] Verificar relaciones auto-referenciadas en Character (relatedCharacters y relatedTo)
  - [x] Validar manejo de relaciones en WorldItem (images, notes, concepts, prompts)

- [ ] Validar manejo de campos obsoletos o renombrados
  - [ ] Identificar y actualizar referencias a campos obsoletos en acciones del servidor
  - [ ] Asegurar que las acciones manejen correctamente los tipos de datos actualizados
  - [x] Implementar validaciones para campos con valores predefinidos (como `size` en WorldItem)

### 5. ✅ Componentes de UI

- [x] Revisar componentes de formulario en `src/components/forms/*` para alineación con esquema
  - [x] Verificar formularios para WorldItem para uso correcto de transformadores
  - [ ] Revisar formularios para otras entidades
- [x] Verificar componentes de visualización para mostrar correctamente todos los campos
  - [x] Confirmar que WorldItemView y WorldItemCard muestran correctamente datos parseados
  - [ ] Revisar componentes para otras entidades
- [x] Revisar validación de formularios para nuevos campos o restricciones
  - [x] Verificar que los validadores de WorldItem son compatibles con los tipos
  - [ ] Revisar validadores para otras entidades
- [x] Asegurar que los componentes de tabla y lista muestren datos actualizados
  - [x] Confirmar que las listas de WorldItems muestran correctamente campos transformados
  - [ ] Revisar listas y tablas para otras entidades

### 6. ✅ Migraciones y Esquema de Drizzle

- [ ] Verificar que el esquema de Drizzle en `src/drizzle/schema/*` esté alineado con el esquema de Prisma
- [ ] Revisar las estrategias de migración para la transición de Prisma a Drizzle
- [ ] Asegurar que las relaciones se definan correctamente en ambos ORM
- [ ] Validar tipos de datos y restricciones entre ambos esquemas

### 7. ✅ Funcionalidad Específica por Módulo

- [ ] Revisar módulo de Perfiles y Configuración
- [ ] Verificar módulo de Carpetas e Imágenes
- [ ] Revisar módulo de Álbumes y Colecciones
- [ ] Verificar módulo de Etiquetas y Propiedades
- [ ] Revisar módulo de Personajes, Lugares e Ítems de Mundo
- [ ] Verificar módulo de Conceptos, Prompts y Notas
- [ ] Revisar módulo de Comodines y Grupos
- [ ] Verificar sistema de Colas (QueueJob)

## Tareas de Limpieza

- [ ] Identificar y eliminar referencias a campos obsoletos
  - [ ] Buscar referencias a campos que ya no existen en el esquema
  - [ ] Eliminar importaciones y usos de tipos obsoletos

- [ ] Remover código relacionado con entidades eliminadas
  - [ ] Buscar y eliminar componentes, hooks o utilidades para entidades que ya no se utilizan

- [ ] Actualizar comentarios y documentación para reflejar cambios en el esquema
  - [ ] Revisar y actualizar documentación en JSDoc para reflejar la estructura actual
  - [ ] Actualizar ejemplos de uso que puedan estar utilizando campos obsoletos

- [ ] Refactorizar código utilizando patrones consistentes en todo el proyecto
  - [ ] Estandarizar nombres de archivos (resolver la inconsistencia `types.ts` vs `[entity]-types.ts`)
  - [ ] Unificar patrones de importación entre los diferentes módulos
  - [ ] Establecer un patrón consistente para manejar campos JSON almacenados como strings

## Tareas de Pruebas

- [ ] Desarrollar pruebas para verificar la integridad de los datos durante la migración
- [ ] Probar operaciones CRUD para cada entidad con el esquema actualizado
- [ ] Verificar consultas complejas que involucren relaciones entre múltiples entidades
- [ ] Validar la funcionalidad del sistema de colas con el nuevo esquema

## Consideraciones Adicionales

- [ ] Evaluar el impacto de los cambios en el rendimiento del sistema
- [ ] Considerar estrategias para migración de datos existentes
- [ ] Planificar la implementación progresiva para minimizar interrupciones
- [ ] Documentar cambios importantes para referencia futura

## Notas sobre Migración a Drizzle

- Estamos migrando gradualmente de Prisma a Drizzle como se menciona en el esquema
- Actualmente tenemos implementaciones paralelas para garantizar compatibilidad
- Los transformadores en `src/transformers/drizzle/*` facilitan la conversión entre ambos ORM
- Las definiciones de tipos en `src/types/drizzle/*` son cruciales para esta transición

## Resumen de Progreso

### Entidad WorldItem (Completado ✅)

Hemos completado una revisión exhaustiva de la entidad WorldItem:

1. **Tipos y Definiciones:**
   - ✅ Documentación clara de campos JSON en interfaces
   - ✅ Implementación de enums para valores predefinidos
   - ✅ Resolución de conflictos de tipos

2. **Transformadores:**
   - ✅ Serializadores para todos los campos JSON
   - ✅ Mappers para operaciones CRUD
   - ✅ Correcta manipulación de datos entre UI y base de datos

3. **Acciones del Servidor:**
   - ✅ Uso correcto de transformadores en operaciones CRUD
   - ✅ Manejo adecuado de relaciones
   - ✅ Validación de datos consistente

4. **Componentes de UI:**
   - ✅ Formularios actualizados para usar tipos correctos
   - ✅ Componentes que muestran correctamente datos parseados
   - ✅ Validación coherente con tipos definidos

### Próximos Pasos

1. Continuar con la revisión de otras entidades siguiendo el mismo enfoque metodológico:
   - ✅ Character (análisis completo, implementación completada)
   - ✅ Prompt (análisis completo, implementación correcta)
   - ✅ WorldItem (análisis completo, implementación completada)
   - ✅ Collection (análisis completo, implementación completada)
   - ⏳ Folder
   - ⏳ Place
   - ⏳ File
   - ⏳ Tag
   - ⏳ Image
   - ⏳ User
   - ⏳ Group

2. Estandarizar patrones de exportación e importación en todas las entidades

3. Implementar pruebas para validar la integridad de datos durante y después de la migración a Drizzle

# ESTADO DEL PROYECTO

## TAREA ACTUAL

Mejorar la estructura de tipos y serializadores para todas las entidades.

## Entidades revisadas

- [x] Character
- [x] Prompt
- [x] WorldItem
- [x] Album
- [x] Collection
- [x] Folder
- [x] Place
- [x] Tag
- [x] Image
- [x] Video
- [ ] Note
- [ ] Concept
- [ ] Property
- [ ] Wildcard

## Para cada entidad

1. Revisar los campos JSON en el modelo de Prisma
2. Documentar qué campos son serializados como JSON
3. Crear tipos para deserialización (interfaz XxxComplete)
4. Implementar serializadores robustos para campos JSON
5. Actualizar transformadores con toXxxComplete y fromXxxComplete
6. Actualizar mappers para usar los nuevos transformadores
7. Refactorizar server actions para utilizar los transformadores
8. Implementar tests básicos de CRUD

### Notas importantes

- Documentar claramente los campos JSON y su estructura esperada
- Seguir un patrón de nombrado consistente para objetos completados
- Mantener coherencia en los patrones utilizados en todas las entidades

# Tarea Actual: Mejora de la Estructura de Datos

## Estado del Proyecto

| Entidad     | Estado       |
|-------------|--------------|
| Character   | ✅ Completado |
| Prompt      | ✅ Completado |
| WorldItem   | ✅ Completado |
| Album       | ✅ Completado |
| Collection  | ✅ Completado |
| Folder      | ✅ Completado |
| Place       | ✅ Completado |
| Tag         | ✅ Completado |
| Image       | ✅ Completado |
| Video       | ✅ Completado |
| Note        | 🔄 En curso  |
| Concept     | ⏳ Pendiente  |
| Property    | ⏳ Pendiente  |
| Wildcard    | ⏳ Pendiente  |

## Descripción

Estamos implementando mejoras en la estructura de datos de la aplicación para garantizar una mejor tipificación, serialización/deserialización de campos JSON, y reducción de errores potenciales.

## Tareas para cada entidad

1. **Revisar campos JSON en el modelo de Prisma**
   - Identificar todos los campos JSON que requieren serialización/deserialización
   - Documentar claramente el propósito y estructura de cada campo

2. **Crear tipos adecuados para deserialización**
   - Definir interfaces específicas (ej: `EntityComplete`, `EntityExtendedComplete`)
   - Implementar tipos para estructuras JSON internas cuando sea necesario

3. **Implementar serializadores robustos**
   - Crear funciones `toEntityComplete` y `fromEntityComplete`
   - Implementar serializadores específicos para cada campo JSON

4. **Actualizar transformadores**
   - Refactorizar funciones de mapeo para usar los nuevos tipos
   - Mantener consistencia con el patrón establecido

5. **Refactorizar acciones del servidor**
   - Actualizar firmas de funciones para devolver tipos consistentes
   - Mejorar manejo de errores y logging

## Patrones a seguir

- **Nomenclatura consistente**: Usar sufijos `Complete` y `ExtendedComplete` para tipos deserializados
- **Transformación en dos etapas**: Primero a `Complete` (deserializado) y luego a `ExtendedComplete` (con propiedades UI)
- **Manejo explícito de errores**: Usar logger específico de contexto en cada transformador
- **Evitar duplicación**: Mantener lógica de serialización/deserialización en un solo lugar

## Próxima Entidad: Note

Enfoque específico para la entidad Note:
- Revisar la estructura de campos JSON (`content` y otros campos potenciales)
- Implementar tipos para la representación completa de notas
- Mejorar los transformadores para mantener consistencia con otras entidades
- Actualizar acciones del servidor para utilizar los nuevos tipos
- Verificar el manejo adecuado del campo `title` vs. el patrón `name` usado en otras entidades
