/**
 * Entity Card Adapter
 *
 * Este módulo proporciona adaptadores y utilidades para transformar datos
 * entre los modelos de Prisma y los componentes de tarjetas.
 *
 * 🔄 Resuelve problemas de compatibilidad de tipos y propiedades
 */

import { deepMerge } from '@/lib/utils';
import type { Note, Place, Prompt, WorldItem } from '@prisma/client';
import type { CardOptions as BaseCardOptions } from '../types/base-card-types';
import type { CardOptions as SharedCardOptions } from '../types/shared-card-types';
import type { CardOptions } from '../types/unified-card-types';

/**
 * Extiende el tipo Note con propiedades adicionales usadas en NoteCard
 * usando Omit para evitar conflictos con propiedades existentes
 */
export interface ExtendedNote extends Omit<Note, 'featuredImage' | 'category' | 'tags'> {
    featuredImage: string | null;
    category: string;
    tags: string;
    // Propiedades extendidas
    type?: string;
    isPinned?: boolean;
    image?: string | null;
    _count?: {
        images?: number;
    };
}

/**
 * Extiende el tipo Prompt con propiedades adicionales usadas en PromptCard
 * usando Omit para evitar conflictos con propiedades existentes
 */
export interface ExtendedPrompt extends Omit<Prompt, 'tags'> {
    tags: string | string[];
    // Propiedades extendidas
    _count?: {
        uses: number;
        images?: number;
    };
    title?: string;
}

/**
 * Extiende el tipo Place con propiedades adicionales
 */
export interface ExtendedPlace extends Place {
    presetId?: string | null;
    _count?: {
        images?: number;
    };
}

/**
 * Extiende el tipo WorldItem con propiedades adicionales
 */
export interface ExtendedWorldItem extends WorldItem {
    _count?: {
        images?: number;
    };
}

/**
 * Adapta un objeto Note para ser compatible con NoteCard
 */
export function adaptNoteForCard(note: Note): ExtendedNote {
    if (!note) return null as any;

    return {
        ...note,
        type: note.category || 'general',
        isPinned: note.priority > 0,
        image: note.featuredImage
    };
}

/**
 * Adapta un objeto Prompt para ser compatible con PromptCard
 */
export function adaptPromptForCard(prompt: Prompt): ExtendedPrompt {
    if (!prompt) return null as any;

    // Convertir tags de string a array si es necesario
    const tags = typeof prompt.tags === 'string'
        ? prompt.tags === 'empty_array' ? [] : JSON.parse(prompt.tags)
        : prompt.tags;

    return {
        ...prompt,
        tags: Array.isArray(tags) ? tags : []
    };
}

/**
 * Adapta un objeto Place para ser compatible con PlaceCard
 */
export function adaptPlaceForCard(place: Place): ExtendedPlace {
    if (!place) return null as any;

    return {
        ...place,
        presetId: (place as any).presetId || null
    };
}

/**
 * Adapta un objeto WorldItem para ser compatible con WorldItemCard
 */
export function adaptWorldItemForCard(worldItem: WorldItem): ExtendedWorldItem {
    if (!worldItem) return null as any;

    return {
        ...worldItem
    };
}

/**
 * Adapta opciones de tarjeta para ser compatibles entre distintos sistemas
 */
