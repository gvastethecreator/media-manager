# 🎨 Base UI Integration Guide - Migración Completa

## 📚 Recursos Oficiales Base UI

### Core Documentation

- **Quick Start**: <https://base-ui.com/react/overview/quick-start>
- **Styling Guide**: <https://base-ui.com/react/handbook/styling>
- **Animation Guide**: <https://base-ui.com/react/handbook/animation>
- **Composition Guide**: <https://base-ui.com/react/handbook/composition>
- **useRender Utility**: <https://base-ui.com/react/utils/use-render>
- **Accessibility**: <https://base-ui.com/react/overview/accessibility>

### 🎯 Key Insights de la Documentación

1. **Tree-shakeable**: Solo importa componentes que usas
2. **Unstyled**: Flexibilidad total para styling
3. **Composable**: Arquitectura de componentes modulares
4. **Accessible**: ARIA y keyboard navigation built-in
5. **Modern**: Optimizado para React 18+ y CSS moderno

### 🚨 Portal Setup CRÍTICO

```tsx
// OBLIGATORIO en layout root para popups
<body>
  <div className="root">
    {children}
  </div>
</body>
```

```css
/* OBLIGATORIO para stacking context */
.root {
  isolation: isolate;
}
```

## 🚀 Instalación y Setup

### Package Installation

```bash
npm i @base-ui-components/react
```

### Portal Setup (Crítico para Dialog, Popover, etc.)

```tsx
// layout.tsx
<body>
  <div className="root">
    {children}
  </div>
</body>
```

```css
/* styles.css */
.root {
  isolation: isolate;
}
```

## 🎯 Patrones de Migración Radix → Base UI

### 1. Dialog Component

```tsx
// ❌ ANTES (Radix)
import { Dialog as DialogPrimitive } from 'radix-ui';

// ✅ DESPUÉS (Base UI)
import { Dialog as DialogPrimitive } from '@base-ui-components/react/dialog';

// Cambios específicos:
// - Overlay → Backdrop
// - Content → Popup
// - Mantener Portal, Title, Description, Close
```

### 2. Label Component

```tsx
// ❌ ANTES (Radix)
import { Label as LabelPrimitive } from '@radix-ui/react-label';

// ✅ DESPUÉS (Base UI)
import { Label as BaseUILabel } from '@base-ui-components/react/label';
```

### 3. Button Component (Slot Replacement)

```tsx
// ❌ ANTES (Radix Slot)
import { Slot as SlotPrimitive } from 'radix-ui';

// ✅ DESPUÉS (Native Implementation)
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    if (asChild) {
      const child = React.Children.only(props.children as React.ReactElement);
      return React.cloneElement(child, {
        ...child.props,
        className: cn(buttonVariants({ variant, size }), className, child.props.className),
      });
    }
    return <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
```

## 🎨 Styling Patterns

### 1. Tailwind CSS Integration

```tsx
// Aplicar clases Tailwind directamente
<Switch.Thumb className="bg-primary data-[checked]:bg-green-500 transition-colors" />
```

### 2. State-Based Styling

```tsx
// Función que recibe estado del componente
<Switch.Thumb className={(state) => (state.checked ? 'checked' : 'unchecked')} />
```

### 3. Data Attributes

```css
/* CSS para estados del componente */
.SwitchThumb[data-checked] {
  background-color: green;
}

.SwitchThumb[data-unchecked] {
  background-color: gray;
}
```

### 4. CSS Variables

```css
/* Variables dinámicas expuestas por componentes */
.Popup {
  max-height: var(--available-height);
  width: var(--anchor-width);
}
```

## 🎬 Animation Patterns

### 1. CSS Transitions

```css
.Popup {
  transition: transform 0.2s ease-out, opacity 0.2s ease-out;
}

.Popup[data-starting-style] {
  transform: scale(0.9);
  opacity: 0;
}

.Popup[data-ending-style] {
  transform: scale(0.9);
  opacity: 0;
}
```

### 2. CSS Animations

```css
@keyframes slideIn {
  from {
    transform: translateY(-10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.Popup[data-starting-style] {
  animation: slideIn 0.2s ease-out;
}
```

### 3. JavaScript Animations (Framer Motion)

```tsx
<Popover.Popup
  render={
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
    />
  }
>
  Content
</Popover.Popup>
```

## 🧩 Composition Patterns

### 1. Component Assembly

```tsx
// Estructura típica de componente Base UI
export default function ExamplePopover() {
  return (
    <Popover.Root>
      <Popover.Trigger>Trigger</Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8}>
          <Popover.Popup>
            <Popover.Arrow />
            <Popover.Title>Title</Popover.Title>
            <Popover.Description>Description</Popover.Description>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
```

