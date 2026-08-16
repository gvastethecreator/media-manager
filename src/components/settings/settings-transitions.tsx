/**
 * @file Transiciones para Settings
 * @module components/settings/settings-transitions
 * @description Envoltorios con transiciones para el panel de configuraciones
 */

import React from 'react';
import { FlipContainer } from '@/components/transitions/flip-container';
import { AnimatePresence, TransitionGroup, TransitionItem } from '@/components/transitions/transition-group';
import { useEnterExit } from '@/hooks/transitions';
import { customEasings } from '@/lib/transitions';
import { cn } from '@/lib/utils';

// ============================================================================
// Transición de Página de Settings
// ============================================================================

interface SettingsPageTransitionProps {
	/** Sección activa */
	activeSection?: string;
	/** Contenido */
	children: React.ReactNode;
}

/**
 * Página de settings con transición de entrada
 */
export function SettingsPageTransition({ children, activeSection }: SettingsPageTransitionProps) {
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
			className={cn('settings-page-transition h-full', isTransitioning && 'transitioning')}
			ref={ref as React.RefObject<HTMLDivElement>}
		>
			{children}
		</div>
	);
}

// ============================================================================
// Transición de Sección de Settings
// ============================================================================

interface SettingsSectionTransitionProps {
	/** Contenido */
	children: React.ReactNode;
	/** Descripción */
	description?: React.ReactNode;
	/** Si está expandida */
	isExpanded?: boolean;
	/** Toggle */
	onToggle?: () => void;
	/** ID de la sección */
	sectionId: string;
	/** Título */
	title: React.ReactNode;
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
			className="settings-section-transition rounded-lg border border-border bg-card"
			flipId={`settings-section-container-${sectionId}`}
		>
			<button
				className={cn(
					'settings-section-header flex w-full items-center justify-between',
					'rounded-lg p-4 text-left transition-colors hover:bg-accent/50'
				)}
				onClick={onToggle}
				type="button"
			>
				<div className="flex-1">
					<h3 className="font-medium">{title}</h3>
					{description && <p className="text-muted-foreground text-sm">{description}</p>}
				</div>
				<span
					className={cn('ml-4 transform transition-transform duration-200', isExpanded ? 'rotate-180' : 'rotate-0')}
				>
					▼
				</span>
			</button>

			{(isExpanded || isTransitioning) && (
				<div className="settings-section-content p-4 pt-0" ref={ref as React.RefObject<HTMLDivElement>}>
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
	/** Control */
	control: React.ReactNode;
	/** Descripción */
	description?: React.ReactNode;
	/** Índice para stagger */
	index?: number;
	/** Si está deshabilitado */
	isDisabled?: boolean;
	/** ID del item */
	itemId: string;
	/** Label */
	label: React.ReactNode;
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
					'flex items-center justify-between gap-4 py-3',
					'border-border border-b last:border-0',
					isDisabled && 'opacity-50'
				)}
			>
				<div className="min-w-0 flex-1">
					<label className="font-medium text-sm">{label}</label>
					{description && <p className="mt-0.5 text-muted-foreground text-xs">{description}</p>}
				</div>
				<div className="flex-shrink-0">{control}</div>
			</div>
		</TransitionItem>
	);
}

// ============================================================================
// Transición de Formulario de Settings
// ============================================================================

interface SettingsFormTransitionProps {
	/** Contenido */
	children: React.ReactNode;
	/** ID del formulario */
	formId: string;
	/** Si está guardando */
	isSaving?: boolean;
}

/**
 * Formulario de settings con transiciones
 */
export function SettingsFormTransition({ formId, children, isSaving }: SettingsFormTransitionProps) {
	return (
		<TransitionGroup
			className="settings-form-transition space-y-1"
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
			id={`settings-form-${formId}`}
			isVisible={true}
			staggerDelay={20}
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
	/** Mensaje */
	message: React.ReactNode;
	/** Tipo */
	type?: 'success' | 'error' | 'info';
}

/**
 * Toast de notificación para settings
 */
export function SettingsToastTransition({ isVisible, type = 'info', message }: SettingsToastTransitionProps) {
	const typeStyles = {
		success: 'bg-success/10 text-success border-success/20',
		error: 'bg-destructive/10 text-destructive border-destructive/20',
		info: 'bg-info/10 text-info border-info/20',
	};

	return (
		<AnimatePresence
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
			present={isVisible}
		>
			<div
				className={cn(
					'settings-toast-transition',
					'fixed right-4 bottom-4 z-50',
					'rounded-lg border px-4 py-3 shadow-dt-2',
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
export function SettingsTabsTransition({ activeTab, children }: SettingsTabsTransitionProps) {
	return (
		<FlipContainer
			className="settings-tabs-transition"
			flipId={`settings-tab-${activeTab}`}
			key={activeTab}
			options={{
				duration: 300,
				easing: customEasings.quickSlow,
			}}
		>
			{children}
		</FlipContainer>
	);
}
