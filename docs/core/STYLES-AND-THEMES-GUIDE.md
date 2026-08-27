# Styles and theme system

Media Manager themes rest on CSS variables, design tokens, and TypeScript helpers. Components should use those tokens instead of hardcoded colors.

## File structure

Theme files live under `src/styles/`:

```
src/styles/
├── app-globals.css
├── globals.css
├── themes.css
├── tokens.css
├── design-tokens.css
├── scrollbar.css
├── selecto.css
├── view-transition.css
├── utilities/theme-system.css
src/lib/styles/
├── color-tokens.ts
└── chart-colors.ts
src/providers/theme-provider.tsx
src/components/core/theme/theme-toggle.tsx
```

Theme application follows this sequence:

1. `themes.css` defines base variables in `oklch()`.
2. Tailwind maps those variables in `globals.css` through `@theme inline`.
3. The app sets `data-theme` on `<html>` to activate the matching theme.

## Available themes

The product includes these theme keys:

| Theme         | Description                        |
| ------------- | ---------------------------------- |
| `light`       | Light theme with gray tones        |
| `dark`        | Standard dark theme                |
| `cafe`        | Warm brown tones                   |
| `violeta`     | Dark purple                        |
| `madera`      | Earth tones                        |
| `nocturno`    | Dark blue                          |
| `verde`       | Green tones                        |
| `atardecer`   | Warm oranges and reds              |
| `corporativo` | Professional blue                  |
| `carbon`      | Deep black with gray accents       |
| `teal`        | Blue-green                         |
| `citrico`     | Vibrant yellows                    |
| `aurora`      | Aurora-inspired                    |
| `neon`        | Bright high-contrast               |

`ThemeProvider` also supports `system`, which follows the operating-system preference and persists the choice in localStorage.

```tsx
import { ThemeProvider } from '@/providers/theme-provider';
import { ThemeToggle } from '@/components/core/theme/theme-toggle';
import { useTheme } from '@/components/ui/theme-provider';
```

`useTheme` exposes `theme`, `resolvedTheme`, `themes`, and `setTheme`.

## Semantic CSS variables

These variables change with the selected theme:

```css
--background --foreground
--card --card-foreground
--popover --popover-foreground
--primary --primary-foreground
--secondary --secondary-foreground
--muted --muted-foreground
--accent --accent-foreground
--destructive --destructive-foreground
--border --input --ring
--sidebar-background --sidebar-foreground
--sidebar-primary --sidebar-accent
--sidebar-border --sidebar-ring
--chart-1 to --chart-5
```

Use them through Tailwind classes (`bg-background`, `text-foreground`, `border-border`) or `var(--primary)`.

### Design tokens (`--dt-*`)

`src/styles/design-tokens.css` defines palettes, shadows, timing, and radius:

- palettes: `--dt-primary-*`, `--dt-neutral-*`, `--dt-success-*`, `--dt-warning-*`, `--dt-danger-*`
- shadows: `--dt-shadow-0` through `--dt-shadow-4`, `--dt-inset-1`, `--dt-inset-2`
- timing: `--dt-duration-instant` (50ms), `--dt-duration-fast` (150ms), `--dt-duration-normal` (250ms), `--dt-duration-slow` (400ms)
- easing: `--dt-ease-default`, `--dt-ease-in`, `--dt-ease-out`, `--dt-ease-bounce`

### Entity tokens (`tokens.css`)

```css
--entity-image --entity-video --entity-audio --entity-document
--entity-file-3d --entity-json --entity-folder
--entity-album --entity-collection --entity-group --entity-favorite
--entity-character --entity-place --entity-world-item --entity-concept
--entity-tag --entity-prompt --entity-note --entity-property --entity-wildcard
--entity-system
```

Prefer `getEntityColor` and `getEntityClasses` from `@/lib/styles/color-tokens` over copying these values.

## TypeScript tokens

```typescript
import {
	getEntityColor,
	getEntityClasses,
	DEFAULT_ENTITY_COLOR,
	PRESET_COLORS_HEX,
} from '@/lib/styles/color-tokens';
import { CHART_COLORS, FILE_TYPE_COLORS, getChartColor } from '@/lib/styles/chart-colors';
```

`getEntityColor('image')` returns `var(--entity-image)`. Chart helpers feed Recharts fills and strokes.

## Practices

Do:

- Use theme Tailwind classes and CSS variables.
- Use `color-tokens.ts` for entity colors and `chart-colors.ts` for charts.
- Use `color-mix(in oklch, var(--primary) 30%, transparent)` when you need opacity.
- Use `PRESET_COLORS_HEX` and `DEFAULT_ENTITY_COLOR` for user-chosen colors stored as hex.

Do not:

- Hardcode hex, `rgb()`, or `rgba()` in UI components.
- Duplicate color maps in a component.
- Use `bg-blue-500` when a semantic token already exists.

Canvas `ctx.fillStyle` does not read CSS variables. If you must pass a hex value, document the matching token next to it.

## Theme transitions

`themes.css` transitions `background-color`, `color`, and `border-color` on `html`. `theme-transitioning` in `utilities/theme-system.css` extends that transition to descendants. The standard duration is `--dt-theme-transition-duration: 300ms`.

Reduced-motion users get a near-zero duration:

```css
@media (prefers-reduced-motion: reduce) {
	.theme-transitioning,
	.theme-transitioning * {
		transition-duration: 0.01ms !important;
	}
}
```

## Add a theme

1. Define `html[data-theme='ocean']` variables in `src/styles/themes.css`.
2. Add `'ocean'` to the `customThemes` list in `src/providers/theme-provider.tsx`.
3. Optional: add `--dt-*` overrides for that theme in `src/styles/design-tokens.css`.
4. Optional: extend the `Theme` union in `src/lib/contexts/theme-context.tsx`.
5. Run `bun run dev:full`, open ThemeToggle, and check contrast, entity colors, and transitions.

## Related reading

- [`./FRONTEND-GUIDE.md`](./FRONTEND-GUIDE.md)
- [Tailwind CSS theme configuration](https://tailwindcss.com/docs/theme)
- [OKLCH](https://oklch.com/)
