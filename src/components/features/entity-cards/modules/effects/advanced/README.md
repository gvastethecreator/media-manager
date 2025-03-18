# Módulo de Efectos Avanzados

Este módulo proporciona funcionalidades para añadir y configurar efectos visuales avanzados en las tarjetas de entidad.

## Características

- **Efectos de Escaneo**: Líneas de escaneo retro con controles de densidad y opacidad.
- **Efectos de Textura**: Grano y texturas de ruido para añadir profundidad visual.
- **Efectos de Borde**: Resplandor de bordes personalizable con controles de color, ancho y propagación.
- **Efectos Holográficos**: Efectos holográficos con modo arcoíris o color único.
- **Efectos de Distorsión**: Aberración cromática, glitch y pixelado para efectos visuales avanzados.

## Componentes

- `AdvancedEffectsPanel`: Componente principal que integra todas las secciones de efectos.
- Secciones individuales para cada categoría de efectos:
  - `ScanEffectsSection`
  - `TextureEffectsSection`
  - `BorderEffectsSection`
  - `HolographicEffectsSection`
  - `DistortionEffectsSection`

## Hook

El módulo incluye el hook `useAdvancedEffects` que proporciona:

- Estado para los efectos avanzados
- Funciones para actualizar efectos individuales o en conjunto
- Reseteo de efectos a valores predeterminados
- Comprobación de efectos activos

## Ejemplo de Uso

```tsx
import { AdvancedEffectsPanel } from '@/components/features/entity-cards/modules/effects/advanced';

function CardEditor() {
	const [cardOptions, setCardOptions] = useState<CardOptions>({});

	return <AdvancedEffectsPanel options={cardOptions} onChange={setCardOptions} />;
}
```

## Estructura de Datos

```typescript
interface AdvancedEffectsOptions {
	// Efectos de Escaneo
	scanlines?: boolean;
	scanlinesDensity?: number;
	scanlinesOpacity?: number;

	// Efectos de Textura
	grain?: boolean;
	grainDensity?: number;
	grainOpacity?: number;
	noiseTexture?: boolean;
	noiseTextureDensity?: number;
	noiseTextureOpacity?: number;

	// Efectos de Borde
	borderGlow?: boolean;
	borderGlowColor?: string;
	borderGlowWidth?: number;
	borderGlowSpread?: number;
	borderGlowIntensity?: number;

	// Efectos Holográficos
	holographicEffect?: boolean;
	holographicRainbowMode?: boolean;
	holographicEffectColor?: string;
	holographicEffectIntensity?: number;

	// Efectos de Distorsión
	chromaticAberration?: boolean;
	chromaticAberrationOffset?: number;
	chromaticAberrationIntensity?: number;
	glitchEffect?: boolean;
	glitchEffectIntensity?: number;
	glitchEffectFrequency?: number;
	pixelate?: boolean;
	pixelateSize?: number;
}
```

## Integración

Este módulo está diseñado para integrarse con el sistema de tarjetas de entidad. Puede utilizarse como parte del editor de tarjetas o como componente independiente.
