# 🎨 Auditoría UX/UI Completa - Image Manager

> **Fecha**: 30 de diciembre de 2025  
> **Autor**: Lead UX/UI Engineer + Design Systems Architect  
> **Alcance**: Sistema completo de diseño, componentes, tokens y plan de implementación

---

## 1. RESUMEN EJECUTIVO

### 🔴 Problemas Críticos Detectados

| Área | Problema | Impacto |
|------|----------|---------|
| **Inconsistencia de sombras** | Sombras hardcodeadas con `rgba(0,0,0,x)` en lugar de tokens | UX fragmentada, difícil mantenimiento |
| **Border-radius inconsistente** | Mezcla de `rounded-md`, `rounded-lg`, `rounded-xl`, valores hardcodeados | Estética desigual |
| **Estados incompletos** | Muchos componentes sin estados `active`, `focus-visible` o `loading` | Accesibilidad deficiente |
| **Gradientes ausentes** | Botones y superficies planos sin profundidad visual | Look "genérico" |
| **Sombras inset inexistentes** | No hay feedback táctil de "presión" en estados activos | Falta feedback |
| **Bordes de 1px** | Demasiado sutiles, inconsistentes entre componentes | Poca definición visual |
| **Sin sistema de elevación** | Sombras ad-hoc sin jerarquía visual | Confusión de profundidad |

### ✅ Fortalezas Existentes

- **Sistema de temas sólido**: 15+ temas con OKLCH bien estructurado
- **Tokens de entidades**: Colores semánticos para cada tipo de entidad
- **Soporte dark/light**: Estructura preparada para múltiples temas
- **Animaciones TCG**: Sistema de animaciones para tarjetas ya implementado
- **prefers-reduced-motion**: Ya existe soporte básico en `globals.css`

### 🎯 Objetivos de Mejora

1. **Consistencia 100%**: Todos los componentes usando tokens
2. **Profundidad táctil**: Sombras outset+inset por estado
3. **Gradientes sutiles**: Semi-3D sin ser exagerado
4. **Bordes de 2px**: Definidos y consistentes
5. **Estados completos**: default/hover/active/focus/disabled/loading
6. **Accesibilidad AA**: Contrast ratios + focus visible + reduced-motion

---

## 2. INVENTARIO EXHAUSTIVO

### 2.1 Elementos con Fondo

| Componente | Archivo | Estados Actuales | Inconsistencia | Acción |
|------------|---------|------------------|----------------|--------|
| **Button (default)** | `ui/button.tsx` | hover, disabled | Sin active/focus visual, sin gradiente | Agregar gradiente sutil, estados completos |
| **Button (destructive)** | `ui/button.tsx` | hover, disabled | Color plano | Gradiente rojo-rosado |
| **Button (secondary)** | `ui/button.tsx` | hover, disabled | Sin feedback táctil | Agregar sombra inset en active |
| **Button (ghost)** | `ui/button.tsx` | hover | Muy sutil | Mantener minimalista pero agregar focus ring |
| **Badge** | `ui/badge.tsx` | hover | Sin estados expanded | Mantener simple, agregar micro-interacción |
| **Card** | `ui/card.tsx` | - | Solo `shadow` básico | Sombra por elevación + hover lift |
| **Input** | `ui/input.tsx` | focus | Ring básico, sin feedback en hover | Sutil background change en hover |
| **Select** | `ui/select.tsx` | focus, disabled | Similar a Input | Unificar con Input |
| **Textarea** | `ui/textarea.tsx` | focus, disabled | Similar a Input | Unificar con Input |
| **Checkbox** | `ui/checkbox.tsx` | checked, disabled | Sin transición suave | Agregar transición, mejorar checked state |
| **Switch** | `ui/switch.tsx` | checked, disabled | Básico | Agregar gradiente en checked |
| **Toggle** | `ui/toggle.tsx` | on, hover, disabled | Correcto pero plano | Agregar profundidad |
| **Slider** | `ui/slider.tsx` | - | Track y thumb básicos | Agregar gradiente al thumb, track mejorado |
| **Progress** | `ui/progress.tsx` | - | Muy básico | Gradiente animado, brillo |
| **Tooltip** | `ui/tooltip.tsx` | - | `bg-primary` plano | Sombra elevada, sutil gradiente |
| **Popover** | `ui/popover.tsx` | - | `shadow-md` | Elevar a shadow-lg, borde sutil |
| **DropdownMenu** | `ui/dropdown-menu.tsx` | focus item | Shadow-lg pero items planos | Hover con elevación sutil |
| **Dialog/Modal** | `ui/dialog.tsx` | - | `shadow-lg` básico | Overlay mejorado, bordes |
| **Toast** | `ui/toast.tsx` | - | Borde simple | Gradiente lateral indicador |
| **Table Row** | `ui/table.tsx` | hover, selected | `bg-muted/50` | Hover más notorio, selected destacado |
| **Sidebar Item** | `ui/sidebar.tsx` | hover, active | Básico | Gradiente lateral en active |
| **Card Container** | `globals.css:743` | hover | Sombra hardcodeada | Migrar a tokens |

