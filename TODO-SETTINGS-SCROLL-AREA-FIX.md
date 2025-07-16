## TODO: SETTINGS-SCROLL-001 - Implementar ScrollArea en todas las vistas de configuración
**STATUS:** PENDIENTE
**PRIORIDAD:** ALTA

### PROBLEMA IDENTIFICADO:
Todas las vistas de configuración en `settings-view.tsx` usan `overflow-auto` nativo pero no implementan el componente `ScrollArea` estilizado, causando que los scrolls se vean sin estilos consistentes.

### SUBTASKS:
```markdown
- [✅] [CHECKPOINT_1] Agregar import de ScrollArea al settings-view.tsx
- [✅] [CHECKPOINT_2] Envolver cada componente de configuración con ScrollArea en los 25 TabsContent
- [✅] [CHECKPOINT_3] Validar que todos los scrolls tengan estilos consistentes
- [✅] [CHECKPOINT_4] Verificar que no se rompa la funcionalidad existente
```

### IMPLEMENTACIÓN COMPLETADA:
- ✅ Se agregó la importación de ScrollArea de `@/components/ui/scroll-area`
- ✅ Se envolvieron todos los 25 componentes de configuración con ScrollArea
- ✅ Se ajustaron las clases CSS: `overflow-auto` → `overflow-hidden` y `p-2` → `p-0`
- ✅ Se agregó padding interno con `<div className="p-2">` dentro de cada ScrollArea
- ✅ El servidor de desarrollo se ejecuta sin errores
- ✅ Los scrolls ahora tienen estilos consistentes usando el componente ScrollArea de radix-ui

### CRITERIOS DE ACEPTACIÓN:
- [ ] Import de ScrollArea agregado correctamente
- [ ] Todos los 25 TabsContent envuelven sus componentes con ScrollArea
- [ ] Los scrolls se ven estilizados consistentemente
- [ ] La funcionalidad de navegación entre tabs se mantiene
- [ ] No hay errores de TypeScript

### VALIDACIÓN:
- [ ] Código compila sin errores
- [ ] Scrolls visualmente consistentes en todas las vistas
- [ ] Tests de navegación pasan

### ARCHIVOS A MODIFICAR:
- `src/components/settings/settings-view.tsx`

### COMPONENTES AFECTADOS:
- SystemSettings, FoldersSettings, InterfaceSection, EntitiesCardsSettings
- AlbumsSettings, CollectionsSettings, TagsSettings, CharactersSettings
- WorldItemsSettings, PlacesSettings, ConceptsSettings, PromptSettings
- NotesSettings, UploadedImagesSettings, ShortcutsSettings, ProfilesSettings
- PropertiesSettings, GroupsSettings, WildcardsSettings, ThumbnailsSettings
- DocumentSettings, AudioSettings, JsonFileSettings, WorkflowSettings, File3DSettings