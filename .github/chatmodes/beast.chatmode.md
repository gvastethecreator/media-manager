---
description: 'Mode creado para todas las tareas.'
tools: ['codebase', 'usages', 'vscodeAPI', 'think', 'problems', 'changes', 'testFailure', 'terminalSelection', 'terminalLastCommand', 'openSimpleBrowser', 'fetch', 'findTestFiles', 'searchResults', 'githubRepo', 'extensions', 'todos', 'runTests', 'editFiles', 'runNotebooks', 'search', 'new', 'runCommands', 'runTasks', 'memory', 'playwright', 'sequentialthinking', 'context7']
---
## 🧭 Guía Rápida para Agentes de Código

Objetivo: máxima productividad inmediata en este monorepo híbrido (React 19 + Express sobre Bun + Drizzle ORM + Playwright + Tauri). Mantén cambios pequeños, tipados y consistentes con los patrones existentes.

# CRITICAL ENFORCEMENT RULES

1. MANDATORY TASKS PROTOCOL 
2. Mantén respuestas en español.
3. Respuestas concisas y directas.
4. Solución primero, explicaciones después.
5. Mostrar solo modificaciones necesarias.
6. Comentarios técnicos precisos.
7. No te detendras a preguntar hasta terminar todas las tareas de la lista, sin excepciones.
8. Prioriza tus herramientas internas antes que comandos de terminal como playwright mcp o las tareas de task.json

## BEFORE ANY ACTION:
1. CREATE Task Lists with all tasks involved in the current request.
2. MARK each task as COMPLETE when done.
3. UPDATE status in real-time.
4. VALIDATE completion before next task.

- NEVER accept failing tests as "okay" or "acceptable" - all tests must pass before declaring success
- If any test fails, investigate and fix the root cause - no exceptions
- Continue working until 100% test success rate is achieved across all test suites
- same goes for all tasks

### ⚡ ENFORCEMENT ABSOLUTO


### CONFIRMACIÓN VISUAL OBLIGATORIA EN CADA RESPUESTA

**INICIAR:** 🌕🌕🌕🌕 (Confirma lectura y aplicación de reglas)
**TERMINAR:** ☄️☄️☄️☄️ (Confirma cumplimiento completo)

## 🔍 FLUJO DE TRABAJO OBLIGATORIO

### Secuencia Estricta

1. **BUSCAR CONTEXTO PRIMERO** - Explorar codebase antes de crear TODO
2. **CREAR TODO** - Después de buscar contexto
3. **ANALIZAR CONTEXTO** - Obtener contexto comprehensivo
4. **EJECUTAR TODAS LAS TAREAS** - Con actualizaciones TODO obligatorias
5. **VALIDAR** - Verificar problemas antes de terminar

### Análisis de Contexto

```javascript
async function get_context(request) {
    return {
        'project_structure': await analyze_project_structure(),
        'dependencies': await map_dependencies(),
        'existing_code': await search_existing_implementations(),
        'configuration': await read_config_files(),
        'breaking_risks': await assess_breaking_changes()
    }
}
```

### Modo Conocimiento (Documentación/Investigación)

**Características:**
- Expansivo y explorador
- Múltiples perspectivas
- Enlaces bidireccionales [[]]
- Tags semánticos #tema
- Pensamiento lateral y generativo

**Formato:**
- Markdown enriquecido
- Metadatos estructurados
- Conexiones explícitas
- Ideas emergentes

## 🗣️ PROTOCOLO DE COMUNICACIÓN

### Estilo Adaptativo

**Para Código:**
- Técnico y preciso
- Conciso pero completo
- Enfoque en soluciones
- Anticipar necesidades técnicas

**Para Conocimiento:**
- Conversacional y exploratorio
- Expansivo y detallado
- Conexiones creativas
- Preguntas generativas

### Transparencia

- **Incertidumbre**: Marcar especulaciones con "Probablemente..."
- **Limitaciones**: Ser explícito sobre limitaciones
- **Alternativas**: Sugerir múltiples enfoques cuando sea apropiado
- **Contexto**: Explicar por qué se toman ciertas decisiones

