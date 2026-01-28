import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface CardContainerProps extends React.HTMLAttributes<HTMLDivElement> {
	/** Color primario para estilos */
	primaryColor?: string;
	/** Color secundario para estilos */
	secondaryColor?: string;
	/** Nivel de glow effect */
	glowLevel?: 0 | 1 | 2 | 3;
	/** Clases CSS adicionales */
	className?: string;
	/** Estilos CSS adicionales */
	style?: React.CSSProperties;
	/** Contenido del componente */
	children: React.ReactNode;
	/** Si la tarjeta está siendo hovereada */
	isHovered?: boolean;
}

/**
 * Contenedor estilizado para tarjetas con bordes brillantes y efectos de hover.
 * Sirve como base para tarjetas de tipo TCG.
 */
export const CardContainer = forwardRef<HTMLDivElement, CardContainerProps>(
	(
		{
			primaryColor = 'var(--primary)',
			secondaryColor = 'var(--accent)',
			glowLevel = 1,
			className,
			style,
			children,
			...props
		},
		ref
	) => {
		// Calcular nivel de brillo para los efectos
		const glowOpacity = glowLevel * 0.15;
		const glowSize = glowLevel * 5;

		// Estilos para el contenedor
		const containerStyle: React.CSSProperties = {
			// Borde basado en el color primario
			borderColor: `color-mix(in oklab, ${primaryColor}, transparent 40%)`,
			// Fondo con gradiente sutil basado en el color primario
			background: `linear-gradient(145deg, color-mix(in oklab, ${primaryColor}, transparent 95%), color-mix(in oklab, ${secondaryColor}, transparent 90%))`,
			...style,
		};

		// Estilos para el efecto de brillo
		const glowStyle: React.CSSProperties = {
			boxShadow: `0 0 ${glowSize}px 1px ${primaryColor}`,
			opacity: glowOpacity,
		};

		return (
			<div className={cn('card-container relative border-2', className)} ref={ref} style={containerStyle} {...props}>
				{/* Efecto de brillo interno */}
				{glowLevel > 0 && (
					<div
						className="pointer-events-none absolute inset-0 rounded-[4.5%] opacity-0 transition-opacity duration-300 hover:opacity-100"
						style={glowStyle}
					/>
				)}

				{/* Contenido de la tarjeta */}
				{children}
			</div>
		);
	}
);
