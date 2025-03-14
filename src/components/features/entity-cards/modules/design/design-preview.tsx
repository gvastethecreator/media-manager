'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import type { DesignSystem } from './types';

interface DesignPreviewProps {
	designSystem: DesignSystem;
	children?: React.ReactNode;
	className?: string;
	showPlaceholder?: boolean;
}

export function DesignPreview({ designSystem, children, className, showPlaceholder = true }: DesignPreviewProps) {
	const [styles, setStyles] = useState<Record<string, string>>({});

	// Generar estilos CSS basados en la configuración del sistema de diseño
	useEffect(() => {
		const {
			borderRadius,
			padding,
			aspectRatio,
			maxWidth,
			elevation,
			shadowColor,
			backgroundColor,
			backgroundOpacity,
			backdropFilter,
			backdropBlurAmount,
			borderWidth,
			borderStyle,
			borderColor,
			customCssVariables,
		} = designSystem;

		// Generar sombra basada en la elevación
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
			if (backdropFilter === 'blur' && backdropBlurAmount > 0) {
				return `blur(${backdropBlurAmount}px)`;
			}
			return backdropFilter !== 'none' ? backdropFilter : 'none';
		};

		// Convertir color hexadecimal a RGB
		const hexToRgb = (hex: string): string => {
			// Eliminar el # si está presente
			const cleanHex = hex.replace('#', '');

			// Convertir a valores RGB
			const r = Number.parseInt(cleanHex.substring(0, 2), 16);
			const g = Number.parseInt(cleanHex.substring(2, 4), 16);
			const b = Number.parseInt(cleanHex.substring(4, 6), 16);

			// Devolver formato RGB
			return `${r}, ${g}, ${b}`;
		};

		// Construir el objeto de estilos CSS
		const newStyles: Record<string, string> = {
			borderRadius: `${borderRadius}px`,
			padding: `${padding}px`,
			aspectRatio,
			maxWidth: `${maxWidth}px`,
			boxShadow: generateShadow(elevation, shadowColor),
			backgroundColor:
				backgroundOpacity < 1 ? `rgba(${hexToRgb(backgroundColor)}, ${backgroundOpacity})` : backgroundColor,
			backdropFilter: generateBackdropFilter(),
			borderWidth: `${borderWidth}px`,
			borderStyle,
			borderColor,
		};

		// Agregar variables CSS personalizadas
		Object.entries(customCssVariables).forEach(([key, value]) => {
			newStyles[`--${key}`] = value;
		});

		setStyles(newStyles);
	}, [designSystem]);

	return (
		<Card
			className={cn(
				'overflow-hidden transition-all duration-300',
				designSystem.customCssClasses?.join(' ') || '',
				className
			)}
			style={styles}
		>
			{children ||
				(showPlaceholder && (
					<div className="flex flex-col items-center justify-center h-full text-center p-4">
						<div className="w-full h-32 bg-muted rounded-md mb-4" />
						<div className="w-3/4 h-4 bg-muted rounded-md mb-2" />
						<div className="w-1/2 h-4 bg-muted rounded-md" />
					</div>
				))}
		</Card>
	);
}
