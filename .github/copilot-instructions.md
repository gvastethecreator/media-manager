# CRITICAL ENFORCEMENT RULES

1. FOLLOW ALL MANDATORY TASKS PROTOCOLS STRICTLY.
2. Mantén respuestas en español.
3. Respuestas concisas y directas.
4. Necesitamos soluciones completas, no parciales ni vagas, junto con sus explicaciones.
5. Mostrar solo modificaciones necesarias cuando sea necesario.
6. Comentarios técnicos precisos y útiles.
7. No te detendras a preguntar hasta terminar todas las tareas de la lista, sin excepciones.
8. Prioriza tus herramientas internas 

## BEFORE ANY ACTION:
1. CREATE Task Lists with all tasks involved in the current request.
2. CHECK and MARK each task as COMPLETE when done.
3. UPDATE status in real-time to the user.
4. VALIDATE completion.

- NEVER accept failing tests as "okay" or "acceptable" - all tests must pass before declaring success
- If any test fails, investigate and fix the root cause - no exceptions
- Continue working until 100% test success rate is achieved across all test suites
- same goes for all tasks
- máxima productividad inmediata.
stack : React 19 + Express sobre Bun + Drizzle ORM + Playwright + Tauri). Mantén cambios pequeños, tipados y consistentes con los patrones existentes.

### ⚡ ENFORCEMENT ABSOLUTO

**DETENER EJECUCIÓN INMEDIATAMENTE SI:**
- No se crea TODO antes de cualquier acción.
- No se busca contexto PRIMERO.
- No se marcan tareas como completadas.
- No se valida implementación antes de continuar.

### CONFIRMACIÓN VISUAL OBLIGATORIA EN CADA RESPUESTA

**INICIAR:** 🌕🌕🌕🌕 (Confirma lectura y aplicación de reglas)
**TERMINAR:** ☄️☄️☄️☄️ (Confirma cumplimiento completo)

## 🔍 FLUJO DE TRABAJO OBLIGATORIO

### Secuencia Estricta

1. **BUSCAR CONTEXTO PRIMERO** - Explorar codebase antes de crear TODO
2. **CREAR TODO** - Después de buscar contexto
3. **ANALIZAR CONTEXTO** - Obtener contexto comprehensivo
4. **EJECUTAR TAREAS** - Con actualizaciones TODO obligatorias
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
- Lint/format: usar scripts con logging tolerante: `bun run biome`, `bun run format:check`. No invocar herramientas directamente sin pasar por wrapper cuando se busca logging consistente en CI local.
- Tipos: `bun run tsc` . Corregir tipos antes de commits grandes.

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



**APLICACIÓN INMEDIATA CONSTANTE Y PERSISTENTE OBLIGATORIA.**
