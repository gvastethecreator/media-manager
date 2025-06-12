# Guía de Contribución

Esta guía resume el flujo recomendado para clonar el proyecto, ejecutar las pruebas y enviar cambios.

## Puesta en marcha

1. Clona el repositorio y entra al directorio:
   ```bash
   git clone https://github.com/tu-usuario/image-manager.git
   cd image-manager
   ```
2. Instala las dependencias con pnpm:
   ```bash
   pnpm install
   ```
3. Copia el archivo `.env.example` (si existe) a `.env` y completa las variables necesarias, en especial `DATABASE_URL`.
4. Ejecuta las migraciones iniciales y carga las seeds de ejemplo:
   ```bash
   pnpm prisma migrate dev
   pnpm prisma db seed
   ```
5. Inicia el servidor de desarrollo:
   ```bash
   pnpm dev
   ```

## Comandos útiles

- `pnpm lint` y `pnpm format` para verificar y formatear el código con **Biome**.
- `pnpm test` para ejecutar la suite de pruebas de Jest.
- `pnpm build` para compilar la aplicación en modo producción.

## Convenciones de código

- Sigue las reglas descritas en `AGENTS.md` y `TRANSFORMERS-FIX.md`.
- Evita importar `PrismaClient` o tipos de Prisma en código que se ejecute en el cliente.
- Mantén la tipificación estricta y evita `any` siempre que sea posible.
- Documenta los cambios importantes en `CURRENT-TASK.md` y dentro de los módulos afectados.

## Flujo de trabajo sugerido

1. Crea una rama descriptiva a partir de `main`.
2. Realiza los cambios y añade pruebas cuando sea necesario.
3. Ejecuta `pnpm test` para asegurarte de que la suite pasa sin errores.
4. Ejecuta `pnpm lint` y `pnpm format` antes de hacer commit.
5. Envía un pull request describiendo el propósito de la modificación.

Para cualquier duda adicional consulta la documentación en `docs/README.md` o abre una incidencia.
