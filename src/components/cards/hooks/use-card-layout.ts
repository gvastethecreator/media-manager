/**
 * @file Hook para manejar layouts de cards
 * @module components/cards/hooks/use-card-layout
 * @description Proporciona clases CSS y estilos basados en la configuración de layout
 */

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { BaseCardProps, CardLayoutConfig } from '../types/card-layout.types';
import { resolveLayoutConfig } from '../types/card-layout.types';

interface UseCardLayoutReturn {
	/** Clases CSS para el contenedor principal */
	containerClasses: string;
	/** Clases CSS para el contenido */
	contentClasses: string;
	/** Clases CSS para la imagen/thumbnail */
	imageClasses: string;
	/** Clases CSS para el texto */
	textClasses: string;
	/** Clases CSS para los metadatos */
	metadataClasses: string;
	/** Estilos inline para el contenedor */
	containerStyles: React.CSSProperties;
	/** Configuración de layout resuelta */
	config: CardLayoutConfig;
	/** Información de dimensiones */
	dimensions: {
		width?: number | string;
		height?: number | string;
		aspectRatio?: string;
	};
}

/**
 * Hook para obtener clases CSS y estilos basados en la configuración de layout
 */
export function useCardLayout(props: Partial<BaseCardProps>, preset?: string): UseCardLayoutReturn {
	const config = useMemo(() => resolveLayoutConfig(props, preset), [props, preset]);

	// Resolver dimensiones
	const dimensions = useMemo(() => {
		const result: UseCardLayoutReturn['dimensions'] = {};

		// Ancho y alto específicos tienen prioridad
		if (config.width) result.width = config.width;
		if (config.height) result.height = config.height;

		// Si no hay dimensiones específicas, usar el tamaño
		if (!result.width && !result.height) {
			switch (config.size) {
				case 'xs':
					result.width = 64;
					result.height = 64;
					break;
				case 'sm':
					result.width = 120;
					result.height = 120;
					break;
				case 'md':
					result.width = 200;
					result.height = 200;
					break;
				case 'lg':
					result.width = 280;
					result.height = 280;
					break;
				case 'xl':
					result.width = 400;
					result.height = 400;
					break;
				case 'auto':
					result.width = '100%';
					result.height = 'auto';
					break;
			}
		}

		// Aplicar aspect ratio
		if (config.aspectRatio) {
			if (typeof config.aspectRatio === 'number') {
				result.aspectRatio = config.aspectRatio.toString();
			} else {
				result.aspectRatio = config.aspectRatio;
			}
		}

		return result;
	}, [config]);

	// Generar clases para el contenedor principal
	const containerClasses = useMemo(() => {
		const classes = ['relative overflow-hidden transition-all duration-200'];

		// Layout específico
		switch (config.layout) {
			case 'minimal':
				classes.push('flex flex-col items-center justify-center p-2');
				break;
			case 'compact':
				classes.push('flex flex-col p-3');
				break;
			case 'complete':
				classes.push('flex flex-col p-4');
				break;
			case 'horizontal':
			case 'list':
				classes.push('flex flex-row items-center gap-3 p-3');
				break;
			case 'vertical':
			case 'grid':
				classes.push('flex flex-col');
				break;
			case 'masonry':
				classes.push('flex flex-col break-inside-avoid');
				break;
		}

		// Variante visual
		switch (config.variant) {
			case 'default':
				classes.push('bg-card border border-border rounded-lg');
				break;
			case 'minimal':
				classes.push('bg-transparent');
				break;
			case 'elevated':
				classes.push('bg-card border border-border rounded-lg shadow-md hover:shadow-lg');
				break;
			case 'outlined':
				classes.push('bg-transparent border-2 border-border rounded-lg');
				break;
			case 'tcg':
				classes.push('bg-gradient-to-b from-gray-900 to-black border border-white/10 rounded-lg shadow-lg');
				break;
			case 'polaroid':
				classes.push('bg-white border border-gray-200 rounded-lg shadow-sm p-2');
				break;
			case 'glass':
				classes.push('bg-white/10 backdrop-blur-md border border-white/20 rounded-lg');
				break;
		}

		// Estados
		if (props.isSelected) {
			classes.push('ring-2 ring-primary ring-offset-2');
		}
		if (props.isActive) {
			classes.push('bg-accent');
		}
		if (props.isLoading) {
			classes.push('animate-pulse');
		}

		// Interactividad
		if (props.onClick) {
			classes.push('cursor-pointer hover:scale-[1.02]');
		}

		return cn(classes, props.className);
	}, [config, props]);

	// Generar clases para el contenido
	const contentClasses = useMemo(() => {
		const classes = ['flex-1'];

		if (config.layout === 'horizontal' || config.layout === 'list') {
			classes.push('min-w-0'); // Para truncate en flex
		}

		return cn(classes);
	}, [config.layout]);

	// Generar clases para la imagen/thumbnail
	const imageClasses = useMemo(() => {
		const classes = ['object-cover'];

		switch (config.layout) {
			case 'minimal':
				classes.push('w-8 h-8 rounded');
				break;
			case 'compact':
				classes.push('w-12 h-12 rounded');
				break;
			case 'complete':
			case 'vertical':
			case 'grid':
				classes.push('w-full aspect-square rounded-t-lg');
				break;
			case 'horizontal':
			case 'list':
				classes.push('w-12 h-12 rounded flex-shrink-0');
				break;
			case 'masonry':
				classes.push('w-full rounded-t-lg');
				break;
		}

		// Variantes específicas para imágenes
		if (config.variant === 'polaroid') {
			classes.push('border border-gray-100');
		}

		return cn(classes);
	}, [config]);

	// Generar clases para el texto
	const textClasses = useMemo(() => {
		const classes = [];

		switch (config.density) {
			case 'low':
				classes.push('space-y-1');
				break;
			case 'medium':
				classes.push('space-y-2');
				break;
			case 'high':
				classes.push('space-y-3');
				break;
		}

		if (config.layout === 'horizontal' || config.layout === 'list') {
			classes.push('min-w-0'); // Para permitir truncate
		}

		return cn(classes);
	}, [config]);

	// Generar clases para metadatos
	const metadataClasses = useMemo(() => {
		const classes = ['text-xs text-muted-foreground'];

		if (!config.showMetadata) {
			classes.push('hidden');
		}

		switch (config.layout) {
			case 'minimal':
				classes.push('hidden');
				break;
			case 'compact':
				classes.push('mt-1');
				break;
			case 'complete':
				classes.push('mt-2');
				break;
			case 'horizontal':
			case 'list':
				classes.push('truncate');
				break;
		}

		return cn(classes);
	}, [config]);

	// Generar estilos inline
	const containerStyles = useMemo((): React.CSSProperties => {
		const styles: React.CSSProperties = {};

		// Aplicar dimensiones
		if (dimensions.width) {
			styles.width = typeof dimensions.width === 'number' ? `${dimensions.width}px` : dimensions.width;
		}
		if (dimensions.height) {
			styles.height = typeof dimensions.height === 'number' ? `${dimensions.height}px` : dimensions.height;
		}
		if (dimensions.aspectRatio) {
			styles.aspectRatio = dimensions.aspectRatio;
		}

		// Estilos específicos para TCG mode
		if (config.variant === 'tcg') {
			styles.boxShadow = '0 10px 15px -3px rgba(59, 130, 246, 0.2), 0 4px 6px -4px rgba(59, 130, 246, 0.3)';
		}

		return styles;
	}, [config, dimensions]);

	return {
		containerClasses,
		contentClasses,
		imageClasses,
		textClasses,
		metadataClasses,
		containerStyles,
		config,
		dimensions,
	};
}