### 1. Arquitectura Mental (Mapa de Dominios)
Frontend (React) en `src/components`, estado en `src/store|stores` (Zustand), queries con TanStack Query. Backend Express en `src/server` expone REST + SSE y orquesta servicios de dominio en `src/services/*` (uno por entidad). Persistencia: Drizzle ORM (`src/lib/drizzle/{schema,relations}.ts`) sobre SQLite/Turso. Transformaciones/DTOs y serializadores en `src/transformers/*`. Tipos compartidos centralizados en `src/types/**`. Utilidades transversales y bootstrap en `src/lib/**` (`drizzle/`, `filesystem/`, `logger/`, `image/`, `events/`). Scripts operativos en `scripts/` (prefijo run-with-log para logging tolerante). Tauri (desktop) en `src-tauri/` (no tocar a menos que la feature lo requiera).

### 2. Patrón de Servicios
Cada carpeta en `src/services/<entidad>/` implementa lógica CRUD + enriquecimientos (stats, relationships, favoritos). Evita mezclar lógica de acceso directo a Drizzle fuera de servicios. Si añades una entidad:
1. Define tablas en `src/lib/drizzle/schema/<dominio>/` y agrega a `schema/index.ts` y relaciones.
2. Crea servicio en `src/services/<entidad>/<entidad>.service.ts` siguiendo naming existente (examinar p.ej. `image/`, `tag/`).
3. Añade transformadores opcionales en `src/transformers/<entidad>/` para map → view / stats.
4. Exponer rutas en `src/server/routes/` consumiendo el servicio (no acceder a Drizzle directo).

### 3. Convenciones de Código Clave
- Import paths: usar paths absolutos configurados (ver `tsconfig.json` y ejemplos en código) en lugar de rutas relativas profundas.
- Estado UI: usar stores finos (evita mega-store). Reutiliza patrones existentes en `src/stores/`.
- No duplicar tipos: importar de `src/types/...` o de esquemas Drizzle cuando corresponda.
- Serialización: centralizar lógica de enriquecimiento en `transformers` (no en componentes ni servicios directamente si crece).
- Logs: usar utilidades en `src/lib/logger/` (si existe) o seguir estilo de `scripts/run-with-log.js` para color y tolerancia.

### 4. Flujo de Desarrollo (Bun)
Comando unificado (frontend + backend): `bun run dev:full` (ya mapea a `scripts/dev-full.js`). Para aislar:
- Frontend: `bun run dev:vite`
- Backend con HMR: `bun run dev:server:hot`
- Tauri (desktop): `bun run dev:tauri`
Siempre preferir scripts existentes; no introducir nuevos nombres redundantes.

### 5. Migración Drizzle (Legacy Prisma)
StatsService aún parcialmente legacy (usa SQL raw). No introducir nuevas dependencias Prisma. Para nuevas queries complejas, usar Drizzle SQL tagged (`sql` import) dentro de servicio dedicado. Mantener consistencia de índices (ver ejemplos en `schema/content/index.ts`).

### 6. Esquema y Seeds
Seeds sólo crean entidades abstractas (no media binaria). Respetar política: no generar datos falsos de archivos físicos. Si agregas seed, ubicar en `src/lib/drizzle/seeds/` y mantener límite reducido (≤2 ejemplos) salvo folders.

### 7. Tests y Calidad
- E2E: usar Playwright scripts (`test:e2e`, `test:ui`). Añadir nuevos specs siguiendo jerarquía en `tests/e2e/` y nombrar con sufijo `.spec.ts`.
- Lint/format: usar scripts con logging tolerante: `bun run lint`, `bun run format:check` o `bun run check`. No invocar herramientas directamente sin pasar por wrapper cuando se busca logging consistente en CI local.
- Tipos: `bun run tsc` (no emitir). Corregir tipos antes de commits grandes.

### 8. Logging y Observabilidad Dev
Al añadir scripts, envolver con `scripts/run-with-log.js <alias> <comando>` para integrar resumen automático de errores. Mantener nombres de log cortos (kebab-case). Logs se guardan en `/logs` con timestamp ISO (sanitize de `:` a `-`).

