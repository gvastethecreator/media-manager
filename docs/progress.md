## Configuración de Biome para Next.js 15.2

Se ha configurado Biome como reemplazo de ESLint y Prettier para el linting y formateo del código. La configuración incluye:

### Archivos de configuración

- `biome.json`: Configuración principal de Biome con reglas de linting y formateo.
- `.biomeignore`: Archivos y directorios ignorados por Biome.
- `.editorconfig`: Configuración para mantener consistencia en editores de código.
- `next.config.ts`: Configurado para deshabilitar ESLint integrado de Next.js.

### Comandos disponibles

```bash
# Verificación de linting
pnpm lint

# Corrección automática de problemas de linting
pnpm lint:fix

# Formateo de código
pnpm format

# Verificación de formato
pnpm format:check

# Verificación completa (linting + formato)
pnpm check

# Corrección automática completa
pnpm check:fix

# Verificación para CI
pnpm biome:ci
```

### Integración con GitHub Actions

Se ha añadido un workflow de GitHub Actions en `.github/workflows/lint.yml` para verificar automáticamente el código con Biome en cada push y pull request.
