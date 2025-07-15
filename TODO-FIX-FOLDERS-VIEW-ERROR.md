## TODO: FIX-FOLDERS-VIEW-001 - Corregir error "folders is not iterable"
**STATUS:** COMPLETADO
**PRIORIDAD:** CRÍTICA

### PROBLEMA IDENTIFICADO:
El hook `useFolders()` retorna un objeto `FoldersResponse` con estructura `{data, pagination}`, pero en `folders-view.tsx` se está desestructurando incorrectamente como `{folders, isLoading, error, refetch}` cuando debería ser `{data, isLoading, error, refetch}`.

### SUBTASKS:
- [✅] [CHECKPOINT_1] Corregir desestructuración del hook useFolders
- [✅] [CHECKPOINT_2] Actualizar referencias a 'folders' por 'data'
- [✅] [CHECKPOINT_3] Verificar que useCreateFolder también retorne estructura correcta
- [✅] [CHECKPOINT_4] Probar la aplicación para confirmar que el error se resuelve

### CRITERIOS DE ACEPTACIÓN:
- [x] La aplicación carga sin errores de runtime
- [x] Las carpetas se muestran correctamente en la vista
- [x] La funcionalidad de crear carpetas funciona
- [x] No hay errores en la consola del navegador

### VALIDACIÓN:
- [x] Código compila sin errores
- [x] Tests de runtime pasan
- [x] Funcionalidad verificada en navegador