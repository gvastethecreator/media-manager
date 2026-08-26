# Styles and theme system guide

This document describes the color and theme system of the project. It includes practices that keep visual consistency.

## Contents

1. [Theme system architecture](#theme-system-architecture)
2. [Semantic CSS variables](#semantic-css-variables)
3. [TypeScript color tokens](#typescript-color-tokens)
4. [Practices](#practices)
5. [Migration of hardcoded colors](#migration-of-hardcoded-colors)
6. [Usage examples](#usage-examples)

---

## Theme system architecture

### File structure

```
src/
├── app/
│   ├── globals.css          # Main CSS, imports themes and tokens
│   └── themes.css           # Definition of all themes
├── styles/
│   ├── tokens.css           # Centralized semantic CSS variables
│   ├── scrollbar.css        # Custom scrollbar styles
│   └── ...
├── lib/styles/
│   ├── color-tokens.ts      # TypeScript tokens for entity colors
│   └── chart-colors.ts      # Colors for Recharts charts
└── tailwind.config.ts       # Tailwind configuration with CSS variables
```

### Theme flow

Theme application follows this sequence:

1. **Base variables** are defined in `themes.css` using `oklch()` for better color perception.
2. **Tailwind variables** map to CSS variables in `globals.css` through `@theme inline`.
3. **Application** uses the `data-theme` attribute on `<html>` to activate the matching theme.

### Available themes

The product includes these themes:

| Theme         | Description                               |
| ------------- | ----------------------------------------- |
| `light`       | Light theme with gray tones               |
| `dark`        | Standard dark theme                       |
| `cafe`        | Warm brown tones                          |
| `violeta`     | Dark purple                               |
| `madera`      | Earth tones                               |
| `nocturno`    | Dark blue to reduce visual fatigue        |
| `verde`       | Green tones                               |
| `atardecer`   | Warm oranges and reds                     |
| `corporativo` | Professional blue                         |
| `carbon`      | Deep black with gray accents              |
| `teal`        | Blue-green                                |
| `citrico`     | Vibrant yellows                           |
| `aurora`      | Inspired by auroras borealis              |
| `neon`        | Cyberpunk with bright colors              |

---

## Semantic CSS variables

### Base theme variables

```css
/* Backgrounds and surfaces */
--background          /* Main background */
--foreground          /* Main text color */
--card                /* Card background */
--card-foreground     /* Text on cards */
--popover             /* Popover background */
--popover-foreground  /* Text on popovers */

/* Semantic colors */
--primary             /* Main or accent color */
--primary-foreground  /* Text on primary */
--secondary           /* Secondary color */
--secondary-foreground
--muted               /* Muted elements */
--muted-foreground
--accent              /* Visual accents */
--accent-foreground
--destructive         /* Destructive actions */
--destructive-foreground

/* UI */
--border              /* Borders */
--input               /* Input fields */
--ring                /* Focus ring */

/* Sidebar */
--sidebar-background
--sidebar-foreground
--sidebar-primary
--sidebar-accent
--sidebar-border
--sidebar-ring

/* Charts */
--chart-1 to --chart-5 /* Colors for visualizations */
```

### Entity variables (`tokens.css`)

```css
/* Content */
--entity-image        /* Blue - images */
--entity-video        /* Red - videos */
--entity-audio        /* Sky - audio */
--entity-document     /* Slate - documents */
--entity-folder       /* Yellow - folders */

/* Organization */
--entity-album        /* Violet - albums */
--entity-collection   /* Cyan - collections */
--entity-group        /* Teal - groups */
--entity-favorite     /* Amber - favorites */

/* Creative */
--entity-character    /* Pink - characters */
--entity-place        /* Teal - places */
--entity-world-item   /* Lime - world items */
--entity-concept      /* Amber - concepts */

/* Metadata */
--entity-tag          /* Pink - tags */
--entity-prompt       /* Emerald - prompts */
--entity-note         /* Red - notes */
--entity-property     /* Light pink - properties */
```

---

## TypeScript color tokens

### Location: `src/lib/styles/color-tokens.ts`

```typescript
import {
	ENTITY_COLOR_VARS,
	ENTITY_TAILWIND_CLASSES,
	getEntityColor,
	getEntityClasses,
	DEFAULT_ENTITY_COLOR,
	PRESET_COLORS_HEX,
} from '@/lib/styles/color-tokens';

// Get a CSS variable for use in style
const color = getEntityColor('image'); // "var(--entity-image)"

// Get Tailwind classes for className
const bgClass = getEntityClasses('folder', 'bg'); // "bg-yellow-500"
const textClass = getEntityClasses('folder', 'text'); // "text-yellow-500"

// Default color for forms
const defaultColor = DEFAULT_ENTITY_COLOR; // "#3b82f6"
```

### Chart colors: `src/lib/styles/chart-colors.ts`

```typescript
import {
  CHART_COLORS,
  METRIC_COLORS,
  FILE_TYPE_COLORS,
  getChartColor
} from '@/lib/styles/chart-colors';

// Use in Recharts
<Line stroke={CHART_COLORS.primary} />
<Bar fill={METRIC_COLORS.cpu} />
<Cell fill={FILE_TYPE_COLORS.images} />

// Dynamic palette by index
data.map((_, i) => <Cell fill={getChartColor(i)} />)
```

---

## Practices

### Do

```tsx
// 1. Use Tailwind classes with theme variables
<div className="bg-background text-foreground border-border" />

// 2. Use CSS variables for dynamic styles
<div style={{ backgroundColor: 'var(--primary)' }} />

// 3. Use centralized tokens for entity colors
import { getEntityClasses } from '@/lib/styles/color-tokens';
<div className={getEntityClasses('folder', 'bg')} />

// 4. Use tokens for charts
import { CHART_COLORS } from '@/lib/styles/chart-colors';
<Line stroke={CHART_COLORS.primary} />

// 5. Use semantic Tailwind classes
<Button variant="destructive" /> // Instead of bg-red-500
```

### Do not

```tsx
// 1. NEVER hardcode hex colors in components
<div style={{ backgroundColor: '#3b82f6' }} /> // no

// 2. NEVER use hex colors in className
<div className="bg-[#3b82f6]" /> // no

// 3. NEVER duplicate color definitions
const COLORS = { blue: '#3b82f6' }; // no. Use the existing tokens

// 4. NEVER use rgb/rgba directly for UI
<div style={{ color: 'rgba(59, 130, 246, 0.5)' }} /> // no
// Use: className="text-primary/50"
```

### Special cases

#### Canvas context

Canvas contexts (`ctx.fillStyle`) do not support CSS variables. In those cases:

```tsx
// Document the color and its Tailwind equivalent
ctx.fillStyle = '#3b82f6'; // blue-500, equivalent to var(--selection-border)
```

#### User-customizable colors

For properties that the user can customize (tag color, group color):

```tsx
// Use PRESET_COLORS_HEX from the centralized token
import { PRESET_COLORS_HEX, DEFAULT_ENTITY_COLOR } from '@/lib/styles/color-tokens';

// The color is stored in DB as hex and used in style
<div style={{ backgroundColor: entity.color ?? DEFAULT_ENTITY_COLOR }} />;
```

---

## Migration of hardcoded colors

### Step 1: Identify

Search these patterns in the code:

- `#[0-9a-fA-F]{3,8}`
- `rgb(`, `rgba(`, `hsl(`

### Step 2: Categorize

Use these categories:

- **Thematic UI**: migrate to CSS variables
- **Charts**: use tokens from `chart-colors.ts`
- **Entities**: use tokens from `color-tokens.ts`
- **User-customizable**: keep, but use `DEFAULT_ENTITY_COLOR`

### Step 3: Replace

Use this replacement map:

| Before                         | After                              |
| ------------------------------ | ---------------------------------- |
| `#3b82f6`                      | `text-blue-500` or `var(--primary)` |
| `bg-[#ef4444]`                 | `bg-red-500` or `bg-destructive`   |
| `style={{ color: '#10b981' }}` | `className="text-emerald-500"`     |

---

## Usage examples

### Component with theme

```tsx
export function EntityCard({ entity }: Props) {
	return (
		<div className="bg-card text-card-foreground border border-border rounded-lg">
			<div className="w-4 h-4 rounded-full" style={{ backgroundColor: entity.color ?? DEFAULT_ENTITY_COLOR }} />
			<span className="text-foreground">{entity.name}</span>
		</div>
	);
}
```

### Chart with consistent colors

```tsx
import { CHART_COLORS, FILE_TYPE_COLORS } from '@/lib/styles/chart-colors';

export function FileTypeChart({ data }) {
	return (
		<PieChart>
			<Pie data={data}>
				{data.map((entry, i) => (
					<Cell key={entry.name} fill={FILE_TYPE_COLORS[entry.type] ?? getChartColor(i)} />
				))}
			</Pie>
		</PieChart>
	);
}
```

### Form with color picker

```tsx
import { ColorPicker } from '@/components/ui/color-picker';
// ColorPicker already uses PRESET_COLORS_HEX internally

<ColorPicker value={formData.color} onChange={(color) => setFormData({ ...formData, color })} />;
```

---

## Theme transitions

The system includes smooth transitions when the theme changes:

```css
html {
	transition:
		background-color 0.4s cubic-bezier(0.4, 0, 0.2, 1),
		color 0.4s cubic-bezier(0.4, 0, 0.2, 1),
		border-color 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## Review checklist

Before you commit, verify:

- [ ] There are no hardcoded hex colors in TSX components.
- [ ] New colors use CSS variables or TypeScript tokens.
- [ ] Charts use colors from `chart-colors.ts`.
- [ ] Entity colors use tokens from `color-tokens.ts`.
- [ ] The component looks correct in light and dark mode.
- [ ] Theme transitions work without glitches.

---

## References

The following references support this guide:

- [Tailwind CSS v4 - Theme Configuration](https://tailwindcss.com/docs/theme)
- [OKLCH Color Space](https://oklch.com/)
- [Recharts Customization](https://recharts.org/en-US/guide/customize)