### 2.2 Elementos con Texto Coloreado

| Elemento | Archivo | Estado Actual | Acción |
|----------|---------|---------------|--------|
| **Links** | Varios | `text-primary` | Agregar underline animado en hover |
| **Error text** | forms | `text-destructive` | OK, mantener |
| **Success text** | tokens.css | `--status-success` | Agregar icono opcional |
| **Warning text** | tokens.css | `--status-warning` | Agregar icono opcional |
| **Muted text** | Varios | `text-muted-foreground` | OK, mantener |
| **Labels** | ui/label.tsx | Sin color especial | Agregar variante required |

### 2.3 Elementos con Gráficos (Charts)

| Elemento | Archivo | Estado Actual | Acción |
|----------|---------|---------------|--------|
| **ChartTooltip** | `ui/chart.tsx` | `border-border/50`, `shadow-xl` | Aumentar contraste borde, gradiente sutil |
| **Series colors** | themes.css | `--chart-1..5` | OK, bien definidos por tema |
| **Legend indicators** | chart.tsx | `rounded-[2px]` | Aumentar a 4px, más visible |
| **Grid lines** | chart.tsx | `stroke-border/50` | Mantener sutil |

### 2.4 Elementos con Bordes y Sombras

| Elemento | Archivo | Border Actual | Shadow Actual | Acción |
|----------|---------|---------------|---------------|--------|
| **Button** | button.tsx | Ninguno (default) | `shadow` básico | 2px border transparent, shadow tokens |
| **Input** | input.tsx | `border-input` 1px | `shadow-sm` | 2px, focus ring mejorado |
| **Card** | card.tsx | `border` 1px | `shadow` | 2px, shadow-elevation-2 |
| **Dialog** | dialog.tsx | `border` 1px | `shadow-lg` | 2px, shadow-elevation-4 |
| **Popover** | popover.tsx | `border` 1px | `shadow-md` | 2px, shadow-elevation-3 |
| **Dropdown** | dropdown-menu.tsx | `border` 1px | `shadow-lg` | 2px, shadow-elevation-3 |
| **Table** | table.tsx | `border-b` 1px | Ninguna | Mantener minimalista |
| **Card Container** | globals.css | Pseudo-element | Hardcodeado | Migrar a tokens |

---

## 3. SISTEMA DE TOKENS PROPUESTO

### 3.1 Archivo: `src/styles/design-tokens.css`

