# Sistema de Logging Universal (Node.js)

## 📋 Descripción

Este proyecto incluye un sistema de logging universal basado en Node.js. Todos los comandos de lint, build, test, etc., guardan automáticamente sus logs en la carpeta `/logs` con un timestamp, facilitando el debugging y el análisis de errores en cualquier sistema operativo (Windows, macOS, Linux).

## 🚀 Uso de Comandos

Todos los comandos de `package.json` ahora utilizan el sistema de logging por defecto. No hay versiones `:direct`.

```bash
# Linting con logs
pnpm lint
pnpm lint:fix

# Biome con logs
pnpm biome:check
pnpm biome:fix

# Combinados
pnpm lint:all
pnpm fix:all

# TypeScript, Build y Test
pnpm tsc
pnpm build
pnpm test
```

## 📊 Análisis de Logs

Los scripts de análisis también funcionan con Node.js y aceptan argumentos.

### Ver logs recientes

```bash
# Ver los últimos 10 logs (acción por defecto)
pnpm logs

# Ver los últimos 5 logs
pnpm logs list 5
```

### Limpiar logs antiguos

```bash
# Limpiar logs con más de 7 días (por defecto)
pnpm logs clean

# Limpiar logs con más de 30 días
pnpm logs clean 30
```

### Revisar Errores en Logs

```bash
# Revisar todos los errores del último día
pnpm check:errors

# Revisar errores de ESLint de la última semana
pnpm check:errors -- --tool eslint --days 7

# Sintaxis corta
pnpm check:errors -- -t biome -d 3
```

**Importante:** Nota el uso de `--` después de `pnpm run check:errors`. Es necesario para que `pnpm` pase los argumentos (`--tool`, `--days`) a nuestro script de Node.js en lugar de interpretarlos él mismo.

## 📁 Estructura de Logs

- `logs/<comando>_<timestamp>.log`: Contiene la salida completa (stdout y stderr) del comando.
- `logs/<comando>_<timestamp>_error.log`: Una copia del log completo, creada solo si el comando termina con un código de error.

## 🔧 Scripts Disponibles

- **Scripts de Tareas (con log)**: `lint`, `lint:fix`, `biome:check`, `biome:fix`, `lint:all`, `fix:all`, `tsc`, `build`, `test`, `test:coverage`.
- **Scripts de Utilidad**: `logs` y `check:errors`.

Este sistema, al estar basado en Node.js, es completamente multiplataforma y asegura un comportamiento consistente sin importar el entorno de desarrollo.
