# 🎨 Guía del Sistema de Themes - Image Manager

**Versión:** 2.0  
**Última actualización:** 2026-01-30

---

## 📋 Índice

1. [Visión General](#visión-general)
2. [Arquitectura](#arquitectura)
3. [Temas Disponibles](#temas-disponibles)
4. [Tokens de Color](#tokens-de-color)
5. [Uso en Componentes](#uso-en-componentes)
6. [Mejores Prácticas](#mejores-prácticas)
7. [Migración desde Hardcodeo](#migración-desde-hardcodeo)
8. [Solución de Problemas](#solución-de-problemas)

---

## Visión General

El sistema de themes de Image Manager está diseñado para:

- ✅ **14 temas personalizables** con transiciones fluidas
- ✅ **Tokens CSS centralizados** - ningún color hardcodeado
- ✅ **Soporte automático de modo oscuro/claro**
- ✅ **Variables semánticas** para consistencia visual
- ✅ **Paleta OKLCH** para percepción uniforme de color
- ✅ **Transiciones suaves** entre temas (300ms)

---

## Arquitectura

### Estructura de Archivos

```
src/
├── app/
│   ├── globals.css          # Estilos globales + importación de themes
│   └── themes.css           # Definición de 14 temas personalizados
├── styles/
│   ├── tokens.css           # Tokens semánticos de color
│   ├── design-tokens.css    # Design tokens v2.0 (OKLCH)
│   └── utilities/
│       ├── theme-system.css # Sistema de themes y transiciones
│       ├── transitions.css  # Transiciones de estado
│       ├── animations.css   # Animaciones
│       ├── typography.css   # Sistema tipográfico
│       └── component-recipes.css
├── lib/styles/
│   ├── color-tokens.ts      # Tokens TypeScript
│   └── chart-colors.ts      # Colores para gráficos
└── components/ui/
    └── theme-provider.tsx   # Theme Provider principal
```

### Flujo de Datos

```
ThemeProvider (React Context)
    ↓
useTheme hook
    ↓
data-theme attribute en <html>
    ↓
CSS Variables aplicadas
    ↓
Tailwind usa var(--color-name)
```

---

## Temas Disponibles

### Temas Básicos
| Tema | Descripción | Caso de uso |
|------|-------------|-------------|
| `light` | Tema claro estándar | Uso diurno |
| `dark` | Tema oscuro estándar | Uso nocturno |
| `system` | Automático según OS | Preferencia del sistema |

### Temas Especiales
| Tema | Descripción | Caso de uso |
|------|-------------|-------------|
| `cafe` | Tonos marrones cálidos | Ambiente acogedor |
| `violeta` | Púrpuras oscuros | Creatividad |
| `madera` | Tonos madera neutros | Naturaleza |
| `nocturno` | Azulado reducido brillo | Fatiga visual |
| `verde` | Esmeralda oscuro | Enfoque |
| `atardecer` | Naranjas y rojos | Relajación |
| `corporativo` | Azul profesional | Entornos de trabajo |
| `carbon` | Negro carbón | Contraste máximo |
| `teal` | Verde azulado | Moderno |
| `citrico` | Amarillos vibrantes | Energía |
| `aurora` | Azules, púrpuras, verdes | Inspiración |
| `neon` | Cyberpunk brillante | Creatividad extrema |

---

## Tokens de Color

### Variables de Tema (shadcn/ui)

Estas variables cambian según el tema activo:

```css
/* Superficies */
--background           /* Fondo principal */
--foreground           /* Texto principal */
--card                 /* Fondo de tarjetas */
--card-foreground      /* Texto en tarjetas */
--popover              /* Fondo de popovers */
--popover-foreground   /* Texto en popovers */

/* Acciones */
--primary              /* Color primario */
--primary-foreground   /* Texto sobre primario */
--secondary            /* Color secundario */
--secondary-foreground /* Texto sobre secundario */
--accent               /* Color de acento */
--accent-foreground    /* Texto sobre acento */
--destructive          /* Color destructivo */
--destructive-foreground /* Texto sobre destructivo */

/* Estados */
--muted                /* Fondo apagado */
--muted-foreground     /* Texto apagado */
--border               /* Color de bordes */
--input                /* Fondo de inputs */
--ring                 /* Color de focus ring */
```

### Design Tokens (Consistentes en todos los themes)

```css
/* Paleta primaria (azul) */
--dt-primary-50 a --dt-primary-950

/* Escala de grises */
--dt-neutral-50 a --dt-neutral-950

/* Estados */
--dt-success-50 a --dt-success-900
--dt-warning-50 a --dt-warning-900
--dt-danger-50 a --dt-danger-900

/* Sombras */
--dt-shadow-0 a --dt-shadow-4
--dt-inset-1, --dt-inset-2

/* Timing */
--dt-duration-instant: 50ms
--dt-duration-fast: 150ms
--dt-duration-normal: 250ms
--dt-duration-slow: 400ms
```

### Tokens de Entidades

```css
/* Contenido */
--entity-image: oklch(0.59 0.2 255);      /* Azul */
--entity-video: oklch(0.63 0.24 29);      /* Rojo */
--entity-audio: oklch(0.68 0.16 201);     /* Sky */
--entity-document: oklch(0.55 0.1 250);   /* Slate */
--entity-file: oklch(0.55 0.1 250);       /* Gris */
--entity-file-3d: oklch(0.65 0.15 277);   /* Índigo */

/* Organización */
--entity-folder: oklch(0.75 0.18 85);     /* Amarillo */
--entity-album: oklch(0.59 0.23 293);     /* Violeta */
--entity-collection: oklch(0.63 0.2 195); /* Cyan */
--entity-group: oklch(0.64 0.17 175);     /* Teal */

/* Metadatos */
--entity-character: oklch(0.7 0.2 350);   /* Rosa */
--entity-place: oklch(0.64 0.17 175);     /* Teal */
--entity-tag: oklch(0.7 0.2 350);         /* Rosa */
--entity-prompt: oklch(0.64 0.17 165);    /* Esmeralda */
--entity-note: oklch(0.63 0.24 29);       /* Rojo */
```

---

## Uso en Componentes

### Hook useTheme

```tsx
import { useTheme } from '@/components/ui/theme-provider';

function MyComponent() {
  const { theme, setTheme, themes, resolvedTheme } = useTheme();

  return (
    <div>
      <p>Tema actual: {theme}</p>
      <p>Tema resuelto: {resolvedTheme}</p>
      
      <select onChange={(e) => setTheme(e.target.value)}>
        {themes.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
    </div>
  );
}
```

### Theme Toggle

```tsx
import { ThemeToggle } from '@/components/core/theme/theme-toggle';

function Header() {
  return (
    <header>
      <ThemeToggle />
    </header>
  );
}
```

### Colores en Tailwind

```tsx
// ✅ USAR - Variables CSS de Tailwind
<div className="bg-background text-foreground" />
<div className="bg-primary text-primary-foreground" />
<div className="border-border" />

// ✅ USAR - Design Tokens
<div className="bg-dt-primary-500" />
<div className="text-dt-success-600" />
<div className="shadow-dt-2" />

// ✅ USAR - Colores de entidades
<div className="text-entity-image" />
<div className="bg-entity-folder" />
```

### Colores en CSS

```css
/* ✅ USAR - Variables CSS */
.my-component {
  background: var(--background);
  color: var(--foreground);
  border: 1px solid var(--border);
}

/* ✅ USAR - Con opacidad (color-mix) */
.my-overlay {
  background: color-mix(in oklch, var(--primary) 50%, transparent);
}

/* ✅ USAR - Design Tokens */
.my-button {
  background: var(--dt-primary-500);
  box-shadow: var(--dt-shadow-2);
  transition: all var(--dt-duration-fast) var(--dt-ease-out);
}
```

### Colores en TypeScript

```ts
import { getEntityColor, ENTITY_COLOR_VARS } from '@/lib/styles/color-tokens';

// Obtener variable CSS
const imageColor = getEntityColor('image'); // "var(--entity-image)"

// Usar directamente
const style = { color: 'var(--entity-video)' };

// Para gráficos (Recharts)
import { CHART_COLORS, withOpacity } from '@/lib/styles/chart-colors';

const data = [
  { color: CHART_COLORS.primary },
  { color: withOpacity(CHART_COLORS.secondary, 0.5) },
];
```

---

## Mejores Prácticas

### ✅ HACER

```tsx
// 1. Usar variables CSS del tema
<div className="bg-background text-foreground" />

// 2. Para componentes con variantes, usar cva con tokens
const variants = cva({
  base: 'bg-background text-foreground',
  variants: {
    intent: {
      primary: 'bg-primary text-primary-foreground',
      danger: 'bg-destructive text-destructive-foreground',
    },
  },
});

// 3. Para hover/focus, usar opacidad
<button className="bg-primary hover:bg-primary/90" />

// 4. Usar color-mix para opacidad personalizada
<div style={{ background: 'color-mix(in oklch, var(--primary) 30%, transparent)' }} />

// 5. Colores de entidades para tipos dinámicos
<div style={{ color: `var(--entity-${entityType})` }} />

// 6. Siempre proporcionar fallback para SSR
<div style={{ color: 'var(--primary, oklch(0.55 0.18 240))' }} />
```

### ❌ NO HACER

```tsx
// 1. NUNCA usar hex/rgb/rgba hardcodeado
<div style={{ color: '#3b82f6' }} />           // ❌
<div className="text-[#3b82f6]" />             // ❌
<div style={{ background: 'rgba(0,0,0,0.5)' }} /> // ❌

// 2. NUNCA usar colores Tailwind directamente
<div className="text-blue-500" />              // ❌ (solo en casos especiales)
<div className="bg-gray-100" />                // ❌

// 3. NUNCA hardcodear para "modo oscuro"
<div className="dark:text-white" />            // ❌ (usar variables CSS)

// 4. NUNCA asumir valores de tema
const isDark = theme === 'dark';               // ❌ (puede haber más themes oscuros)
```

---

## Migración desde Hardcodeo

### Ejemplo 1: Botón con color hardcodeado

**Antes:**
```tsx
<button style={{ background: '#3b82f6', color: 'white' }}>
  Click me
</button>
```

**Después:**
```tsx
<button className="bg-primary text-primary-foreground">
  Click me
</button>
```

### Ejemplo 2: Overlay con opacidad

**Antes:**
```tsx
<div style={{ background: 'rgba(0, 0, 0, 0.5)' }} />
```

**Después:**
```tsx
// Opción 1: Usar color del tema
<div className="bg-black/50" />  // Tailwind opacity

// Opción 2: Usar variable con opacidad
<div style={{ background: 'color-mix(in oklch, var(--background) 50%, transparent)' }} />
```

### Ejemplo 3: Colores de entidad dinámica

**Antes:**
```tsx
const COLORS = {
  image: '#3b82f6',
  video: '#ef4444',
  audio: '#0ea5e9',
};

<div style={{ color: COLORS[type] }} />
```

**Después:**
```tsx
<div style={{ color: `var(--entity-${type})` }} />
// o
<div className={`text-entity-${type}`} />
```

---

## Solución de Problemas

### El tema no aplica

```tsx
// Verificar que ThemeProvider envuelve la app
<ThemeProvider defaultTheme="system" storageKey="theme">
  <App />
</ThemeProvider>

// Verificar que el atributo data-theme existe en <html>
// Debería verse: <html data-theme="dark">
```

### Transiciones no funcionan

```css
/* Asegurar que las transiciones están habilitadas */
html {
  transition: background-color 0.4s ease, color 0.4s ease;
}
```

### Variables CSS no definidas

```tsx
// Si una variable no existe, usar fallback
<div style={{ color: 'var(--mi-variable, var(--primary))' }} />
```

### Flash de tema incorrecto (FOUC)

```tsx
// El ThemeProvider maneja esto automáticamente
// Asegurar que el script de tema esté en el head
```

---

## Referencias

- [Design Tokens v2.0](../src/styles/design-tokens.css)
- [Tokens Semánticos](../src/styles/tokens.css)
- [Sistema de Themes](../src/styles/utilities/theme-system.css)
- [Theme Provider](../src/components/ui/theme-provider.tsx)
- [color-tokens.ts](../src/lib/styles/color-tokens.ts)
- [chart-colors.ts](../src/lib/styles/chart-colors.ts)

---

## Changelog

### v2.0 (2026-01-30)
- ✅ Eliminados todos los colores hex hardcodeados
- ✅ Agregados temas `aurora` y `neon`
- ✅ Actualizado Theme Provider con 14 temas
- ✅ Ripple effect usa variables CSS
- ✅ Documentación completa
