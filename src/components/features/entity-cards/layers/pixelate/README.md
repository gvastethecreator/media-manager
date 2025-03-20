# 🎮 Pixelate Layer

El Pixelate Layer es un componente avanzado que permite aplicar efectos de pixelado y retro a las imágenes de las cartas. Este layer ofrece una amplia gama de opciones de personalización y efectos adicionales para crear estilos únicos y nostálgicos.

## 📁 Estructura del Directorio

```
pixelate/
├── actions/
│   └── pixelate-config.action.ts    # Configuración y estado del pixelado
├── components/
│   ├── pixelate-layer.tsx          # Componente principal del pixelado
│   └── pixelate-config.tsx         # Componente de configuración
├── utils/
│   └── pixelate-utils.ts           # Utilidades para efectos de pixelado
└── README.md                       # Esta documentación
```

## 🔄 Flujo de Datos

```mermaid
graph TD
    A[PixelateConfig] -->|Actualiza configuración| B[PixelateStore]
    B -->|Estado actual| C[PixelateLayer]
    C -->|Procesa| D[Canvas Fuente]
    D -->|Aplica efectos| E[Canvas Destino]
    F[pixelate-utils] -->|Proporciona| G[Efectos & Utilidades]
    G -->|Utiliza| C
```

## ⚙️ Configuración

La configuración del pixelado incluye múltiples opciones para personalizar el efecto:

```typescript
interface PixelateConfig {
  enabled: boolean;
  pixelSize: number;
  opacity: number;
  blendMode: string;
  animated: boolean;
  animationSpeed: number;
  animationPattern: 'random' | 'wave' | 'spiral' | 'none';
  colorQuantization: boolean;
  colorLevels: number;
  preserveAlpha: boolean;
  threshold: number;
  edgeDetection: boolean;
  edgeColor: [number, number, number];
  edgeThickness: number;
  noiseAmount: number;
  glitchIntensity: number;
  glitchFrequency: number;
}
```

## 🎯 Características Principales

1. **Pixelado Básico**
   - Control preciso del tamaño de píxel
   - Ajuste de opacidad
   - Modos de mezcla personalizables

2. **Animaciones**
   - Patrones predefinidos (onda, espiral, aleatorio)
   - Velocidad ajustable
   - Transiciones suaves

3. **Efectos de Color**
   - Cuantización de color
   - Preservación de transparencia
   - Ajuste de niveles de color

4. **Efectos Especiales**
   - Detección de bordes
   - Efectos de ruido
   - Efectos glitch

## 📝 Ejemplos de Uso

### Uso Básico

```tsx
import { PixelateLayer } from './components/pixelate-layer';

function Card() {
  return (
    <div className="relative">
      <PixelateLayer
        width={300}
        height={400}
        sourceImage="/path/to/image.jpg"
      />
      {/* Contenido de la carta */}
    </div>
  );
}
```

### Configuración de Efectos

```tsx
import { usePixelateStore } from './actions/pixelate-config.action';

function PixelateControls() {
  const { updateConfig } = usePixelateStore();

  const enableRetroEffect = () => {
    updateConfig({
      enabled: true,
      pixelSize: 4,
      colorQuantization: true,
      colorLevels: 8,
      noiseAmount: 0.1
    });
  };

  return <button onClick={enableRetroEffect}>Activar Efecto Retro</button>;
}
```

## 🚀 Optimizaciones

- Uso de `requestAnimationFrame` para animaciones suaves
- Canvas oculto para procesamiento fuera de pantalla
- Memoización de cálculos pesados
- Limpieza de recursos al desmontar
- Renderizado condicional basado en configuración

## 🔗 Integración con Otros Sistemas

- Compatible con el sistema de capas de la carta
- Interactúa con el sistema de eventos
- Se integra con el sistema de temas
- Soporta el sistema de animaciones global

## 🎯 Planes Futuros

- [ ] Añadir más patrones de animación
- [ ] Implementar efectos de CRT
- [ ] Añadir filtros de color retro
- [ ] Mejorar el rendimiento en dispositivos móviles
- [ ] Añadir presets de efectos populares
- [ ] Implementar efectos de scanline

## 🛠️ Consideraciones Técnicas

- Requiere soporte de Canvas 2D
- Optimizado para rendimiento en tiempo real
- Manejo de memoria para animaciones
- Soporte para diferentes densidades de píxeles
- Fallbacks para navegadores antiguos

## 🎨 Presets Recomendados

1. **Retro Game**
   ```typescript
   {
     pixelSize: 4,
     colorQuantization: true,
     colorLevels: 16,
     noiseAmount: 0.05
   }
   ```

2. **Glitch Art**
   ```typescript
   {
     pixelSize: 2,
     glitchIntensity: 0.7,
     glitchFrequency: 5,
     edgeDetection: true
   }
   ```

3. **Animated Wave**
   ```typescript
   {
     animated: true,
     animationPattern: 'wave',
     animationSpeed: 1.5,
     pixelSize: 8
   }
   ```