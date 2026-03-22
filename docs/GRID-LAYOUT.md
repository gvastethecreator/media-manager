# Sistema de Grillas Responsive

## Resumen de Implementación

Se ha estandarizado el sistema de grillas responsive en todas las vistas de entidades para mostrar **5 columnas en desktop (xl: 1280px+)**.

## Configuración Estándar

Todas las vistas ahora usan este patrón consistente:

```css
grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6
```

### Breakpoints y Columnas

| Breakpoint | Tamaño | Columnas |
|------------|--------|----------|
| Default | < 640px | 2 columnas |
| sm | 640px+ | 3 columnas |
| md | 768px+ | 4 columnas |
| lg | 1024px+ | 4 columnas |
| xl | 1280px+ | **5 columnas** ← TARGET |
| 2xl | 1536px+ | 6 columnas |

## Componente GridLayout

Se creó un componente reutilizable para estandarizar las grillas:

**Ubicación**: `src/components/layout/grid-layout.tsx`

### Uso Básico

```tsx
import { GridLayout, GRID_PRESETS } from '@/components/layout/grid-layout';

<GridLayout {...GRID_PRESETS.default}>
  {items.map(item => <Card key={item.id} data={item} />)}
</GridLayout>
```

### Props Disponibles

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `density` | 'compact' \| 'default' \| 'comfortable' \| 'spacious' | 'default' | Densidad del grid |
| `gap` | 'none' \| 'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' | 'md' | Tamaño del gap |
| `padding` | 'none' \| 'sm' \| 'md' \| 'lg' \| 'xl' | 'md' | Padding del contenedor |
| `animated` | boolean | true | Animaciones de entrada |

### Presets Predefinidos

```typescript
GRID_PRESETS.default      // 5 cols en xl - estándar
GRID_PRESETS.compact      // 6 cols en xl - más denso
GRID_PRESETS.comfortable  // 5 cols en xl - items más grandes
GRID_PRESETS.spacious     // 4 cols en xl - items grandes
GRID_PRESETS.files        // 6 cols en xl - para archivos
```

## Vistas Actualizadas

Las siguientes vistas fueron actualizadas para usar el estándar de 5 columnas:

✅ **Core Views**:

- `files-content-view.tsx`
- `favorites-content-view.tsx`
- `uploaded-images-content-view.tsx`
- `all-images-content-view.tsx` (usa FileBrowser)

✅ **Entity Views**:

- `albums-content-view.tsx`
- `collections-content-view.tsx`
- `tags-content-view.tsx`
- `characters-content-view.tsx`
- `places-content-view.tsx`
- `groups-content-view.tsx`
- `world-items-content-view.tsx`
- `wildcards-content-view.tsx`
- `concepts-content-view.tsx`
- `prompts-content-view.tsx`
- `notes-content-view.tsx`
- `properties-content-view.tsx`

✅ **Detail Views** (también actualizadas):

- `group-content-view.tsx`
- `tags-content-view.tsx`
- `properties-content-view.tsx`
- `places-content-view.tsx`
- `wildcards-content-view.tsx`
- `world-items-content-view.tsx`
- `notes-content-view.tsx`
- `prompts-content-view.tsx`

## Ejemplo de Implementación Manual

Si necesitas implementar el grid manualmente en una vista:

```tsx
<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
  {items.map((item, index) => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card data={item} />
    </motion.div>
  ))}
</div>
```

## Consideraciones Responsive

1. **Mobile First**: El diseño parte de 2 columnas en mobile
2. **Progresivo**: Aumenta columnas gradualmente según el viewport
3. **Consistente**: Todas las vistas usan el mismo patrón
4. **Adaptativo**: Se ajusta automáticamente al tamaño de pantalla

## Testing

Para verificar las grillas en diferentes tamaños:

1. Abrir DevTools (F12)
2. Activar Device Toolbar (Ctrl+Shift+M)
3. Probar estos breakpoints:
   - 375px (mobile)
   - 768px (tablet)
   - 1024px (laptop)
   - 1280px (desktop) ← Debe mostrar 5 columnas
   - 1536px (large desktop) ← 6 columnas

## Notas Técnicas

- Se usa `gap-4` (1rem / 16px) entre items
- El contenedor tiene `container mx-auto` para centrar
- `p-6` (1.5rem / 24px) de padding en el contenedor
- Las animaciones usan `motion.div` de `@/components/ui/motion-shim`
- El stagger delay es de 0.05s entre items