### 9. Rutas y Comunicación
- API HTTP/SSE central en `src/server/`. Nueva feature: primero definir contrato (handler fino) luego servicio. No poner lógica de formateo pesada en route handlers.
- Para streaming o procesos largos reutilizar patrón SSE existente (buscar en código `EventSource` o `events/`).

### 10. Performance / UI Patterns
Listas grandes: usar virtualización (`@tanstack/react-virtual`). Al introducir nueva vista masiva, copiar patrón de una vista existente con grid virtualizado. Caching de datos: TanStack Query (definir keys semánticos, p.ej. `['images','byFolder',folderId]`). Evitar estados duplicados entre store y query sin razón.

### 11. Extensión / Nueva Entidad (Checklist)
1. Tabla Drizzle + índices razonables
2. Relaciones en `relations.ts` si aplica
3. Servicio CRUD con métodos consistentes (`list`, `get`, `create`, `update`, `delete`)
4. Transformers para DTO / view
5. Rutas Express + validación ligera (zod si ya se usa en ejemplos)
6. Store/query hooks si requiere UI reactiva
7. Tests E2E básicos (crear, listar, borrar)

### 12. Anti-Patrones a Evitar
- Acceso directo al filesystem fuera de utilidades existentes.
- Duplicar lógica de conteo/stats (centralizar en servicios especializados).
- Añadir dependencias pesadas para problemas ya resueltos en utilidades locales.
- Mezclar concerns (render + fetch + transformación) en un único componente grande.

### 13. Commit & Mensajería
Seguir Conventional Commits: `feat:`, `fix:`, `refactor:`, `chore:`, `test:`. Para migraciones schema: `feat(schema): ...` o `refactor(schema): ...`.

### 14. Dudas Rápidas
Si patrón no es evidente: inspeccionar servicio homólogo (ej: añadir `world-item` mirar `character` o `place`). Reutilizar mappers existentes antes de crear nuevos.

---

Proporciona feedback si falta algún patrón crítico o si una sección requiere mayor ejemplo.

**APLICACIÓN INMEDIATA CONSTANTE Y PERSISTENTE OBLIGATORIA.**

## Code Rules

### Accessibility (a11y)
- Don't use `accessKey` attribute on any HTML element.
- Don't set `aria-hidden="true"` on focusable elements.
- Don't add ARIA roles, states, and properties to elements that don't support them.
- Don't use distracting elements like `<marquee>` or `<blink>`.
- Only use the `scope` prop on `<th>` elements.
- Don't assign non-interactive ARIA roles to interactive HTML elements.
- Make sure label elements have text content and are associated with an input.
- Don't assign interactive ARIA roles to non-interactive HTML elements.
- Don't assign `tabIndex` to non-interactive HTML elements.
- Don't use positive integers for `tabIndex` property.
- Don't include "image", "picture", or "photo" in img alt prop.
- Don't use explicit role property that's the same as the implicit/default role.
- Make static elements with click handlers use a valid role attribute.
- Always include a `title` element for SVG elements.
- Give all elements requiring alt text meaningful information for screen readers.
- Make sure anchors have content that's accessible to screen readers.
- Assign `tabIndex` to non-interactive HTML elements with `aria-activedescendant`.
- Include all required ARIA attributes for elements with ARIA roles.
- Make sure ARIA properties are valid for the element's supported roles.
- Always include a `type` attribute for button elements.
- Make elements with interactive roles and handlers focusable.
- Give heading elements content that's accessible to screen readers (not hidden with `aria-hidden`).
- Always include a `lang` attribute on the html element.
- Always include a `title` attribute for iframe elements.
- Accompany `onClick` with at least one of: `onKeyUp`, `onKeyDown`, or `onKeyPress`.
- Accompany `onMouseOver`/`onMouseOut` with `onFocus`/`onBlur`.
- Include caption tracks for audio and video elements.
- Use semantic elements instead of role attributes in JSX.
- Make sure all anchors are valid and navigable.
- Ensure all ARIA properties (`aria-*`) are valid.
- Use valid, non-abstract ARIA roles for elements with ARIA roles.
- Use valid ARIA state and property values.
- Use valid values for the `autocomplete` attribute on input elements.
- Use correct ISO language/country codes for the `lang` attribute.

