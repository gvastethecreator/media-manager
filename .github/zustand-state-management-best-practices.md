# Zustand: Mejores Prácticas

- **Stores pequeños y enfocados:** Divide el estado global en stores por feature.
- **Middleware:** Usa `persist` e `immer` para mejorar gestión de estado.
- **Selectores:** Usa selectores para evitar renders innecesarios.
- **Acciones dentro del store:** Define lógica de modificación en el store.
- **TypeScript fuerte:** Siempre tipa los stores.
- **Evita stores inflados:** Solo global lo necesario, usa local state cuando aplique.
- **Testing de stores:** Tests unitarios para acciones y selectores.
- **Integración con React Query:** Zustand para UI, React Query para server state.
- **Store factory pattern:** Crea stores similares con factories.
- **Modelos de suscripción:** Implementa patrones de suscripción cross-store.
- **Normalización de estado:** Evita duplicidad y inconsistencias.
- **Devtools:** Usa Zustand devtools en desarrollo.
- **Lazy initialization:** Inicialización perezosa para estados costosos.
- **Store Provider pattern:** Usa providers para gestión compleja.
