# T01 – Auditoría de Dependencias

## Metodología

1. **Clasificación** de cada paquete como _Core_, _UI_, _Build_, _Dev Tool_ o _Legacy_.
2. Identificación de acoplamientos directos a **Next.js** o **Webpack**.
3. Determinación de acción: _Mantener_, _Eliminar_, _Sustituir_ o _Añadir_.

## Matriz resumen

| Paquete | Tipo | Estado actual | Acción | Sustituto/Versión |
|---------|------|---------------|--------|-------------------|
| next | Core Framework | Presente | Eliminar | `vite`, `@vitejs/plugin-react` |
| react, react-dom | Core | Presente | Mantener | 19.x |
| next-themes | UI/Theme | Presente | Revisar | Posible migración a `next-themes` standalone o `react-theme-provider` |
| @svgr/webpack | Build | DevDep | Eliminar | `vite-plugin-svgr` |
| file-loader, ignore-loader | Build | DevDep | Eliminar | Vite asset handling nativo |
| @tailwindcss/postcss | Build | DevDep | Mantener | Compatible |
| tailwindcss | Build | DevDep | Mantener | 4.x |
| autoprefixer, postcss | Build | DevDep | Mantener | |
| eslint, biome, ts-node, typescript | Dev Tool | Presente | Mantener | |
| @vitejs/plugin-react | Build | — | Añadir | ^4.2.0 |
| vite | Build | — | Añadir | ^5.3.0 |
| vite-tsconfig-paths | Build | — | Añadir | Para paths TS |
| vite-plugin-svgr | Build | — | Añadir | Para SVG import |
| vitest, @vitest/ui | Testing | — | Añadir | Sustituir Jest si aplica |
| react-router-dom | Core Routing | — | Añadir | 6.23.x |
| sharp | Binario nativo | Presente | Mantener | Prever rebuild en Windows |
| prisma | Binario nativo | Presente | Mantener | Prever rebuild en Windows |
| @biomejs/biome | Dev Tool | Presente | Mantener | 2.0.6 (peer)

> **Nota:** Dependencias como `@tanstack/react-query` y `zustand` no dependen de Next.js, por lo que se mantendrán sin cambios.

## Pasos siguientes

1. Crear branch `migration/vite-deps`.
2. Actualizar `package.json` según la matriz.
3. Ejecutar `pnpm install` y validar que no existan conflictos de versiones.
4. Ajustar scripts de `package.json` (T04).
5. En Windows usar `pnpm install --ignore-script=false` para permitir reconstrucción de binarios nativos (`sharp`, `prisma`).

🎯 **Criterio de aceptación:** _El proyecto compila con Vite en modo dev (`pnpm dev:vite`) mostrando la pantalla de inicio sin errores de runtime._