```css
/**
 * 🎨 DESIGN TOKENS v2.0
 * ====================
 * Sistema de diseño unificado para Image Manager
 * 
 * Convenciones:
 * - Prefijo --dt- para "design token"
 * - Valores en OKLCH para consistencia
 * - Fallbacks HSL para compatibilidad
 */

:root {
  /* =====================================================
   * 🎨 PALETA RAMP - PRIMARY (Azul base)
   * ===================================================== */
  --dt-primary-50: oklch(0.97 0.02 240);
  --dt-primary-100: oklch(0.93 0.04 240);
  --dt-primary-200: oklch(0.86 0.08 240);
  --dt-primary-300: oklch(0.76 0.12 240);
  --dt-primary-400: oklch(0.65 0.16 240);
  --dt-primary-500: oklch(0.55 0.18 240);  /* Base */
  --dt-primary-600: oklch(0.48 0.16 240);
  --dt-primary-700: oklch(0.40 0.14 240);
  --dt-primary-800: oklch(0.32 0.12 240);
  --dt-primary-900: oklch(0.24 0.10 240);
  --dt-primary-950: oklch(0.16 0.08 240);

  /* =====================================================
   * 🎨 PALETA RAMP - NEUTRAL (Grises)
   * ===================================================== */
  --dt-neutral-50: oklch(0.98 0.002 0);
  --dt-neutral-100: oklch(0.96 0.002 0);
  --dt-neutral-200: oklch(0.92 0.002 0);
  --dt-neutral-300: oklch(0.87 0.002 0);
  --dt-neutral-400: oklch(0.70 0.002 0);
  --dt-neutral-500: oklch(0.55 0.002 0);
  --dt-neutral-600: oklch(0.45 0.002 0);
  --dt-neutral-700: oklch(0.35 0.002 0);
  --dt-neutral-800: oklch(0.25 0.002 0);
  --dt-neutral-900: oklch(0.18 0.002 0);
  --dt-neutral-950: oklch(0.12 0.002 0);

  /* =====================================================
   * 🎨 PALETA RAMP - SUCCESS (Verde)
   * ===================================================== */
  --dt-success-50: oklch(0.97 0.03 145);
  --dt-success-100: oklch(0.93 0.06 145);
  --dt-success-200: oklch(0.86 0.10 145);
  --dt-success-300: oklch(0.76 0.14 145);
  --dt-success-400: oklch(0.68 0.17 145);
  --dt-success-500: oklch(0.60 0.18 145);  /* Base */
  --dt-success-600: oklch(0.52 0.16 145);
  --dt-success-700: oklch(0.44 0.14 145);
  --dt-success-800: oklch(0.36 0.12 145);
  --dt-success-900: oklch(0.28 0.10 145);

  /* =====================================================
   * 🎨 PALETA RAMP - WARNING (Ámbar)
   * ===================================================== */
  --dt-warning-50: oklch(0.98 0.04 85);
  --dt-warning-100: oklch(0.94 0.08 85);
  --dt-warning-200: oklch(0.88 0.14 85);
  --dt-warning-300: oklch(0.82 0.18 85);
  --dt-warning-400: oklch(0.76 0.18 85);
  --dt-warning-500: oklch(0.70 0.17 85);  /* Base */
  --dt-warning-600: oklch(0.62 0.15 85);
  --dt-warning-700: oklch(0.52 0.13 85);
  --dt-warning-800: oklch(0.42 0.11 85);
  --dt-warning-900: oklch(0.32 0.09 85);

  /* =====================================================
   * 🎨 PALETA RAMP - DANGER (Rojo)
   * ===================================================== */
  --dt-danger-50: oklch(0.97 0.03 25);
  --dt-danger-100: oklch(0.93 0.06 25);
  --dt-danger-200: oklch(0.86 0.12 25);
  --dt-danger-300: oklch(0.76 0.18 25);
  --dt-danger-400: oklch(0.68 0.22 25);
  --dt-danger-500: oklch(0.60 0.24 25);  /* Base */
  --dt-danger-600: oklch(0.52 0.22 25);
  --dt-danger-700: oklch(0.44 0.18 25);
  --dt-danger-800: oklch(0.36 0.14 25);
  --dt-danger-900: oklch(0.28 0.10 25);

  /* =====================================================
   * 🌈 GRADIENTES RECETA
   * Formato: from -> to (2-3 stops max)
   * ===================================================== */
  
  /* Solid: Mismo color, diferente luminosidad */
  --dt-g-primary-solid: linear-gradient(
    135deg,
    var(--dt-primary-400) 0%,
    var(--dt-primary-500) 50%,
    var(--dt-primary-600) 100%
  );
  
  --dt-g-secondary-solid: linear-gradient(
    135deg,
    var(--dt-neutral-200) 0%,
    var(--dt-neutral-300) 100%
  );
  
  --dt-g-success-solid: linear-gradient(
    135deg,
    var(--dt-success-400) 0%,
    var(--dt-success-500) 50%,
    var(--dt-success-600) 100%
  );
  
  --dt-g-warning-solid: linear-gradient(
    135deg,
    var(--dt-warning-400) 0%,
    var(--dt-warning-500) 50%,
    var(--dt-warning-600) 100%
  );
  
  --dt-g-danger-solid: linear-gradient(
    135deg,
    var(--dt-danger-400) 0%,
    var(--dt-danger-500) 50%,
    var(--dt-danger-600) 100%
  );

  /* Soft: Muy sutil, para superficies */
  --dt-g-primary-soft: linear-gradient(
    135deg,
    oklch(0.97 0.01 240 / 0.8) 0%,
    oklch(0.95 0.02 240 / 0.9) 100%
  );
  
  --dt-g-surface-soft: linear-gradient(
    180deg,
    oklch(1 0 0 / 0.02) 0%,
    oklch(0 0 0 / 0.02) 100%
  );

  /* Glass: Para overlays y modales */
  --dt-g-glass: linear-gradient(
    135deg,
    oklch(1 0 0 / 0.1) 0%,
    oklch(1 0 0 / 0.05) 100%
  );

  /* =====================================================
   * 🌑 SOMBRAS POR ELEVACIÓN
   * Outset: elevación visual
   * Inset: feedback táctil
   * ===================================================== */
  
  /* Base shadow color */
  --dt-shadow-color: oklch(0 0 0 / 0.08);
  --dt-shadow-color-dark: oklch(0 0 0 / 0.25);
  
  /* Elevación 0: Sin sombra (pressed/active) */
  --dt-shadow-0: none;
  
  /* Elevación 1: Sutil (inputs, botones default) */
  --dt-shadow-1: 
    0 1px 2px oklch(0 0 0 / 0.05),
    0 1px 3px oklch(0 0 0 / 0.08);
  
  /* Elevación 2: Media (cards, dropdowns) */
  --dt-shadow-2: 
    0 2px 4px oklch(0 0 0 / 0.04),
    0 4px 8px oklch(0 0 0 / 0.08);
  
  /* Elevación 3: Alta (popovers, tooltips) */
  --dt-shadow-3: 
    0 4px 8px oklch(0 0 0 / 0.04),
    0 8px 16px oklch(0 0 0 / 0.08),
    0 16px 32px oklch(0 0 0 / 0.04);
  
  /* Elevación 4: Máxima (modales) */
  --dt-shadow-4: 
    0 8px 16px oklch(0 0 0 / 0.06),
    0 16px 32px oklch(0 0 0 / 0.10),
    0 32px 64px oklch(0 0 0 / 0.06);

  /* Inset shadows (presión/tacto) */
  --dt-inset-1: inset 0 1px 2px oklch(0 0 0 / 0.08);
  --dt-inset-2: inset 0 2px 4px oklch(0 0 0 / 0.12);
  
  /* Highlight interno (brillo superior) */
  --dt-highlight-1: inset 0 1px 0 oklch(1 0 0 / 0.1);
  --dt-highlight-2: inset 0 2px 0 oklch(1 0 0 / 0.15);

  /* =====================================================
   * 📏 BORDES
   * ===================================================== */
  --dt-border-width: 2px;
  --dt-border-width-thin: 1px;
  
  --dt-border-soft: var(--dt-border-width) solid oklch(0 0 0 / 0.06);
  --dt-border-medium: var(--dt-border-width) solid oklch(0 0 0 / 0.12);
  --dt-border-strong: var(--dt-border-width) solid oklch(0 0 0 / 0.20);
  
  --dt-border-focus: var(--dt-border-width) solid var(--dt-primary-500);
  --dt-border-error: var(--dt-border-width) solid var(--dt-danger-500);
  --dt-border-success: var(--dt-border-width) solid var(--dt-success-500);

  /* =====================================================
   * 🔵 BORDER RADIUS
   * ===================================================== */
  --dt-radius-xs: 2px;
  --dt-radius-sm: 4px;
  --dt-radius-md: 6px;
  --dt-radius-lg: 8px;
  --dt-radius-xl: 12px;
  --dt-radius-full: 9999px;

  /* =====================================================
   * ⚡ MOTION & TIMING
   * ===================================================== */
  --dt-ease-default: cubic-bezier(0.4, 0, 0.2, 1);
  --dt-ease-in: cubic-bezier(0.4, 0, 1, 1);
  --dt-ease-out: cubic-bezier(0, 0, 0.2, 1);
  --dt-ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
  
  --dt-duration-instant: 50ms;
  --dt-duration-fast: 150ms;
  --dt-duration-normal: 250ms;
  --dt-duration-slow: 400ms;

  /* =====================================================
   * 🎯 FOCUS RING
   * ===================================================== */
  --dt-focus-ring: 
    0 0 0 2px var(--background),
    0 0 0 4px var(--dt-primary-500);
  
  --dt-focus-ring-error:
    0 0 0 2px var(--background),
    0 0 0 4px var(--dt-danger-500);
}

/* Dark mode overrides */
html.dark,
html[data-theme="dark"],
html[data-theme="nocturno"],
html[data-theme="carbon"],
html[data-theme="neon"],
html[data-theme="aurora"] {
  --dt-shadow-color: oklch(0 0 0 / 0.3);
  --dt-shadow-color-dark: oklch(0 0 0 / 0.5);
  
  --dt-border-soft: var(--dt-border-width) solid oklch(1 0 0 / 0.06);
  --dt-border-medium: var(--dt-border-width) solid oklch(1 0 0 / 0.12);
  --dt-border-strong: var(--dt-border-width) solid oklch(1 0 0 / 0.20);
  
  --dt-highlight-1: inset 0 1px 0 oklch(1 0 0 / 0.05);
  --dt-highlight-2: inset 0 2px 0 oklch(1 0 0 / 0.08);
  
  /* Sombras más pronunciadas en dark */
  --dt-shadow-1: 
    0 1px 2px oklch(0 0 0 / 0.15),
    0 1px 3px oklch(0 0 0 / 0.20);
  
  --dt-shadow-2: 
    0 2px 4px oklch(0 0 0 / 0.15),
    0 4px 8px oklch(0 0 0 / 0.25);
  
  --dt-shadow-3: 
    0 4px 8px oklch(0 0 0 / 0.15),
    0 8px 16px oklch(0 0 0 / 0.25),
    0 16px 32px oklch(0 0 0 / 0.15);
  
  --dt-shadow-4: 
    0 8px 16px oklch(0 0 0 / 0.20),
    0 16px 32px oklch(0 0 0 / 0.30),
    0 32px 64px oklch(0 0 0 / 0.20);
  
  --dt-g-surface-soft: linear-gradient(
    180deg,
    oklch(1 0 0 / 0.03) 0%,
    oklch(0 0 0 / 0.03) 100%
  );
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  :root {
    --dt-duration-instant: 0ms;
    --dt-duration-fast: 0ms;
    --dt-duration-normal: 0ms;
    --dt-duration-slow: 0ms;
  }
}
```

