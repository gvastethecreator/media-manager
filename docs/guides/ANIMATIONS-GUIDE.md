# Animations guide

Use one animation path per component:

1. `@/components/ui/motion-shim` for declarative enter, exit, hover, and stagger
2. `@/lib/anime` for timelines and programmatic control
3. CSS animations for simple hover and state changes

Do not mix those systems in one component. Do not import another animation library when the shim or `@/lib/anime` already covers the case. Do not add extra animation libraries to new components.

## Motion shim

Use the shim for React enter and exit animations, hover, tap, exit, and grids with stagger.

```typescript
import { motion, AnimatePresence } from '@/components/ui/motion-shim';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
>
  Content
</motion.div>

const variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

<motion.div variants={variants} initial="hidden" animate="visible" />

<AnimatePresence>
  {isVisible && (
    <motion.div exit={{ opacity: 0 }}>
      Content
    </motion.div>
  )}
</AnimatePresence>

<motion.div
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
/>
```

Available components include `motion.div`, `motion.button`, `motion.span`, `motion.img`, `motion.section`, `motion.article`, `motion.header`, `motion.footer`, `motion.nav`, and `motion.main`. See `motion-shim.tsx` for the full list.

Supported props:

- `initial`: initial state
- `animate`: target state
- `exit`: state on unmount (requires AnimatePresence)
- `whileHover`: state on hover
- `whileTap`: state on click
- `transition`: configuration `{ duration, ease, delay, type }`
- `variants`: named variants
- `layout`: boolean for layout animations
- `layoutId`: string for shared layout animations

## Lib anime

Use `@/lib/anime` for complex timelines, programmatic stagger, play/pause/seek, and morph or flip transitions.

```typescript
import { anime, animate, createTimeline, stagger } from '@/lib/anime';

await animate({
	targets: '.element',
	translateX: 250,
	duration: 800,
	easing: 'easeOutQuad',
});

const timeline = await createTimeline();
timeline.add({ targets: '.el1', translateX: 100 }, 0).add({ targets: '.el2', translateX: 100 }, '+=100');

await stagger('.items', {
	translateY: [20, 0],
	opacity: [0, 1],
	delay: (el, i) => i * 100,
	duration: 500,
});
```

## CSS animations

Use CSS for simple hover and focus, loading states, basic transitions, and cases that do not need JavaScript.

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

```html
<div class="transition-all duration-dt-fast ease-dt-out hover:scale-105" />
<div class="animate-fade-in duration-dt-normal" />
```

## Design tokens

```css
--dt-duration-instant: 50ms; /* Micro-interactions */
--dt-duration-fast: 150ms; /* Hover, focus */
--dt-duration-normal: 250ms; /* UI transitions */
--dt-duration-slow: 400ms; /* Entries, modals */

--dt-ease-default: cubic-bezier(0.4, 0, 0.2, 1);
--dt-ease-in: cubic-bezier(0.4, 0, 1, 1);
--dt-ease-out: cubic-bezier(0, 0, 0.2, 1);
--dt-ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

Tailwind classes: `duration-dt-instant`, `duration-dt-fast`, `duration-dt-normal`, `duration-dt-slow`, `ease-dt-default`, `ease-dt-in`, `ease-dt-out`, `ease-dt-bounce`.

## Reduced motion

Always respect `prefers-reduced-motion`.

The shim handles common cases. For complex animations:

```typescript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

<motion.div
  animate={prefersReducedMotion ? false : { opacity: 1, y: 0 }}
/>
```

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

Tailwind: `.motion-reduce:animate-none` and `.motion-reduce:transition-none`.

## Performance

1. Animate `transform` and `opacity`. They are the cheapest properties.
2. Avoid animating `width`, `height`, `top`, and `left`. They cause reflow.
3. Use `will-change` only on elements that animate often.
4. Keep declarative motion on the shim. The shim concentrates that work on GSAP.
5. Debounce or throttle scroll and mouse animations.

Targets: First Contentful Paint under 1.8s, Largest Contentful Paint under 2.5s, animation frame rate a consistent 60fps.

## Migration from previous declarative APIs

```typescript
// Before (another animation library)
import { motion, AnimatePresence } from 'some-other-motion-library';

// After (motion-shim)
import { motion, AnimatePresence } from '@/components/ui/motion-shim';
```

Differences:

1. Easing: the shim accepts declarative names and translates them to GSAP.
2. Spring: the shim simplifies common cases. For advanced physics, use GSAP directly.
3. Layout animations: support is limited. Use `layout` or `layoutId` when it applies.
4. Drag: the compatibility API is limited. For advanced cases, use a specific integration.

## Examples

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

## Debugging

1. React Scan is already installed. It detects re-renders.
2. Chrome DevTools > Animations inspects CSS animations.
3. Chrome DevTools > Performance measures FPS and times.

```typescript
import { clientLogger } from '@/lib/logger/client-logger';

clientLogger.debug('Animation started', { element: 'card', type: 'fade-in' });
```

## References

- [GSAP Documentation](https://gsap.com/docs/v3/)
- [Motion API patterns](https://www.framer.com/motion/) (conceptual ergonomics reference only)
- [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [Design Tokens CSS](../../src/styles/design-tokens.css)

## Checklist

Before you deliver a component with animations:

- [ ] It uses the standard system (shim, lib, or CSS).
- [ ] It does not mix multiple systems.
- [ ] It respects `prefers-reduced-motion`.
- [ ] It uses design tokens for durations and timing.
- [ ] It animates only `transform` and `opacity` when possible.
- [ ] It has a no-JS fallback when it applies.
- [ ] It documents any special behavior.