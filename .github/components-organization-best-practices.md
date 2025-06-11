# Organización de Componentes: Mejores Prácticas

- **UI reutilizable en `components/ui/`:** Componentes genéricos y reutilizables.
- **Composición en features:** Componer UI con lógica de feature.
- **Nombres descriptivos:** Consistentes y claros.
- **Carpetas para componentes complejos:** Subcomponentes y `index.ts` para exportar.
- **Tests unitarios:** Especialmente en `ui/` y `features/`.
- **Server Components por defecto:** Solo 'use client' donde sea necesario.
- **Props tipadas:** Siempre con TypeScript.
- **Entity Card pattern:** Seguir patrón de entity-cards para entidades.
- **Documentación en cada componente:** README.md y docs de arquitectura.
- **Organización por feature:** Agrupar por feature cuando aplique.
- **Adapters:** Usar adapter pattern para lógica compleja.
- **Hooks co-localizados:** Hooks en carpetas dentro de features.
- **Animaciones con motion/react:** Preferir sobre CSS transitions.
- **Módulos para features complejas:** Modularizar entity-cards y similares.
