import type { FilterConfig } from '../filter-schema';

/**
 * 🎨 Genera los estilos CSS para los filtros básicos
 */
export function generateBasicFilterStyles(config: FilterConfig['basic']) {
  return {
    filter: [
      `brightness(${config.brightness}%)`,
      `contrast(${config.contrast}%)`,
      `saturate(${config.saturation}%)`,
      `hue-rotate(${config.hueRotate}deg)`,
      `blur(${config.blur}px)`,
      `opacity(${config.opacity}%)`,
    ].join(' '),
  };
}

/**
 * ✨ Genera los estilos CSS para el efecto de resplandor
 */
export function generateGlowStyles(config: NonNullable<FilterConfig['glow']>) {
  if (!config.enabled) return {};

  return {
    boxShadow: `0 0 ${config.radius}px ${config.spread}px ${config.color}`,
    filter: `brightness(${1 + config.intensity})`,
  };
}

/**
 * 🌑 Genera los estilos CSS para el efecto de sombra
 */
export function generateShadowStyles(config: NonNullable<FilterConfig['shadow']>) {
  if (!config.enabled) return {};

  const shadowType = config.inset ? 'inset' : '';
  return {
    boxShadow: `${shadowType} ${config.offsetX}px ${config.offsetY}px ${config.blur}px ${config.color}`,
  };
}

/**
 * 🌊 Genera los estilos CSS para el efecto de distorsión
 */
export function generateDistortionStyles(config: NonNullable<FilterConfig['distortion']>) {
  if (!config.enabled) return {};

  const getDistortionFilter = () => {
    switch (config.type) {
      case 'wave':
        return `url('#wave-distortion')`;
      case 'ripple':
        return `url('#ripple-distortion')`;
      case 'twist':
        return `url('#twist-distortion')`;
      case 'bulge':
        return `url('#bulge-distortion')`;
      default:
        return '';
    }
  };

  return {
    filter: getDistortionFilter(),
    transform: config.animated ? `scale(${1 + Math.sin(Date.now() * config.speed / 1000) * 0.02})` : 'none',
  };
}

/**
 * 🎨 Genera todos los estilos CSS para la capa de filtros
 */
export function generateFilterStyles(config: FilterConfig) {
  const styles: Record<string, any> = {
    mixBlendMode: config.blendMode,
  };

  // Aplicar filtros según el tipo activo
  switch (config.filterType) {
    case 'basic':
      Object.assign(styles, generateBasicFilterStyles(config.basic));
      break;
    case 'glow':
      if (config.glow) {
        Object.assign(styles, generateGlowStyles(config.glow));
      }
      break;
    case 'shadow':
      if (config.shadow) {
        Object.assign(styles, generateShadowStyles(config.shadow));
      }
      break;
    case 'distortion':
      if (config.distortion) {
        Object.assign(styles, generateDistortionStyles(config.distortion));
      }
      break;
  }

  return styles;
}

/**
 * 🎭 Genera los filtros SVG necesarios para los efectos de distorsión
 */
export function generateDistortionFilters() {
  return (
    <svg style={{ position: 'absolute', width: 0, height: 0 }}>
      <defs>
        {/* Filtro de onda */}
        <filter id="wave-distortion">
          <feTurbulence type="fractalNoise" baseFrequency="0.01 0.01" numOctaves="1" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="20" />
        </filter>

        {/* Filtro de ondulación */}
        <filter id="ripple-distortion">
          <feTurbulence type="turbulence" baseFrequency="0.02 0.02" numOctaves="3" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="30" />
        </filter>

        {/* Filtro de torsión */}
        <filter id="twist-distortion">
          <feTurbulence type="turbulence" baseFrequency="0.005 0.005" numOctaves="2" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="40" />
        </filter>

        {/* Filtro de abultamiento */}
        <filter id="bulge-distortion">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
          <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>
    </svg>
  );
}