---

## 4. RECETAS POR COMPONENTE

### 4.1 Button

```css
/* Button Primary */
.btn-primary {
  /* Background */
  background: var(--dt-g-primary-solid);
  
  /* Border */
  border: var(--dt-border-width) solid transparent;
  border-radius: var(--dt-radius-md);
  
  /* Shadow */
  box-shadow: 
    var(--dt-shadow-1),
    var(--dt-highlight-1);
  
  /* Transition */
  transition: 
    transform var(--dt-duration-fast) var(--dt-ease-default),
    box-shadow var(--dt-duration-fast) var(--dt-ease-default),
    background var(--dt-duration-fast) var(--dt-ease-default);
}

.btn-primary:hover {
  background: var(--dt-g-primary-solid);
  filter: brightness(1.05);
  box-shadow: 
    var(--dt-shadow-2),
    var(--dt-highlight-2);
  transform: translateY(-1px);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: 
    var(--dt-shadow-0),
    var(--dt-inset-1);
  filter: brightness(0.95);
}

.btn-primary:focus-visible {
  outline: none;
  box-shadow: var(--dt-focus-ring);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  filter: grayscale(0.3);
}
```

### 4.2 Input / Select / Textarea

```css
.input-control {
  /* Background */
  background: var(--background);
  
  /* Border */
  border: var(--dt-border-width) solid var(--border);
  border-radius: var(--dt-radius-md);
  
  /* Shadow */
  box-shadow: var(--dt-inset-1);
  
  /* Transition */
  transition: 
    border-color var(--dt-duration-fast) var(--dt-ease-default),
    box-shadow var(--dt-duration-fast) var(--dt-ease-default),
    background var(--dt-duration-fast) var(--dt-ease-default);
}

.input-control:hover:not(:disabled) {
  border-color: var(--dt-primary-300);
  background: oklch(from var(--background) l c h / 0.98);
}

.input-control:focus {
  outline: none;
  border-color: var(--dt-primary-500);
  box-shadow: 
    var(--dt-inset-1),
    0 0 0 3px oklch(from var(--dt-primary-500) l c h / 0.15);
}

.input-control:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--muted);
}

.input-control[aria-invalid="true"] {
  border-color: var(--dt-danger-500);
  box-shadow: 
    var(--dt-inset-1),
    0 0 0 3px oklch(from var(--dt-danger-500) l c h / 0.15);
}
```

