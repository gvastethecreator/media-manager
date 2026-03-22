# Guía de Animaciones - Image Manager

## Resumen Ejecutivo

Este documento establece el estándar para el sistema de animaciones en Image Manager para asegurar consistencia, performance y mantenibilidad.

## ⚠️ ESTANDARIZACIÓN OBLIGATORIA

**REGLA CRÍTICA**: Todos los componentes deben usar **una sola** de estas tres opciones:

1. **`@/components/ui/motion-shim`** (RECOMENDADO para compatibilidad declarativa)
2. **`@/lib/anime`** (Para animaciones complejas con timeline)
3. **CSS Animations** (Para animaciones simples hover/estados)

**❌ PROHIBIDO**:

- Mezclar múltiples sistemas en un mismo componente
- Importar otra librería de animación directamente si ya existe solución en `motion-shim` o `@/lib/anime`
- Reintroducir librerías de animación adicionales en componentes nuevos

---

## 📦 Opción 1: Motion Shim (Recomendado)

### Cuándo usar

- Componentes React que necesitan animaciones de entrada/salida
- Reemplazo de APIs declarativas de motion
- Animaciones hover/tap/exit
- Grids con stagger animations

### API

```typescript
import { motion, AnimatePresence } from '@/components/ui/motion-shim';

// Componente básico
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
>
  Contenido
</motion.div>

// Con variants
const variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

<motion.div variants={variants} initial="hidden" animate="visible" />

// AnimatePresence para mount/unmount
<AnimatePresence>
  {isVisible && (
    <motion.div exit={{ opacity: 0 }}>
      Contenido
    </motion.div>
  )}
</AnimatePresence>

// Hover animations
<motion.div
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
/>
```

### Componentes disponibles

```typescript
(motion.div, motion.button, motion.span, motion.img);
(motion.section, motion.article, motion.header);
(motion.footer, motion.nav, motion.main);
// ... y más (ver motion-shim.tsx)
```

### Props soportadas

- `initial`: Estado inicial
- `animate`: Estado objetivo
- `exit`: Estado al desmontar (requiere AnimatePresence)
- `whileHover`: Estado en hover
- `whileTap`: Estado en click
- `transition`: Configuración { duration, ease, delay, type }
- `variants`: Variantes nombradas
- `layout`: Boolean para animaciones de layout
- `layoutId`: String para shared layout animations

---

## 📦 Opción 2: Lib Anime (Para casos avanzados)

### Cuándo usar

- Animaciones con timeline complejas
- Stagger animations programáticas
- Animaciones que necesitan control (play/pause/seek)
- Integración con sistema de transiciones morph/flip

### API

```typescript
import { anime, animate, createTimeline, stagger } from '@/lib/anime';

// Animación simple
await animate({
	targets: '.element',
	translateX: 250,
	duration: 800,
	easing: 'easeOutQuad',
});

// Timeline
const timeline = await createTimeline();
timeline.add({ targets: '.el1', translateX: 100 }, 0).add({ targets: '.el2', translateX: 100 }, '+=100');

// Stagger
await stagger('.items', {
	translateY: [20, 0],
	opacity: [0, 1],
	delay: (el, i) => i * 100,
	duration: 500,
});
```

---

## 📦 Opción 3: CSS Animations

### Cuándo usar

- Animaciones simples de hover/focus
- Estados de loading
- Transiciones básicas
- Cuando no se necesita JavaScript

### Clases disponibles

```css
/* Entrada */
.animate-fade-in
.animate-slide-up
.animate-scale-in
.animate-zoom-bounce

/* Énfasis */
.dt-pulse-subtle
.dt-bounce-soft
.dt-shake
.dt-ripple
.dt-attention-pulse

/* Loading */
.dt-skeleton-pulse
.dt-skeleton-shimmer
.animate-spin

/* Reduced motion */
.motion-reduce:animate-none
```

### Uso en Tailwind

```html
<div class="transition-all duration-dt-fast ease-dt-out hover:scale-105" />
<div class="animate-fade-in duration-dt-normal" />
```

---

## 🎨 Design Tokens para Animaciones

### Duraciones

```css
--dt-duration-instant: 50ms /* Micro-interacciones */ --dt-duration-fast: 150ms /* Hover, focus */
	--dt-duration-normal: 250ms /* Transiciones UI */ --dt-duration-slow: 400ms /* Entradas, modals */;
```

### Timing Functions

