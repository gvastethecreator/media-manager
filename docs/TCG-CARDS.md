# Sistema de Cards TCG (Trading Card Game)

## Resumen

Sistema completo de cards estilo TCG con efectos 3D, shaders sutiles, colores dinámicos por entidad y todas las funciones integradas.

## Componentes Creados

### 1. `useTilt3D` Hook
**Ubicación**: `src/hooks/use-tilt-3d.ts`

Hook que proporciona efecto de inclinación 3D al hover:
- Rotación X/Y basada en posición del mouse
- Efecto de escala suave
- Reflejo/glare dinámico
- Transiciones fluidas
- Soporte para reduced motion

```typescript
const { ref, style, glareStyle, handlers } = useTilt3D({
  maxTilt: 15,
  scale: 1.03,
  enableGlare: true,
  glareOpacity: 0.3
});
```

### 2. `TCGCard` Componente Base
**Ubicación**: `src/components/ui/tcg/tcg-card.tsx`

Componente base de carta TCG con:
- Efectos 3D integrados
- Bordes dinámicos con gradiente
- Textura sutil (grain)
- Esquinas decorativas
- Indicadores de selección
- Rareza visual (common → mythic)
- Soporte para modo compacto

```tsx
<TCGCard
  accentColor="var(--entity-image)"
  rarity="epic"
  size="md"
  isSelected={true}
  header={<TCGCardHeader title="Nombre" typeText="Imagen" />}
  thumbnail={<img src="..." />}
  footer={<TCGCardStats stats={[...]} />}
>
  Contenido
</TCGCard>
```

### 3. `TCGEntityCard` Componente
**Ubicación**: `src/components/cards/tcg-entity-card.tsx`

Integración completa con entidades:
- Soporte para todos los tipos de entidad
- Thumbnails automáticos
- Colores dinámicos según tipo
- Rareza calculada por relaciones
- Stats de relaciones
- Metadatos (formato, tamaño)

```tsx
<TCGEntityCard
  entity={entity}
  size="lg"
  variant="tcg"
  isSelected={selected}
  onClick={handleClick}
/>
```

## Estilos CSS
**Ubicación**: `src/components/ui/tcg/tcg-card.css`

Incluye:
- Variables CSS para personalización
- Gradientes y sombras dinámicas
- Animaciones keyframes (shimmer, glow, pulse)
- Efectos de hover y selección
- Responsive design
- Soporte para dark mode
- Reduced motion support

## Uso en EntityCard

El sistema `EntityCard` ahora soporta la variante `'tcg'`:

```tsx
// Usando variant directamente
<EntityCard 
  entity={entity} 
  variant="tcg" 
  size="lg"
/>

// Usando preset
<EntityCard 
  entity={entity} 
  preset="tcg-mode"
/>

// Usando tcgMode (legacy)
<EntityCard 
  entity={entity} 
  tcgMode={true}
  size="lg"
/>
```

## Tamaños Disponibles

- `sm`: 180px × 240px
- `md`: 220px × 300px (default)
- `lg`: 280px × 380px
- `xl`: 340px × 460px

## Rareza de Cartas

La rareza afecta los efectos visuales:
- `common`: Efectos básicos
- `uncommon`: Glow verde suave
- `rare`: Glow azul + shimmer
- `epic`: Glow púrpura + shimmer rápido
- `legendary`: Glow dorado + animación especial
- `mythic`: Glow rojo + borde animado

La rareza se calcula automáticamente basada en el número de relaciones de la entidad.

## Características Visuales

### Efectos 3D
- Perspectiva 1000px
- Rotación máxima 15°
- Escala 1.03 en hover
- Transición 400ms ease-out

### Shaders y Texturas
- Fondo con gradiente sutil
- Textura grain (3% opacity)
- Overlay de integración en thumbnails
- Reflejo dinámico siguiendo el mouse

### Bordes Dinámicos
- Borde de 2-4px según rareza
- Gradiente del color de la entidad
- Sombra elevada (shadow-dt)
- Glow animado para rarezas altas

### Colores
Usa las variables CSS de entidades:
- `--entity-image`: Azul
- `--entity-video`: Rojo
- `--entity-audio`: Sky
- `--entity-folder`: Amarillo
- etc.

## Accesibilidad

- Soporte para `prefers-reduced-motion`
- Focus visible en elementos interactivos
- ARIA labels automáticos
- Contraste de colores adecuado
- Tabindex management

## Ejemplos de Uso

### Card Básica
```tsx
<TCGEntityCard entity={imageEntity} size="md" />
```

### Card con Eventos
```tsx
<TCGEntityCard 
  entity={videoEntity}
  size="lg"
  isSelected={isSelected}
  onClick={(e) => handleSelect(e, entity.id)}
  onDoubleClick={() => openEntity(entity.id)}
/>
```

### Card Compacta
```tsx
<TCGEntityCard 
  entity={folderEntity}
  size="sm"
  isCompact={true}
  disable3D={true}
/>
```

## Integración

Los estilos CSS se importan automáticamente en `globals.css`:
```css
@import '../components/ui/tcg/tcg-card.css';
```

## Performance

- `will-change: transform` en elementos animados
- Lazy loading de imágenes
- `transform-style: preserve-3d` para GPU acceleration
- Memoización de componentes con `React.memo`
- UseMemo para cálculos costosos
