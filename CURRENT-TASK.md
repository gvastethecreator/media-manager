## TODO: Implementación Completa de Sistema de Vistas

## TODO: Implementación Completa de Sistema de Vistas

### Análisis Arquitectural
[✅] [CRITICAL][BIG] Analizar la arquitectura actual de vistas e identificar patrones de implementación
[✅] [HIGH][MEDIUM] Mapear todas las vistas existentes y su estado actual
[✅] [HIGH][MEDIUM] Definir patrones estándar para vista de listado + vista de contenido

### Implementación de Vistas Base y Navegación

#### 🗂️ Vistas de Archivos y Carpetas
[✅] [CRITICAL][BIG] Implementar vista 'folders' usando FoldersView con navegación a folder-content
[✅] [HIGH][MEDIUM] Corregir 'files' (todos los archivos) - crear AllFilesView
[✅] [HIGH][MEDIUM] Implementar 'all-images' usando AllImagesView existente
[✅] [HIGH][MEDIUM] Implementar 'documents' usando DocumentsView existente
[✅] [HIGH][MEDIUM] Implementar 'audios' - crear AudiosView
[ ] [HIGH][MEDIUM] Implementar 'json-files' - crear JsonFilesView
[✅] [HIGH][MEDIUM] Implementar 'workflows' usando WorkflowsView existente
[ ] [HIGH][MEDIUM] Implementar 'file-3ds' usando File3DView existente

#### 📚 Vistas de Librería
[✅] [HIGH][MEDIUM] Implementar 'favorites' usando FavoritesView existente
[✅] [HIGH][MEDIUM] Implementar 'albums' - crear AlbumsView + album-content
[✅] [HIGH][MEDIUM] Implementar 'groups' - crear GroupsView + group-content
[✅] [HIGH][MEDIUM] Implementar 'tags' usando TagsView + tag-content existentes
[✅] [HIGH][MEDIUM] Implementar 'collections' - crear CollectionsView + collection-content
[✅] [HIGH][MEDIUM] Implementar 'prompts' usando PromptsView + prompt-content existentes

#### 🌍 Vistas de Worldbuilding
[✅] [HIGH][MEDIUM] Implementar 'characters' - crear CharactersView + character-content existente
[✅] [HIGH][MEDIUM] Implementar 'places' usando PlacesView + place-content existentes
[✅] [HIGH][MEDIUM] Implementar 'world-items' usando WorldItemsView + world-item-content existentes
[✅] [HIGH][MEDIUM] Implementar 'concepts' - crear ConceptsView + concept-content
[✅] [HIGH][MEDIUM] Implementar 'wildcards' usando WildcardsView + wildcard-content existentes

### Integración en ViewContainer
[🔄️] [CRITICAL][BIG] Actualizar ViewContainer con todas las vistas implementadas
[🔄️] [HIGH][MEDIUM] Crear mapeo correcto entre navegación y vistas
[ ] [HIGH][MEDIUM] Implementar transiciones suaves entre vistas de listado y contenido

### Validación y Testing
[ ] [MEDIUM][MEDIUM] Validar navegación completa con Playwright MCP
[ ] [MEDIUM][SMALL] Verificar contadores dinámicos en todas las vistas
[ ] [MEDIUM][SMALL] Validar expansión de hijos en navegación lateral

CONTEXTO_REQUERIDO:
- src/components/views/
- src/components/navigation/
- src/store/entities/
- src/types/entities/
- src/lib/api/

ACEPTACIÓN:
- Todas las vistas de navegación funcionales
- Navegación entre listado y contenido operativa
- Contadores dinámicos actualizándose
- Sin errores de tipos TypeScript
- Integración completa en ViewContainer

STATUS: IN_PROGRESS

### PROGRESO ACTUAL:
- ✅ 18 de 21 vistas principales implementadas
- ✅ ViewContainer actualizado con 18 vistas funcionales
- ✅ Corregidos errores críticos de importación (applyFileFilters, NoteSortOption)
- ✅ Validado funcionamiento completo sin errores de consola
- 🔄️ Faltan: json-files, file-3ds, content views

### Errores Críticos Corregidos

- ✅ applyFileFilters - Implementado en transformers/file/filters.ts
- ✅ NoteSortOption - Todas las importaciones corregidas desde enums.ts
- ✅ VideoFormat - Importación corregida desde enums.ts
- ✅ getVideoMetadata - Exportación inexistente removida de utils/index.ts
- ✅ FileWithStats - Importaciones unificadas
- ✅ FileFilterOptions - Tipos correctos
- ✅ Exportaciones index.ts - Divididas correctamente entre enums y types

### Patrón de Implementación Estándar

**Para cada vista de listado:**
1. Usar BaseContentView o crear vista específica usando stores Zustand
2. Renderizar tarjetas de entidades con navegación al contenido
3. Integrar filtros, búsqueda y selección
4. Manejar estados de carga, error y vacío

**Para cada vista de contenido:**
1. Usar FileBrowser con filtrado por entidad padre
2. Integrar ViewToolbar para controles
3. Manejar selección y navegación
4. Estados optimistas y validación

CONTEXTO_REQUERIDO:
- src/components/views/
- src/components/navigation/
- src/store/entities/
- src/types/entities/
- src/lib/api/

ACEPTACIÓN:
- Todas las vistas de navegación funcionales
- Navegación entre listado y contenido operativa
- Contadores dinámicos actualizándose
- Sin errores de tipos TypeScript
- Integración completa en ViewContainer

STATUS: PENDING → IN_PROGRESS

Leyenda: [ ] No iniciado | [🔄️] En Progreso | [✅] Completado | [🟥] Removido
