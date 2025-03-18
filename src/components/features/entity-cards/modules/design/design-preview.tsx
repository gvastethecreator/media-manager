'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import type { DesignSystem } from './types';

/**
 * Props para el componente DesignPreview
 */
interface DesignPreviewProps {
	designSystem: DesignSystem;
	children?: React.ReactNode;
	className?: string;
	showPlaceholder?: boolean;
}

/**
 * 🎨 Componente para mostrar una vista previa del diseño
 */
export function DesignPreview({ designSystem, children, className, showPlaceholder = false }: DesignPreviewProps) {
	// Función para convertir un color hex a RGB
	const hexToRgb = (hex: string) => {
		// Si no es un color hex válido, devolver blanco
		if (!hex.match(/^#([A-Fa-f0-9]{3}){1,2}$/)) {
			return '255, 255, 255';
		}

		// Expandir color hex corto (por ejemplo, #FFF a #FFFFFF)
		if (hex.length === 4) {
			hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
		}

		// Convertir a RGB
		const r = parseInt(hex.substring(1, 3), 16);
		const g = parseInt(hex.substring(3, 5), 16);
		const b = parseInt(hex.substring(5, 7), 16);

		return `${r}, ${g}, ${b}`;
	};

	// Función para generar el valor de las sombras
	const generateShadow = (level: number, color: string) => {
		switch (level) {
			case 0:
				return 'none';
			case 1:
				return `0 2px 4px ${color}`;
			case 2:
				return `0 4px 8px ${color}`;
			case 3:
				return `0 8px 16px ${color}`;
			case 4:
				return `0 12px 24px ${color}`;
			case 5:
				return `0 16px 32px ${color}`;
			default:
				return `0 8px 16px ${color}`;
		}
	};

	// Generar filtro de fondo
	const generateBackdropFilter = () => {
		if (designSystem.backdropFilter === 'blur' && designSystem.backdropBlurAmount > 0) {
			return `blur(${designSystem.backdropBlurAmount}px)`;
		}
		return designSystem.backdropFilter !== 'none' ? designSystem.backdropFilter : 'none';
	};

	// Generar estilos basados en el sistema de diseño
	const styles: React.CSSProperties = {
		borderRadius: `${designSystem.borderRadius}px`,
		padding: `${designSystem.padding}px`,
		aspectRatio: designSystem.aspectRatio,
		maxWidth: `${designSystem.maxWidth}px`,
		boxShadow: generateShadow(designSystem.elevation, designSystem.shadowColor),
		backgroundColor:
			designSystem.backgroundOpacity < 1
				? `rgba(${hexToRgb(designSystem.backgroundColor)}, ${designSystem.backgroundOpacity})`
				: designSystem.backgroundColor,
		backdropFilter: generateBackdropFilter(),
		borderWidth: `${designSystem.borderWidth}px`,
		borderStyle: designSystem.borderStyle,
		borderColor: designSystem.borderColor,
		color: designSystem.textColor,
		position: 'relative',
		overflow: 'hidden',
		width: '100%',
		height: '100%',
		transition: 'all 0.3s ease',
	};

	// Agregar variables CSS personalizadas
	Object.entries(designSystem.customCssVariables || {}).forEach(([key, value]) => {
		(styles as any)[`--${key}`] = value;
	});

	// Contenido de muestra para la previsualización
	const placeholderContent = (
		<div className="w-full h-full flex flex-col gap-2">
			<div className="w-full h-3 bg-primary/20 rounded-full" />
			<div className="w-2/3 h-3 bg-primary/20 rounded-full" />
			<div className="w-full h-12 mt-2 bg-primary/10 rounded-md" />
			<div className="flex-1 mt-2 bg-primary/5 rounded-md flex items-center justify-center">
				<div className="text-xl font-light text-primary/40">{designSystem.preset || 'Vista previa'}</div>
			</div>
			<div className="w-full flex gap-1 mt-2">
				<div className="w-1/3 h-2 bg-primary/15 rounded-full" />
				<div className="w-1/4 h-2 bg-primary/15 rounded-full" />
				<div className="w-1/5 h-2 bg-primary/15 rounded-full" />
			</div>
		</div>
	);

	return (
		<Card className={cn('design-system-preview', ...(designSystem.customCssClasses || []), className)} style={styles}>
			{showPlaceholder ? placeholderContent : children}
		</Card>
	);
}