### 4.3 Card / Panel / Modal

```css
.surface-card {
  /* Background */
  background: var(--card);
  
  /* Border */
  border: var(--dt-border-width) solid var(--border);
  border-radius: var(--dt-radius-lg);
  
  /* Shadow */
  box-shadow: var(--dt-shadow-2);
  
  /* Transition */
  transition: 
    box-shadow var(--dt-duration-normal) var(--dt-ease-default),
    transform var(--dt-duration-normal) var(--dt-ease-default);
}

.surface-card:hover {
  box-shadow: var(--dt-shadow-3);
  transform: translateY(-2px);
}

/* Modal específico */
.surface-modal {
  background: var(--popover);
  border: var(--dt-border-width) solid var(--border);
  border-radius: var(--dt-radius-xl);
  box-shadow: var(--dt-shadow-4);
}
```

### 4.4 Tooltip / Popover

```css
.surface-tooltip {
  /* Background */
  background: var(--popover);
  
  /* Border */
  border: var(--dt-border-width) solid oklch(from var(--border) l c h / 0.5);
  border-radius: var(--dt-radius-md);
  
  /* Shadow */
  box-shadow: var(--dt-shadow-3);
}

.surface-popover {
  background: var(--popover);
  border: var(--dt-border-width) solid var(--border);
  border-radius: var(--dt-radius-lg);
  box-shadow: var(--dt-shadow-3);
}
```