```css
--dt-ease-default: cubic-bezier(0.4, 0, 0.2, 1) --dt-ease-in: cubic-bezier(0.4, 0, 1, 1)
	--dt-ease-out: cubic-bezier(0, 0, 0.2, 1) --dt-ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Tailwind Classes

```
duration-dt-instant, duration-dt-fast, duration-dt-normal, duration-dt-slow
ease-dt-default, ease-dt-in, ease-dt-out, ease-dt-bounce
```

---

## ♿ Accesibilidad - Reduced Motion

**SIEMPRE** respetar `prefers-reduced-motion`:

### Con Motion Shim

```typescript
// Ya manejado automáticamente en shim
// Pero para animaciones complejas:
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

<motion.div
  animate={prefersReducedMotion ? false : { opacity: 1, y: 0 }}
/>
```

### Con CSS

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

/* O usar clases de Tailwind */
.motion-reduce:animate-none
.motion-reduce:transition-none
```

---

## 📊 Performance

### Mejores prácticas

1. **Usar `transform` y `opacity`** - Son las propiedades más performantes
2. **Evitar animar `width`, `height`, `top`, `left`** - Causan reflow
3. **Usar `will-change` con moderación** - Solo en elementos animados frecuentemente
4. **Centralización del runtime** - El shim concentra la semántica declarativa sobre GSAP
5. **Debounce/throttle** - Para animaciones basadas en scroll/mouse

### Métricas objetivo

- **First Contentful Paint**: < 1.8s
- **Largest Contentful Paint**: < 2.5s
- **Animation frame rate**: 60fps consistente

---

## 🔄 Migración desde APIs declarativas previas

### Cambios necesarios

```typescript
// ❌ Antes (otra librería de animación)
import { motion, AnimatePresence } from 'some-other-motion-library';

// ✅ Después (motion-shim)
import { motion, AnimatePresence } from '@/components/ui/motion-shim';
```

### Diferencias

1. **Easing**: El shim acepta nombres declarativos y los traduce a GSAP
2. **Spring**: El shim simplifica casos comunes; para física avanzada usa GSAP directo
3. **Layout animations**: Soporte limitado en shim (usar `layout`/`layoutId` cuando aplique)
4. **Drag**: La API de compatibilidad es acotada; para casos avanzados usar una integración específica

---

## 📝 Ejemplos por Caso de Uso

### Grid de cards con stagger

```typescript
{items.map((item, index) => (
  <motion.div
    key={item.id}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05, duration: 0.3 }}
  >
    <Card {...item} />
  </motion.div>
))}
```

### Hover effect

```typescript
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  transition={{ duration: 0.15 }}
>
  Click me
</motion.button>
```

### Página con entrada suave

```typescript
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.4, ease: 'easeOut' }}
>
  <PageContent />
</motion.div>
```

### Modal con backdrop

```typescript
<AnimatePresence>
  {isOpen && (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="backdrop"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="modal"
      >
        Content
      </motion.div>
    </>
  )}
</AnimatePresence>
```

---

## 🔍 Debugging

### Herramientas útiles

1. **React Scan** - Ya instalado en el proyecto (detecta re-renders)
2. **Chrome DevTools > Animations** - Inspeccionar animaciones CSS
3. **Chrome DevTools > Performance** - Medir FPS y tiempos

### Logs de desarrollo

```typescript
import { clientLogger } from '@/lib/logger/client-logger';

// Log cuando inicia animación
clientLogger.debug('Animation started', { element: 'card', type: 'fade-in' });
```

---

## 📚 Referencias

- [GSAP Documentation](https://gsap.com/docs/v3/)
- [Motion API patterns](https://www.framer.com/motion/) (solo como referencia conceptual de ergonomía)
- [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [Design Tokens CSS](../styles/design-tokens.css)

---

## ✅ Checklist de Implementación

Antes de entregar un componente con animaciones:

- [ ] Usa el sistema estándar (shim/lib/CSS)
- [ ] No mezcla múltiples sistemas
- [ ] Respeta `prefers-reduced-motion`
- [ ] Usa design tokens para duraciones/timing
- [ ] Anima solo `transform` y `opacity` cuando sea posible
- [ ] Tiene fallback sin JS si aplica
- [ ] Documenta cualquier comportamiento especial

---

## 🚀 Próximos Pasos

1. **Audit completo** - Revisar componentes nuevos para mantener GSAP como estándar único
2. **Componentes v3** - Actualizar a usar siempre el shim o `@/lib/anime`
3. **Testing** - Agregar tests de accesibilidad para reduced-motion
4. **Documentación** - Mantener actualizada esta guía

---

**Última actualización**: 2025-01-31
**Versión**: 1.0
**Autor**: Sistema de UX/UI Image Manager
