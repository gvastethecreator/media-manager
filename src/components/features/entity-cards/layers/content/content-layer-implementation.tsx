'use client';

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { CardContent } from '../card-content';
import type { LayerConfig, LayerRenderProps } from '../types';

/**
 * 📝 Configuración de la capa de contenido
 */
export interface ContentLayerConfig extends LayerConfig {
	/** Espaciado interno en píxeles */
	padding: number;
	/** Tipo de layout para el contenido */
	layout: 'standard' | 'grid' | 'masonry' | 'carousel';
	/** Espaciado entre elementos */
	spacing: number;
	/** Alineación del contenido */
	alignment: 'left' | 'center' | 'right';
	/** Número de columnas para grid y masonry */
	columns?: number;
	/** Altura máxima para carousel */
	maxHeight?: number;
	/** Opciones de accesibilidad */
	accessibility?: {
		/** Texto alternativo para lectores de pantalla */
		ariaLabel?: string;
		/** Descripción extendida del contenido */
		ariaDescription?: string;
	};
}

/**
 * 🧩 Componente para la capa de contenido
 * Muestra el contenido principal de la entidad con diferentes layouts y estilos
 */
export function ContentLayerComponent({
	config,
	children,
	isHovered,
	isActive,
	isExploded,
	mousePosition,
	entityType,
	entityId,
}: LayerRenderProps) {
	const safeConfig = config as ContentLayerConfig;

	if (!safeConfig.enabled) {
		return null;
	}

	// Función para obtener las clases de layout
	const getLayoutClasses = () => {
		const baseClasses = 'relative w-full transition-all duration-200';
		const columns = safeConfig.columns || 2;

		switch (safeConfig.layout) {
			case 'grid':
				return cn(baseClasses, `grid grid-cols-${columns} gap-${safeConfig.spacing / 4}`);
			case 'masonry':
				return cn(baseClasses, `columns-${columns} gap-${safeConfig.spacing / 4}`);
			case 'carousel':
				return cn(
					baseClasses,
					'flex overflow-x-auto snap-x snap-mandatory',
					`gap-${safeConfig.spacing / 4}`,
					safeConfig.maxHeight && `max-h-[${safeConfig.maxHeight}px]`
				);
			default:
				return cn(baseClasses, 'flex flex-col');
		}
	};

	// Función para obtener las clases de alineación
	const getAlignmentClasses = () => {
		switch (safeConfig.alignment) {
			case 'left':
				return 'items-start text-left justify-start';
			case 'right':
				return 'items-end text-right justify-end';
			default:
				return 'items-center text-center justify-center';
		}
	};

	// Función para obtener las propiedades de accesibilidad
	const getAccessibilityProps = () => ({
		role: safeConfig.layout === 'carousel' ? 'list' : 'region',
		'aria-label': safeConfig.accessibility?.ariaLabel || `Contenido de la tarjeta ${entityType}${entityId ? ` #${entityId}` : ''}`,
		'aria-description': safeConfig.accessibility?.ariaDescription,
		'aria-expanded': isExploded ? 'true' : 'false',
		'aria-haspopup': 'false',
		'aria-live': 'polite',
		tabIndex: 0,
	});

	return (
		<motion.div
			className={cn(
				'card-content',
				getLayoutClasses(),
				getAlignmentClasses(),
				`p-${safeConfig.padding / 4}`,
				isHovered && 'content-hovered',
				isActive && 'content-active',
				isExploded && 'content-exploded'
			)}
			style={{
				zIndex: safeConfig.layerIndex,
				...(isExploded ? {
					transform: `translate3d(${20 * safeConfig.layerIndex}px, ${20 * safeConfig.layerIndex}px, 0)`,
					transition: 'transform 0.3s ease-in-out'
				} : {}),
			}}
			{...getAccessibilityProps()}
			initial={false}
			animate={{
				scale: isHovered ? 1.02 : 1,
				transition: { duration: 0.2 }
			}}
		>
			{children || (
				<CardContent
					className={cn(
						"w-full",
						safeConfig.layout === 'carousel' && 'snap-start'
					)}
				>
					<div
						className="card-title font-medium mb-2"
						role="heading"
						aria-level={2}
					>
						Sin contenido
					</div>
					<div
						className="card-description text-sm text-muted-foreground"
						role="contentinfo"
					>
						Esta tarjeta no tiene contenido definido
					</div>
				</CardContent>
			)}
		</motion.div>
	);
}

// Asignar displayName para DevTools
ContentLayerComponent.displayName = 'ContentLayer';