### 4.5 Badge/Tag/Chip

```css
.badge {
  /* Background */
  background: var(--dt-g-primary-soft);
  
  /* Border */
  border: var(--dt-border-width) solid oklch(from var(--dt-primary-500) l c h / 0.2);
  border-radius: var(--dt-radius-sm);
  
  /* Shadow */
  box-shadow: var(--dt-shadow-1);
  
  /* Transition */
  transition: 
    transform var(--dt-duration-fast) var(--dt-ease-bounce);
}

.badge:hover {
  transform: scale(1.02);
}

/* Variante destructive */
.badge-destructive {
  background: linear-gradient(135deg, var(--dt-danger-100), var(--dt-danger-200));
  border-color: oklch(from var(--dt-danger-500) l c h / 0.3);
}
```

### 4.6 Navbar/Sidebar Items

```css
.nav-item {
  /* Background */
  background: transparent;
  
  /* Border */
  border: var(--dt-border-width) solid transparent;
  border-radius: var(--dt-radius-sm);
  
  /* Transition */
  transition: 
    background var(--dt-duration-fast) var(--dt-ease-default),
    border-color var(--dt-duration-fast) var(--dt-ease-default),
    box-shadow var(--dt-duration-fast) var(--dt-ease-default);
}

.nav-item:hover {
  background: var(--accent);
  border-color: oklch(from var(--border) l c h / 0.5);
}

.nav-item[data-active="true"] {
  background: var(--dt-g-primary-soft);
  border-color: var(--dt-primary-500);
  box-shadow: 
    inset 3px 0 0 var(--dt-primary-500),
    var(--dt-shadow-1);
}

.nav-item:focus-visible {
  outline: none;
  box-shadow: var(--dt-focus-ring);
}
```

### 4.7 Table Row

```css
.table-row {
  /* Transition */
  transition: background var(--dt-duration-fast) var(--dt-ease-default);
}

.table-row:hover {
  background: oklch(from var(--muted) l c h / 0.5);
}

.table-row[data-selected="true"] {
  background: oklch(from var(--dt-primary-500) l c h / 0.1);
  box-shadow: inset 3px 0 0 var(--dt-primary-500);
}
```

### 4.8 Toast/Notification

```css
.toast {
  /* Background */
  background: var(--popover);
  
  /* Border con indicador lateral */
  border: var(--dt-border-width) solid var(--border);
  border-left-width: 4px;
  border-left-color: var(--dt-primary-500);
  border-radius: var(--dt-radius-md);
  
  /* Shadow */
  box-shadow: var(--dt-shadow-3);
}

.toast-success {
  border-left-color: var(--dt-success-500);
}

.toast-warning {
  border-left-color: var(--dt-warning-500);
}

.toast-error {
  border-left-color: var(--dt-danger-500);
}
```

### 4.9 Chart Elements

```css
.chart-tooltip {
  background: var(--popover);
  border: var(--dt-border-width) solid var(--border);
  border-radius: var(--dt-radius-md);
  box-shadow: var(--dt-shadow-3);
}

.chart-legend-indicator {
  width: 12px;
  height: 12px;
  border-radius: var(--dt-radius-sm);
  box-shadow: var(--dt-shadow-1);
}
```

