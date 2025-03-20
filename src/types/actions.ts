/**
 * Tipos base para las acciones del sistema
 */

/**
 * Respuesta genérica para acciones
 */
export interface ActionResponse<T = any> {
    /** Indica si la acción fue exitosa */
    success: boolean;
    /** Mensaje descriptivo del resultado */
    message: string;
    /** Datos de respuesta */
    data: T | null;
}

/**
 * Tipos de entidad para acciones visuales
 */
export type VisualConfigType = 'folder' | 'image' | 'video';

/**
 * Configuración visual base
 */
export interface BaseVisualConfig {
    /** Efectos 3D */
    enable3DEffect: boolean;
    /** Sistema de diseño */
    designSystem: string | null;
    /** Efecto holográfico */
    enableHolographicEffect: boolean;
    /** Efecto de brillo */
    enableGlowEffect: boolean;
    /** Borde animado */
    enableAnimatedBorder: boolean;
    /** Halo de luz */
    enableLightHalo: boolean;
    /** Efectos adicionales */
    effects: string | null;
    /** Sistema de capas */
    layerSystem: {
        layers: Array<{
            id: string;
            type: string;
            visible: boolean;
            opacity: number;
        }>;
    };
    /** Estados de interacción */
    states: {
        hover: boolean;
        focus: boolean;
        active: boolean;
    };
}
