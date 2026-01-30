/**
 * @file Transiciones para Settings
 * @module components/settings/settings-transitions
 * @description Envoltorios con transiciones para el panel de configuraciones
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { FlipContainer, TransitionGroup, TransitionItem, AnimatePresence } from '@/components/transitions';
import { useEnterExit } from '@/hooks/transitions';
import { customEasings } from '@/lib/transitions';

// ============================================================================
// Transición de Página de Settings
// ============================================================================

interface SettingsPageTransitionProps {
  /** Contenido */
  children: React.ReactNode;
  /** Sección activa */
  activeSection?: string;
}

/**
 * Página de settings con transición de entrada
 */
export function SettingsPageTransition({
  children,
  activeSection,
}: SettingsPageTransitionProps) {
  const { ref, isTransitioning } = useEnterExit({
    id: 'settings-page',
    isVisible: true,
    enterConfig: {
      type: 'slide',
      direction: 'right',
      distance: 30,
      duration: 400,
      easing: customEasings.easeOutSuper,
    },
  });

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={cn(
        'settings-page-transition h-full',
        isTransitioning && 'transitioning'
      )}
    >
      {children}
    </div>
  );
}

// ============================================================================
// Transición de Sección de Settings
// ============================================================================

interface SettingsSectionTransitionProps {
  /** ID de la sección */
  sectionId: string;
  /** Título */
  title: React.ReactNode;
  /** Descripción */
  description?: React.ReactNode;
  /** Contenido */
  children: React.ReactNode;
  /** Si está expandida */
  isExpanded?: boolean;
  /** Toggle */
  onToggle?: () => void;
}

/**
 * Sección colapsable de settings
 */
export function SettingsSectionTransition({
  sectionId,
  title,
  description,
  children,
  isExpanded = true,
  onToggle,
}: SettingsSectionTransitionProps) {
  const { ref, isTransitioning, isVisible } = useEnterExit({
    id: `settings-section-${sectionId}`,
    isVisible: isExpanded,
    enterConfig: {
      type: 'slide',
      direction: 'top',
      distance: 20,
      duration: 300,
      easing: customEasings.easeOutSuper,
    },
    exitConfig: {
      type: 'slide',
      direction: 'top',
      distance: 15,
      duration: 200,
      easing: customEasings.easeInSuper,
    },
  });

  return (
    <FlipContainer
      flipId={`settings-section-container-${sectionId}`}
      className="settings-section-transition rounded-lg border border-border bg-card"
    >
      <button
        onClick={onToggle}
        className={cn(
          'settings-section-header w-full flex items-center justify-between',
          'p-4 text-left hover:bg-accent/50 transition-colors rounded-lg'
        )}
      >
        <div className="flex-1">
          <h3 className="font-medium">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <span
          className={cn(
            'transform transition-transform duration-200 ml-4',
            isExpanded ? 'rotate-180' : 'rotate-0'
          )}
        >
          ▼
        </span>
      </button>
      
      {(isExpanded || isTransitioning) && (
        <div
          ref={ref as React.RefObject<HTMLDivElement>}
          className="settings-section-content p-4 pt-0"
        >
          {children}
        </div>
      )}
    </FlipContainer>
  );
}

// ============================================================================
// Transición de Item de Setting
// ============================================================================

interface SettingsItemTransitionProps {
  /** ID del item */
  itemId: string;
  /** Índice para stagger */
  index?: number;
  /** Label */
  label: React.ReactNode;
  /** Descripción */
  description?: React.ReactNode;
  /** Control */
  control: React.ReactNode;
  /** Si está deshabilitado */
  isDisabled?: boolean;
}

/**
 * Item individual de setting con transición
 */
export function SettingsItemTransition({
  itemId,
  index = 0,
  label,
  description,
  control,
  isDisabled,
}: SettingsItemTransitionProps) {
  return (
    <TransitionItem id={`setting-item-${itemId}`} index={index}>
      <div
        className={cn(
          'settings-item-transition',
          'flex items-center justify-between py-3 gap-4',
          'border-b border-border last:border-0',
          isDisabled && 'opacity-50'
        )}
      >
        <div className="flex-1 min-w-0">
          <label className="font-medium text-sm">{label}</label>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        <div className="flex-shrink-0">
          {control}
        </div>
      </div>
    </TransitionItem>
  );
}

// ============================================================================
// Transición de Formulario de Settings
// ============================================================================

interface SettingsFormTransitionProps {
  /** ID del formulario */
  formId: string;
  /** Contenido */
  children: React.ReactNode;
  /** Si está guardando */
  isSaving?: boolean;
}

/**
 * Formulario de settings con transiciones
 */
export function SettingsFormTransition({
  formId,
  children,
  isSaving,
}: SettingsFormTransitionProps) {
  return (
    <TransitionGroup
      id={`settings-form-${formId}`}
      isVisible={true}
      enterConfig={{
        type: 'slide',
        direction: 'bottom',
        distance: 15,
        duration: 300,
        easing: customEasings.easeOutSuper,
      }}
      exitConfig={{
        type: 'slide',
        direction: 'bottom',
        distance: 10,
        duration: 200,
        easing: customEasings.easeInSuper,
      }}
      staggerDelay={20}
      className="settings-form-transition space-y-1"
    >
      {children}
    </TransitionGroup>
  );
}

// ============================================================================
// Transición de Toast/Notificación de Settings
// ============================================================================

interface SettingsToastTransitionProps {
  /** Si está visible */
  isVisible: boolean;
  /** Tipo */
  type?: 'success' | 'error' | 'info';
  /** Mensaje */
  message: React.ReactNode;
}

/**
 * Toast de notificación para settings
 */
export function SettingsToastTransition({
  isVisible,
  type = 'info',
  message,
}: SettingsToastTransitionProps) {
  const typeStyles = {
    success: 'bg-green-500/10 text-green-700 border-green-500/20',
    error: 'bg-red-500/10 text-red-700 border-red-500/20',
    info: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  };

  return (
    <AnimatePresence
      present={isVisible}
      enter={{
        type: 'slide',
        direction: 'top',
        distance: 20,
        duration: 300,
        easing: customEasings.easeOutSuper,
      }}
      exit={{
        type: 'slide',
        direction: 'top',
        distance: 15,
        duration: 200,
        easing: customEasings.easeInSuper,
      }}
    >
      <div
        className={cn(
          'settings-toast-transition',
          'fixed bottom-4 right-4 z-50',
          'px-4 py-3 rounded-lg border shadow-lg',
          typeStyles[type]
        )}
      >
        {message}
      </div>
    </AnimatePresence>
  );
}

// ============================================================================
// Transición de Tabs de Settings
// ============================================================================

interface SettingsTabsTransitionProps {
  /** ID de la tab activa */
  activeTab: string;
  /** Contenido de las tabs */
  children: React.ReactNode;
}

/**
 * Contenedor de tabs de settings con transición
 */
export function SettingsTabsTransition({
  activeTab,
  children,
}: SettingsTabsTransitionProps) {
  return (
    <FlipContainer
      key={activeTab}
      flipId={`settings-tab-${activeTab}`}
      options={{
        duration: 300,
        easing: customEasings.quickSlow,
      }}
      className="settings-tabs-transition"
    >
      {children}
    </FlipContainer>
  );
}
