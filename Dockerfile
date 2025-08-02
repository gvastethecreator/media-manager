# Usar la imagen oficial de Bun
FROM oven/bun:1-alpine AS base

# Configurar variables de entorno
ENV NODE_ENV=production
ENV PORT=5173

# Crear directorio de trabajo
WORKDIR /app

# Cambiar ownership del directorio a bun user
RUN chown -R bun:bun /app
USER bun

# Copiar archivos de configuración de dependencias
COPY --chown=bun:bun package.json bun.lock* bunfig.toml ./

# Instalar dependencias
RUN bun install --frozen-lockfile --production

# Copiar código fuente
COPY --chown=bun:bun . .

# Construir la aplicación
RUN bun run build

# Exponer puerto
EXPOSE 5173

# Comando por defecto para producción
CMD ["bun", "run", "start"]
