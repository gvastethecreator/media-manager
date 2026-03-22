# 🎨 Guía de Estilos y Sistema de Themes

Este documento describe el sistema de colores y temas del proyecto, incluyendo las mejores prácticas para mantener la consistencia visual.

## Índice

1. [Arquitectura del Sistema de Themes](#arquitectura-del-sistema-de-themes)
2. [Variables CSS Semánticas](#variables-css-semánticas)
3. [Tokens de Color TypeScript](#tokens-de-color-typescript)
4. [Buenas Prácticas](#buenas-prácticas)
5. [Migración de Colores Hardcodeados](#migración-de-colores-hardcodeados)
6. [Ejemplos de Uso](#ejemplos-de-uso)

---

## Arquitectura del Sistema de Themes

### Estructura de Archivos

```
src/
├── app/
│   ├── globals.css          # CSS principal, importa themes y tokens
│   └── themes.css           # Definición de todos los temas
├── styles/
│   ├── tokens.css           # Variables CSS semánticas centralizadas
│   ├── scrollbar.css        # Estilos de scrollbar personalizados
│   └── ...
├── lib/styles/
│   ├── color-tokens.ts      # Tokens TypeScript para colores de entidad
│   └── chart-colors.ts      # Colores para gráficos Recharts
└── tailwind.config.ts       # Configuración Tailwind con variables CSS
```

### Flujo de Temas

1. **Variables Base** → Definidas en `themes.css` usando `oklch()` para mejor percepción de color
2. **Variables Tailwind** → Mapean a las variables CSS en `globals.css` via `@theme inline`
3. **Aplicación** → El atributo `data-theme` en `<html>` activa el tema correspondiente

### Temas Disponibles

| Tema          | Descripción                            |
| ------------- | -------------------------------------- |
| `light`       | Tema claro con tonos grises            |
| `dark`        | Tema oscuro estándar                   |
| `cafe`        | Tonos cálidos marrones                 |
| `violeta`     | Púrpura oscuro                         |
| `madera`      | Tonos tierra                           |
| `nocturno`    | Azul oscuro para reducir fatiga visual |
| `verde`       | Tonos verdes                           |
| `atardecer`   | Naranjas y rojos cálidos               |
| `corporativo` | Azul profesional                       |
| `carbon`      | Negro profundo con acentos grises      |
| `teal`        | Verde azulado                          |
| `citrico`     | Amarillos vibrantes                    |
| `aurora`      | Inspirado en auroras boreales          |
| `neon`        | Cyberpunk con colores brillantes       |

---

## Variables CSS Semánticas

### Variables de Theme Base

```css
/* Fondos y superficies */
--background          /* Fondo principal */
--foreground          /* Color de texto principal */
--card                /* Fondo de tarjetas */
--card-foreground     /* Texto en tarjetas */
--popover             /* Fondo de popovers */
--popover-foreground  /* Texto en popovers */

/* Colores semánticos */
--primary             /* Color principal/acento */
--primary-foreground  /* Texto sobre primary */
--secondary           /* Color secundario */
--secondary-foreground
--muted               /* Elementos atenuados */
--muted-foreground
--accent              /* Acentos visuales */
--accent-foreground
--destructive         /* Acciones destructivas */
--destructive-foreground

/* UI */
--border              /* Bordes */
--input               /* Campos de entrada */
--ring                /* Anillo de foco */

/* Sidebar */
--sidebar-background
--sidebar-foreground
--sidebar-primary
--sidebar-accent
--sidebar-border
--sidebar-ring

/* Gráficos */
--chart-1 a --chart-5 /* Colores para visualizaciones */
```

### Variables de Entidad (tokens.css)

```css
/* Contenido */
--entity-image        /* Azul - imágenes */
--entity-video        /* Rojo - videos */
--entity-audio        /* Sky - audio */
--entity-document     /* Slate - documentos */
--entity-folder       /* Amarillo - carpetas */

/* Organización */
--entity-album        /* Violeta - álbumes */
--entity-collection   /* Cyan - colecciones */
--entity-group        /* Teal - grupos */
--entity-favorite     /* Ámbar - favoritos */

/* Creativas */
--entity-character    /* Rosa - personajes */
--entity-place        /* Teal - lugares */
--entity-world-item   /* Lima - objetos de mundo */
--entity-concept      /* Ámbar - conceptos */

/* Metadatos */
--entity-tag          /* Rosa - tags */
--entity-prompt       /* Esmeralda - prompts */
--entity-note         /* Rojo - notas */
--entity-property     /* Rosa claro - propiedades */
```

---

## Tokens de Color TypeScript

### Ubicación: `src/lib/styles/color-tokens.ts`

```typescript
import {
	ENTITY_COLOR_VARS,
	ENTITY_TAILWIND_CLASSES,
	getEntityColor,
	getEntityClasses,
	DEFAULT_ENTITY_COLOR,
	PRESET_COLORS_HEX,
} from '@/lib/styles/color-tokens';

// Obtener variable CSS para usar en style
const color = getEntityColor('image'); // "var(--entity-image)"

// Obtener clases Tailwind para className
const bgClass = getEntityClasses('folder', 'bg'); // "bg-yellow-500"
const textClass = getEntityClasses('folder', 'text'); // "text-yellow-500"

// Color por defecto para formularios
const defaultColor = DEFAULT_ENTITY_COLOR; // "#3b82f6"
```

### Colores para Gráficos: `src/lib/styles/chart-colors.ts`

```typescript
import {
  CHART_COLORS,
  METRIC_COLORS,
  FILE_TYPE_COLORS,
  getChartColor
} from '@/lib/styles/chart-colors';

// Uso en Recharts
<Line stroke={CHART_COLORS.primary} />
<Bar fill={METRIC_COLORS.cpu} />
<Cell fill={FILE_TYPE_COLORS.images} />

// Paleta dinámica por índice
data.map((_, i) => <Cell fill={getChartColor(i)} />)
```

---

## Buenas Prácticas

### ✅ HACER

```tsx
// 1. Usar clases Tailwind con variables del tema
<div className="bg-background text-foreground border-border" />

// 2. Usar variables CSS para estilos dinámicos
<div style={{ backgroundColor: 'var(--primary)' }} />

// 3. Usar tokens centralizados para colores de entidad
import { getEntityClasses } from '@/lib/styles/color-tokens';
<div className={getEntityClasses('folder', 'bg')} />

// 4. Usar tokens para gráficos
import { CHART_COLORS } from '@/lib/styles/chart-colors';
<Line stroke={CHART_COLORS.primary} />

// 5. Usar clases semánticas de Tailwind
<Button variant="destructive" /> // En lugar de bg-red-500
```

### ❌ NO HACER

```tsx
// 1. NUNCA hardcodear colores hex en componentes
<div style={{ backgroundColor: '#3b82f6' }} /> // ❌

// 2. NUNCA usar colores hex en className
<div className="bg-[#3b82f6]" /> // ❌

// 3. NUNCA duplicar definiciones de colores
const COLORS = { blue: '#3b82f6' }; // ❌ Usa los tokens existentes

// 4. NUNCA usar rgb/rgba directamente para UI
<div style={{ color: 'rgba(59, 130, 246, 0.5)' }} /> // ❌
// ✅ Usar: className="text-primary/50"
```

### Casos Especiales

#### Canvas Context

Los contextos de canvas (`ctx.fillStyle`) no soportan variables CSS. En estos casos:

```tsx
// Documentar el color y su equivalente Tailwind
ctx.fillStyle = '#3b82f6'; // blue-500, equivale a var(--selection-border)
```

#### Colores Personalizables por Usuario

Para propiedades que el usuario puede personalizar (color de tag, color de grupo):

```tsx
// Usar PRESET_COLORS_HEX del token centralizado
import { PRESET_COLORS_HEX, DEFAULT_ENTITY_COLOR } from '@/lib/styles/color-tokens';

// El color se guarda en DB como hex y se usa en style
<div style={{ backgroundColor: entity.color ?? DEFAULT_ENTITY_COLOR }} />;
```

---

## Migración de Colores Hardcodeados

### Paso 1: Identificar

Buscar patrones en el código:

- `#[0-9a-fA-F]{3,8}`
- `rgb(`, `rgba(`, `hsl(`

### Paso 2: Categorizar

- **UI Temática**: Migrar a variables CSS
- **Gráficos**: Usar tokens de `chart-colors.ts`
- **Entidades**: Usar tokens de `color-tokens.ts`
- **Usuario-personalizable**: Mantener pero usar `DEFAULT_ENTITY_COLOR`

### Paso 3: Reemplazar

| Antes                          | Después                            |
| ------------------------------ | ---------------------------------- |
| `#3b82f6`                      | `text-blue-500` o `var(--primary)` |
| `bg-[#ef4444]`                 | `bg-red-500` o `bg-destructive`    |
| `style={{ color: '#10b981' }}` | `className="text-emerald-500"`     |

---

## Ejemplos de Uso

### Componente con Tema

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

### Gráfico con Colores Consistentes

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

### Formulario con Color Picker

```tsx
import { ColorPicker } from '@/components/ui/color-picker';
// ColorPicker ya usa PRESET_COLORS_HEX internamente

<ColorPicker value={formData.color} onChange={(color) => setFormData({ ...formData, color })} />;
```

---

## Transiciones de Tema

El sistema incluye transiciones suaves al cambiar de tema:

```css
html {
	transition:
		background-color 0.4s cubic-bezier(0.4, 0, 0.2, 1),
		color 0.4s cubic-bezier(0.4, 0, 0.2, 1),
		border-color 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## Checklist de Revisión

Antes de hacer commit, verificar:

- [ ] No hay colores hex hardcodeados en componentes TSX
- [ ] Los nuevos colores usan variables CSS o tokens TypeScript
- [ ] Los gráficos usan colores de `chart-colors.ts`
- [ ] Los colores de entidad usan tokens de `color-tokens.ts`
- [ ] El componente se ve correcto en modo claro y oscuro
- [ ] Las transiciones de tema funcionan sin glitches

---

## Referencias

- [Tailwind CSS v4 - Theme Configuration](https://tailwindcss.com/docs/theme)
- [OKLCH Color Space](https://oklch.com/)
- [Recharts Customization](https://recharts.org/en-US/guide/customize)
