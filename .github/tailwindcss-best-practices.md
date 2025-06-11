# Tailwind CSS 4 & Shadcn/ui: Mejores Prácticas (2025)

- **Clases utilitarias en JSX:** Usar clases Tailwind directamente en JSX.
- **Componentes shadcn/ui:** Usar componentes shadcn/ui integrados con Tailwind 4.
- **Animaciones con motion/react:** Integrar motion/react para animaciones en UI.
- **Responsive y dark mode:** Usar breakpoints y variantes dark de Tailwind.
- **Custom utilities y @apply:** Crear utilidades personalizadas con @apply.
- **Configuración en tailwind.config.js:** Personalizar colores y variables.
- **Condicionales con clsx/tailwind-merge:** Usar para clases dinámicas.
- **Patrones de layout modernos:** Grid, aspect-ratio, masonry, etc.
- **Testing visual y accesibilidad:** Probar componentes con herramientas de accesibilidad.
- **Documentación y ejemplos en cada componente.**

```mermaid
graph TD
    A[Tailwind CSS] --> B[Layout]
    A --> C[Components]
    A --> D[Utilities]

    B --> B1[Grid Systems]
    B --> B2[Responsive Design]
    B --> B3[Aspect Ratio]

    C --> C1[Cards]
    C --> C2[Modal/Dialog]
    C --> C3[Navigation]

    D --> D1[Color Variants]
    D --> D2[Shadows/Effects]
    D --> D3[Typography]

    style A fill:#d4f1f9
    style B fill:#ffecb3
    style C fill:#e1bee7
    style D fill:#c8e6c9
```

**Ejemplo:**

```tsx
export function ImageCard({ image, isSelected, onClick }) {
  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-lg transition-all duration-300",
        "aspect-[3/2]",
        "hover:ring-2 hover:ring-primary/70 hover:scale-[1.02]",
        isSelected && "ring-2 ring-primary shadow-lg"
      )}
      onClick={onClick}
    >
      <img
        src={image.thumbnailUrl}
        alt={image.title || "Untitled image"}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
          <p className="font-medium text-sm line-clamp-1">{image.title || "Untitled"}</p>
          <p className="text-xs opacity-80">{image.dimensions}</p>
        </div>
      </div>
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}
    </div>
  );
}
```
