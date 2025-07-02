import { forwardRef } from 'react';
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
}

/**
 * Contenedor estilizado para tarjetas con bordes brillantes y efectos de hover.
 * Sirve como base para tarjetas de tipo TCG.
 */
export const CardContainer = forwardRef<HTMLDivElement, CardContainerProps>(
	(
		{ primaryColor = '#0ea5e9', secondaryColor = '#0369a1', glowLevel = 1, className, style, children, ...props },
		ref
	) => {
		// Calcular nivel de brillo para los efectos
		const glowOpacity = glowLevel * 0.15;
		const glowSize = glowLevel * 5;

		// Estilos para el contenedor
		const containerStyle: React.CSSProperties = {
			// Borde basado en el color primario
			borderColor: `${primaryColor}90`,
			// Fondo con gradiente sutil basado en el color primario
			background: `linear-gradient(145deg, ${primaryColor}08, ${secondaryColor}15)`,
			...style,
		};

		// Estilos para el efecto de brillo
		const glowStyle: React.CSSProperties = {
			boxShadow: `0 0 ${glowSize}px 1px ${primaryColor}`,
			opacity: glowOpacity,
		};

		return (
			<div ref={ref} className={cn('card-container border-2 relative', className)} style={containerStyle} {...props}>
				{/* Efecto de brillo interno */}
				{glowLevel > 0 && (
					<div
						className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-[4.5%]"
						style={glowStyle}
					/>
				)}

				{/* Contenido de la tarjeta */}
				{children}
			</div>
		);
	}
);
