## TODO: TS-PHASE2-001 - Limpieza de Código Legacy y Consolidación
**STATUS:** PENDIENTE
**PRIORIDAD:** ALTA

### SUBTASKS:
- [⏳] [CHECKPOINT_1] Eliminar archivos temporales y legacy
- [⏳] [CHECKPOINT_2] Consolidar documentación TODO dispersa
- [⏳] [CHECKPOINT_3] Limpiar scripts de migración completados
- [⏳] [CHECKPOINT_4] Revisar y optimizar imports no utilizados
- [⏳] [CHECKPOINT_5] Validar estructura de proyecto limpia

### CRITERIOS DE ACEPTACIÓN:
- [ ] Archivos temporales eliminados (files-temp.ts, profiles-fixed.ts, backups)
- [ ] TODOs consolidados en un solo documento de seguimiento
- [ ] Scripts de migración archivados apropiadamente
- [ ] Imports no utilizados removidos
- [ ] Estructura de proyecto optimizada

### VALIDACIÓN:
- [ ] Proyecto compila sin errores después de limpieza
- [ ] No hay referencias rotas a archivos eliminados
- [ ] Documentación consolidada y actualizada
- [ ] Performance de build mejorado

### ARCHIVOS ESPECÍFICOS A LIMPIAR:

#### 1. Archivos Temporales a Eliminar:
- `src/server/routes/files-temp.ts`
- `src/server/routes/profiles-fixed.ts`
- `vite.config.ts.backup-2025-07-22`
- `bunfig.toml.backup-2025-07-22`

#### 2. TODOs a Consolidar:
- `TODO-TYPESCRIPT-FIXES*.md`
- `TODO-ENTITYSTATSTYPE-FIX.md`
- `TODO-SERVER-WEBSOCKET-FIX.md`
- `CLEANUP-DEBUGGING-TODO.md`

#### 3. Scripts de Migración a Archivar:
- `scripts/migration/bun-migration-prep.js`
- `scripts/migration/fase3-checkpoint1-prep.js`
- `scripts/migration/fase3-migration-plan.js`

#### 4. Documentación Legacy a Revisar:
- `docs/migration-*` (consolidar completados)
- `ARREGLOS-COMPLETADOS-2025-07-21.md`
- Logs antiguos en `/logs`

### IMPACTO ESPERADO:
- Reducción del 20% en tamaño de proyecto
- Mejora en tiempo de build
- Estructura más clara para desarrollo
- Documentación consolidada y útil

### RIESGOS:
- Eliminar archivos con dependencias ocultas
- Perder historial importante de cambios

### MITIGACIÓN:
- Crear backup antes de eliminar
- Verificar referencias con grep antes de eliminar
- Archivar en lugar de eliminar documentación importante