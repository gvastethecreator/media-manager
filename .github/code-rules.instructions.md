## Reglas de código (adaptadas al stack)

Contexto: Bun (server) + React SPA (frontend) + Tailwind + shadcn. Sin Next.js ni Solid. Oxc (`oxlint` + `oxfmt`) es el linter/formatter y Vite+ maneja las tareas de frontend.

### Accesibilidad (a11y)

- Evitar `accessKey` y `tabIndex` positivo.
- No usar `aria-hidden="true"` en elementos focusables; usar roles solo cuando aplican.
- `img` con `alt` significativo; `svg` con `<title>` cuando comunican información.
- Botones con `type` y elementos interactivos focusables; enlazar `label` con su `input`.
- Enlaces con contenido accesible y destino válido.

### React y JSX

- Hooks: llamar desde el tope del componente y declarar dependencias correctamente.
- Claves: no usar índice de array como `key` salvo listas estáticas.
- Evitar componentes definidos dentro de otros; no asignar a `props`.
- Evitar `dangerouslySetInnerHTML` y props peligrosas; preferir `<>...</>` a `<Fragment>`.
- No usar handlers en elementos no interactivos sin rol adecuado.

### Calidad y estilo (no agresivo)

- `const` por defecto; `===/!==`; plantillas en lugar de concatenación.
- `parseInt(valor, 10)`; evitar `var`/`with`/`eval`/`debugger`.
- Evitar ternarios anidados; preferir returns tempranos.
- Evitar `console.log` en código de producción del navegador; permitido en servidor y durante desarrollo. Usar el sistema de logs cuando aplique.
- Preferir `Response.json()` sobre `new Response()` cuando devuelve JSON.

### Correctitud

- Sin código inalcanzable; manejar promesas correctamente.
- Evitar `await` en bucles cuando pueda usarse `Promise.all`, salvo dependencia secuencial.
- Evitar sombras de variables; prevenir ciclos de importación.
- No exponer secretos en el código.

### TypeScript

- `strict` activo (ya configurado). Evitar `any` implícito y `!` non-null; usar refinamientos.
- `export type`/`import type` para tipos; preferir `as const` en literales.
- Evitar `enum` tradicionales; preferir uniones de literales u objetos `as const` (permitir enums si interoperan con APIs).
- Interfaces vacías y sobrecargas no adyacentes: evitar.

### Node/Bun (server)

- Usar `node:` para builtins cuando se importen (en server). En frontend no.
- Preferir `Response.json`/`new Response` según corresponda; no bloquear el event loop con trabajo pesado.

### Cómo se aplica

- Oxc aplica formateo y linting; ver `oxlint.config.ts` y `oxfmt.json`.
- Para checks unificados usa: `bun run check`.
- Para lint directo usa: `bun run lint`.
- Para formato usa: `bun run format` o `bun run format:check`.

### Ejemplo (manejo de errores)

```ts
// ✅ Bien
try {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	return await res.json();
} catch (err) {
	console.error('fetch failed', err);
	return null;
}
```