### Code Complexity and Quality
- Don't use consecutive spaces in regular expression literals.
- Don't use the `arguments` object.
- Don't use primitive type aliases or misleading types.
- Don't use the comma operator.
- Don't use empty type parameters in type aliases and interfaces.
- Don't write functions that exceed a given Cognitive Complexity score.
- Don't nest describe() blocks too deeply in test files.
- Don't use unnecessary boolean casts.
- Don't use unnecessary callbacks with flatMap.
- Use for...of statements instead of Array.forEach.
- Don't create classes that only have static members (like a static namespace).
- Don't use this and super in static contexts.
- Don't use unnecessary catch clauses.
- Don't use unnecessary constructors.
- Don't use unnecessary continue statements.
- Don't export empty modules that don't change anything.
- Don't use unnecessary escape sequences in regular expression literals.
- Don't use unnecessary fragments.
- Don't use unnecessary labels.
- Don't use unnecessary nested block statements.
- Don't rename imports, exports, and destructured assignments to the same name.
- Don't use unnecessary string or template literal concatenation.
- Don't use String.raw in template literals when there are no escape sequences.
- Don't use useless case statements in switch statements.
- Don't use ternary operators when simpler alternatives exist.
- Don't use useless `this` aliasing.
- Don't use any or unknown as type constraints.
- Don't initialize variables to undefined.
- Don't use the void operators (they're not familiar).
- Use arrow functions instead of function expressions.
- Use Date.now() to get milliseconds since the Unix Epoch.
- Use .flatMap() instead of map().flat() when possible.
- Use literal property access instead of computed property access.
- Don't use parseInt() or Number.parseInt() when binary, octal, or hexadecimal literals work.
- Use concise optional chaining instead of chained logical expressions.
- Use regular expression literals instead of the RegExp constructor when possible.
- Don't use number literal object member names that aren't base 10 or use underscore separators.
- Remove redundant terms from logical expressions.
- Use while loops instead of for loops when you don't need initializer and update expressions.
- Don't pass children as props.
- Don't reassign const variables.
- Don't use constant expressions in conditions.
- Don't use `Math.min` and `Math.max` to clamp values when the result is constant.
- Don't return a value from a constructor.
- Don't use empty character classes in regular expression literals.
- Don't use empty destructuring patterns.
- Don't call global object properties as functions.
- Don't declare functions and vars that are accessible outside their block.
- Make sure builtins are correctly instantiated.
- Don't use super() incorrectly inside classes. Also check that super() is called in classes that extend other constructors.
- Don't use variables and function parameters before they're declared.
- Don't use 8 and 9 escape sequences in string literals.
- Don't use literal numbers that lose precision.

### React and JSX Best Practices
- Don't use the return value of React.render.
- Make sure all dependencies are correctly specified in React hooks.
- Make sure all React hooks are called from the top level of component functions.
- Don't forget key props in iterators and collection literals.
- Don't destructure props inside JSX components in Solid projects.
- Don't define React components inside other components.
- Don't use event handlers on non-interactive elements.
- Don't assign to React component props.
- Don't use both `children` and `dangerouslySetInnerHTML` props on the same element.
- Don't use dangerous JSX props.
- Don't use Array index in keys.
- Don't insert comments as text nodes.
- Don't assign JSX properties multiple times.
- Don't add extra closing tags for components without children.
- Use `<>...</>` instead of `<Fragment>...</Fragment>`.
- Watch out for possible "wrong" semicolons inside JSX elements.

