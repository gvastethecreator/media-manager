'use client';

import type * as React from 'react';
import type { LayerComponentProps } from '../layer-plugin-system';
import type { GlitchEffectConfig } from './actions/glitch-effect-config.action';
import { GlitchEffectLayer } from './glitch-effect-layer';

interface GlitchEffectWrapperProps extends LayerComponentProps<GlitchEffectConfig> {
  children?: React.ReactNode;
}

/**
 * Componente wrapper para adaptar la capa de efecto Glitch al sistema de plugins.
 * Esta capa crea efectos de interferencia y distorsión visual similares a fallos digitales.
 */
export function GlitchEffectWrapper({
  isExploded,
  isHovered,
  entityType,
  entityId,
  config,
  children,
}: GlitchEffectWrapperProps) {
  // Crear propiedades para el componente GlitchEffectLayer basadas en el sistema de plugins
  const glitchProps = {
    entityType,
    entityId,
    config: {
      ...config,
      visibleOnHover: config?.visibleOnHover || false,
      triggerOnHover: isHovered && (config?.triggerOnHover || false),
    },
  };

  return (
    <GlitchEffectLayer
      {...glitchProps}
      className={isExploded ? 'exploded-layer layer-glitch' : ''}
    >
      {children || <div className="w-full h-full absolute inset-0" />}
    </GlitchEffectLayer>
  );
}

export default GlitchEffectWrapper;