### 2. Custom Render Prop

```tsx
// useRender utility para composición avanzada
import { useRender } from '@base-ui-components/react/utils/use-render';

function CustomComponent() {
  const render = useRender();

  return (
    <Component
      render={render(<motion.div />, (props) => (
        <motion.div {...props} initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
      ))}
    />
  );
}
```

## ♿ Accessibility Features

### 1. Built-in ARIA Support

```tsx
// Base UI maneja automáticamente:
// - aria-expanded, aria-haspopup
// - aria-labelledby, aria-describedby
// - role attributes
// - keyboard navigation
```

### 2. Focus Management

```tsx
// Manejo automático de focus
<Dialog.Root>
  <Dialog.Trigger>Open</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Popup>
      {/* Focus automáticamente aquí al abrir */}
      <Dialog.Close>Close</Dialog.Close>
    </Dialog.Popup>
  </Dialog.Portal>
</Dialog.Root>
```

## 📋 Componentes Disponibles en Base UI

### ✅ Disponibles y Migrados

- **Dialog** ✅ Migrado
- **Label** ✅ Migrado
- **Button** ✅ Migrado (implementación nativa)

### 🔄 Disponibles - Pendientes de Migración

- **Accordion** ⏳
- **Alert Dialog** ⏳
- **Avatar** ⏳
- **Checkbox** ⏳
- **Checkbox Group** ⏳
- **Collapsible** ⏳
- **Context Menu** ⏳
- **Field** ⏳
- **Fieldset** ⏳
- **Form** ⏳
- **Input** ⏳
- **Menu** ⏳
- **Menubar** ⏳
- **Meter** ⏳
- **Navigation Menu** ⏳
- **Number Field** ⏳
- **Popover** ⏳
- **Preview Card** ⏳
- **Progress** ⏳
- **Radio** ⏳
- **Scroll Area** ⏳
- **Select** ⏳
- **Separator** ⏳
- **Slider** ⏳
- **Switch** ⏳
- **Tabs** ⏳
- **Toast** ⏳
- **Toggle** ⏳
- **Toggle Group** ⏳
- **Toolbar** ⏳
- **Tooltip** ⏳

## 🛠️ Migration Checklist

### Antes de Migrar

- [ ] Verificar que el componente esté disponible en Base UI
- [ ] Revisar breaking changes en la API
- [ ] Identificar diferencias en nombres de props/componentes

### Durante la Migración

- [ ] Actualizar imports
- [ ] Cambiar nombres de componentes (Overlay → Backdrop, Content → Popup)
- [ ] Verificar que los estilos sigan funcionando
- [ ] Probar funcionalidad completa
- [ ] Verificar accesibilidad

### Después de Migrar

- [ ] Remover dependencias Radix no utilizadas
- [ ] Actualizar documentación
- [ ] Probar en diferentes navegadores
- [ ] Verificar que no hay regresiones

## 🎯 Beneficios de Base UI

### 1. Performance

- Tree-shakeable (solo importa lo que usas)
- Menor bundle size que Radix
- Optimizado para React 18+

### 2. Developer Experience

- TypeScript nativo
- Mejor composición de componentes
- APIs más consistentes

### 3. Styling Flexibility

- Completamente unstyled
- Compatible con cualquier solución CSS
- CSS variables para valores dinámicos

### 4. Accessibility

- ARIA completo out-of-the-box
- Keyboard navigation
- Screen reader support

## 🚨 Consideraciones Importantes

### 1. Breaking Changes

- Algunos nombres de componentes cambian
- Props pueden tener nombres diferentes
- Comportamientos sutiles pueden variar

### 2. CSS Targeting

- Data attributes pueden ser diferentes
- CSS variables tienen nombres específicos
- Verificar estilos después de migrar

### 3. Animation Timing

- Algunos componentes manejan animaciones diferente
- Revisar timing de transiciones
- Probar estados de loading/error

## 📊 Estado Actual del Proyecto

### Componentes UI Migrados: 3/25+ (12%)

- ✅ label.tsx → Base UI Label
- ✅ button.tsx → Implementación nativa
- ✅ dialog.tsx → Base UI Dialog

### Próximos en Prioridad

1. **select.tsx** → Base UI Select
2. **checkbox.tsx** → Base UI Checkbox
3. **switch.tsx** → Base UI Switch
4. **tabs.tsx** → Base UI Tabs
5. **popover.tsx** → Base UI Popover

---

**Documentación Base UI**: <https://base-ui.com/react/overview/quick-start>
**Última actualización**: Migración actual en progreso
