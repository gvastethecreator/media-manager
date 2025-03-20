import type { ReactNode } from 'react';

/**
 * 🎨 Tipos base para efectos
 */
export interface BaseEffectOptions {
  enabled: boolean;
  intensity?: number;
  opacity?: number;
}

/**
 * 🌈 Tipos para efectos con color
 */
export interface ColorEffectOptions extends BaseEffectOptions {
  color?: string;
}

/**
 * 📏 Tipos para efectos con dimensiones
 */
export interface DimensionalEffectOptions extends BaseEffectOptions {
  width?: number;
  spread?: number;
}

/**
 * 🎯 Props base para secciones de efectos
 */
export interface BaseEffectSectionProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  disabled?: boolean;
  children?: ReactNode;
}

/**
 * 🎛️ Props para controles de efectos
 */
export interface EffectControlProps<T> {
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}

/**
 * 🎨 Esquemas de color para paneles de efectos
 */
export const effectColorSchemes = {
  visual: 'visual',
  advanced: 'advanced',
  design: 'design',
} as const;

export type EffectColorScheme = keyof typeof effectColorSchemes;

/**
 * 🎭 Estados comunes para efectos
 */
export const effectStates = {
  enabled: 'enabled',
  disabled: 'disabled',
  loading: 'loading',
  error: 'error',
} as const;

export type EffectState = keyof typeof effectStates;
