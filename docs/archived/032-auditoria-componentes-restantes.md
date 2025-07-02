# 032 - Auditoría de carpetas restantes en `components`

## Contexto
Se revisaron todas las carpetas de `src/components` fuera de `features` para eliminar directivas heredadas de Next.js y referencias obsoletas.

## Cambios Realizados
- Eliminadas todas las directivas `'use client'` en 264 archivos.
- Ajustado el comentario de `documentation.ts` para quitar mención a Next.js.
- Actualizados readmes de `useFolders` y `documents` para referirse a Vite y SSR genérico.
- Actualizado `image-card/README.md` eliminando la referencia a `next/image`.

## Resultado
Todos los componentes restantes funcionan con Vite sin referencias a Next.js.
