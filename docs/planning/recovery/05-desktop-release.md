# Waves 7–8 — Desktop, distribución y operación

Resultado: Media Manager se instala, actualiza, recupera y soporta como aplicación. Tauri empieza sólo cuando web-local y
los flujos críticos tienen gates verdes.

## Wave 7 — Runtime desktop

### DESKTOP-001 — Arquitectura del sidecar

- [ ] Elegir backend: binario Bun compilado, runtime embebido o sidecar dedicado; registrar ADR.
- [ ] Empaquetar binario y recursos mínimos, no `db.sqlite` de desarrollo.
- [ ] Rust genera puerto/token, arranca proceso y espera ready health.
- [ ] Frontend recibe endpoint/token mediante canal Tauri seguro.
- [ ] Restart/backoff limitado; crash loop muestra recovery UI.
- [ ] Shutdown mata child y espera flush/checkpoint.

### DESKTOP-002 — Data dir y lifecycle

- [ ] DB, logs, cache, backups y config bajo dirs por plataforma.
- [ ] Migrar desde rutas legacy con backup y detección idempotente.
- [ ] Separar assets bundled read-only de datos mutables.
- [ ] Espacio libre y permisos verificados antes de migrar/indexar.
- [ ] Multiple instance lock o comportamiento explícito.

### DESKTOP-003 — Capabilities y CSP

- [ ] CSP mínima compatible con assets/API local.
- [ ] Tauri capabilities sólo para comandos necesarios.
- [ ] Shell/fs plugins con allowlists estrictas o retirados si no se usan.
- [ ] Navegación externa mediante opener seguro y confirmación cuando aplique.
- [ ] Security review de IPC payloads.

### DESKTOP-004 — Packaging reproducible

- [ ] `cargo check` funciona sin artefactos manuales faltantes.
- [ ] `beforeBuildCommand` produce todos los recursos declarados.
- [ ] Versiones frontend/backend/schema/Tauri alineadas.
- [ ] Iconos, metadata, license, publisher y identifiers finales.
- [ ] Build limpio en CI Windows.

### DESKTOP-005 — Installer smoke

- [ ] Instalar en perfil/máquina limpia.
- [ ] Primer arranque crea/migra DB y muestra onboarding.
- [ ] Registrar root fixture, indexar, buscar, abrir y operar archivo.
- [ ] Reiniciar y comprobar persistencia.
- [ ] Desinstalar no borra datos sin opción explícita.

## Wave 8 — Release y soporte

### RELS-001 — Versionado y compatibilidad

- [ ] SemVer/canal y matriz app ↔ backend ↔ schema.
- [ ] Política de upgrade desde versiones soportadas.
- [ ] Backup automático y rollback/restore documentado.
- [ ] Bloquear downgrade incompatible con mensaje accionable.

### RELS-002 — Firma y update

- [ ] Firma de código/installer y custodia de secretos fuera del repo.
- [ ] Update feed autenticado y staged rollout si se habilita auto-update.
- [ ] Verificación de checksum/signature antes de instalar.
- [ ] Recuperación si update se interrumpe.

### RELS-003 — Release gate

- [ ] Lockfile frozen, SBOM, licenses y dependency audit.
- [ ] Migration/backup/restore tests.
- [ ] Unit/integration/API/E2E críticos verdes.
- [ ] Build web/server/Tauri reproducible.
- [ ] Installer/upgrade smoke y artifacts checksums.
- [ ] Performance/a11y budgets verdes.
- [ ] Release notes honestas y known issues.

### RELS-004 — Privacidad y soporte

- [ ] Política local-first: qué datos salen, idealmente ninguno por default.
- [ ] Telemetría sólo opt-in, minimizada y documentada.
- [ ] Support bundles redacted con preview antes de compartir.
- [ ] Crash reports sin paths/nombres/contenido personal.
- [ ] Data export/delete y ubicación de backups documentados.

### RELS-005 — Operación posterior

- [ ] Severity/incident process para corrupción/pérdida/seguridad.
- [ ] Métricas de crash/startup/migration/reindex sin violar privacidad.
- [ ] Cadencia de dependency/security maintenance.
- [ ] Prueba periódica de restore y corpus grande.
- [ ] Ledger de deuda con owner/expiry; no nuevos “complete” sin evidence.

## Targets de soporte iniciales recomendados

- Windows x64 como primer target, porque es el entorno real observado.
- Web-local como modo técnico de soporte y diagnóstico.
- macOS/Linux sólo después de definir fixtures, CI y permisos filesystem específicos.
- No prometer network shares/UNC hasta cerrar la decisión de root policy y pruebas.

## Rollback mínimo

Todo release con cambio de schema debe incluir:

1. Backup pre-upgrade con hash.
2. Migration manifest y log.
3. Detector de startup incompleto.
4. Restore a archivo nuevo, no overwrite inmediato.
5. Verificación de conteos/integridad.
6. UI/CLI que explica cómo recuperar sin manipular SQLite manualmente.

## Programa final exit gate

- [ ] Instalación y upgrade soportados pasan en máquina limpia.
- [ ] Sidecar lifecycle y security boundaries probados.
- [ ] DB y media sobreviven crash/restart/update/restore scenarios.
- [ ] Artefactos firmados/reproducibles con licenses/SBOM.
- [ ] Flujos originales pasan E2E sobre installer.
- [ ] Runbooks de release/incidente/restore fueron ensayados, no sólo escritos.
- [ ] Auditoría inicial P0/P1 cerrada con evidencia enlazada.
