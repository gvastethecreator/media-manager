import { cn } from '@/lib/utils';
import type * as React from 'react';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { effectsStore, EFFECT_MODULES } from './store/effects-store';
import type { EntityBasicInfo } from './types/unified-types';

export interface EntityCardProps extends EntityBasicInfo {
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children?: React.ReactNode;
  debug?: boolean;
}

/**
 * Tarjeta de entidad básica en formato portrait
 * Esta versión es la más simple y mantiene solo la funcionalidad core
 * Optimizada para trabajar con el almacén centralizado de efectos
 */
export function EntityCard({
  id,
  title,
  description,
  image,
  metadata,
  className,
  onClick,
  children,
  debug = false,
}: EntityCardProps) {
  const [debugState, setDebugState] = useState({
    visualEnabled: false,
    advancedEnabled: false,
    effects: effectsStore.getEffects()
  });

  // Efecto para sincronizar el estado con el store cuando está en modo debug
  useEffect(() => {
    if (debug && process.env.NODE_ENV === 'development') {
      // Función para actualizar el estado desde el store
      const updateDebugState = () => {
        setDebugState({
          visualEnabled: effectsStore.isModuleEnabled(EFFECT_MODULES.VISUAL),
          advancedEnabled: effectsStore.isModuleEnabled(EFFECT_MODULES.ADVANCED),
          effects: effectsStore.getEffects()
        });
      };

      // Estado inicial
      updateDebugState();

      // Suscripción a cambios usando el sistema de suscripción del store
      const unsubscribe = effectsStore.subscribe(updateDebugState);
      
      return () => unsubscribe();
    }
  }, [debug]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      // Creamos un evento sintético que contenga la información relevante
      const syntheticEvent = {
        currentTarget: e.currentTarget,
        target: e.target,
        preventDefault: () => {},
        stopPropagation: () => {},
      } as React.MouseEvent<HTMLButtonElement>;
      
      onClick(syntheticEvent);
    }
  }, [onClick]);

  // Aplicar efectos visuales si están habilitados
  const effectClasses = useMemo(() => {
    if (!debug || !debugState.visualEnabled) return '';
    
    const { visual } = debugState.effects;
    if (!visual) return '';

    const classes = [];

    if (visual.holographic?.enabled) {
      classes.push('card-effect-holographic');
    }
    if (visual.scanlines?.enabled) {
      classes.push('card-effect-scanlines');
    }
    if (visual.glow?.enabled) {
      classes.push('card-effect-glow');
    }
    if (visual.grain?.enabled) {
      classes.push('card-effect-grain');
    }
    if (visual.border?.enabled) {
      classes.push('card-effect-border');
    }

    return classes.join(' ');
  }, [debug, debugState.visualEnabled, debugState.effects]);

  // Aplicar efectos avanzados si están habilitados
  const advancedStyles = useMemo(() => {
    if (!debug || !debugState.advancedEnabled) return {};
    
    const { advanced } = debugState.effects;
    if (!advanced) return {};

    const styles: React.CSSProperties = {};

    if (advanced.filter?.enabled) {
      styles.filter = `
        brightness(${advanced.filter.brightness}%)
        contrast(${advanced.filter.contrast}%)
        saturate(${advanced.filter.saturation}%)
        hue-rotate(${advanced.filter.hueRotate}deg)
        blur(${advanced.filter.blur}px)
        sepia(${advanced.filter.sepia}%)
      `;
    }

    if (advanced.shadow?.enabled) {
      const { offsetX, offsetY, blur, spread, color, opacity, inset } = advanced.shadow;
      const shadowColor = color.replace(/^#/, '');
      const rgba = `rgba(${Number.parseInt(shadowColor.slice(0, 2), 16)}, ${Number.parseInt(shadowColor.slice(2, 4), 16)}, ${Number.parseInt(shadowColor.slice(4, 6), 16)}, ${opacity})`;
      styles.boxShadow = `${inset ? 'inset ' : ''}${offsetX}px ${offsetY}px ${blur}px ${spread}px ${rgba}`;
    }

    // Aplicar distorsión si está habilitada
    if (advanced.distortion?.enabled) {
      const { intensity, type } = advanced.distortion;
      
      if (type !== 'none') {
        styles.transform = `${type}(${intensity}%)`;
      }
    }

    return styles;
  }, [debug, debugState.advancedEnabled, debugState.effects]);

  const CardContent = useCallback(() => (
    <>
      {/* Contenido principal */}
      <div className="flex flex-col h-full">
        {/* Imagen */}
        {image && (
          <div className="relative w-full aspect-[3/4]">
            <img
              src={image}
              alt={title}
              className="object-cover w-full h-full"
            />
          </div>
        )}

        {/* Información */}
        <div className="p-3 flex flex-col flex-grow">
          <h3 className="text-base font-medium truncate">{title}</h3>
          
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {description}
            </p>
          )}

          {/* Metadata */}
          {metadata && Object.keys(metadata).length > 0 && (
            <div className="mt-2 space-y-1">
              {Object.entries(metadata).map(([key, value]) => (
                <div key={key} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{key}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Contenido adicional */}
          {children && <div className="mt-auto pt-3">{children}</div>}
        </div>
      </div>

      {/* Modo debug */}
      {debug && process.env.NODE_ENV === 'development' && (
        <div className="absolute top-0 right-0 bg-black/80 text-white text-[10px] p-1 rounded-bl-md">
          <div>ID: {id}</div>
          <div>
            Efectos: 
            <span className={debugState.visualEnabled ? "text-green-400" : "text-red-400"}>
              {debugState.visualEnabled ? " ✓" : " ✗"} Visual
            </span>
            <span className={debugState.advancedEnabled ? "text-green-400" : "text-red-400"}>
              {debugState.advancedEnabled ? " ✓" : " ✗"} Avanzado
            </span>
          </div>
        </div>
      )}
    </>
  ), [title, description, image, metadata, children, debug, id, debugState]);

  return (
    <button
      type="button"
      className={cn(
        // Base
        'relative bg-white text-left',
        'w-[240px] h-[320px] rounded-lg shadow-sm overflow-hidden',
        'transition-all duration-300 ease-in-out',
        'outline-none focus:ring-2 focus:ring-primary/50',
        // Hover
        'hover:shadow-md',
        // Efectos visuales
        effectClasses,
        // Clase personalizada
        className,
      )}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label={`Tarjeta: ${title}`}
      style={advancedStyles}
    >
      <CardContent />
    </button>
  );
}