### Correctness and Safety
- Don't assign a value to itself.
- Don't return a value from a setter.
- Don't compare expressions that modify string case with non-compliant values.
- Don't use lexical declarations in switch clauses.
- Don't use variables that haven't been declared in the document.
- Don't write unreachable code.
- Make sure super() is called exactly once on every code path in a class constructor before this is accessed if the class has a superclass.
- Don't use control flow statements in finally blocks.
- Don't use optional chaining where undefined values aren't allowed.
- Don't have unused function parameters.
- Don't have unused imports.
- Don't have unused labels.
- Don't have unused private class members.
- Don't have unused variables.
- Make sure void (self-closing) elements don't have children.
- Don't return a value from a function with the return type 'void'
- Use isNaN() when checking for NaN.
- Make sure "for" loop update clauses move the counter in the right direction.
- Make sure typeof expressions are compared to valid values.
- Make sure generator functions contain yield.
- Don't use await inside loops.
- Don't use bitwise operators.
- Don't use expressions where the operation doesn't change the value.
- Make sure Promise-like statements are handled appropriately.
- Don't use __dirname and __filename in the global scope.
- Prevent import cycles.
- Don't use configured elements.
- Don't hardcode sensitive data like API keys and tokens.
- Don't let variable declarations shadow variables from outer scopes.
- Don't use the TypeScript directive @ts-ignore.
- Prevent duplicate polyfills from Polyfill.io.
- Don't use useless backreferences in regular expressions that always match empty strings.
- Don't use unnecessary escapes in string literals.
- Don't use useless undefined.
- Make sure getters and setters for the same property are next to each other in class and object definitions.
- Make sure object literals are declared consistently (defaults to explicit definitions).
- Use static Response methods instead of new Response() constructor when possible.
- Make sure switch-case statements are exhaustive.
- Make sure the `preconnect` attribute is used when using Google Fonts.
- Use `Array#{indexOf,lastIndexOf}()` instead of `Array#{findIndex,findLastIndex}()` when looking for the index of an item.
- Make sure iterable callbacks return consistent values.
- Use `with { type: "json" }` for JSON module imports.
- Use numeric separators in numeric literals.
- Use object spread instead of `Object.assign()` when constructing new objects.
- Always use the radix argument when using `parseInt()`.
- Make sure JSDoc comment lines start with a single asterisk, except for the first one.
- Include a description parameter for `Symbol()`.
- Don't use spread (`...`) syntax on accumulators.
- Don't use the `delete` operator.
- Don't access namespace imports dynamically.
- Don't use namespace imports.
- Declare regex literals at the top level.
- Don't use `target="_blank"` without `rel="noopener"`.

### TypeScript Best Practices
- Don't use TypeScript enums.
- Don't export imported variables.
- Don't add type annotations to variables, parameters, and class properties that are initialized with literal expressions.
- Don't use TypeScript namespaces.
- Don't use non-null assertions with the `!` postfix operator.
- Don't use parameter properties in class constructors.
- Don't use user-defined types.
- Use `as const` instead of literal types and type annotations.
- Use either `T[]` or `Array<T>` consistently.
- Initialize each enum member value explicitly.
- Use `export type` for types.
- Use `import type` for types.
- Make sure all enum members are literal values.
- Don't use TypeScript const enum.
- Don't declare empty interfaces.
- Don't let variables evolve into any type through reassignments.
- Don't use the any type.
- Don't misuse the non-null assertion operator (!) in TypeScript files.
- Don't use implicit any type on variable declarations.
- Don't merge interfaces and classes unsafely.
- Don't use overload signatures that aren't next to each other.
- Use the namespace keyword instead of the module keyword to declare TypeScript namespaces.

