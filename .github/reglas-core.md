# Reglas Core (2025)

> Estas reglas rigen todo el desarrollo del proyecto y deben cumplirse en cada tarea.

- Prioriza SIEMPRE herramientas internas (no terminal) para manipulación de archivos y código.
- Comenta y documenta en español, con emojis en comentarios clave.
- Analiza el flujo y busca en el codebase antes de actuar.
- Mantén la documentación actualizada en cada carpeta de componente/módulo, incluyendo diagrama mermaid, estructura, ejemplos y relaciones.
- **Toda funcionalidad, tipo, componente o archivo modificado o creado debe ser documentado inmediatamente después de trabajarlo.**
- Usa el stack real: Next.js 15.3.3, React 19, Tailwind 4, Shadcn/ui, motion/react, PNPM, Prisma (migrando a Drizzle).
- Prefiere Server Actions para mutaciones y lógica de negocio; API solo para casos especiales.
- Valida siempre con Zod antes de persistir datos.
- Usa tipos canónicos y elimina legacy/duplicados.
- Antes de crear archivos, revisa si ya existe funcionalidad similar.
- Mantén CURRENT-TASK.md actualizado y consulta guidelines antes de cada tarea.
- Usa diagramas mermaid para flujos y relaciones.
- No crees directorios vacíos, solo archivos.
- Refuerza la consistencia en nombres, rutas y estructura según el codebase real.
- Elimina código/archivos obsoletos o duplicados.
- Usa las últimas features de React 19 y Next.js 15 (SSR, suspense, automatic batching, etc).
- Integra animaciones con motion/react y UI con Shadcn/ui.
- Usa stores Zustand para estado global, React Query para server state.
- Siempre lista las reglas activas en cada tarea relevante.