export function adaptCardOptions(options: Partial<BaseCardOptions> | Partial<SharedCardOptions> | Partial<CardOptions>): Partial<CardOptions> {
    if (!options) return {};

    // Opciones básicas compatibles con todos los sistemas
    const baseCompatibleOptions = {
        primaryColor: options.primaryColor,
        secondaryColor: options.secondaryColor,
        contentLayout: options.contentLayout,
        contentPadding: options.contentPadding,
        contentSpacing: options.contentSpacing,
        contentAlignment: options.contentAlignment,

        enable3DEffect: options.enable3DEffect,
        enableHolographicEffect: options.enableHolographicEffect,
        enableScanlinesEffect: options.enableScanlinesEffect,
        enableGlowEffect: options.enableGlowEffect,
        enableBorderEffect: options.enableBorderEffect,
        enableGrainEffect: options.enableGrainEffect,

        hoverLiftHeight: options.hoverLiftHeight,
        maxRotation: options.maxRotation,

        // Eliminar subpropiedades problemáticas si existen
        designSystem: options.designSystem ? {
            preset: options.designSystem.preset,
            variant: options.designSystem.variant,
            aspectRatio: options.designSystem.aspectRatio,
            cornerStyle: options.designSystem.cornerStyle,
            cornerRadius: options.designSystem.cornerRadius,
            elevation: options.designSystem.elevation,
            shadowStyle: 'soft', // Forzar un valor compatible
            padding: 'md',
            maxWidth: '100%',
            shadowColor: 'rgba(0,0,0,0.2)',
            shadowOffset: { x: 0, y: 4 },
            shadowBlur: 8,
            borderWidth: 0,
            borderColor: 'transparent',
            backgroundColor: 'transparent',
            backgroundOpacity: 1,
            glassmorphism: false,
            glassmorphismBlur: 0,
        } : undefined,

        // Estados compatibles
        states: {
            selected: { style: 'border' }
        }
    };

    // Sistema de capas compatible
    const layerSystem = options.layerSystem ? {
        order: options.layerSystem.order,
        layerBlending: 'normal',
        layerSpacing: 2,
    } : undefined;

    // Configuraciones de efectos compatibles
    const holoOptions = options.holographicOptions ? {
        ...options.holographicOptions,
        patternType: 'rainbow' // Forzar un valor compatible
    } : undefined;

    const borderOptions = options.borderOptions ? {
        ...options.borderOptions,
        pattern: 'solid', // Forzar un valor compatible
        width: typeof options.borderOptions.width === 'number' ? options.borderOptions.width : 1 // Asegurar que width tenga un valor
    } : undefined;

    return deepMerge(baseCompatibleOptions, {
        layerSystem,
        holographicOptions: holoOptions,
        borderOptions
    }) as Partial<CardOptions>;
}

/**
 * Proporciona opciones por defecto para una entidad específica
 */
export function getDefaultCardOptions(entityType: 'note' | 'prompt' | 'place' | 'worldItem'): Partial<CardOptions> {
    const common = {
        enable3DEffect: true,
        enableHolographicEffect: true,
        enableGlowEffect: true,
        enableBorderEffect: true,
        designSystem: {
            preset: 'default',
            variant: 'default',
            aspectRatio: '7/10',
            cornerStyle: 'rounded',
            cornerRadius: 12,
            elevation: 2,
            shadowStyle: 'soft',
            padding: 'md',
            maxWidth: '100%',
            shadowColor: 'rgba(0,0,0,0.2)',
            shadowOffset: { x: 0, y: 4 },
            shadowBlur: 8,
            borderWidth: 0,
            borderColor: 'transparent',
            backgroundColor: 'transparent',
            backgroundOpacity: 1,
            glassmorphism: false,
            glassmorphismBlur: 0,
        },
        contentPadding: 2,
        contentSpacing: 1,
        contentAlignment: 'start',
        states: {
            selected: { style: 'border' }
        },
        layerSystem: {
            order: ['content', 'holographic', 'border', 'filter'],
            layerBlending: 'normal',
            layerSpacing: 2
        }
    };

    switch (entityType) {
        case 'note':
            return {
                ...common,
                designSystem: {
                    ...common.designSystem,
                    preset: 'note'
                }
            };
        case 'prompt':
            return {
                ...common,
                designSystem: {
                    ...common.designSystem,
                    preset: 'prompt'
                }
            };
        case 'place':
            return {
                ...common,
                designSystem: {
                    ...common.designSystem,
                    preset: 'place'
                }
            };
        case 'worldItem':
            return {
                ...common,
                designSystem: {
                    ...common.designSystem,
                    preset: 'worldItem'
                }
            };
        default:
            return common;
    }
}