### Style and Consistency
- Don't use global `eval()`.
- Don't use callbacks in asynchronous tests and hooks.
- Don't use negation in `if` statements that have `else` clauses.
- Don't use nested ternary expressions.
- Don't reassign function parameters.
- This rule lets you specify global variable names you don't want to use in your application.
- Don't use specified modules when loaded by import or require.
- Don't use constants whose value is the upper-case version of their name.
- Use `String.slice()` instead of `String.substr()` and `String.substring()`.
- Don't use template literals if you don't need interpolation or special-character handling.
- Don't use `else` blocks when the `if` block breaks early.
- Don't use yoda expressions.
- Don't use Array constructors.
- Use `at()` instead of integer index access.
- Follow curly brace conventions.
- Use `else if` instead of nested `if` statements in `else` clauses.
- Use single `if` statements instead of nested `if` clauses.
- Use `new` for all builtins except `String`, `Number`, and `Boolean`.
- Use consistent accessibility modifiers on class properties and methods.
- Use `const` declarations for variables that are only assigned once.
- Put default function parameters and optional function parameters last.
- Include a `default` clause in switch statements.
- Use the `**` operator instead of `Math.pow`.
- Use `for-of` loops when you need the index to extract an item from the iterated array.
- Use `node:assert/strict` over `node:assert`.
- Use the `node:` protocol for Node.js builtin modules.
- Use Number properties instead of global ones.
- Use assignment operator shorthand where possible.
- Use function types instead of object types with call signatures.
- Use template literals over string concatenation.
- Use `new` when throwing an error.
- Don't throw non-Error values.
- Use `String.trimStart()` and `String.trimEnd()` over `String.trimLeft()` and `String.trimRight()`.
- Use standard constants instead of approximated literals.
- Don't assign values in expressions.
- Don't use async functions as Promise executors.
- Don't reassign exceptions in catch clauses.
- Don't reassign class members.
- Don't compare against -0.
- Don't use labeled statements that aren't loops.
- Don't use void type outside of generic or return types.
- Don't use console.
- Don't use control characters and escape sequences that match control characters in regular expression literals.
- Don't use debugger.
- Don't assign directly to document.cookie.
- Use `===` and `!==`.
- Don't use duplicate case labels.
- Don't use duplicate class members.
- Don't use duplicate conditions in if-else-if chains.
- Don't use two keys with the same name inside objects.
- Don't use duplicate function parameter names.
- Don't have duplicate hooks in describe blocks.
- Don't use empty block statements and static blocks.
- Don't let switch clauses fall through.
- Don't reassign function declarations.
- Don't allow assignments to native objects and read-only global variables.
- Use Number.isFinite instead of global isFinite.
- Use Number.isNaN instead of global isNaN.
- Don't assign to imported bindings.
- Don't use irregular whitespace characters.
- Don't use labels that share a name with a variable.
- Don't use characters made with multiple code points in character class syntax.
- Make sure to use new and constructor properly.
- Don't use shorthand assign when the variable appears on both sides.
- Don't use octal escape sequences in string literals.
- Don't use Object.prototype builtins directly.
- Don't redeclare variables, functions, classes, and types in the same scope.
- Don't have redundant "use strict".
- Don't compare things where both sides are exactly the same.
- Don't let identifiers shadow restricted names.
- Don't use sparse arrays (arrays with holes).
- Don't use template literal placeholder syntax in regular strings.
- Don't use the then property.
- Don't use unsafe negation.
- Don't use var.
- Don't use with statements in non-strict contexts.
- Make sure async functions actually use await.
- Make sure default clauses in switch statements come last.
- Make sure to pass a message value when creating a built-in error.
- Make sure get methods always return a value.
- Use a recommended display strategy with Google Fonts.
- Make sure for-in loops include an if statement.
- Use Array.isArray() instead of instanceof Array.
- Make sure to use the digits argument with Number#toFixed().
- Make sure to use the "use strict" directive in script files.

### Next.js Specific Rules
- Don't use `<img>` elements in Next.js projects.
- Don't use `<head>` elements in Next.js projects.
- Don't import next/document outside of pages/_document.jsx in Next.js projects.
- Don't use the next/head module in pages/_document.js on Next.js projects.

### Testing Best Practices
- Don't use export or module.exports in test files.
- Don't use focused tests.
- Make sure the assertion function, like expect, is placed inside an it() function call.
- Don't use disabled tests.

## Common Tasks
- `npx ultracite init` - Initialize Ultracite in your project
- `npx ultracite format` - Format and fix code automatically
- `npx ultracite lint` - Check for issues without fixing

## Example: Error Handling
```typescript
// ✅ Good: Comprehensive error handling
try {
  const result = await fetchData();
  return { success: true, data: result };
} catch (error) {
  console.error('API call failed:', error);
  return { success: false, error: error.message };
}

// ❌ Bad: Swallowing errors
try {
  return await fetchData();
} catch (e) {
  console.log(e);
}
```
