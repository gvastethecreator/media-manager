# 📊 Auditoría de Temas y Estilos - Image Manager

**Fecha:** 2026-01-30  
**Auditor:** Sistema de revisión de estilos  
**Estado:** En progreso

---

## 🎯 Resumen Ejecutivo

El proyecto cuenta con una infraestructura sólida de temas y tokens CSS. Se identificaron **14 temas personalizados** y un sistema de tokens bien estructurado. Sin embargo, se encontraron algunas inconsistencias que requieren corrección.

### Fortalezas ✅

1. Sistema de tokens CSS robusto (`design-tokens.css`, `tokens.css`)
2. Theme Provider implementado con 13 temas personalizados
3. Tailwind configurado para usar variables CSS
4. Soporte para transiciones fluidas entre temas
5. Componente Theme Toggle ya existe

### Problemas Identificados ⚠️

1. Colores hex hardcodeados en `color-tokens.ts` (líneas 205-226)
2. Efecto ripple en `button.tsx` usa `rgba(255, 255, 255, 0.3)` hardcodeado
3. Algunos colores oklch hardcodeados en `chart-colors.ts`
4. Duplicación de variables CSS entre `globals.css` y `app/globals.css`
5. Faltan tokens semánticos para algunos colores de UI

---

## 📁 Estructura de Archivos de Estilos

```
src/
├── app/
│   ├── globals.css          # Estilos globales principales (Tailwind v4)
│   └── themes.css           # Definición de 13+ temas personalizados
├── styles/
│   ├── globals.css          # Estilos globales legacy (deprectar)
│   ├── tokens.css           # Tokens semánticos de color
│   ├── design-tokens.css    # Design tokens v2.0 (OKLCH)
│   ├── scrollbar.css        # Scrollbar personalizada
│   └── utilities/
│       ├── theme-system.css # Sistema de themes y transiciones
│       ├── transitions.css  # Transiciones de estado
│       ├── animations.css   # Animaciones keyframes
│       ├── typography.css   # Sistema tipográfico
│       ├── component-recipes.css # Recetas de componentes
│       └── border-pulse.css # Efectos de borde
├── lib/styles/
│   ├── color-tokens.ts      # Tokens TypeScript (⚠️ colores hardcodeados)
│   └── chart-colors.ts      # Colores para gráficos (⚠️ algunos hardcodeados)
└── components/core/theme/
    └── theme-toggle.tsx     # Componente toggle (✅ implementado)
```

---

## 🎨 Temas Disponibles

| Tema          | Descripción                   | Estado |
| ------------- | ----------------------------- | ------ |
| `light`       | Tema claro por defecto        | ✅     |
| `dark`        | Tema oscuro por defecto       | ✅     |
| `cafe`        | Tonos marrones cálidos        | ✅     |
| `violeta`     | Púrpuras oscuros              | ✅     |
| `madera`      | Tonos madera neutros          | ✅     |
| `nocturno`    | Azulado para fatiga visual    | ✅     |
| `verde`       | Esmeralda oscuro              | ✅     |
| `atardecer`   | Naranjas y rojos              | ✅     |
| `corporativo` | Azul profesional              | ✅     |
| `carbon`      | Negro carbón                  | ✅     |
| `teal`        | Verde azulado                 | ✅     |
| `citrico`     | Amarillos vibrantes           | ✅     |
| `aurora`      | Inspirado en auroras boreales | ✅     |
| `neon`        | Estilo cyberpunk/neón         | ✅     |

---

## 🔧 Sistema de Tokens

### Tokens de Color Semánticos

```css
/* Entidades de contenido */
--entity-image: oklch(0.59 0.2 255);
--entity-video: oklch(0.63 0.24 29);
--entity-audio: oklch(0.68 0.16 201);
...

/* Estados */
--status-success: oklch(0.72 0.19 142);
--status-warning: oklch(0.75 0.18 85);
--status-info: oklch(0.59 0.2 255);

/* UI */
--ui-success-bg: var(--dt-success-50);
--ui-warning-bg: var(--dt-warning-50);
...
```

### Design Tokens v2.0

```css
/* Paletas */
--dt-primary-50 a --dt-primary-950
--dt-neutral-50 a --dt-neutral-950
--dt-success-50 a --dt-success-900
--dt-warning-50 a --dt-warning-900
--dt-danger-50 a --dt-danger-900

/* Sombras */
--dt-shadow-0 a --dt-shadow-4
--dt-inset-1, --dt-inset-2

/* Bordes */
--dt-border-soft, --dt-border-medium, --dt-border-strong

/* Timing */
--dt-duration-instant: 50ms
--dt-duration-fast: 150ms
--dt-duration-normal: 250ms
--dt-duration-slow: 400ms
```

---

## ⚠️ Colores Hardcodeados Encontrados

### 1. `src/lib/styles/color-tokens.ts` (Líneas 205-226)

```typescript
// ❌ HEX hardcodeados
export const PRESET_COLORS_HEX = [
	'#22c55e', // green
	'#eab308', // yellow
	'#ec4899', // pink
	'#8b5cf6', // purple
	'#06b6d4', // cyan
	'#f97316', // orange
	'#14b8a6', // teal
	'#f43f5e', // rose
	'#6366f1', // indigo
	'#0ea5e9', // sky
	'#64748b', // slate
	'#6b7280', // gray
	'#d946ef', // fuchsia
	'#84cc16', // lime
	'#0891b2', // cyan-dark
	'#9333ea', // purple-dark
];
```

**Solución:** Reemplazar con variables CSS o valores OKLCH del sistema.

### 2. `src/components/ui/button.tsx` (Línea 114)

```typescript
// ❌ RGBA hardcodeado para ripple
rippleElement.style.cssText = `
  background: rgba(255, 255, 255, 0.3);
  ...
`;
```

**Solución:** Usar variable CSS o `currentColor` con opacidad.

### 3. `src/lib/styles/chart-colors.ts` (Línea 58)

```typescript
// ❌ OKLCH hardcodeado
others: 'oklch(0.7 0.15 90)', // --preset-citrico
```

**Solución:** Crear variable CSS correspondiente.

---

## 📝 Recomendaciones

### Prioridad Alta

1. ✅ Migrar colores HEX en `color-tokens.ts` a variables CSS
2. ✅ Reemplazar `rgba(255, 255, 255, 0.3)` en ripple con variable temática
3. ✅ Consolidar variables duplicadas entre archivos CSS

### Prioridad Media

4. Agregar documentación de uso de tokens en AGENTS.md
5. Crear guía visual de todos los temas disponibles
6. Implementar theme toggle en la UI principal

### Prioridad Baja

7. Auditar componentes individuales por colores inline
8. Crear tests visuales para regresión de temas

---

## 🧪 Verificación Post-Migración

- [ ] Todos los temas aplican correctamente
- [ ] Transiciones entre temas son fluidas
- [ ] No hay colores hardcodeados en componentes
- [ ] Theme toggle funciona correctamente
- [ ] Documentación actualizada
- [ ] Tests pasan

---

## 📚 Referencias

- [Design Tokens v2.0](../src/styles/design-tokens.css)
- [Theme System](../src/styles/utilities/theme-system.css)
- [Tokens Semánticos](../src/styles/tokens.css)
- [Themes](../src/app/themes.css)
