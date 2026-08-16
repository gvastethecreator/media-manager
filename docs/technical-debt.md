# Deuda técnica priorizada — 2026-08-11

| Prioridad | Deuda                                                             | Impacto                                                             | Próxima acción                                                        |
| --------- | ----------------------------------------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------- |
| P1        | Empaquetado Tauri no probado fuera del checkout                   | No hay instalable reproducible con backend nativo                   | Definir bundle, supervisión, firma e instalación limpia               |
| P1        | E2E y smoke de preview aún no cerrados tras upgrades              | Falta evidencia de integración navegador                            | Ejecutar `bun run build` + `bun run test:e2e` contra preview          |
| P2        | Warnings a11y en file-browser/viewer/cards                        | Navegación por teclado y labels incompletos                         | Sustituir handlers no interactivos por controles semánticos           |
| P2        | Tests de `skills/effect-solutions-main` con expects fuera de test | Ruido de lint y riesgo de mantenimiento                             | Encapsular casos en tests explícitos o excluir la fixture documentada |
| P2        | Adapter TanStack Table v9 legacy                                  | Mantiene API v8 compatible, pero oculta el modelo de features nuevo | Migrar componentes a `useTable`/features v9 por dominio               |
| P3        | Chunks grandes en build histórico                                 | Tiempo de carga inicial                                             | Medir bundle actual y dividir viewers 3D/media por ruta               |
| P3        | Archivos históricos bajo `docs/core` y auditorías                 | Puede confundir a nuevos colaboradores                              | Marcar fecha/estado y enlazar desde una única entrada                 |

No se eliminó deuda funcional sin evidencia: los warnings y gates abiertos
quedan visibles para el siguiente ciclo.
