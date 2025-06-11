# Optimización de Performance: Mejores Prácticas

- **Lazy loading de imágenes:** Solo cargar imágenes visibles.
- **BlurHash:** Placeholders estéticos durante carga.
- **Selección responsive:** Diferentes tamaños según dispositivo.
- **Next.js Image Optimization:** Usa el componente Image para optimización automática.
- **Prefetching estratégico:** Precarga imágenes probables.
- **Code splitting:** Divide JS por rutas/características.
- **Tree shaking agresivo:** Solo código usado en bundles.
- **Web Vitals monitoring:** Monitorea Core Web Vitals, enfocado en LCP.
- **Optimización de fuentes:** Carga óptima y `font-display: swap`.
- **CSS crítico inline:** Evita bloqueo de render.
- **Paginación/infinite scroll:** Para grandes colecciones.
- **Virtualización de listas:** Renderiza solo lo visible.
- **Memoización de componentes:** Usa React.memo/useMemo estratégicamente.
- **Animaciones optimizadas:** Solo `transform` y `opacity` para fluidez.
- **Debounce/throttle:** En búsquedas y scroll.

```mermaid
graph TD
    A[Estrategias de Rendimiento] --> B[Front-end]
    A --> C[Back-end]
    A --> D[Monitorización]
    B --> B1[Carga de Imágenes]
    B --> B2[JavaScript]
    B --> B3[CSS]
    C --> C1[Optimización de API]
    C --> C2[Caché]
    C --> C3[Optimización de Imágenes]
    D --> D1[Core Web Vitals]
    D --> D2[Error Tracking]
    D --> D3[Analytics]
    B1 --> B11[Lazy Loading]
    B1 --> B12[Responsive Images]
    B1 --> B13[BlurHash/LQIP]
    B2 --> B21[Code Splitting]
    B2 --> B22[Tree Shaking]
    B2 --> B23[Memoización]
    C3 --> C31[Sharp]
    C3 --> C32[Formatos Modernos]
    C3 --> C33[CDN]
    style A fill:#d4f1f9
    style B fill:#ffecb3
    style C fill:#e1bee7
    style D fill:#c8e6c9
    style B1 fill:#bbdefb
    style C3 fill:#bbdefb
```
