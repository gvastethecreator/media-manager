# Theme system guide

Complete guide to the Media Manager theme system with 14 custom themes, design tokens, and practices.

---

## Contents

1. [Theme system summary](#theme-system-summary)
2. [Using CSS variables](#using-css-variables)
3. [Practices](#practices)
4. [Migration of hardcoded colors](#migration-of-hardcoded-colors)
5. [Theme transitions](#theme-transitions)
6. [How to add a new theme](#how-to-add-a-new-theme)

---

## Theme system summary

Media Manager has a robust and flexible theme system. It lets you customize the full appearance of the application.

### 14 custom themes available

The product includes these themes:

| Theme         | Description                    | Best for                         |
| ------------- | ------------------------------ | -------------------------------- |
| `light`       | Light theme with soft grays    | Daytime use, office              |
| `dark`        | Default dark theme             | Night use, battery saving        |
| `cafe`        | Warm brown tones               | Relaxed environment              |
| `violeta`     | Dark purples                   | Creativity, design               |
| `madera`      | Neutral wood tones             | Natural, organic                 |
| `nocturno`    | Bluish, for visual fatigue     | Prolonged reading                |
| `verde`       | Dark emerald                   | Nature, calm                     |
| `atardecer`   | Warm oranges and reds          | Creativity, energy               |
| `corporativo` | Professional blue              | Business environments            |
| `carbon`      | Minimal charcoal black         | High contrast                    |
| `teal`        | Blue-green                     | Freshness, modernity             |
| `citrico`     | Vibrant yellows                | Energy, positivity               |
| `aurora`      | Inspired by auroras borealis   | Fantasy, creativity              |
| `neon`        | Cyberpunk/neon style           | Gaming, modern                   |

### ThemeProvider with `system` support

`ThemeProvider` supplies a complete context to manage themes:

```tsx
// src/providers/theme-provider.tsx
import { ThemeProvider } from '@/providers/theme-provider';

// In your application
function App() {
	return (
		<ThemeProvider defaultTheme="system" storageKey="theme">
			<YourApp />
		</ThemeProvider>
	);
}
```

**Characteristics:**

- Support for the `system` theme that detects the OS preference automatically
- Persistence in localStorage
- Smooth transitions between themes
- CSS classes applied automatically (`light`, `dark`, `system`)

### ThemeToggle to change themes

```tsx
// src/components/core/theme/theme-toggle.tsx
import { ThemeToggle } from '@/components/core/theme/theme-toggle';

// Use in any component
function Header() {
	return (
		<header>
			<ThemeToggle />
		</header>
	);
}
```

**Toggle features:**

- Dropdown with all available themes
- Visual indicator of the current theme
- Smooth animations between icons (sun/moon)
- Accessible (ARIA labels)

### useTheme hook

```tsx
import { useTheme } from '@/components/ui/theme-provider';

function MyComponent() {
	const { theme, setTheme, themes, resolvedTheme } = useTheme();

	// theme: currently selected theme (includes 'system')
	// resolvedTheme: resolved theme ('light' or 'dark') when theme is 'system'
	// themes: array with all available themes
	// setTheme: function to change the theme

	return (
		<div>
			<p>Current theme: {theme}</p>
			<p>Resolved theme: {resolvedTheme}</p>
			<button onClick={() => setTheme('dark')}>Switch to dark</button>
		</div>
	);
}
```

---

## Using CSS variables

The theme system is based on CSS variables. They update dynamically according to the selected theme.

### Semantic variables (shadcn/ui compatible)

Main variables that change with the theme:

```css
/* Base UI variables */
--background        /* Main background */
--foreground        /* Main text */
--card              /* Card background */
--card-foreground   /* Text on cards */
--popover           /* Popover background */
--popover-foreground/* Text on popovers */
--primary           /* Primary color (buttons, links) */
--primary-foreground/* Text on primary color */
--secondary         /* Secondary color */
--secondary-foreground /* Text on secondary */
--muted             /* Background of muted elements */
--muted-foreground  /* Muted text */
--accent            /* Accent color */
--accent-foreground /* Text on accent */
--destructive       /* Color for destructive actions */
--destructive-foreground /* Text on destructive */
--border            /* Border color */
--input             /* Input color */
--ring              /* Focus ring color */
```

**Use in Tailwind:**

```tsx
<div className="bg-background text-foreground">
	<button className="bg-primary text-primary-foreground hover:bg-primary/90">Click me</button>
</div>
```

**Use in inline CSS:**

```tsx
<div style={{ backgroundColor: 'var(--background)' }}>
	<span style={{ color: 'var(--primary)' }}>Text</span>
</div>
```

### Design tokens (`--dt-*`)

Complete design-token system in `src/styles/design-tokens.css`:

#### Color palettes

```css
/* Primary (Blue) */
--dt-primary-50 to --dt-primary-950

/* Neutral (Grays) */
--dt-neutral-50 to --dt-neutral-950

/* Success (Green) */
--dt-success-50 to --dt-success-900

/* Warning (Amber) */
--dt-warning-50 to --dt-warning-900

/* Danger (Red) */
--dt-danger-50 to --dt-danger-900
```

#### Shadows

```css
--dt-shadow-0    /* No shadow */
--dt-shadow-1    /* Subtle (inputs, buttons) */
--dt-shadow-2    /* Medium (cards, dropdowns) */
--dt-shadow-3    /* High (popovers, tooltips) */
--dt-shadow-4    /* Maximum (modals) */
--dt-inset-1     /* Subtle inner shadow */
--dt-inset-2     /* Strong inner shadow */
```

#### Timing and easing

```css
--dt-duration-instant: 50ms; /* Micro-interactions */
--dt-duration-fast: 150ms; /* Hover, focus */
--dt-duration-normal: 250ms; /* Standard transitions */
--dt-duration-slow: 400ms; /* Elaborated animations */
--dt-ease-default: cubic-bezier(0.4, 0, 0.2, 1);
--dt-ease-in: cubic-bezier(0.4, 0, 1, 1);
--dt-ease-out: cubic-bezier(0, 0, 0.2, 1);
--dt-ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
```

#### Borders and radius

```css
--dt-border-width: 2px;
--dt-border-width-thin: 1px;
--dt-border-soft;
--dt-border-medium;
--dt-border-strong;
--dt-border-focus;
--dt-radius-xs: 2px;
--dt-radius-sm: 4px;
--dt-radius-md: 6px;
--dt-radius-lg: 8px;
--dt-radius-xl: 12px;
--dt-radius-full: 9999px;
```

### Entity tokens

Specific colors for each entity type in `src/styles/tokens.css`:

```css
/* Content entities */
--entity-image: oklch(0.59 0.2 255); /* Blue */
--entity-video: oklch(0.63 0.24 29); /* Red */
--entity-audio: oklch(0.68 0.16 201); /* Sky */
--entity-document: oklch(0.55 0.1 250); /* Slate */
--entity-file-3d: oklch(0.65 0.15 277); /* Indigo */
--entity-json: oklch(0.7 0.15 350); /* Pink */

/* Organization entities */
--entity-folder: oklch(0.75 0.18 85); /* Yellow */
--entity-album: oklch(0.59 0.23 293); /* Violet */
--entity-collection: oklch(0.63 0.2 195); /* Cyan */
--entity-group: oklch(0.64 0.17 175); /* Teal */
--entity-favorite: oklch(0.75 0.18 85); /* Amber */

/* Creative entities */
--entity-character: oklch(0.7 0.2 350); /* Pink */
--entity-place: oklch(0.64 0.17 175); /* Teal */
--entity-world-item: oklch(0.72 0.2 130); /* Lime */
--entity-concept: oklch(0.72 0.18 65); /* Amber */

/* Metadata entities */
--entity-tag: oklch(0.7 0.2 350); /* Pink */
--entity-prompt: oklch(0.64 0.17 165); /* Emerald */
--entity-note: oklch(0.63 0.24 29); /* Red */
--entity-property: oklch(0.7 0.15 350); /* Light pink */
--entity-wildcard: oklch(0.7 0.2 350); /* Pink */

/* System entities */
--entity-system: oklch(0.55 0.12 240); /* Gray-blue */
```

**Practical use:**

```tsx
// In React components
<div style={{ color: 'var(--entity-image)' }}>Image</div>
<div style={{ color: 'var(--entity-video)' }}>Video</div>

// With Tailwind (using arbitrary values)
<div className="text-[color:var(--entity-folder)]">Folder</div>
```

---

## Practices

### Never use hardcoded colors

```tsx
// BAD - Never do this
<div style={{ color: '#3b82f6' }} />
<div className="text-[#3b82f6]" />
<div style={{ background: 'rgba(255, 255, 255, 0.3)' }} />
<div className="bg-blue-500" />

// BAD - Do not use hex colors in CSS
.custom-class {
  color: #3b82f6;
  background: rgba(255, 255, 255, 0.5);
}
```

### Always use CSS variables

```tsx
// GOOD - Use semantic CSS variables
<div className="text-primary" />
<div className="bg-background" />
<div className="border-border" />

// GOOD - Use design tokens
<div className="bg-dt-primary-500" />
<div className="text-dt-success-600" />

// GOOD - In CSS
.custom-class {
  color: var(--primary);
  background: var(--background);
  border: 1px solid var(--border);
}
```

### Use color-mix for opacities

When you need to adjust the opacity of a color, use `color-mix()`:

```tsx
// GOOD - Use color-mix for opacity
<div style={{
  background: 'color-mix(in oklch, var(--primary) 30%, transparent)'
}} />

// GOOD - Combine colors
<div style={{
  background: 'color-mix(in oklch, var(--entity-image) 20%, var(--background))'
}} />

// GOOD - In CSS with oklch(from)
--panel-bg-overlay: oklch(from var(--background) l c h / 0.4);
```

### Code examples: good versus bad

#### Example 1: Button with hover

```tsx
// BAD
<button
  style={{
    background: '#3b82f6',
    color: 'white'
  }}
  onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
  onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
>
  Click
</button>

// GOOD
import { Button } from '@/components/ui/button';

<Button variant="default">
  Click
</Button>

// Or using Tailwind classes
<button className="bg-primary text-primary-foreground hover:bg-primary/90">
  Click
</button>
```

#### Example 2: Card with border

```tsx
// BAD
<div style={{
  border: '1px solid #e5e7eb',
  background: '#ffffff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
}} />

// GOOD
<div className="border bg-card shadow-dt-1" />

// Or with CSS
<div style={{
  border: '1px solid var(--border)',
  background: 'var(--card)',
  boxShadow: 'var(--dt-shadow-1)'
}} />
```

#### Example 3: Entity badge

```tsx
// BAD
<div style={{
  background: 'rgba(59, 130, 246, 0.2)',
  color: '#3b82f6',
  border: '1px solid rgba(59, 130, 246, 0.4)'
}}>
  Image
</div>

// GOOD
<div style={{
  background: 'color-mix(in oklch, var(--entity-image) 20%, transparent)',
  color: 'var(--entity-image)',
  border: '1px solid color-mix(in oklch, var(--entity-image) 40%, transparent)'
}}>
  Image
</div>

// Or using Tailwind classes with color-mix
<div className="bg-[color:color-mix(in_oklch,var(--entity-image)_20%,transparent)]
                text-[color:var(--entity-image)]">
  Image
</div>
```

---

## Migration of hardcoded colors

During the migration to the theme system, multiple files that used hardcoded colors were corrected.

### Common migration patterns

#### 1. Hex colors to CSS variables

```tsx
// BEFORE
<div style={{ color: '#3b82f6' }} />

// AFTER
<div style={{ color: 'var(--primary)' }} />
// or
<div className="text-primary" />
```

#### 2. RGBA to color-mix

```tsx
// BEFORE
<div style={{ background: 'rgba(59, 130, 246, 0.2)' }} />

// AFTER
<div style={{
  background: 'color-mix(in oklch, var(--primary) 20%, transparent)'
}} />
```

#### 3. Hardcoded entity colors to tokens

```tsx
// BEFORE
const entityColors = {
  image: '#3b82f6',
  video: '#ef4444',
  folder: '#eab308'
};

// AFTER
// Use the CSS variables directly
<div style={{ color: 'var(--entity-image)' }} />
<div style={{ color: 'var(--entity-video)' }} />
<div style={{ color: 'var(--entity-folder)' }} />
```

#### 4. Hardcoded shadows to design tokens

```tsx
// BEFORE
<div style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} />

// AFTER
<div style={{ boxShadow: 'var(--dt-shadow-1)' }} />
// or
<div className="shadow-dt-1" />
```

### Key files in the migration

The following files were updated to use the theme system:

| File                                    | Main changes                                          |
| --------------------------------------- | ----------------------------------------------------- |
| `src/styles/tokens.css`                 | Definition of entity tokens and functional colors     |
| `src/styles/design-tokens.css`          | Color palettes, shadows, timing, borders              |
| `src/styles/themes.css`                 | Definitions of the 14 custom themes                   |
| `src/styles/utilities/theme-system.css` | Transition system and utilities                       |
| `src/components/cards/*`                | Migration of hardcoded colors to tokens               |
| `src/components/ui/*.tsx`               | UI components using CSS variables                     |
| `src/components/views/*`                | Views using entity tokens                             |

---

## Theme transitions

The system includes automatic smooth transitions when you change themes.

### Automatic transitions

```css
/* src/styles/themes.css - At the end of the file */
html {
	transition:
		background-color 0.4s cubic-bezier(0.4, 0, 0.2, 1),
		color 0.4s cubic-bezier(0.4, 0, 0.2, 1),
		border-color 0.4s cubic-bezier(0.4, 0, 0.2, 1),
		box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1),
		outline-color 0.4s cubic-bezier(0.4, 0, 0.2, 1),
		text-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1),
		background 0.4s cubic-bezier(0.4, 0, 0.2, 1),
		filter 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### `theme-transitioning` class

For more controlled transitions, use the `theme-transitioning` class:

```tsx
// Apply transitions to all child elements
<div className="theme-transitioning">
	<Card />
	<Button />
	<Text />
</div>
```

**CSS definition:**

```css
/* src/styles/utilities/theme-system.css */
.theme-transitioning,
.theme-transitioning *,
.theme-transitioning *::before,
.theme-transitioning *::after {
	transition:
		background-color var(--dt-theme-transition-duration) var(--dt-theme-transition-timing),
		border-color var(--dt-theme-transition-duration) var(--dt-theme-transition-timing),
		color var(--dt-theme-transition-duration) var(--dt-theme-transition-timing),
		fill var(--dt-theme-transition-duration) var(--dt-theme-transition-timing),
		stroke var(--dt-theme-transition-duration) var(--dt-theme-transition-timing),
		box-shadow var(--dt-theme-transition-duration) var(--dt-theme-transition-timing) !important;
}
```

### Duration: 300ms

The standard duration of theme transitions is **300ms**:

```css
:root {
	--dt-theme-transition-duration: 300ms;
	--dt-theme-transition-timing: cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Reduced motion support

The system respects the user preference to reduce motion:

```css
@media (prefers-reduced-motion: reduce) {
	.theme-transitioning,
	.theme-transitioning *,
	.theme-transitioning *::before,
	.theme-transitioning *::after {
		transition-duration: 0.01ms !important;
	}
}
```

---

## How to add a new theme

### Step 1: Define the theme CSS variables

Add a new section in `src/styles/themes.css`:

```css
/* Custom theme - Example: Ocean */
html[data-theme='ocean'] {
	/* Base variables */
	--background: oklch(0.2 0.04 220);
	--foreground: oklch(0.95 0.01 220);
	--card: oklch(0.25 0.05 220);
	--card-foreground: oklch(0.95 0.01 220);
	--popover: oklch(0.25 0.05 220);
	--popover-foreground: oklch(0.95 0.01 220);

	/* Main colors */
	--primary: oklch(0.6 0.18 220);
	--primary-foreground: oklch(0.1 0.01 220);
	--secondary: oklch(0.3 0.06 220);
	--secondary-foreground: oklch(0.95 0.01 220);

	/* States */
	--muted: oklch(0.3 0.05 220);
	--muted-foreground: oklch(0.7 0.03 220);
	--accent: oklch(0.55 0.12 220);
	--accent-foreground: oklch(0.95 0.01 220);
	--destructive: oklch(0.6 0.15 20);
	--destructive-foreground: oklch(0.95 0.01 220);

	/* UI elements */
	--border: oklch(0.35 0.04 220);
	--input: oklch(0.35 0.04 220);
	--ring: oklch(0.6 0.18 220);

	/* Sidebar */
	--sidebar-background: oklch(0.15 0.03 220);
	--sidebar-foreground: oklch(0.95 0.01 220);
	--sidebar-primary: oklch(0.6 0.18 220);
	--sidebar-primary-foreground: oklch(0.1 0.01 220);
	--sidebar-accent: oklch(0.3 0.06 220);
	--sidebar-accent-foreground: oklch(0.95 0.01 220);
	--sidebar-border: oklch(0.3 0.04 220);
	--sidebar-ring: oklch(0.6 0.18 220);

	/* Charts */
	--chart-1: oklch(0.6 0.18 220);
	--chart-2: oklch(0.55 0.15 240);
	--chart-3: oklch(0.65 0.12 200);
	--chart-4: oklch(0.5 0.14 180);
	--chart-5: oklch(0.7 0.16 260);
}
```

### Step 2: Register the theme in ThemeProvider

Add the theme to the list in `src/providers/theme-provider.tsx`:

```tsx
const customThemes = [
	'light',
	'dark',
	'cafe',
	'violeta',
	'madera',
	'nocturno',
	'verde',
	'atardecer',
	'corporativo',
	'carbon',
	'teal',
	'citrico',
	'aurora',
	'neon',
	'ocean', // <-- New theme
];
```

### Step 3: Add dark mode overrides (optional)

If your theme needs specific dark-mode adjustments, add them in `src/styles/design-tokens.css`:

```css
html[data-theme='ocean'] {
	/* Specific adjustments for ocean theme */
	--dt-shadow-color: oklch(0 0 0 / 0.3);
	--dt-border-soft: var(--dt-border-width) solid oklch(1 0 0 / 0.06);
}
```

### Step 4: Update the context (optional)

If you need specific support in the theme context, update `src/lib/contexts/theme-context.tsx`:

```tsx
// Make sure the type includes the new theme
export type Theme =
	| 'light'
	| 'dark'
	| 'system'
	| 'cafe'
	| 'violeta'
	| 'madera'
	| 'nocturno'
	| 'verde'
	| 'atardecer'
	| 'corporativo'
	| 'carbon'
	| 'teal'
	| 'citrico'
	| 'aurora'
	| 'neon'
	| 'ocean';
```

### Step 5: Test the theme

Follow this sequence:

1. Start the application: `bun run dev:full`
2. Open ThemeToggle.
3. Select your new theme "Ocean".
4. Verify that:
   - The colors apply correctly.
   - The transitions work.
   - All components look good.
   - There are no problematic contrasts.

### Tips to create a good theme

Follow these tips:

1. **Use OKLCH**. Colors in OKLCH are more consistent perceptually.
2. **Keep contrast**. Make sure foreground has good contrast with background.
3. **Be consistent**. Use the same hue for related variables.
4. **Test in both modes**. If your theme is dark, verify the needed overrides.
5. **Consider the entities**. Entity colors must remain distinguishable in your theme.

---

## References

The following files support this guide:

- [Design Tokens CSS](src/styles/design-tokens.css)
- [Entity tokens](src/styles/tokens.css)
- [Theme definitions](src/styles/themes.css)
- [Theme system utilities](src/styles/utilities/theme-system.css)
- [ThemeProvider](src/providers/theme-provider.tsx)
- [ThemeToggle](src/components/core/theme/theme-toggle.tsx)
- [Theme context](src/lib/contexts/theme-context.tsx)

---

## Support

If you find problems with the theme system, or you need help to create a new one, review:

1. The browser console (ThemeProvider has debug logging).
2. That all CSS variables are defined.
3. That the theme is registered in the `customThemes` array.
4. That transitions do not interfere with layout.