---

## 5. EFECTO BORDER PULSE (Utilidad Reutilizable)

### Archivo: `src/styles/utilities/border-pulse.css`

```css
/**
 * 🔄 BORDER PULSE EFFECT
 * Efecto sutil de pulso en borde para estados active
 * 
 * USO: Agregar clase .btn-pulse a cualquier elemento interactivo
 */

.btn-pulse {
  position: relative;
  isolation: isolate;
}

/* Pseudo-elemento para el pulso */
.btn-pulse::after {
  content: '';
  position: absolute;
  inset: -1px;
  border: var(--dt-border-width) solid currentColor;
  border-radius: inherit;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.6s 0.1s var(--dt-ease-default);
}

/* Estado active: pulso visible inmediato */
.btn-pulse:active::after {
  opacity: 0.4;
  transition-duration: 0s;
  transition-delay: 0s;
}

/* Variante con color primario */
.btn-pulse--primary::after {
  border-color: var(--dt-primary-500);
}

/* Variante con color de tema actual */
.btn-pulse--themed::after {
  border-color: var(--primary);
}

/* Dark mode: mayor visibilidad */
html.dark .btn-pulse::after,
html[data-theme="dark"] .btn-pulse::after,
html[data-theme="nocturno"] .btn-pulse::after {
  opacity: 0;
}

html.dark .btn-pulse:active::after,
html[data-theme="dark"] .btn-pulse:active::after,
html[data-theme="nocturno"] .btn-pulse:active::after {
  opacity: 0.5;
}

/* Reduced motion: desactivar animación, mantener feedback visual */
@media (prefers-reduced-motion: reduce) {
  .btn-pulse::after {
    transition: none;
  }
  
  .btn-pulse:active::after {
    opacity: 0.3;
  }
}
```

---

## 6. PLAN DE IMPLEMENTACIÓN POR ETAPAS

### Etapa 1: Fundamentos (Semana 1)

| Tarea | Prioridad | Archivos |
|-------|-----------|----------|
| Crear `design-tokens.css` | 🔴 Alta | `src/styles/design-tokens.css` |
| Crear `border-pulse.css` | 🔴 Alta | `src/styles/utilities/border-pulse.css` |
| Importar en `globals.css` | 🔴 Alta | `src/app/globals.css` |
| Agregar clases utilitarias Tailwind | 🟡 Media | `tailwind.config.ts` |

### Etapa 2: Componentes Base (Semana 2)

| Componente | Cambios |
|------------|---------|
| `button.tsx` | Migrar a tokens, agregar gradientes, estados completos |
| `input.tsx` | Border 2px, hover/focus mejorados |
| `textarea.tsx` | Unificar con input |
| `select.tsx` | Unificar con input |
| `checkbox.tsx` | Transición suave, checked mejorado |
| `switch.tsx` | Gradiente en thumb |

### Etapa 3: Superficies (Semana 3)

| Componente | Cambios |
|------------|---------|
| `card.tsx` | Shadow tokens, hover lift |
| `dialog.tsx` | Shadow-4, overlay mejorado |
| `popover.tsx` | Shadow-3, border 2px |
| `tooltip.tsx` | Shadow-3, sutil gradiente |
| `dropdown-menu.tsx` | Items con hover mejorado |

### Etapa 4: Navegación y Tablas (Semana 4)

| Componente | Cambios |
|------------|---------|
| `sidebar.tsx` | Items con gradiente active |
| `table.tsx` | Row hover/selected mejorado |
| `toast.tsx` | Borde lateral indicador |
| `badge.tsx` | Gradiente soft, micro-interacción |

### Etapa 5: Charts y Refinamiento (Semana 5)

| Tarea | Cambios |
|-------|---------|
| `chart.tsx` | Tooltip mejorado, legend visible |
| Cards de entidades | Unificar con sistema de tokens |
| Revisión global | Eliminar hardcodes restantes |
| Testing accesibilidad | Validar contrast ratios |

---

## 7. CHECKLIST PARA PRs

### ✅ Obligatorio

- [ ] No hay colores hardcodeados (`#xxx`, `rgb()`, `rgba()`)
- [ ] Usa tokens de `design-tokens.css` o variables de tema
- [ ] Border-width es 2px (usando `--dt-border-width`)
- [ ] Border-radius entre 2-6px (usando tokens `--dt-radius-*`)
- [ ] Todos los estados implementados: default, hover, active, focus-visible, disabled
- [ ] Focus ring visible y accesible
- [ ] Transiciones usando `--dt-duration-*` y `--dt-ease-*`
- [ ] Funciona con `prefers-reduced-motion`

