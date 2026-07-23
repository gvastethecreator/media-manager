# Estabilidad del runner Vite+ en Windows

Fecha: 2026-07-23.

## Pregunta

¿La configuración duplicada de pruebas explica o agrava los `ENOENT` intermitentes del module runner al ejecutar la
suite completa, y cuál es el cambio seguro antes de modificar el pool?

## Evidencia local

- Runtime: Bun 1.3.14. El proyecto usa `vite-plus`, `@voidzero-dev/vite-plus-core` y
  `@voidzero-dev/vite-plus-test` 0.1.20.
- Hay dos fuentes completas de configuración: `vite.config.ts` y `vitest.config.ts`. Ambas definen entorno jsdom,
  pool `forks`, aislamiento, dos workers y la misma selección de archivos; difieren en algunos detalles de secuencia.
- Dos ejecuciones de `bun run test` produjeron resultados distintos:
  - 806/808 tests pasaron; dos aserciones nuevas de `use-delete` esperaban una ruta relativa aunque el cliente usa la
    URL absoluta del mismo origen en producción.
  - Tras corregir esa expectativa, 794 tests pasaron y siete archivos no llegaron a ejecutarse por `ENOENT` al leer
    módulos temporales bajo `AppData/Local/Temp/.../client/...`.
- Los siete archivos afectados pasan solos y juntos con uno y dos workers. Esto descarta una falla funcional focal y
  apunta a un recurso temporal del runner que aparece tras una suite extensa.
- Al retirar la configuración separada, el arranque mostró otro acoplamiento: el proxy de desarrollo de `vite.config.ts`
  exigía un token de sesión durante tests. El runner aislado ya establece `NODE_ENV=test`; sin token el proxy queda
  desactivado. Las pruebas de tooling que sí aportan token conservan el proxy para verificar la sesión local.
- La primera ejecución con el config unificado también aplicó los aliases de build que sustituyen `crypto`, `fs` y otros
  módulos Node por un módulo vacío. Eso produjo fallas reales en servicios. Los aliases de build quedan ahora fuera de
  `NODE_ENV=test`; tres suites de servicios afectadas volvieron a pasar (137 tests).

## Fuentes primarias

- [Vite+ Test](https://viteplus.dev/guide/test): Vite+ declara que su comando de pruebas se basa en Vitest y recomienda
  ubicar la configuración en el bloque `test` de `vite.config.ts`, no en un `vitest.config.ts` separado.
- [Vitest Config](https://vitest.dev/config/): una configuración `vitest.config.*` separada tiene prioridad y hace que
  Vitest ignore la configuración de Vite.

## Decisión

Consolidar la configuración de tests en `vite.config.ts`, que ya contiene el bloque equivalente, retirar la duplicación
y excluir del runner aislado sin token tanto el proxy autenticado como los aliases de build para módulos Node. Un test
que aporta el token mantiene el proxy para cubrir esa frontera. No se atribuye el `ENOENT` a esa duplicación sin una
reproducción determinista: el cambio reduce una fuente de divergencia y sigue la configuración recomendada por Vite+.

Si la suite completa continúa con `ENOENT`, el siguiente paso es documentar un repro mínimo para el upstream y contener
el gate con un pool serial en CI sólo después de comparar al menos tres ejecuciones completas. No aumentar timeouts ni
reintentos para ocultar el problema.

## Validación posterior

Dos ejecuciones exactas de `bun run test` pasaron después del cambio: 808/808 tests en 374 s y 346 s. Ambas crearon y
eliminaron 87 DBs SQLite descartables, y ninguna emitió `ENOENT` ni solicitó un token de sesión. La evidencia reduce el
riesgo del runner en este host; no sustituye una matriz de CI en otros sistemas operativos.
