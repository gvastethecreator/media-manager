# Alineación de Vite+, Vitest y coverage

Fecha: 2026-07-23

## Pregunta

¿Se puede corregir el mismatch actual entre el runner de tests y `@vitest/coverage-v8` cambiando sólo una versión de
`package.json`?

## Respuesta

No. El checkout mezcla `vite-plus`/`vite`/`vitest` aliasados a `0.1.20` con `@vitest/coverage-v8` `4.1.5`.
La documentación oficial exige que Vite+ use Vitest 4.1 o posterior y que los paquetes `@vitest/*` estén en lockstep
con el Vitest que carga el runner. La ruta soportada es una migración de toolchain que alinea el paquete local, los
aliases de Vite, el pin/override de Vitest, `@vitest/coverage-v8` y los imports de tests cuando corresponda.

Un cambio aislado de coverage no puede ser considerado una reparación: mantendría dos familias de Vitest con mocks,
expect y estado de runner distintos.

## Evidencia local

- `package.json` fija `vite-plus`, `vite` y `vitest` a los aliases Vite+ `0.1.20`.
- `package.json` instala `@vitest/coverage-v8` `^4.1.5`.
- `bun pm ls` resuelve el runner como `vitest@0.1.20` y coverage como `@vitest/coverage-v8@4.1.5`.
- Hay imports de `vitest` repartidos por tests de producto; algunos archivos están modificados por trabajo concurrente.

## Fuentes

- [Vite+ Troubleshooting: versiones soportadas](https://viteplus.dev/guide/troubleshooting), consultada el 2026-07-23:
  Vite+ requiere Vite 8+ y Vitest 4.1+.
- [Vite+ Migration Rules](https://viteplus.dev/guide/migrate-rules), consultada el 2026-07-23: la migración alinea
  `@vitest/coverage-v8` y otros paquetes `@vitest/*` con el Vitest del toolchain, y reescribe imports ordinarios a
  `vite-plus/test`.
- [Vite+ Upgrade](https://viteplus.dev/guide/upgrade), consultada el 2026-07-23: una versión desactualizada del pin de
  Vitest puede dividir mocks, expect y el estado interno del runner; recomienda `vp migrate` después de actualizar
  Vite+.
- [Vite+ Test](https://viteplus.dev/guide/test), consultada el 2026-07-23: `vp test` es el runner Vitest integrado y
  admite coverage desde el bloque `test` de `vite.config.ts`.

## Decisión de implementación

No editar el lockfile ni reescribir imports en este lote: tocaría numerosos tests, incluidos archivos con cambios
ajenos. Abrir una tarea de toolchain con ownership exclusivo para ejecutar la migración soportada, revisar su diff y
validar primero un archivo con coverage, después la suite aislada. Hasta entonces `test:ci` no es evidencia de cobertura
confiable y debe conservar su gate rojo ante cualquier fallo.

## Incertidumbre pendiente

Hay que verificar qué versión local de Vite+ se adopta y si sus cambios requieren ajustes de configuración adicionales.
La decisión debe hacerse sobre un árbol sin cambios concurrentes en tests o en un worktree dedicado.