### 🟡 Recomendado

- [ ] Usa gradientes de tokens para superficies prominentes
- [ ] Sombras con tokens `--dt-shadow-*`
- [ ] Inset shadows en estados active (`--dt-inset-*`)
- [ ] Highlight interno en botones/cards (`--dt-highlight-*`)
- [ ] Micro-interacción en hover (scale, translateY)

### ⚠️ Evitar

- [ ] `rounded-full` en elementos no-pill
- [ ] Sombras con `rgba(0,0,0,x)` directamente
- [ ] `transition: all` (especificar propiedades)
- [ ] Gradientes con más de 4 stops
- [ ] Animaciones que no sean `transform` u `opacity`

---

## 8. CRITERIOS DE ACEPTACIÓN

### Consistencia Visual

| Criterio | Métrica | Herramienta |
|----------|---------|-------------|
| Sin colores hardcodeados | 0 instancias | grep `#[0-9a-fA-F]{3,6}` |
| Border-radius consistente | 100% usando tokens | Revisión manual |
| Sombras tokenizadas | 100% usando `--dt-shadow-*` | grep |
| Estados completos | 100% componentes | Storybook/manual |

### Accesibilidad

| Criterio | Métrica | Herramienta |
|----------|---------|-------------|
| Contrast ratio texto | ≥ 4.5:1 | axe-core |
| Contrast ratio UI | ≥ 3:1 | axe-core |
| Focus visible | 100% elementos interactivos | Manual |
| Reduced motion | Animaciones desactivables | Manual |

### Performance

| Criterio | Métrica |
|----------|---------|
| Animaciones | Solo `transform`, `opacity` |
| Repaint triggers | Ningún `width`, `height`, `top`, `left` animado |
| CSS bundle size | +10KB máximo |

---

## 9. SNIPPETS IMPLEMENTABLES

### Border Gradient con Pseudo-elemento

```css
.border-gradient {
  position: relative;
  background: var(--card);
  border-radius: var(--dt-radius-md);
  /* Clip interior */
  overflow: hidden;
}

.border-gradient::before {
  content: '';
  position: absolute;
  inset: 0;
  padding: var(--dt-border-width);
  background: linear-gradient(
    135deg,
    var(--dt-primary-400),
    var(--dt-primary-600)
  );
  -webkit-mask: 
    linear-gradient(#fff 0 0) content-box, 
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  border-radius: inherit;
  pointer-events: none;
}
```

### Sombras Inset/Outset por Estado

```css
.tactile-button {
  /* Default: elevado */
  box-shadow: 
    var(--dt-shadow-1),
    var(--dt-highlight-1);
  transform: translateY(0);
  
  transition: 
    box-shadow var(--dt-duration-fast) var(--dt-ease-default),
    transform var(--dt-duration-fast) var(--dt-ease-default);
}

.tactile-button:hover {
  /* Hover: más elevado */
  box-shadow: 
    var(--dt-shadow-2),
    var(--dt-highlight-2);
  transform: translateY(-1px);
}

.tactile-button:active {
  /* Active: presionado */
  box-shadow: 
    var(--dt-shadow-0),
    var(--dt-inset-2);
  transform: translateY(1px);
}
```

### Animación Suave de Estados

```css
.smooth-interactive {
  transition-property: 
    background-color,
    border-color,
    box-shadow,
    transform,
    opacity;
  transition-duration: var(--dt-duration-fast);
  transition-timing-function: var(--dt-ease-default);
}

/* Entrada más lenta, salida más rápida */
.smooth-interactive:hover {
  transition-duration: var(--dt-duration-normal);
}

.smooth-interactive:not(:hover) {
  transition-duration: var(--dt-duration-fast);
}
```

---

## 10. PRÓXIMOS PASOS INMEDIATOS

1. **Crear archivo de tokens** → `src/styles/design-tokens.css`
2. **Crear utilidad border-pulse** → `src/styles/utilities/border-pulse.css`
3. **Importar en globals.css** → Agregar imports
4. **Migrar Button** → Primer componente de prueba
5. **Validar en temas** → Probar light/dark/aurora/neon
6. **Documentar en Storybook** → Si existe, agregar stories

---

*Documento generado el 30 de diciembre de 2025*
