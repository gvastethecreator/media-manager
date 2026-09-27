# Animations

Use the animation path already owned by the component. The current React motion shim is `src/components/ui/motion-shim.tsx`, backed by GSAP. Simple hover, focus, and loading transitions can use the existing CSS utilities. Do not add another animation library or mix systems on the same element.

## Motion shim

```tsx
import { motion } from '@/components/ui/motion-shim';

<motion.div
  initial={{ opacity: 0, y: 12 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
>
  Content
</motion.div>
```

The shim maps animation properties to GSAP and supports enter, hover, and tap behavior. Inspect its implementation before relying on a prop: accepted `layout` and `layoutId` props do not implement shared-layout transitions. `AnimatePresence` supplies context but does not retain removed children for a complete exit lifecycle.

The former `@/lib/anime` module is absent. Use the installed GSAP implementation and existing component patterns for programmatic animation; do not copy old anime examples.

## Verification

Keep animations scoped to the component and clean up owned timelines or tweens. Respect `prefers-reduced-motion`; the shim does not provide a universal reduced-motion policy for every consumer.

Check the rendered flow, including interruption, unmount, keyboard focus, and reduced motion. Verify exit behavior in the browser before claiming support. See [styles and themes](../core/STYLES-AND-THEMES-GUIDE.md) for CSS tokens and theme transitions.
