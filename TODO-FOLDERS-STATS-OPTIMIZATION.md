## TODO: FOLDERS-STATS-002 - Optimizar layout de estadísticas y actualización de datos
**STATUS:** EN_PROGRESO
**PRIORIDAD:** ALTA

### SUBTASKS:
- [✅] [CHECKPOINT_1] Analizar layout actual y planificar optimización
- [✅] [CHECKPOINT_2] Modificar FoldersStats para usar grid compacto
- [✅] [CHECKPOINT_3] Verificar actualización automática de datos
- [✅] [CHECKPOINT_4] Probar integración y validar cambios

### CRITERIOS DE ACEPTACIÓN:
- [✅] Las tarjetas de estadísticas usan un grid compacto (no filas separadas)
- [✅] El layout ocupa menos espacio vertical
- [✅] Los datos se actualizan automáticamente
- [✅] El diseño es responsive y mantiene buena UX
- [✅] No hay errores en consola

### VALIDACIÓN:
- [ ] Código compila y tests pasan
- [ ] Layout optimizado funciona en diferentes tamaños de pantalla
- [ ] Datos se refrescan correctamente

### PROBLEMA IDENTIFICADO:
1. El layout actual usa múltiples grids separados (4+3+2 tarjetas) ocupando mucho espacio vertical
2. Las estadísticas no se actualizan automáticamente cuando cambian los datos

### SOLUCIÓN:
1. Unificar todas las tarjetas en un solo grid responsive
2. Verificar que el hook useFolderStats tenga refetch automático
3. Optimizar el espaciado y tamaño de las tarjetas