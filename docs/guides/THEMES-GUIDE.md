# 🎨 Guía del Sistema de Themes

Guía completa del sistema de themes de Image Manager con 14 temas personalizados, design tokens y mejores prácticas.

---

## 📑 Tabla de Contenidos

1. [Resumen del Sistema de Themes](#resumen-del-sistema-de-themes)
2. [Uso de Variables CSS](#uso-de-variables-css)
3. [Mejores Prácticas](#mejores-prácticas)
4. [Migración de Colores Hardcodeados](#migración-de-colores-hardcodeados)
5. [Transiciones de Tema](#transiciones-de-tema)
6. [Cómo Agregar un Nuevo Tema](#cómo-agregar-un-nuevo-tema)

---

## Resumen del Sistema de Themes

Image Manager cuenta con un sistema de themes robusto y flexible que permite personalizar completamente la apariencia de la aplicación.

### 14 Temas Personalizados Disponibles

| Tema | Descripción | Ideal para |
|------|-------------|------------|
| `light` | Tema claro con grises suaves | Uso diurno, oficina |
| `dark` | Tema oscuro por defecto | Uso nocturno, ahorro de batería |
| `cafe` | Tonos marrones cálidos | Ambiente relajado |
| `violeta` | Púrpuras oscuros | Creatividad, diseño |
| `madera` | Tonos madera neutros | Natural, orgánico |
| `nocturno` | Azulado para fatiga visual | Lectura prolongada |
| `verde` | Esmeralda oscuro | Naturaleza, calma |
| `atardecer` | Naranjas y rojos cálidos | Creatividad, energía |
| `corporativo` | Azul profesional | Entornos empresariales |
| `carbon` | Negro carbón minimalista | Alto contraste |
| `teal` | Verde azulado | Frescura, modernidad |
| `citrico` | Amarillos vibrantes | Energía, positividad |
| `aurora` | Inspirado en auroras boreales | Fantasía, creatividad |
| `neon` | Estilo cyberpunk/neón | Gaming, moderno |

### ThemeProvider con Soporte para 'system'

El `ThemeProvider` proporciona un contexto completo para gestionar themes:

```tsx
// src/providers/theme-provider.tsx
import { ThemeProvider } from '@/providers/theme-provider';

// En tu aplicación
function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="theme">
      <YourApp />
    </ThemeProvider>
  );
}
```

**Características:**
- Soporte para tema `system` que detecta automáticamente la preferencia del OS
- Persistencia en localStorage
- Transiciones fluidas entre themes
- Clases CSS aplicadas automáticamente (`light`, `dark`, `system`)

### ThemeToggle para Cambiar Entre Themes

```tsx
// src/components/core/theme/theme-toggle.tsx
import { ThemeToggle } from '@/components/core/theme/theme-toggle';

// Uso en cualquier componente
function Header() {
  return (
    <header>
      <ThemeToggle />
    </header>
  );
}
```

**Features del toggle:**
- Dropdown con todos los themes disponibles
- Indicador visual del tema actual
- Animaciones suaves entre iconos (sol/luna)
- Accesible (ARIA labels)

### Hook useTheme

```tsx
import { useTheme } from '@/components/ui/theme-provider';

function MyComponent() {
  const { theme, setTheme, themes, resolvedTheme } = useTheme();
  
  // theme: tema actual seleccionado (incluye 'system')
  // resolvedTheme: tema resuelto ('light' o 'dark') cuando theme es 'system'
  // themes: array con todos los themes disponibles
  // setTheme: función para cambiar el tema
  
  return (
    <div>
      <p>Tema actual: {theme}</p>
      <p>Tema resuelto: {resolvedTheme}</p>
      <button onClick={() => setTheme('dark')}>Cambiar a dark</button>
    </div>
  );
}
```

---

## Uso de Variables CSS

El sistema de themes se basa en variables CSS que se actualizan dinámicamente según el tema seleccionado.

### Variables Semánticas (shadcn/ui compatible)

Variables principales que cambian según el tema:

```css
/* Variables base de UI */
--background        /* Fondo principal */
--foreground        /* Texto principal */
--card              /* Fondo de tarjetas */
--card-foreground   /* Texto en tarjetas */
--popover           /* Fondo de popovers */
--popover-foreground/* Texto en popovers */
--primary           /* Color primario (botones, enlaces) */
--primary-foreground/* Texto sobre color primario */
--secondary         /* Color secundario */
--secondary-foreground /* Texto sobre secundario */
--muted             /* Fondo de elementos muted */
--muted-foreground  /* Texto muted */
--accent            /* Color de acento */
--accent-foreground /* Texto sobre acento */
--destructive       /* Color para acciones destructivas */
--destructive-foreground /* Texto sobre destructivo */
--border            /* Color de bordes */
--input             /* Color de inputs */
--ring              /* Color de focus rings */
```

**Uso en Tailwind:**
```tsx
<div className="bg-background text-foreground">
  <button className="bg-primary text-primary-foreground hover:bg-primary/90">
    Click me
  </button>
</div>
```

**Uso en CSS inline:**
```tsx
<div style={{ backgroundColor: 'var(--background)' }}>
  <span style={{ color: 'var(--primary)' }}>Texto</span>
</div>
```

### Design Tokens (--dt-*)

Sistema completo de tokens de diseño en `src/styles/design-tokens.css`:

#### Paletas de Color

```css
/* Primary (Azul) */
--dt-primary-50 a --dt-primary-950

/* Neutral (Grises) */
--dt-neutral-50 a --dt-neutral-950

/* Success (Verde) */
--dt-success-50 a --dt-success-900

/* Warning (Ámbar) */
--dt-warning-50 a --dt-warning-900

/* Danger (Rojo) */
--dt-danger-50 a --dt-danger-900
```

#### Sombras

```css
--dt-shadow-0    /* Sin sombra */
--dt-shadow-1    /* Sutil (inputs, botones) */
--dt-shadow-2    /* Media (cards, dropdowns) */
--dt-shadow-3    /* Alta (popovers, tooltips) */
--dt-shadow-4    /* Máxima (modales) */
--dt-inset-1     /* Sombra interna sutil */
--dt-inset-2     /* Sombra interna pronunciada */
```

#### Timing y Easing

```css
--dt-duration-instant: 50ms   /* Micro-interacciones */
--dt-duration-fast: 150ms     /* Hover, focus */
--dt-duration-normal: 250ms   /* Transiciones estándar */
--dt-duration-slow: 400ms     /* Animaciones elaboradas */

--dt-ease-default: cubic-bezier(0.4, 0, 0.2, 1)
--dt-ease-in: cubic-bezier(0.4, 0, 1, 1)
--dt-ease-out: cubic-bezier(0, 0, 0.2, 1)
--dt-ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1)
```

#### Bordes y Radius

```css
--dt-border-width: 2px
--dt-border-width-thin: 1px
--dt-border-soft
--dt-border-medium
--dt-border-strong
--dt-border-focus

--dt-radius-xs: 2px
--dt-radius-sm: 4px
--dt-radius-md: 6px
--dt-radius-lg: 8px
--dt-radius-xl: 12px
--dt-radius-full: 9999px
```

### Tokens de Entidades

Colores específicos para cada tipo de entidad en `src/styles/tokens.css`:

```css
/* Entidades de contenido */
--entity-image: oklch(0.59 0.2 255);      /* Azul */
--entity-video: oklch(0.63 0.24 29);      /* Rojo */
--entity-audio: oklch(0.68 0.16 201);     /* Sky */
--entity-document: oklch(0.55 0.1 250);   /* Slate */
--entity-file-3d: oklch(0.65 0.15 277);   /* Índigo */
--entity-json: oklch(0.7 0.15 350);       /* Rosa */

/* Entidades de organización */
--entity-folder: oklch(0.75 0.18 85);     /* Amarillo */
--entity-album: oklch(0.59 0.23 293);     /* Violeta */
--entity-collection: oklch(0.63 0.2 195); /* Cyan */
--entity-group: oklch(0.64 0.17 175);     /* Teal */
--entity-favorite: oklch(0.75 0.18 85);   /* Ámbar */

/* Entidades creativas */
--entity-character: oklch(0.7 0.2 350);   /* Rosa */
--entity-place: oklch(0.64 0.17 175);     /* Teal */
--entity-world-item: oklch(0.72 0.2 130); /* Lima */
--entity-concept: oklch(0.72 0.18 65);    /* Ámbar */

/* Entidades de metadatos */
--entity-tag: oklch(0.7 0.2 350);         /* Rosa */
--entity-prompt: oklch(0.64 0.17 165);    /* Esmeralda */
--entity-note: oklch(0.63 0.24 29);       /* Rojo */
--entity-property: oklch(0.7 0.15 350);   /* Rosa claro */
--entity-wildcard: oklch(0.7 0.2 350);    /* Rosa */

/* Entidades de sistema */
--entity-system: oklch(0.55 0.12 240);    /* Azul grisáceo */
```

**Uso práctico:**
```tsx
// En componentes React
<div style={{ color: 'var(--entity-image)' }}>Imagen</div>
<div style={{ color: 'var(--entity-video)' }}>Video</div>

// Con Tailwind (usando arbitrary values)
<div className="text-[color:var(--entity-folder)]">Carpeta</div>
```

---

## Mejores Prácticas

### ❌ NUNCA Usar Colores Hardcodeados

```tsx
// MAL - Nunca hacer esto
<div style={{ color: '#3b82f6' }} />
<div className="text-[#3b82f6]" />
<div style={{ background: 'rgba(255, 255, 255, 0.3)' }} />
<div className="bg-blue-500" />

// MAL - No usar colores hex en CSS
.custom-class {
  color: #3b82f6;
  background: rgba(255, 255, 255, 0.5);
}
```

### ✅ SIEMPRE Usar Variables CSS

```tsx
// BIEN - Usar variables CSS semánticas
<div className="text-primary" />
<div className="bg-background" />
<div className="border-border" />

// BIEN - Usar design tokens
<div className="bg-dt-primary-500" />
<div className="text-dt-success-600" />

// BIEN - En CSS
.custom-class {
  color: var(--primary);
  background: var(--background);
  border: 1px solid var(--border);
}
```

### Usar color-mix para Opacidades

Cuando necesites ajustar la opacidad de un color, usa `color-mix()`:

```tsx
// BIEN - Usar color-mix para opacidad
<div style={{ 
  background: 'color-mix(in oklch, var(--primary) 30%, transparent)' 
}} />

// BIEN - Combinar colores
<div style={{ 
  background: 'color-mix(in oklch, var(--entity-image) 20%, var(--background))' 
}} />

// BIEN - En CSS con oklch(from)
--panel-bg-overlay: oklch(from var(--background) l c h / 0.4);
```

### Ejemplos de Código: Bueno vs Malo

#### Ejemplo 1: Botón con hover

```tsx
// ❌ MAL
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

// ✅ BIEN
import { Button } from '@/components/ui/button';

<Button variant="default">
  Click
</Button>

// O usando clases de Tailwind
<button className="bg-primary text-primary-foreground hover:bg-primary/90">
  Click
</button>
```

#### Ejemplo 2: Tarjeta con borde

```tsx
// ❌ MAL
<div style={{ 
  border: '1px solid #e5e7eb',
  background: '#ffffff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
}} />

// ✅ BIEN
<div className="border bg-card shadow-dt-1" />

// O con CSS
<div style={{ 
  border: '1px solid var(--border)',
  background: 'var(--card)',
  boxShadow: 'var(--dt-shadow-1)'
}} />
```

#### Ejemplo 3: Badge de entidad

```tsx
// ❌ MAL
<div style={{ 
  background: 'rgba(59, 130, 246, 0.2)',
  color: '#3b82f6',
  border: '1px solid rgba(59, 130, 246, 0.4)'
}}>
  Imagen
</div>

// ✅ BIEN
<div style={{ 
  background: 'color-mix(in oklch, var(--entity-image) 20%, transparent)',
  color: 'var(--entity-image)',
  border: '1px solid color-mix(in oklch, var(--entity-image) 40%, transparent)'
}}>
  Imagen
</div>

// O usando clases de Tailwind con color-mix
<div className="bg-[color:color-mix(in_oklch,var(--entity-image)_20%,transparent)] 
                text-[color:var(--entity-image)]">
  Imagen
</div>
```

---

## Migración de Colores Hardcodeados

Durante la migración al sistema de themes, se corrigieron múltiples archivos que utilizaban colores hardcodeados.

### Patrones de Migración Comunes

#### 1. Colores Hex → Variables CSS

```tsx
// ANTES
<div style={{ color: '#3b82f6' }} />

// DESPUÉS
<div style={{ color: 'var(--primary)' }} />
// o
<div className="text-primary" />
```

#### 2. RGBA → color-mix

```tsx
// ANTES
<div style={{ background: 'rgba(59, 130, 246, 0.2)' }} />

// DESPUÉS
<div style={{ 
  background: 'color-mix(in oklch, var(--primary) 20%, transparent)' 
}} />
```

#### 3. Colores de entidad hardcodeados → Tokens

```tsx
// ANTES
const entityColors = {
  image: '#3b82f6',
  video: '#ef4444',
  folder: '#eab308'
};

// DESPUÉS
// Usar las variables CSS directamente
<div style={{ color: 'var(--entity-image)' }} />
<div style={{ color: 'var(--entity-video)' }} />
<div style={{ color: 'var(--entity-folder)' }} />
```

#### 4. Sombras hardcodeadas → Design tokens

```tsx
// ANTES
<div style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} />

// DESPUÉS
<div style={{ boxShadow: 'var(--dt-shadow-1)' }} />
// o
<div className="shadow-dt-1" />
```

### Archivos Clave en la Migración

Los siguientes archivos fueron actualizados para usar el sistema de themes:

| Archivo | Cambios Principales |
|---------|---------------------|
| `src/styles/tokens.css` | Definición de tokens de entidades y colores funcionales |
| `src/styles/design-tokens.css` | Paletas de color, sombras, timing, borders |
| `src/app/themes.css` | Definiciones de los 14 temas personalizados |
| `src/styles/utilities/theme-system.css` | Sistema de transiciones y utilities |
| `src/components/cards/*` | Migración de colores hardcodeados a tokens |
| `src/components/ui/*.tsx` | Componentes UI usando variables CSS |
| `src/components/views/*` | Vistas usando tokens de entidades |

---

## Transiciones de Tema

El sistema incluye transiciones fluidas automáticas cuando se cambia entre themes.

### Transiciones Automáticas

```css
/* src/app/themes.css - Al final del archivo */
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

### Clase theme-transitioning

Para transiciones más controladas, usa la clase `theme-transitioning`:

```tsx
// Aplica transiciones a todos los elementos hijos
<div className="theme-transitioning">
  <Card />
  <Button />
  <Text />
</div>
```

**Definición en CSS:**
```css
/* src/styles/utilities/theme-system.css */
.theme-transitioning,
.theme-transitioning *,
.theme-transitioning *::before,
.theme-transitioning *::after {
  transition:
    background-color var(--dt-theme-transition-duration)
    var(--dt-theme-transition-timing),
    border-color var(--dt-theme-transition-duration)
    var(--dt-theme-transition-timing),
    color var(--dt-theme-transition-duration) var(--dt-theme-transition-timing),
    fill var(--dt-theme-transition-duration) var(--dt-theme-transition-timing),
    stroke var(--dt-theme-transition-duration) var(--dt-theme-transition-timing),
    box-shadow var(--dt-theme-transition-duration)
    var(--dt-theme-transition-timing) !important;
}
```

### Duración: 300ms

La duración estándar de transiciones de tema es **300ms**:

```css
:root {
  --dt-theme-transition-duration: 300ms;
  --dt-theme-transition-timing: cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Soporte para Reduced Motion

El sistema respeta la preferencia del usuario de reducir movimiento:

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

## Cómo Agregar un Nuevo Tema

### Paso 1: Definir las Variables CSS del Tema

Agrega una nueva sección en `src/app/themes.css`:

```css
/* Tema Personalizado - Ejemplo: Ocean */
html[data-theme="ocean"] {
  /* Variables base */
  --background: oklch(0.2 0.04 220);
  --foreground: oklch(0.95 0.01 220);
  --card: oklch(0.25 0.05 220);
  --card-foreground: oklch(0.95 0.01 220);
  --popover: oklch(0.25 0.05 220);
  --popover-foreground: oklch(0.95 0.01 220);
  
  /* Colores principales */
  --primary: oklch(0.6 0.18 220);
  --primary-foreground: oklch(0.1 0.01 220);
  --secondary: oklch(0.3 0.06 220);
  --secondary-foreground: oklch(0.95 0.01 220);
  
  /* Estados */
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
  
  /* Gráficos */
  --chart-1: oklch(0.6 0.18 220);
  --chart-2: oklch(0.55 0.15 240);
  --chart-3: oklch(0.65 0.12 200);
  --chart-4: oklch(0.5 0.14 180);
  --chart-5: oklch(0.7 0.16 260);
}
```

### Paso 2: Registrar el Tema en ThemeProvider

Agrega el tema a la lista en `src/providers/theme-provider.tsx`:

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
  'ocean', // <-- Nuevo tema
];
```

### Paso 3: Agregar Dark Mode Overrides (Opcional)

Si tu tema necesita ajustes específicos en modo oscuro, agrégalos en `src/styles/design-tokens.css`:

```css
html[data-theme="ocean"] {
  /* Ajustes específicos para tema ocean */
  --dt-shadow-color: oklch(0 0 0 / 0.3);
  --dt-border-soft: var(--dt-border-width) solid oklch(1 0 0 / 0.06);
}
```

### Paso 4: Actualizar el Contexto (Opcional)

Si necesitas soporte específico en el contexto de themes, actualiza `src/lib/contexts/theme-context.tsx`:

```tsx
// Asegúrate de que el tipo incluya el nuevo tema
export type Theme = 'light' | 'dark' | 'system' | 'cafe' | 'violeta' | 
  'madera' | 'nocturno' | 'verde' | 'atardecer' | 'corporativo' | 
  'carbon' | 'teal' | 'citrico' | 'aurora' | 'neon' | 'ocean';
```

### Paso 5: Probar el Tema

1. Inicia la aplicación: `bun run dev:full`
2. Abre el ThemeToggle
3. Selecciona tu nuevo tema "Ocean"
4. Verifica que:
   - Los colores se aplican correctamente
   - Las transiciones funcionan
   - Todos los componentes se ven bien
   - No hay contrastes problemáticos

### Tips para Crear un Buen Tema

1. **Usa OKLCH**: Los colores en OKLCH son más consistentes perceptualmente
2. **Mantén el contraste**: Asegúrate de que foreground tenga buen contraste con background
3. **Sé consistente**: Usa la misma hue (matiz) para variables relacionadas
4. **Prueba en ambos modos**: Si tu tema es oscuro, verifica las overrides necesarias
5. **Considera las entidades**: Los colores de entidades deben ser distinguibles en tu tema

---

## Referencias

- [Design Tokens CSS](src/styles/design-tokens.css)
- [Tokens de Entidades](src/styles/tokens.css)
- [Definiciones de Themes](src/app/themes.css)
- [Theme System Utilities](src/styles/utilities/theme-system.css)
- [ThemeProvider](src/providers/theme-provider.tsx)
- [ThemeToggle](src/components/core/theme/theme-toggle.tsx)
- [Theme Context](src/lib/contexts/theme-context.tsx)

---

## Soporte

Si encuentras problemas con el sistema de themes o necesitas ayuda para crear uno nuevo, revisa:

1. La consola del navegador (el ThemeProvider tiene debug logging)
2. Que todas las variables CSS estén definidas
3. Que el tema esté registrado en el array `customThemes`
4. Las transiciones no interfieran con el layout
