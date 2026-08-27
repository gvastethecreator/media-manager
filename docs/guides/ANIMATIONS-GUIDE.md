# Animations guide

This document sets the standard for the animation system in Media Manager. Use one animation path per component.

## Mandatory standardization

**Critical rule**: All components must use **one** of these three options:

1. **`@/components/ui/motion-shim`** (recommended for declarative compatibility)
2. **`@/lib/anime`** (for complex timeline animations)
3. **CSS animations** (for simple hover and state animations)

**Forbidden**:

- Mix multiple systems in the same component.
- Import another animation library directly if a solution already exists in `motion-shim` or `@/lib/anime`.
- Reintroduce extra animation libraries in new components.

---

## Option 1: Motion shim (recommended)

### When to use

Use the shim for:

- React components that need enter and exit animations
- Replacement of declarative motion APIs
- Hover, tap, and exit animations
- Grids with stagger animations

### API

```typescript
import { motion, AnimatePresence } from '@/components/ui/motion-shim';

// Basic component
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
>
  Content
</motion.div>

// With variants
const variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

<motion.div variants={variants} initial="hidden" animate="visible" />

// AnimatePresence for mount/unmount
<AnimatePresence>
  {isVisible && (
    <motion.div exit={{ opacity: 0 }}>
      Content
    </motion.div>
  )}
</AnimatePresence>

// Hover animations
<motion.div
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
/>
```

### Available components

```typescript
(motion.div, motion.button, motion.span, motion.img);
(motion.section, motion.article, motion.header);
(motion.footer, motion.nav, motion.main);
// ... and more (see motion-shim.tsx)
```

### Supported props

Supported props include:

- `initial`: initial state
- `animate`: target state
- `exit`: state on unmount (requires AnimatePresence)
- `whileHover`: state on hover
- `whileTap`: state on click
- `transition`: configuration `{ duration, ease, delay, type }`
- `variants`: named variants
- `layout`: boolean for layout animations
- `layoutId`: string for shared layout animations

---

## Option 2: Lib anime (for advanced cases)

### When to use

Use `@/lib/anime` for:

- Complex timeline animations
- Programmatic stagger animations
- Animations that need control (play, pause, seek)
- Integration with the morph and flip transition system

### API

```typescript
import { anime, animate, createTimeline, stagger } from '@/lib/anime';

// Simple animation
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

## Option 3: CSS animations

### When to use

Use CSS animations for:

- Simple hover and focus animations
- Loading states
- Basic transitions
- Cases that do not need JavaScript

### Available classes

```css
/* Enter */
.animate-fade-in
.animate-slide-up
.animate-scale-in
.animate-zoom-bounce

/* Emphasis */
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

### Use in Tailwind

```html
<div class="transition-all duration-dt-fast ease-dt-out hover:scale-105" />
<div class="animate-fade-in duration-dt-normal" />
```

---

## Design tokens for animations

### Durations

```css
--dt-duration-instant: 50ms; /* Micro-interactions */
--dt-duration-fast: 150ms; /* Hover, focus */
--dt-duration-normal: 250ms; /* UI transitions */
--dt-duration-slow: 400ms; /* Entries, modals */
```

### Timing functions

```css
--dt-ease-default: cubic-bezier(0.4, 0, 0.2, 1);
--dt-ease-in: cubic-bezier(0.4, 0, 1, 1);
--dt-ease-out: cubic-bezier(0, 0, 0.2, 1);
--dt-ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Tailwind classes

```
duration-dt-instant, duration-dt-fast, duration-dt-normal, duration-dt-slow
ease-dt-default, ease-dt-in, ease-dt-out, ease-dt-bounce
```

---

## Accessibility: reduced motion

Always respect `prefers-reduced-motion`.

### With motion shim

```typescript
// Already handled automatically in the shim
// For complex animations:
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

<motion.div
  animate={prefersReducedMotion ? false : { opacity: 1, y: 0 }}
/>
```

### With CSS

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

/* Or use Tailwind classes */
.motion-reduce:animate-none
.motion-reduce:transition-none
```

---

## Performance

### Practices

Follow these practices:

1. **Use `transform` and `opacity`**. They are the most performant properties.
2. **Avoid animating `width`, `height`, `top`, and `left`**. They cause reflow.
3. **Use `will-change` with moderation**. Use it only on elements that animate often.
4. **Centralize the runtime**. The shim concentrates declarative semantics on GSAP.
5. **Debounce or throttle**. Use this for scroll or mouse animations.

### Target metrics

Target metrics are:

- **First Contentful Paint**: less than 1.8s
- **Largest Contentful Paint**: less than 2.5s
- **Animation frame rate**: consistent 60fps

---

## Migration from previous declarative APIs

### Required changes

```typescript
// Before (another animation library)
import { motion, AnimatePresence } from 'some-other-motion-library';

// After (motion-shim)
import { motion, AnimatePresence } from '@/components/ui/motion-shim';
```

### Differences

The shim differs in these ways:

1. **Easing**: The shim accepts declarative names and translates them to GSAP.
2. **Spring**: The shim simplifies common cases. For advanced physics, use GSAP directly.
3. **Layout animations**: Support is limited in the shim. Use `layout` or `layoutId` when it applies.
4. **Drag**: The compatibility API is limited. For advanced cases, use a specific integration.

---

## Examples by use case

### Card grid with stagger

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

### Page with a soft enter

```typescript
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.4, ease: 'easeOut' }}
>
  <PageContent />
</motion.div>
```

### Modal with backdrop

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

## Debugging

### Useful tools

Useful tools include:

1. **React Scan**. Already installed in the project. It detects re-renders.
2. **Chrome DevTools > Animations**. Inspect CSS animations.
3. **Chrome DevTools > Performance**. Measure FPS and times.

### Development logs

```typescript
import { clientLogger } from '@/lib/logger/client-logger';

// Log when an animation starts
clientLogger.debug('Animation started', { element: 'card', type: 'fade-in' });
```

---

## References

The following references support this guide:

- [GSAP Documentation](https://gsap.com/docs/v3/)
- [Motion API patterns](https://www.framer.com/motion/) (conceptual ergonomics reference only)
- [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [Design Tokens CSS](../../src/styles/design-tokens.css)

---

## Implementation checklist

Before you deliver a component with animations:

- [ ] It uses the standard system (shim, lib, or CSS).
- [ ] It does not mix multiple systems.
- [ ] It respects `prefers-reduced-motion`.
- [ ] It uses design tokens for durations and timing.
- [ ] It animates only `transform` and `opacity` when possible.
- [ ] It has a no-JS fallback when it applies.
- [ ] It documents any special behavior.

---

## Next steps

The next work is:

1. **Complete audit**. Review new components to keep GSAP as the single standard.
2. **v3 components**. Update them to always use the shim or `@/lib/anime`.
3. **Testing**. Add accessibility tests for reduced motion.
4. **Documentation**. Keep this guide current.

---

**Last update**: 2025-01-31  
**Version**: 1.0  
**Author**: Media Manager UX/UI system
