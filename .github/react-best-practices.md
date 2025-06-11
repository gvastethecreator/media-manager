# React: Mejores Prácticas

- **Componentes funcionales con hooks:** Siempre preferir sobre clases.
- **Single responsibility:** Componentes pequeños y enfocados.
- **Optimización de performance:** Memoización con useMemo, useCallback, memo.
- **Gestión de estado:** Context para simple, Zustand para global complejo.
- **React 19 features:** SSR mejorado, automatic batching, suspense.
- **Error boundaries:** Implementar para manejo de errores.
- **Separación client/server:** 'use client' solo donde sea necesario.
- **Reglas de hooks:** Solo en el top level de funciones React.
- **Custom hooks:** Extraer lógica reutilizable.
- **Renderizado condicional limpio:** Ternarios o AND lógico.
- **Formularios controlados:** Preferir inputs controlados y validación.
- **React DevTools:** Usar para debug y profiling.
- **Documentación de props:** Siempre con TypeScript y JSDoc.
- **Testing de componentes:** Foco en interacciones de usuario.
