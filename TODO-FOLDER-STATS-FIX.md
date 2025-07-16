## TODO: FOLDER-STATS-001 - Solucionar error "Query data cannot be undefined"
**STATUS:** COMPLETADO ✅
**PRIORIDAD:** ALTA

### SUBTASKS:
- [✅] [CHECKPOINT_1] Modificar useFolderStats para manejar null correctamente
- [✅] [CHECKPOINT_2] Validar que el hook funciona con datos por defecto
- [✅] [CHECKPOINT_3] Probar la integración en FoldersSettings
- [✅] [CHECKPOINT_4] Verificar que no hay errores en consola

### CRITERIOS DE ACEPTACIÓN:
- [✅] El hook useFolderStats nunca retorna undefined
- [✅] La query folder-stats funciona correctamente
- [✅] No hay errores en la consola del navegador
- [✅] FoldersSettings muestra estadísticas o valores por defecto

### VALIDACIÓN:
- [✅] Código compila y tests pasan
- [✅] Documentación y métricas actualizadas

### PROBLEMA IDENTIFICADO:
La función getFolderStats() en stats.service.ts puede retornar null cuando hay errores, pero React Query espera que queryFn siempre retorne datos válidos. Esto causa el error "Query data cannot be undefined" en settings-view.tsx:254.

### SOLUCIÓN:
Modificar el hook useFolderStats para que transforme null en un objeto FolderStats con valores por defecto.